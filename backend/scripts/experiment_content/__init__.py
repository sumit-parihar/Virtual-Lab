"""The ten experiments: content, quizzes and the Code Exercise for each.

One module per experiment (exp01_..., exp02_..., ...) holds the text and quizzes. The solution used to
compute each Code Exercise answer is in solutions/, and the stored answers are in expected_results.json.
Edit a module and re-run `python -m scripts.load_experiments` to refresh the app.
"""
import json
from dataclasses import dataclass
from importlib import import_module
from pathlib import Path
from typing import Any, Optional

_DIR = Path(__file__).parent

# Order = experiment number (1 to 10).
MODULES = [
    "exp01_simple_linear_regression",
    "exp02_multiple_linear_regression",
    "exp03_logistic_regression",
    "exp04_knn",
    "exp05_naive_bayes",
    "exp06_decision_tree",
    "exp07_random_forest",
    "exp08_svm",
    "exp09_kmeans",
    "exp10_ann",
]

Quiz = list[tuple[str, list[str], int]]  # (question, options, index of the correct option)


@dataclass
class ExperimentContent:
    number: int
    title: str
    slug: str
    overview: str
    aim: str
    objective: str
    video_url: str
    notes: str
    pre_quiz: Quiz
    post_quiz: Quiz
    assignment: Quiz
    allowed_imports: list[str]
    dataset_url: Optional[str]
    code_problem_statement: str
    starter_code: str
    solution_code: str
    expected_result: Any


def expected_results() -> dict:
    return json.loads((_DIR / "expected_results.json").read_text())["results"]


def load_all() -> list[ExperimentContent]:
    expected = expected_results()
    experiments = []
    for number, name in enumerate(MODULES, start=1):
        m = import_module(f"scripts.experiment_content.{name}")
        experiments.append(ExperimentContent(
            number=number,
            title=m.TITLE,
            slug=m.SLUG,
            overview=m.OVERVIEW,
            aim=m.AIM,
            objective=m.OBJECTIVE,
            video_url=m.VIDEO_URL,
            notes=m.NOTES,
            pre_quiz=m.PRE_QUIZ,
            post_quiz=m.POST_QUIZ,
            assignment=m.ASSIGNMENT,
            allowed_imports=m.ALLOWED_IMPORTS,
            dataset_url=m.DATASET_URL,
            code_problem_statement=m.CODE_PROBLEM_STATEMENT,
            starter_code=m.STARTER_CODE,
            solution_code=(_DIR / "solutions" / m.SOLUTION_FILE).read_text(),
            expected_result=expected[m.SLUG],
        ))
    return experiments
