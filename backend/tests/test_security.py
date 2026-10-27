"""Sign-in protection: lockout, rate limit, token invalidation, API docs in production."""
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.core.ratelimit import auth_limiter
from app.main import create_app
from app.models import User, UserRole
from helpers import make_user


@pytest.fixture
def sent(monkeypatch):
    box = {"invites": [], "resets": []}
    monkeypatch.setattr("app.routers.admin.send_credentials_emails", lambda recipients: box["invites"].extend(recipients))
    monkeypatch.setattr(
        "app.routers.auth.send_password_reset_email",
        lambda email, name, link, minutes: box["resets"].append({"email": email, "link": link}),
    )
    return box


def _login(client, email, password):
    return client.post("/auth/login", json={"email": email, "password": password})


def _user(db, role=UserRole.student):
    user = make_user(db, role)
    return user, db.get(User, user.id).email


# ── Lockout ───────────────────────────────────────────────────────────────────

def test_account_is_locked_after_repeated_wrong_passwords(client, db):
    _, email = _user(db)
    for _ in range(settings.MAX_FAILED_LOGINS):
        assert _login(client, email, "wrong-password").status_code == 401

    locked = _login(client, email, "Pass12345")  # even the right password is refused while locked
    assert locked.status_code == 429 and "locked" in locked.json()["detail"].lower()
    assert int(locked.headers["retry-after"]) > 0


def test_a_correct_login_resets_the_failure_count(client, db):
    _, email = _user(db)
    for _ in range(settings.MAX_FAILED_LOGINS - 1):
        _login(client, email, "wrong-password")
    assert _login(client, email, "Pass12345").status_code == 200
    for _ in range(settings.MAX_FAILED_LOGINS - 1):
        assert _login(client, email, "wrong-password").status_code == 401
    assert _login(client, email, "Pass12345").status_code == 200  # still not locked


def test_the_lock_expires_by_itself(client, db):
    from datetime import datetime, timedelta, timezone

    user, email = _user(db)
    for _ in range(settings.MAX_FAILED_LOGINS):
        _login(client, email, "wrong-password")
    row = db.get(User, user.id)
    row.locked_until = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()
    assert _login(client, email, "Pass12345").status_code == 200


def test_unknown_deactivated_and_wrong_password_look_the_same(client, db):
    admin = make_user(db, UserRole.admin)
    student, email = _user(db)
    client.post(f"/admin/users/{student.id}/deactivate", headers=admin.headers)
    _, other = _user(db)
    answers = {
        (r.status_code, r.json()["detail"])
        for r in (
            _login(client, "nobody@college.edu", "whatever123"),
            _login(client, email, "Pass12345"),
            _login(client, other, "wrong-password"),
        )
    }
    assert answers == {(401, "Invalid credentials")}


def test_resetting_the_password_unlocks_the_account(client, db, sent):
    _, email = _user(db)
    for _ in range(settings.MAX_FAILED_LOGINS):
        _login(client, email, "wrong-password")
    assert _login(client, email, "Pass12345").status_code == 429

    client.post("/auth/forgot-password", json={"email": email})
    token = sent["resets"][0]["link"].split("token=")[1]
    assert client.post("/auth/reset-password", json={"token": token, "new_password": "BrandNew123"}).status_code == 200
    assert _login(client, email, "BrandNew123").status_code == 200


def test_admin_reset_unlocks_the_account(client, db, sent):
    admin = make_user(db, UserRole.admin)
    student, email = _user(db)
    for _ in range(settings.MAX_FAILED_LOGINS):
        _login(client, email, "wrong-password")
    client.post(f"/admin/users/{student.id}/resend-invitation", headers=admin.headers)
    assert _login(client, email, sent["invites"][0]["password"]).status_code == 200


# ── Rate limit per address ────────────────────────────────────────────────────

