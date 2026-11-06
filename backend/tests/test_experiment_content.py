"""The ten experiments: content checks, the loader, and the stored Code Exercise answers."""
import json
import os
import sys
from pathlib import Path

import pytest

from app.models import (
    CodeSubmission, Experiment, ExperimentEvaluationSpec, Option, Question, Quiz, QuizType, RevealPolicy,
    SubmissionStatus, UserRole,
)
from helpers import add_code_submission, make_experiment, make_user
from scripts import load_experiments
from scripts.experiment_content import MODULES, expected_results, load_all
from scripts.load_experiments import load

EXPECTED_TITLES = [
    "Simple Linear Regression",
    "Multiple Linear Regression",
    "Logistic Regression",
    "K-Nearest Neighbors (KNN)",
    "Naive Bayes Classification",
    "Decision Tree Classification",
    "Random Forest Classification",
    "Support Vector Machine (SVM)",
    "K-Means Clustering",
    "Artificial Neural Network (ANN) for Classification",
]


# ── The content itself ────────────────────────────────────────────────────────

def test_there_are_ten_experiments_in_the_agreed_order():
    experiments = load_all()
    assert [e.number for e in experiments] == list(range(1, 11))
    assert [e.title for e in experiments] == EXPECTED_TITLES
    assert len({e.slug for e in experiments}) == 10
    assert len(MODULES) == 10


@pytest.mark.parametrize("content", load_all(), ids=lambda c: c.slug)
def test_every_experiment_is_complete(content):
    for text in (content.overview, content.aim, content.objective, content.notes, content.code_problem_statement):
        assert text.strip()
    assert content.objective.startswith("After completing this experiment")
    assert "## References" in content.notes
    assert content.video_url.startswith("https://")

    for name in ("pre_quiz", "post_quiz", "assignment"):
        quiz = getattr(content, name)
        assert len(quiz) == 10, name
        for question, options, correct in quiz:
            assert question.strip()
            assert 2 <= len(options) <= 4
            assert len(set(options)) == len(options), f"repeated option in: {question}"
            assert 0 <= correct < len(options)


@pytest.mark.parametrize("content", load_all(), ids=lambda c: c.slug)
def test_every_code_exercise_is_set_up_for_students(content):
    assert content.starter_code.startswith("result = None")
    assert "print(" not in content.starter_code and "solution" not in content.starter_code.lower()
    assert "`result`" in content.code_problem_statement
    assert "Mark Completed" in content.code_problem_statement
    assert content.allowed_imports == ["numpy", "pandas", "sklearn"]
    json.dumps(content.expected_result)  # a plain JSON value
    assert content.expected_result not in (None, [], {}, "")
    if content.number != 9:  # every exercise except K-Means splits the data
        assert "random_state=42" in content.code_problem_statement


def test_only_experiment_1_needs_a_dataset_file():
    experiments = load_all()
    assert experiments[0].dataset_url == "/datasets/Salary_dataset.csv"
    assert all(e.dataset_url is None for e in experiments[1:])
    assert "read_csv" not in experiments[1].starter_code
    path = Path(__file__).resolve().parents[2] / "frontend" / "public" / "datasets" / "Salary_dataset.csv"
    if path.parent.exists():
        assert path.read_text().splitlines()[0] == "YearsExperience,Salary"


def test_expected_results_file_matches_the_experiments():
    results = expected_results()
    assert set(results) == {e.slug for e in load_all()}
    assert results["simple-linear-regression"] == [115791.21, 71499.28, 102597.87, 75268.8, 55478.79, 60190.7]
    assert set(results["k-means-clustering"]) == {"cluster_sizes", "inertia"}
    assert isinstance(results["artificial-neural-network"], float)


