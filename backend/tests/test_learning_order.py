"""Learning order for the learner study, first-attempt quiz scores, and the study export.

Order: Overview and Aim are open; Video, Theory, Guided Lab and Code Exercise open after the
Pre-Quiz is submitted; the Post-Quiz opens after every earlier section; the Assignment after the
Post-Quiz. The Pre-Quiz and Post-Quiz keep the first-attempt score as well as the best score.
"""
import io
import uuid

from openpyxl import load_workbook

from app.models import Batch, Enrollment, InstructorAssignment, StudentQuizProgress, User, UserRole
from helpers import complete_static_sections, get_experiment, make_experiment, make_user, quiz_in, submit_quiz

CONTENT = ("video", "theory", "guided-lab", "code-exercise")


def _mark(client, user, exp, key):
    return client.post(f"/experiments/{exp.slug}/sections/{key}/complete", headers=user.headers)


def _code(client, user, exp):
    body = {"experiment_id": str(exp.id), "submitted_code": "result = 1", "client_output": {"value": 1.0}}
    return client.post("/code_submissions", json=body, headers=user.headers)


# ── Content opens after the Pre-Quiz ──────────────────────────────────────────

def test_content_is_locked_until_the_pre_quiz_is_submitted(client, db):
    exp = make_experiment(db)
    student = make_user(db)

    data = get_experiment(client, student, exp)
    assert data["content_locked"] is True
    for key in CONTENT:
        resp = _mark(client, student, exp, key)
        assert resp.status_code == 403
        assert "Pre-Quiz" in resp.json()["detail"]
    assert _code(client, student, exp).status_code == 403

    # Overview and Aim stay open.
    assert _mark(client, student, exp, "overview").status_code == 200
    assert _mark(client, student, exp, "aim-objectives").status_code == 200

    assert submit_quiz(client, student, exp, "pre", correct=False).status_code == 201
    assert get_experiment(client, student, exp)["content_locked"] is False
    for key in CONTENT:
        assert _mark(client, student, exp, key).status_code == 200
    assert _code(client, student, exp).status_code == 201


def test_instructors_never_see_locks(client, db):
    exp = make_experiment(db)
    instructor = make_user(db, UserRole.instructor)
    data = get_experiment(client, instructor, exp)
    assert data["content_locked"] is False
    assert data["post_quiz_locked"] is False
    assert len(quiz_in(data, "post")["questions"]) == 1


# ── Post-Quiz opens after every earlier section ───────────────────────────────

def test_post_quiz_is_locked_and_hidden_until_every_earlier_section_is_complete(client, db):
    exp = make_experiment(db)
    student = make_user(db)

    data = get_experiment(client, student, exp)
    assert data["post_quiz_locked"] is True
    assert data["post_quiz_missing_steps"] == [
        "Experiment Title / Overview", "Aim / Learning Objectives", "Pre-Quiz", "Video",
        "Theory / Reading Material", "Guided Lab", "Code Exercise",
    ]
    assert quiz_in(data, "post")["questions"] == []
    resp = submit_quiz(client, student, exp, "post")
    assert resp.status_code == 403
    assert "Post-Quiz is locked" in resp.json()["detail"]

    assert submit_quiz(client, student, exp, "pre").status_code == 201
    for key in ("overview", "aim-objectives", "video", "theory", "guided-lab"):
        assert _mark(client, student, exp, key).status_code == 200
    data = get_experiment(client, student, exp)
    assert data["post_quiz_missing_steps"] == ["Code Exercise"]
    assert submit_quiz(client, student, exp, "post").status_code == 403

    assert _mark(client, student, exp, "code-exercise").status_code == 200
    data = get_experiment(client, student, exp)
    assert data["post_quiz_locked"] is False
    assert data["post_quiz_missing_steps"] == []
    assert len(quiz_in(data, "post")["questions"]) == 1
    assert submit_quiz(client, student, exp, "post").status_code == 201


# ── First-attempt scores ──────────────────────────────────────────────────────

def _progress(db, student, exp, quiz_type):
    db.expire_all()
    return db.query(StudentQuizProgress).filter_by(
        student_id=student.id, quiz_id=exp.quizzes[quiz_type].quiz_id
    ).one()


