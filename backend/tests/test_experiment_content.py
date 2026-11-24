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
    # A web link, or a video file served by the app from frontend/public/videos/ (which must exist).
    assert content.video_url.startswith(("https://", "/videos/"))
    if content.video_url.startswith("/videos/"):
        video = Path(__file__).resolve().parents[2] / "frontend" / "public" / content.video_url.lstrip("/")
        if video.parent.exists():
            assert video.is_file(), content.video_url

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


def test_experiment_1_has_a_data_only_guided_lab():
    experiments = load_all()
    lab = experiments[0].lab_config
    assert lab is not None
    assert lab["kind"] == "linear-regression"
    assert lab["dataset_url"] == experiments[0].dataset_url  # the same presaved file as the Code Exercise
    assert "compute" not in lab  # data only: the lab's code lives in the frontend
    json.dumps(lab)
    for name in ("slope", "intercept", "predict_x"):
        slider = lab[name]
        assert slider["min"] <= slider["start"] <= slider["max"] and slider["step"] > 0
    assert len(lab["steps"]) >= 3
    assert all(step["task"].strip() and step["explanation"].strip() for step in lab["steps"])


# The lab kinds the frontend knows (GuidedLab.jsx, LABS). A lab_config with another kind would show "not available".
LAB_KINDS = {
    "linear-regression", "multiple-regression", "logistic-regression", "knn", "naive-bayes", "decision-tree",
    "random-forest", "svm", "kmeans", "neural-network",
}


@pytest.mark.parametrize("content", [c for c in load_all() if c.lab_config], ids=lambda c: c.slug)
def test_every_guided_lab_is_data_only_and_uses_presaved_files(content):
    lab = content.lab_config
    json.dumps(lab)
    assert lab["kind"] in LAB_KINDS
    assert "compute" not in lab  # never code: the lab itself is a frontend component
    assert lab.get("intro", "").strip()
    assert len(lab["steps"]) >= 3
    assert all(step["task"].strip() and step["explanation"].strip() for step in lab["steps"])
    for key in ("dataset_url", "split_url"):
        if key in lab and DATASETS_DIR.exists():
            assert (DATASETS_DIR / lab[key].split("/")[-1]).exists(), lab[key]
    if lab["kind"] == "multiple-regression" and DATASETS_DIR.exists():
        header = (DATASETS_DIR / lab["dataset_url"].split("/")[-1]).read_text().splitlines()[0].split(",")
        assert {f["name"] for f in lab["features"]} <= set(header)
        assert set(lab["start_features"]) <= {f["name"] for f in lab["features"]}
        assert lab["target_column"] in header
    if "feature_pairs" in lab and DATASETS_DIR.exists():  # every preset names two real columns of the file
        header = (DATASETS_DIR / lab["dataset_url"].split("/")[-1]).read_text().splitlines()[0].split(",")
        for pair in lab["feature_pairs"]:
            assert pair["x"] in header and pair["y"] in header and pair["label"].strip()


def test_loader_stores_the_guided_lab(db):
    load(db)
    first = db.query(Experiment).filter(Experiment.order_index == 1).one()
    assert first.lab_config["kind"] == "linear-regression"
    assert first.dataset_info["name"] == "Salary dataset"
    second = db.query(Experiment).filter(Experiment.order_index == 2).one()
    assert second.dataset_info["file_url"] == "/datasets/diabetes.csv"
    assert all(e.dataset_info for e in db.query(Experiment).all())


DATASETS_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "datasets"
# Which scikit-learn loader each experiment's Code Exercise uses, so the panel describes that same data.
EXPECTED_DATASET = {
    1: "Salary_dataset.csv", 2: "diabetes.csv", 3: "breast_cancer.csv", 4: "iris.csv", 5: "wine.csv",
    6: "iris.csv", 7: "breast_cancer.csv", 8: "wine.csv", 9: "iris.csv", 10: "digits.csv",
}


@pytest.mark.parametrize("content", load_all(), ids=lambda c: c.slug)
def test_every_dataset_panel_matches_its_file(content):
    info = content.dataset_info
    assert info is not None
    json.dumps(info)
    file_name = info["file_url"].split("/")[-1]
    assert file_name == EXPECTED_DATASET[content.number]
    assert info["name"].strip() and info["description"].strip() and info["row_meaning"].strip()
    assert info["load_hint"].split("(")[0].split()[-1] in content.code_problem_statement  # e.g. load_iris
    assert info["sample_rows"] > 0
    assert all(c["role"] in ("feature", "target", "unused") and c["meaning"].strip() for c in info["columns"])

    path = DATASETS_DIR / file_name
    if not path.parent.exists():  # backend checked out without the frontend
        return
    header = path.read_text(encoding="utf-8").splitlines()[0].split(",")
    # The described columns cover the file's columns exactly, in order (a group covers `count` columns).
    assert sum(c.get("count", 1) for c in info["columns"]) == len(header)
    position = 0
    for column in info["columns"]:
        if column.get("count", 1) == 1:
            assert column["name"] == header[position]
        position += column.get("count", 1)
    if info.get("class_column"):
        column = header.index(info["class_column"])
        labels = {line.split(",")[column] for line in path.read_text(encoding="utf-8").splitlines()[1:]}
        assert set(info.get("class_names", {})) <= labels


def test_experiment_1_dataset_panel_describes_the_salary_file():
    first = load_all()[0]
    info = first.dataset_info
    assert info is not None
    assert info["file_url"] == first.dataset_url
    json.dumps(info)
    assert info["row_meaning"].strip() and info["description"].strip()
    assert info["sample_rows"] > 0
    assert [c["role"] for c in info["columns"]] == ["feature", "target"]
    assert all(c["meaning"].strip() for c in info["columns"])
    assert "Salary_dataset.csv" in info["load_hint"]
    path = Path(__file__).resolve().parents[2] / "frontend" / "public" / "datasets" / "Salary_dataset.csv"
    if path.exists():  # every described column is a real column of the file, in the same order
        assert [c["name"] for c in info["columns"]] == path.read_text().splitlines()[0].split(",")


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
    # The Code Exercise opens only after the Pre-Quiz is submitted.
    pre = next(q for q in exp.quizzes if q.quiz_type == QuizType.pre)
    answers = [
        {"question_id": str(q.id), "selected_option_id": str(q.options[0].id)} for q in pre.questions
    ]
    assert client.post(f"/quizzes/{pre.id}/submit", json={"answers": answers}, headers=student.headers).status_code == 201

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