@pytest.mark.skipif(os.environ.get("RUN_SOLUTION_CHECKS") != "1", reason="set RUN_SOLUTION_CHECKS=1 (needs pandas and scikit-learn)")
def test_each_solution_produces_its_stored_result(monkeypatch):
    """Optional: runs the ten solutions with this computer's scikit-learn. Values can differ from the browser's version."""
    pytest.importorskip("sklearn")
    monkeypatch.chdir(Path(__file__).resolve().parents[2] / "frontend" / "public" / "datasets")
    for content in load_all():
        namespace = {}
        exec(content.solution_code, namespace)
        assert namespace["result"] == content.expected_result, content.slug


# ── The loader ────────────────────────────────────────────────────────────────

def test_loader_replaces_every_existing_experiment(db):
    demo = make_experiment(db)
    student = make_user(db, UserRole.student)
    add_code_submission(db, student, demo, SubmissionStatus.matched)  # must not block the replacement
    db.commit()

    loaded = load(db)

    assert db.get(Experiment, demo.id) is None
    stored = db.query(Experiment).order_by(Experiment.order_index).all()
    assert [e.order_index for e in stored] == list(range(1, 11))
    assert [e.title for e in stored] == EXPECTED_TITLES
    assert [e.slug for e in loaded] == [e.slug for e in stored]
    assert all(e.is_published for e in stored)
    assert db.query(CodeSubmission).count() == 0


def test_loader_is_safe_to_run_again(db):
    load(db)
    load(db)
    assert db.query(Experiment).count() == 10


def test_loaded_quizzes_have_one_correct_option_each(db):
    load(db)
    assert db.query(Quiz).count() == 30
    for quiz in db.query(Quiz).all():
        assert len(quiz.questions) == 10
        assert quiz.deadline is None and quiz.reveal_policy == RevealPolicy.immediate
        assert quiz.is_scored == (quiz.quiz_type == QuizType.assignment)
        for question in quiz.questions:
            assert sum(o.is_correct for o in question.options) == 1
    assert db.query(Question).count() == 300
    assert db.query(Option).count() >= 300 * 2


def test_loaded_code_exercises_hold_the_expected_results(db):
    load(db)
    specs = {s.experiment_id: s for s in db.query(ExperimentEvaluationSpec).all()}
    results = expected_results()
    for exp in db.query(Experiment).all():
        assert specs[exp.id].expected_output == results[exp.slug]
        assert specs[exp.id].comparison_tolerance is None
        assert exp.code_dataset_url == ("/datasets/Salary_dataset.csv" if exp.order_index == 1 else None)


def test_students_see_the_ten_experiments_without_answers(client, db):
    load(db)
    student = make_user(db, UserRole.student)
    listing = client.get("/experiments", headers=student.headers).json()
    assert [e["title"] for e in listing] == EXPECTED_TITLES

    detail = client.get("/experiments/k-nearest-neighbors", headers=student.headers).json()
    assert detail["starter_code"].startswith("result = None")
    assert "expected_output" not in json.dumps(detail)
    for quiz in detail["quizzes"]:
        assert "is_correct" not in json.dumps(quiz["questions"])


@pytest.mark.parametrize("slug", ["k-means-clustering", "artificial-neural-network", "naive-bayes"])
def test_code_answers_are_checked_exactly(client, db, slug):
    load(db)
    student = make_user(db, UserRole.student)
    exp = db.query(Experiment).filter_by(slug=slug).one()
    expected = expected_results()[slug]

    def submit(output):
        body = {"experiment_id": str(exp.id), "submitted_code": "result = ...", "client_output": output}
        return client.post("/code_submissions", json=body, headers=student.headers).json()["status"]

    assert submit(expected) == "matched"
    wrong = {"cluster_sizes": [1, 2, 3], "inertia": 1.0} if isinstance(expected, dict) else (
        expected + 0.01 if isinstance(expected, float) else list(reversed(expected)) + [9]
    )
    assert submit(wrong) == "mismatched"


def test_loader_refuses_to_run_in_production_without_force(monkeypatch):
    monkeypatch.setattr(load_experiments.settings, "ENV", "production")
    monkeypatch.setattr(sys, "argv", ["load_experiments"])
    with pytest.raises(SystemExit):
        load_experiments.main()
