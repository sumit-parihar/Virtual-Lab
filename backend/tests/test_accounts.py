"""Add one student, Profile data, and the forgot-password flow."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.models import Batch, Enrollment, InstructorAssignment, PasswordResetToken, User, UserRole
from helpers import make_user


@pytest.fixture
def sent(monkeypatch):
    """Capture invitation emails and reset links instead of sending them."""
    box = {"invites": [], "resets": []}
    monkeypatch.setattr("app.routers.admin.send_credentials_emails", lambda recipients: box["invites"].extend(recipients))
    monkeypatch.setattr(
        "app.routers.auth.send_password_reset_email",
        lambda email, name, link, minutes: box["resets"].append({"email": email, "link": link, "minutes": minutes}),
    )
    return box


def _batch(db, name=None):
    batch = Batch(name=name or f"B-{uuid.uuid4().hex[:6]}", academic_year="2026-27")
    db.add(batch)
    db.commit()
    return batch.id


def _payload(batch_id, **over):
    body = {"roll_number": "CS001", "full_name": "Asha Patil", "email": "Asha@College.edu", "batch_id": str(batch_id)}
    body.update(over)
    return body


def _token(link: str) -> str:
    return link.split("token=")[1]


# ── Add one student ───────────────────────────────────────────────────────────

def test_admin_adds_one_student_who_gets_a_temporary_password(client, db, sent):
    admin = make_user(db, UserRole.admin)
    batch_id = _batch(db)
    resp = client.post("/admin/students", json=_payload(batch_id), headers=admin.headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "asha@college.edu" and body["account_state"] == "invited"
    assert body["batch"]["id"] == str(batch_id)

    assert [r["email"] for r in sent["invites"]] == ["asha@college.edu"]
    student = db.query(User).filter_by(email="asha@college.edu").one()
    assert student.role == UserRole.student and student.roll_number == "CS001" and student.must_change_password is True
    assert db.query(Enrollment).filter_by(student_id=student.id, batch_id=batch_id).count() == 1
    login = client.post("/auth/login", json={"email": "asha@college.edu", "password": sent["invites"][0]["password"]})
    assert login.status_code == 200 and login.json()["must_change_password"] is True


def test_add_student_is_admin_only(client, db, sent):
    instructor = make_user(db, UserRole.instructor)
    student = make_user(db, UserRole.student)
    batch_id = _batch(db)
    for who in (instructor, student):
        assert client.post("/admin/students", json=_payload(batch_id), headers=who.headers).status_code == 403
    assert client.post("/admin/students", json=_payload(batch_id)).status_code == 401


def test_add_student_rejects_duplicates_and_bad_input(client, db, sent):
    admin = make_user(db, UserRole.admin)
    batch_id, other = _batch(db, "A"), _batch(db, "B")
    assert client.post("/admin/students", json=_payload(batch_id), headers=admin.headers).status_code == 201

    same_batch = client.post("/admin/students", json=_payload(batch_id, roll_number="CS777"), headers=admin.headers)
    assert same_batch.status_code == 409 and "Already in this batch" in same_batch.json()["detail"]

    elsewhere = client.post("/admin/students", json=_payload(other, roll_number="CS778"), headers=admin.headers)
    assert elsewhere.status_code == 409 and "Use Move student" in elsewhere.json()["detail"]

    urn_taken = client.post("/admin/students", json=_payload(batch_id, email="new@college.edu"), headers=admin.headers)
    assert urn_taken.status_code == 422 and "URN already used" in urn_taken.json()["detail"]

    teacher = make_user(db, UserRole.instructor)
    teacher_email = db.get(User, teacher.id).email
    as_teacher = client.post("/admin/students", json=_payload(batch_id, roll_number="CS9", email=teacher_email), headers=admin.headers)
    assert as_teacher.status_code == 422

    assert client.post("/admin/students", json=_payload(batch_id, email="nope"), headers=admin.headers).status_code == 422
    assert client.post("/admin/students", json=_payload(uuid.uuid4()), headers=admin.headers).status_code == 404
    assert len(sent["invites"]) == 1  # only the first one was invited


def test_cannot_add_a_student_to_an_archived_batch(client, db, sent):
    admin = make_user(db, UserRole.admin)
    batch_id = _batch(db)
    client.post(f"/admin/batches/{batch_id}/archive", headers=admin.headers)
    assert client.post("/admin/students", json=_payload(batch_id), headers=admin.headers).status_code == 409


# ── Profile ───────────────────────────────────────────────────────────────────

def test_profile_shows_each_roles_details(client, db):
    batch_id = _batch(db, "TE-CSE-A")
    student = make_user(db, UserRole.student)
    row = db.get(User, student.id)
    row.full_name, row.roll_number = "Asha Patil", "CS001"
    db.add(Enrollment(student_id=student.id, batch_id=batch_id))
    teacher = make_user(db, UserRole.instructor)
    db.add(InstructorAssignment(instructor_id=teacher.id, batch_id=batch_id))
    admin = make_user(db, UserRole.admin)
    db.commit()

    s = client.get("/auth/profile", headers=student.headers).json()
    assert (s["full_name"], s["roll_number"], s["role"]) == ("Asha Patil", "CS001", "student")
    assert s["batch"]["name"] == "TE-CSE-A" and s["batches"] == []

    t = client.get("/auth/profile", headers=teacher.headers).json()
    assert t["role"] == "instructor" and [b["name"] for b in t["batches"]] == ["TE-CSE-A"] and t["batch"] is None

    a = client.get("/auth/profile", headers=admin.headers).json()
    assert a["role"] == "admin" and a["batch"] is None and a["batches"] == []
    assert client.get("/auth/profile").status_code == 401


def test_profile_hides_archived_batches_from_instructors(client, db):
    admin = make_user(db, UserRole.admin)
    teacher = make_user(db, UserRole.instructor)
    batch_id = _batch(db)
    db.add(InstructorAssignment(instructor_id=teacher.id, batch_id=batch_id))
    db.commit()
    client.post(f"/admin/batches/{batch_id}/archive", headers=admin.headers)
    assert client.get("/auth/profile", headers=teacher.headers).json()["batches"] == []


# ── Forgot password ───────────────────────────────────────────────────────────

def _email_of(db, user):
    return db.get(User, user.id).email


def test_forgot_password_gives_the_same_reply_for_any_email(client, db, sent):
    student = make_user(db, UserRole.student)
    known = client.post("/auth/forgot-password", json={"email": _email_of(db, student)})
    unknown = client.post("/auth/forgot-password", json={"email": "nobody@college.edu"})
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()
    assert len(sent["resets"]) == 1  # a link only for the real account


def test_deactivated_account_gets_no_link(client, db, sent):
    admin = make_user(db, UserRole.admin)
    student = make_user(db, UserRole.student)
    client.post(f"/admin/users/{student.id}/deactivate", headers=admin.headers)
    assert client.post("/auth/forgot-password", json={"email": _email_of(db, student)}).status_code == 200
    assert sent["resets"] == []


def test_reset_link_sets_a_new_password_once(client, db, sent):
    student = make_user(db, UserRole.student)
    email = _email_of(db, student)
    client.post("/auth/forgot-password", json={"email": email})
    link = sent["resets"][0]
    assert link["minutes"] == 30
    token = _token(link["link"])

    # Only a hash is stored, never the token itself.
    stored = db.query(PasswordResetToken).filter_by(user_id=student.id).one()
    assert token not in stored.token_hash and len(stored.token_hash) == 64

    ok = client.post("/auth/reset-password", json={"token": token, "new_password": "BrandNew123"})
    assert ok.status_code == 200
    assert client.post("/auth/login", json={"email": email, "password": "Pass12345"}).status_code == 401
    assert client.post("/auth/login", json={"email": email, "password": "BrandNew123"}).status_code == 200

    again = client.post("/auth/reset-password", json={"token": token, "new_password": "AnotherOne123"})
    assert again.status_code == 400  # the link works once


def test_reset_clears_the_forced_password_change(client, db, sent):
    student = make_user(db, UserRole.student)
    db.get(User, student.id).must_change_password = True
    db.commit()
    email = _email_of(db, student)
    client.post("/auth/forgot-password", json={"email": email})
    client.post("/auth/reset-password", json={"token": _token(sent["resets"][0]["link"]), "new_password": "BrandNew123"})
    assert client.post("/auth/login", json={"email": email, "password": "BrandNew123"}).json()["must_change_password"] is False


def test_only_the_newest_link_works(client, db, sent):
    student = make_user(db, UserRole.student)
    email = _email_of(db, student)
    client.post("/auth/forgot-password", json={"email": email})
    client.post("/auth/forgot-password", json={"email": email})
    first, second = (_token(r["link"]) for r in sent["resets"])
    assert client.post("/auth/reset-password", json={"token": first, "new_password": "BrandNew123"}).status_code == 400
    assert client.post("/auth/reset-password", json={"token": second, "new_password": "BrandNew123"}).status_code == 200


def test_expired_unknown_and_weak_requests_are_rejected(client, db, sent):
    student = make_user(db, UserRole.student)
    email = _email_of(db, student)
    client.post("/auth/forgot-password", json={"email": email})
    token = _token(sent["resets"][0]["link"])

    assert client.post("/auth/reset-password", json={"token": "not-a-real-token", "new_password": "BrandNew123"}).status_code == 400
    assert client.post("/auth/reset-password", json={"token": token, "new_password": "short"}).status_code == 422

    record = db.query(PasswordResetToken).filter_by(user_id=student.id).one()
    record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    assert client.post("/auth/reset-password", json={"token": token, "new_password": "BrandNew123"}).status_code == 400


def test_deactivated_after_requesting_cannot_use_the_link(client, db, sent):
    admin = make_user(db, UserRole.admin)
    student = make_user(db, UserRole.student)
    client.post("/auth/forgot-password", json={"email": _email_of(db, student)})
    token = _token(sent["resets"][0]["link"])
    client.post(f"/admin/users/{student.id}/deactivate", headers=admin.headers)
    assert client.post("/auth/reset-password", json={"token": token, "new_password": "BrandNew123"}).status_code == 400


def test_forgot_password_is_limited_per_account(client, db, sent):
    student = make_user(db, UserRole.student)
    email = _email_of(db, student)
    for _ in range(6):
        assert client.post("/auth/forgot-password", json={"email": email}).status_code == 200
    assert len(sent["resets"]) == 3  # the rest were quietly ignored