def test_first_attempt_score_is_kept_while_best_score_improves(client, db):
    exp = make_experiment(db)
    student = make_user(db)

    assert submit_quiz(client, student, exp, "pre", correct=False).status_code == 201
    first = _progress(db, student, exp, "pre")
    assert first.first_score == 0.0 and first.best_score == 0.0
    first_time = first.first_submitted_at
    assert first_time is not None

    assert submit_quiz(client, student, exp, "pre", correct=True).status_code == 201
    again = _progress(db, student, exp, "pre")
    assert again.first_score == 0.0  # never changed by later attempts
    assert again.best_score == 100.0
    assert again.first_submitted_at == first_time

    complete_static_sections(client, student, exp)
    assert submit_quiz(client, student, exp, "post", correct=True).status_code == 201
    assert submit_quiz(client, student, exp, "post", correct=False).status_code == 201
    post = _progress(db, student, exp, "post")
    assert post.first_score == 100.0 and post.best_score == 100.0


# ── Study export ──────────────────────────────────────────────────────────────

def _batch_with(db, instructor):
    batch = Batch(name=f"Learner batch {uuid.uuid4().hex[:4]}", academic_year="2026-27")
    db.add(batch)
    db.flush()
    db.add(InstructorAssignment(instructor_id=instructor.id, batch_id=batch.id))
    db.commit()
    return batch.id


def _enrol(db, batch_id, name, urn):
    student = make_user(db, UserRole.student)
    user = db.get(User, student.id)
    user.full_name, user.roll_number = name, urn
    db.add(Enrollment(student_id=student.id, batch_id=batch_id))
    db.commit()
    return student


def test_study_export_lists_first_and_best_scores_per_student_and_experiment(client, db):
    exp = make_experiment(db)
    instructor = make_user(db, UserRole.instructor)
    batch_id = _batch_with(db, instructor)
    asha = _enrol(db, batch_id, "Asha Patil", "CS001")
    _enrol(db, batch_id, "Ravi Kale", "CS002")  # has done nothing

    # Asha: Pre-Quiz wrong then right, every section, Post-Quiz right, Assignment wrong.
    submit_quiz(client, asha, exp, "pre", correct=False)
    submit_quiz(client, asha, exp, "pre", correct=True)
    complete_static_sections(client, asha, exp)
    submit_quiz(client, asha, exp, "post", correct=True)
    submit_quiz(client, asha, exp, "assignment", correct=False)

    resp = client.get(f"/instructor/batches/{batch_id}/study-export", headers=instructor.headers)
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]
    assert resp.headers["content-disposition"].rstrip('"').endswith("_study_data.xlsx")
    rows = list(load_workbook(io.BytesIO(resp.content)).active.iter_rows(values_only=True))

    header_at = next(i for i, r in enumerate(rows) if r and r[0] == "URN")
    assert rows[header_at] == (
        "URN", "Student Name", "Exp. No.", "Experiment",
        "Pre-Quiz First (%)", "Pre-Quiz Best (%)", "Post-Quiz First (%)", "Post-Quiz Best (%)",
        "Assignment (%)", "Sections Completed", "Status",
    )
    data = [r for r in rows[header_at + 1:] if r and r[0]]
    by_urn = {r[0]: r for r in data}
    assert by_urn["CS001"][1] == "Asha Patil"
    assert by_urn["CS001"][4:11] == (0, 100, 100, 100, 0, "9 of 9", "Completed")
    assert by_urn["CS002"][4:11] == (None, None, None, None, None, "0 of 9", "Not Attempted")


def test_study_export_is_only_for_the_batch_instructor(client, db):
    instructor = make_user(db, UserRole.instructor)
    other = make_user(db, UserRole.instructor)
    batch_id = _batch_with(db, instructor)
    url = f"/instructor/batches/{batch_id}/study-export"

    assert client.get(url, headers=other.headers).status_code == 403
    for role in (UserRole.student, UserRole.admin):
        assert client.get(url, headers=make_user(db, role).headers).status_code == 403