def test_one_address_cannot_hammer_the_sign_in_endpoints(client, db, monkeypatch):
    _, email = _user(db)
    monkeypatch.setattr(auth_limiter, "limit", 3)
    assert [_login(client, email, "Pass12345").status_code for _ in range(3)] == [200, 200, 200]
    blocked = _login(client, email, "Pass12345")
    assert blocked.status_code == 429 and blocked.headers["retry-after"] == "60"
    assert client.post("/auth/forgot-password", json={"email": email}).status_code == 429


# ── Old logins stop working ───────────────────────────────────────────────────

def _bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_logout_ends_the_login(client, db):
    _, email = _user(db)
    token = _login(client, email, "Pass12345").json()["access_token"]
    assert client.get("/auth/me", headers=_bearer(token)).status_code == 200
    assert client.post("/auth/logout", headers=_bearer(token)).status_code == 204
    assert client.get("/auth/me", headers=_bearer(token)).status_code == 401
    fresh = _login(client, email, "Pass12345").json()["access_token"]  # a new login works
    assert client.get("/auth/me", headers=_bearer(fresh)).status_code == 200


def test_changing_the_password_ends_other_logins_but_returns_a_fresh_token(client, db):
    _, email = _user(db)
    old = _login(client, email, "Pass12345").json()["access_token"]
    resp = client.post(
        "/auth/change-password",
        json={"current_password": "Pass12345", "new_password": "BrandNew123"},
        headers=_bearer(old),
    )
    assert resp.status_code == 200
    fresh = resp.json()["access_token"]
    assert client.get("/auth/me", headers=_bearer(old)).status_code == 401
    assert client.get("/auth/me", headers=_bearer(fresh)).status_code == 200
    assert resp.json()["must_change_password"] is False


def test_reset_link_ends_every_login(client, db, sent):
    _, email = _user(db)
    token = _login(client, email, "Pass12345").json()["access_token"]
    client.post("/auth/forgot-password", json={"email": email})
    link_token = sent["resets"][0]["link"].split("token=")[1]
    client.post("/auth/reset-password", json={"token": link_token, "new_password": "BrandNew123"})
    assert client.get("/auth/me", headers=_bearer(token)).status_code == 401


def test_admin_reset_and_deactivation_end_the_login(client, db, sent):
    admin = make_user(db, UserRole.admin)
    first, first_email = _user(db)
    second, second_email = _user(db)
    t1 = _login(client, first_email, "Pass12345").json()["access_token"]
    t2 = _login(client, second_email, "Pass12345").json()["access_token"]

    client.post(f"/admin/users/{first.id}/resend-invitation", headers=admin.headers)
    client.post(f"/admin/users/{second.id}/deactivate", headers=admin.headers)
    assert client.get("/auth/me", headers=_bearer(t1)).status_code == 401
    assert client.get("/auth/me", headers=_bearer(t2)).status_code == 401
    client.post(f"/admin/users/{second.id}/reactivate", headers=admin.headers)
    assert client.get("/auth/me", headers=_bearer(t2)).status_code == 401  # the earlier login stays ended


def test_a_token_without_a_version_is_treated_as_version_zero(client, db):
    from jose import jwt

    user, _ = _user(db)
    legacy = jwt.encode({"sub": str(user.id), "role": "student"}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    assert client.get("/auth/me", headers=_bearer(legacy)).status_code == 200


# ── API docs ──────────────────────────────────────────────────────────────────

def test_api_docs_are_switched_off_in_production(monkeypatch):
    monkeypatch.setattr(settings, "ENV", "production")
    prod = TestClient(create_app())
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert prod.get(path).status_code == 404
    assert prod.get("/health").status_code == 200

    monkeypatch.setattr(settings, "ENV", "development")
    dev = TestClient(create_app())
    assert dev.get("/docs").status_code == 200


def test_the_answer_key_endpoint_is_gone(client, db):
    instructor = make_user(db, UserRole.instructor)
    admin = make_user(db, UserRole.admin)
    for who in (instructor, admin):
        assert client.get("/quizzes/00000000-0000-0000-0000-000000000000", headers=who.headers).status_code in (404, 405)
