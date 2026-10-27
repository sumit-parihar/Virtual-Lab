"""Sends the 'here is your default password' emails. Meant to run as a FastAPI background task."""
import logging
import smtplib
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage

from app.config import settings
from app.database import SessionLocal
from app.models import User

logger = logging.getLogger(__name__)


def _build_message(email: str, full_name: str, password: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = "Your ML Virtual Lab account"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    msg.set_content(
        f"Hello {full_name},\n\n"
        f"An account has been created for you on the ML Virtual Lab.\n\n"
        f"Login page: {settings.FRONTEND_URL}/login\n"
        f"Email: {email}\n"
        f"Temporary password: {password}\n\n"
        f"You will be asked to change this password the first time you log in.\n"
        f"Do not share it with anyone.\n"
    )
    return msg


def _mark(user_id: uuid.UUID, status: str) -> None:
    """Record the result of the invitation email: "sent", "failed" or "console"."""
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user:
            user.credentials_status = status
            if status != "failed":
                user.credentials_sent_at = datetime.now(timezone.utc)
            db.commit()


def send_credentials_emails(recipients: list[dict]) -> None:
    """recipients: [{"user_id": UUID, "email": str, "full_name": str, "password": str}]
    Uses one SMTP connection for the whole list. The result of each email is
    saved on the user (credentials_status) so the admin can see failures and resend."""
    if not recipients:
        return

    if not settings.EMAIL_ENABLED:  # dev mode: no SMTP, print instead
        for r in recipients:
            logger.warning("[DEV EMAIL - not sent] to=%s password=%s", r["email"], r["password"])
            _mark(r["user_id"], "console")
        return

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            for r in recipients:
                try:
                    smtp.send_message(_build_message(r["email"], r["full_name"], r["password"]))
                    _mark(r["user_id"], "sent")
                except Exception:
                    logger.exception("Could not send credentials email to %s", r["email"])
                    _mark(r["user_id"], "failed")
    except Exception:
        logger.exception("Could not connect to the SMTP server")
        for r in recipients:
            _mark(r["user_id"], "failed")


def send_password_reset_email(email: str, full_name: str, link: str, minutes: int) -> None:
    """Email a single-use "reset your password" link. With email switched off, the link is printed instead."""
    if not settings.EMAIL_ENABLED:  # dev mode: no SMTP
        logger.warning("[DEV EMAIL - not sent] password reset for %s: %s", email, link)
        return

    msg = EmailMessage()
    msg["Subject"] = "Reset your ML Virtual Lab password"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    msg.set_content(
        f"Hello {full_name},\n\n"
        f"We received a request to reset your ML Virtual Lab password.\n\n"
        f"Open this link to choose a new password (it works once and expires in {minutes} minutes):\n"
        f"{link}\n\n"
        f"If you did not ask for this, you can ignore this email. Your password has not changed.\n"
    )
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
    except Exception:
        logger.exception("Could not send the password reset email to %s", email)
