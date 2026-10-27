"""
Admin console API (admin only).

  Batches      GET/POST /admin/batches, GET/PATCH /admin/batches/{id}
               PUT/DELETE /admin/batches/{id}/instructor        (replace / remove the one instructor)
               POST /admin/batches/{id}/archive | restore
  Students     GET /admin/students, PATCH /admin/students/{id}, POST /admin/students/{id}/move
               GET /admin/students/template
               POST /admin/batches/{id}/students/preview | import   (CSV or Excel)
  Instructors  GET/POST /admin/instructors, PATCH /admin/instructors/{id}
  Accounts     POST /admin/users/{id}/deactivate | reactivate | resend-invitation

New students and instructors get a random temporary password by email and must change it
at first login. Nothing is ever deleted permanently: users are deactivated and batches archived.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import require_roles
from app.core.mailer import send_credentials_emails
from app.core.security import generate_default_password, hash_password
from app.database import get_db
from app.models import Batch, Enrollment, InstructorAssignment, User, UserRole
from app.schemas.admin import (
    AdminBatchDetail,
    AdminBatchOut,
    AdminUserOut,
    BatchCreate,
    BatchRef,
    BatchUpdate,
    ImportResult,
    ImportRowResult,
    InstructorCreate,
    InstructorRef,
    MoveStudent,
    SetInstructor,
    StudentCreate,
    UserUpdate,
)
from app.services.exports import XLSX_MEDIA_TYPE
from app.services.student_import import ParsedRow, evaluate_rows, parse_upload, template_workbook

router = APIRouter(prefix="/admin", tags=["admin"])

_admin_only = require_roles(UserRole.admin)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _batch_ref(b: Batch) -> BatchRef:
    return BatchRef(id=b.id, name=b.name, academic_year=b.academic_year, is_archived=b.is_archived)


def _account_state(user: User) -> str:
    if not user.is_active:
        return "deactivated"
    return "invited" if user.must_change_password else "active"


def _user_out(user: User, db: Session) -> AdminUserOut:
    batch = None
    batches: list[BatchRef] = []
    if user.role == UserRole.student:
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == user.id).first()
        batch = _batch_ref(enrollment.batch) if enrollment else None
    elif user.role == UserRole.instructor:
        assigned = (
            db.query(Batch)
            .join(InstructorAssignment, InstructorAssignment.batch_id == Batch.id)
            .filter(InstructorAssignment.instructor_id == user.id)
            .order_by(Batch.name)
            .all()
        )
        batches = [_batch_ref(b) for b in assigned]
    return _user_out_with(user, batch, batches)


def _user_out_with(user: User, batch: Optional[BatchRef], batches: list[BatchRef]) -> AdminUserOut:
    return AdminUserOut(
        id=user.id, full_name=user.full_name, email=user.email, roll_number=user.roll_number,
        role=user.role, is_active=user.is_active, account_state=_account_state(user),
        invitation=user.credentials_status, credentials_sent_at=user.credentials_sent_at,
        batch=batch, batches=batches,
    )


def _get_user(user_id: uuid.UUID, db: Session, *roles: UserRole) -> User:
    user = db.get(User, user_id)
    if user is None or (roles and user.role not in roles):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


def _get_batch(batch_id: uuid.UUID, db: Session) -> Batch:
    batch = db.get(Batch, batch_id)
    if batch is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Batch not found")
    return batch


def _batch_out(batch: Batch, db: Session) -> AdminBatchOut:
    assignment = db.query(InstructorAssignment).filter(InstructorAssignment.batch_id == batch.id).first()
    instructor = None
    if assignment is not None:
        i = assignment.instructor
        instructor = InstructorRef(id=i.id, full_name=i.full_name, is_active=i.is_active)
    count = db.query(func.count(Enrollment.id)).filter(Enrollment.batch_id == batch.id).scalar() or 0
    return AdminBatchOut(
        id=batch.id, name=batch.name, academic_year=batch.academic_year, is_archived=batch.is_archived,
        created_at=batch.created_at, instructor=instructor, student_count=count,
    )


def _commit_or_conflict(db: Session, message: str) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, message)


def _invite(background_tasks: BackgroundTasks, users_with_passwords: list[tuple[User, str]]) -> None:
    """Queue the temporary-password emails; the result of each is saved on the user."""
    recipients = [
        {"user_id": u.id, "email": u.email, "full_name": u.full_name, "password": pw}
        for u, pw in users_with_passwords
    ]
    background_tasks.add_task(send_credentials_emails, recipients)


# ── Batches ───────────────────────────────────────────────────────────────────

@router.get("/batches", response_model=list[AdminBatchOut])
def list_batches(include_archived: bool = False, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    query = db.query(Batch)
    if not include_archived:
        query = query.filter(Batch.is_archived == False)  # noqa: E712
    return [_batch_out(b, db) for b in query.order_by(Batch.academic_year.desc(), Batch.name).all()]


@router.post("/batches", response_model=AdminBatchOut, status_code=status.HTTP_201_CREATED)
def create_batch(payload: BatchCreate, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    batch = Batch(name=payload.name, academic_year=payload.academic_year)
    db.add(batch)
    _commit_or_conflict(db, "This batch (name + academic year) already exists")
    db.refresh(batch)
    return _batch_out(batch, db)


@router.get("/batches/{batch_id}", response_model=AdminBatchDetail)
def get_batch(batch_id: uuid.UUID, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    batch = _get_batch(batch_id, db)
    students = (
        db.query(User).join(Enrollment, Enrollment.student_id == User.id)
        .filter(Enrollment.batch_id == batch.id).order_by(User.roll_number, User.full_name).all()
    )
    ref = _batch_ref(batch)
    out = _batch_out(batch, db)
    return AdminBatchDetail(**out.model_dump(), students=[_user_out_with(s, ref, []) for s in students])


@router.patch("/batches/{batch_id}", response_model=AdminBatchOut)
def update_batch(batch_id: uuid.UUID, payload: BatchUpdate, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    batch = _get_batch(batch_id, db)
    if payload.name is not None:
        batch.name = payload.name
    if payload.academic_year is not None:
        batch.academic_year = payload.academic_year
    _commit_or_conflict(db, "This batch (name + academic year) already exists")
    return _batch_out(batch, db)


@router.post("/batches/{batch_id}/archive", response_model=AdminBatchOut)
def archive_batch(batch_id: uuid.UUID, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    batch = _get_batch(batch_id, db)
    batch.is_archived = True
    db.commit()
    return _batch_out(batch, db)


@router.post("/batches/{batch_id}/restore", response_model=AdminBatchOut)
def restore_batch(batch_id: uuid.UUID, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    batch = _get_batch(batch_id, db)
    batch.is_archived = False
    db.commit()
    return _batch_out(batch, db)


@router.put("/batches/{batch_id}/instructor", response_model=AdminBatchOut)
def set_instructor(batch_id: uuid.UUID, payload: SetInstructor, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    """Assign the batch's instructor, or replace the current one in a single step.

    The new instructor keeps any other batches they already teach.
    """
    batch = _get_batch(batch_id, db)
    if batch.is_archived:
        raise HTTPException(status.HTTP_409_CONFLICT, "This batch is archived. Restore it first.")
    instructor = _get_user(payload.instructor_id, db, UserRole.instructor)
    if not instructor.is_active:
        raise HTTPException(status.HTTP_409_CONFLICT, "This instructor account is deactivated")

    current = db.query(InstructorAssignment).filter(InstructorAssignment.batch_id == batch.id).first()
    if current is not None and current.instructor_id == instructor.id:
        return _batch_out(batch, db)
    if current is not None:
        db.delete(current)
        db.flush()
    db.add(InstructorAssignment(instructor_id=instructor.id, batch_id=batch.id))
    _commit_or_conflict(db, "Could not change the instructor. Please try again.")
    return _batch_out(batch, db)


@router.delete("/batches/{batch_id}/instructor", response_model=AdminBatchOut)
def remove_instructor(batch_id: uuid.UUID, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    """Remove the batch's instructor and leave the batch without one."""
    batch = _get_batch(batch_id, db)
    db.query(InstructorAssignment).filter(InstructorAssignment.batch_id == batch.id).delete()
    db.commit()
    return _batch_out(batch, db)


