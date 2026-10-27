import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from functools import lru_cache
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_active_user, get_current_user
from app.core.mailer import send_password_reset_email
from app.core.ratelimit import limit_auth_requests
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models import Batch, Enrollment, InstructorAssignment, PasswordResetToken, User, UserRole
from app.schemas.user import (
    BatchBrief,
    ChangePasswordRequest,
    PasswordChangedOut,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileOut,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)

RESET_LINK_MINUTES = 30
RESET_REQUESTS_PER_WINDOW = 3  # per account, per 15 minutes
RESET_WINDOW_MINUTES = 15

router = APIRouter(prefix="/auth", tags=["auth"])


@lru_cache(maxsize=1)
def _dummy_hash() -> str:
    """A password hash to check against when the email is unknown, so timing does not reveal which emails exist."""
    return hash_password("not-a-real-password")


def _clear_lockout(user: User) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(limit_auth_requests)])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # The same error for "no such email", "deactivated" and "wrong password", so a caller can't tell which is wrong.
    if user is None or not user.is_active:
        verify_password(payload.password, _dummy_hash())
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    now = datetime.now(timezone.utc)
    if user.locked_until is not None and _aware(user.locked_until) > now:
        minutes = int((_aware(user.locked_until) - now).total_seconds() // 60) + 1
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Too many wrong passwords. This account is locked for about {minutes} more minute(s). "
            "You can also use Forgot password.",
            headers={"Retry-After": str(minutes * 60)},
        )

    if not verify_password(payload.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGINS:
            user.locked_until = now + timedelta(minutes=settings.LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    _clear_lockout(user)
    db.commit()
    token = create_access_token(user.id, user.role.value, user.token_version)
    return TokenResponse(access_token=token, must_change_password=user.must_change_password)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """End the session. Every login token issued before now stops working."""
    user.token_version += 1
    db.commit()


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password", response_model=PasswordChangedOut)
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "New password must be at least 8 characters")
    if payload.new_password == payload.current_password:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "New password must differ from the current one")
    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    user.token_version += 1  # other devices are signed out; this device gets a fresh token below
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role.value, user.token_version)
    return PasswordChangedOut(**UserOut.model_validate(user).model_dump(), access_token=token)


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Read-only details for the Profile page."""
    batch = None
    batches: list[BatchBrief] = []
    if user.role == UserRole.student:
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == user.id).first()
        if enrollment is not None:
            b = enrollment.batch
            batch = BatchBrief(id=b.id, name=b.name, academic_year=b.academic_year)
    elif user.role == UserRole.instructor:
        taught = (
            db.query(Batch)
            .join(InstructorAssignment, InstructorAssignment.batch_id == Batch.id)
            .filter(InstructorAssignment.instructor_id == user.id, Batch.is_archived == False)  # noqa: E712
            .order_by(Batch.name)
            .all()
        )
        batches = [BatchBrief(id=b.id, name=b.name, academic_year=b.academic_year) for b in taught]
    return ProfileOut(
        full_name=user.full_name, email=user.email, role=user.role,
        roll_number=user.roll_number, batch=batch, batches=batches,
    )


# ── Forgot password ───────────────────────────────────────────────────────────

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


@router.post("/forgot-password", dependencies=[Depends(limit_auth_requests)])
def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Email a single-use reset link. The reply is always the same, so nobody can find out which emails have accounts."""
    reply = {"detail": "If this email belongs to an account, we have sent a link to reset the password."}
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not user.is_active:
        return reply

    now = datetime.now(timezone.utc)
    recent = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id, PasswordResetToken.created_at >= now - timedelta(minutes=RESET_WINDOW_MINUTES))
        .count()
    )
    if recent >= RESET_REQUESTS_PER_WINDOW:
        return reply  # too many requests: quietly send nothing

    # Only the newest link works.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)

    token = secrets.token_urlsafe(32)
    db.add(PasswordResetToken(
        user_id=user.id, token_hash=_hash_token(token), created_at=now,
        expires_at=now + timedelta(minutes=RESET_LINK_MINUTES),
    ))
    db.commit()
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    background_tasks.add_task(send_password_reset_email, user.email, user.full_name, link, RESET_LINK_MINUTES)
    return reply


@router.post("/reset-password", dependencies=[Depends(limit_auth_requests)])
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Set a new password with a valid, unused, unexpired link."""
    invalid = HTTPException(status.HTTP_400_BAD_REQUEST, "This reset link is invalid or has expired. Please request a new one.")
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == _hash_token(payload.token)).first()
    now = datetime.now(timezone.utc)
    if record is None or record.used_at is not None or _aware(record.expires_at) < now:
        raise invalid
    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        raise invalid
    if len(payload.new_password) < 8:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Password must be at least 8 characters")

    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    user.token_version += 1  # every earlier login stops working
    _clear_lockout(user)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
    db.commit()
    return {"detail": "Your password has been changed. You can now sign in."}