# ── Student import ────────────────────────────────────────────────────────────

@router.get("/students/template")
def student_template(_a: User = Depends(_admin_only)):
    return Response(
        content=template_workbook(),
        media_type=XLSX_MEDIA_TYPE,
        headers={"Content-Disposition": 'attachment; filename="student_import_template.xlsx"'},
    )


async def _evaluate_upload(batch_id: uuid.UUID, file: UploadFile, db: Session):
    batch = _get_batch(batch_id, db)
    if batch.is_archived:
        raise HTTPException(status.HTTP_409_CONFLICT, "This batch is archived. Restore it first.")
    content = await file.read()
    try:
        rows = parse_upload(file.filename or "", content, settings.MAX_UPLOAD_ROWS)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))
    return batch, evaluate_rows(db, batch, rows)


def _result(preview: bool, evaluated, outcome: dict[int, str]) -> ImportResult:
    rows = []
    for e in evaluated:
        if preview:
            label = {"create": "ready", "enroll": "ready", "skip": "skipped", "invalid": "invalid"}[e.action]
        else:
            label = outcome.get(e.row.row, "skipped" if e.action == "skip" else "invalid")
        rows.append(ImportRowResult(
            row=e.row.row, urn=e.row.urn, name=e.row.name, email=e.row.email, status=label, reason=e.reason,
        ))
    return ImportResult(
        preview=preview,
        total=len(rows),
        ready=sum(r.status in ("ready", "created", "enrolled") for r in rows),
        created=sum(r.status == "created" for r in rows),
        skipped=sum(r.status == "skipped" for r in rows),
        invalid=sum(r.status == "invalid" for r in rows),
        rows=rows,
    )


@router.post("/batches/{batch_id}/students/preview", response_model=ImportResult)
async def preview_import(batch_id: uuid.UUID, file: UploadFile = File(...), db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    """Check the file without changing anything."""
    _, evaluated = await _evaluate_upload(batch_id, file, db)
    return _result(True, evaluated, {})


@router.post("/batches/{batch_id}/students/import", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def import_students(
    batch_id: uuid.UUID, background_tasks: BackgroundTasks, file: UploadFile = File(...),
    db: Session = Depends(get_db), _a: User = Depends(_admin_only),
):
    """Add the good rows to the batch and skip the rest. New accounts get a temporary password by email."""
    batch, evaluated = await _evaluate_upload(batch_id, file, db)

    outcome: dict[int, str] = {}
    invited: list[tuple[User, str]] = []
    for e in evaluated:
        if e.action == "create":
            password = generate_default_password()
            student = User(
                full_name=e.row.name, email=e.row.email, roll_number=e.row.urn,
                password_hash=hash_password(password), role=UserRole.student, must_change_password=True,
            )
            db.add(student)
            db.flush()
            db.add(Enrollment(student_id=student.id, batch_id=batch.id))
            invited.append((student, password))
            outcome[e.row.row] = "created"
        elif e.action == "enroll":
            student = db.query(User).filter(User.email == e.row.email).one()
            db.add(Enrollment(student_id=student.id, batch_id=batch.id))
            outcome[e.row.row] = "enrolled"
    _commit_or_conflict(db, "Another change happened while importing. Please check the file and try again.")
    _invite(background_tasks, invited)
    return _result(False, evaluated, outcome)


# ── Students ──────────────────────────────────────────────────────────────────

@router.get("/students", response_model=list[AdminUserOut])
def list_students(
    batch_id: Optional[uuid.UUID] = None, q: Optional[str] = None,
    db: Session = Depends(get_db), _a: User = Depends(_admin_only),
):
    query = db.query(User).filter(User.role == UserRole.student)
    if batch_id is not None:
        query = query.join(Enrollment, Enrollment.student_id == User.id).filter(Enrollment.batch_id == batch_id)
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.filter(
            func.lower(User.full_name).like(like) | func.lower(User.email).like(like)
            | func.lower(func.coalesce(User.roll_number, "")).like(like)
        )
    students = query.order_by(User.roll_number, User.full_name).all()
    batches = {
        sid: _batch_ref(b)
        for sid, b in db.query(Enrollment.student_id, Batch).join(Batch, Batch.id == Enrollment.batch_id).all()
    }
    return [_user_out_with(s, batches.get(s.id), []) for s in students]


@router.post("/students", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
def add_student(payload: StudentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    """Add one student to a batch, with the same checks as a row of the import file."""
    batch = _get_batch(payload.batch_id, db)
    if batch.is_archived:
        raise HTTPException(status.HTTP_409_CONFLICT, "This batch is archived. Restore it first.")
    row = ParsedRow(1, payload.roll_number, payload.full_name, str(payload.email))
    verdict = evaluate_rows(db, batch, [row])[0]
    if verdict.action == "invalid":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, verdict.reason)
    if verdict.action == "skip":
        raise HTTPException(status.HTTP_409_CONFLICT, verdict.reason)

    if verdict.action == "enroll":  # an existing student who has no batch yet
        student = db.query(User).filter(User.email == verdict.row.email).one()
        db.add(Enrollment(student_id=student.id, batch_id=batch.id))
        _commit_or_conflict(db, "Could not add the student. Please try again.")
        return _user_out(student, db)

    password = generate_default_password()
    student = User(
        full_name=verdict.row.name, email=verdict.row.email, roll_number=verdict.row.urn,
        password_hash=hash_password(password), role=UserRole.student, must_change_password=True,
    )
    db.add(student)
    db.flush()
    db.add(Enrollment(student_id=student.id, batch_id=batch.id))
    _commit_or_conflict(db, "This email or URN is already in use.")
    db.refresh(student)
    _invite(background_tasks, [(student, password)])
    return _user_out(student, db)


def _apply_update(user: User, payload: UserUpdate, db: Session) -> None:
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        email = payload.email.lower()
        if db.query(User.id).filter(User.email == email, User.id != user.id).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "This email already belongs to another account")
        user.email = email
    if payload.roll_number is not None and user.role == UserRole.student:
        if db.query(User.id).filter(User.roll_number == payload.roll_number, User.id != user.id).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "This URN already belongs to another student")
        user.roll_number = payload.roll_number


@router.patch("/students/{student_id}", response_model=AdminUserOut)
def update_student(student_id: uuid.UUID, payload: UserUpdate, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    student = _get_user(student_id, db, UserRole.student)
    _apply_update(student, payload, db)
    _commit_or_conflict(db, "These details conflict with another account")
    return _user_out(student, db)


@router.post("/students/{student_id}/move", response_model=AdminUserOut)
def move_student(student_id: uuid.UUID, payload: MoveStudent, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    """Put the student in another batch. Their progress and scores belong to the student and move with them."""
    student = _get_user(student_id, db, UserRole.student)
    target = _get_batch(payload.batch_id, db)
    if target.is_archived:
        raise HTTPException(status.HTTP_409_CONFLICT, "This batch is archived. Restore it first.")
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id).first()
    if enrollment is None:
        db.add(Enrollment(student_id=student.id, batch_id=target.id))
    else:
        enrollment.batch_id = target.id
    _commit_or_conflict(db, "Could not move the student. Please try again.")
    db.refresh(student)
    return _user_out(student, db)


# ── Instructors ───────────────────────────────────────────────────────────────

@router.get("/instructors", response_model=list[AdminUserOut])
def list_instructors(db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    instructors = db.query(User).filter(User.role == UserRole.instructor).order_by(User.full_name).all()
    return [_user_out(i, db) for i in instructors]


@router.post("/instructors", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
def create_instructor(payload: InstructorCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    email = payload.email.lower()
    if db.query(User.id).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "This email already belongs to another account")
    password = generate_default_password()
    instructor = User(
        full_name=payload.full_name, email=email, password_hash=hash_password(password),
        role=UserRole.instructor, must_change_password=True,
    )
    db.add(instructor)
    _commit_or_conflict(db, "This email already belongs to another account")
    db.refresh(instructor)
    _invite(background_tasks, [(instructor, password)])
    return _user_out(instructor, db)


@router.patch("/instructors/{instructor_id}", response_model=AdminUserOut)
def update_instructor(instructor_id: uuid.UUID, payload: UserUpdate, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    instructor = _get_user(instructor_id, db, UserRole.instructor)
    _apply_update(instructor, payload, db)
    _commit_or_conflict(db, "These details conflict with another account")
    return _user_out(instructor, db)


# ── Account actions (students and instructors) ────────────────────────────────

@router.post("/users/{user_id}/deactivate", response_model=AdminUserOut)
def deactivate_user(user_id: uuid.UUID, db: Session = Depends(get_db), admin: User = Depends(_admin_only)):
    user = _get_user(user_id, db)
    if user.id == admin.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "You cannot deactivate your own account")
    if user.role == UserRole.admin:
        active_admins = db.query(func.count(User.id)).filter(User.role == UserRole.admin, User.is_active == True).scalar()  # noqa: E712
        if user.is_active and active_admins <= 1:
            raise HTTPException(status.HTTP_409_CONFLICT, "The last active admin cannot be deactivated")
    user.is_active = False
    user.token_version += 1
    db.commit()
    return _user_out(user, db)


@router.post("/users/{user_id}/reactivate", response_model=AdminUserOut)
def reactivate_user(user_id: uuid.UUID, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    user = _get_user(user_id, db)
    user.is_active = True
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    return _user_out(user, db)


@router.post("/users/{user_id}/resend-invitation", response_model=AdminUserOut)
def resend_invitation(user_id: uuid.UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db), _a: User = Depends(_admin_only)):
    """Issue a new temporary password and email it. Never creates another account."""
    user = _get_user(user_id, db, UserRole.student, UserRole.instructor)
    if not user.is_active:
        raise HTTPException(status.HTTP_409_CONFLICT, "This account is deactivated. Reactivate it first.")
    password = generate_default_password()
    user.password_hash = hash_password(password)
    user.must_change_password = True
    user.credentials_status = None
    user.token_version += 1  # the old login stops working
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    _invite(background_tasks, [(user, password)])
    return _user_out(user, db)
