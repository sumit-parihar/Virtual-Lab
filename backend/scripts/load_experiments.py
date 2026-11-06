"""Load the ten experiments into the database, replacing the existing experiments.

Run from the backend directory with the project's virtualenv active:
    python -m scripts.load_experiments

What it does:
  * deletes every existing experiment together with its quizzes, section completions, code submissions,
    assignment submissions and quiz scores (progress on those experiments is lost, so only do this on development data)
  * creates the ten experiments (numbers 1 to 10) with overview, aim, objectives, video link, theory, a Pre-Quiz,
    a Post-Quiz and an Assignment (no deadline, score shown immediately), and the Code Exercise (problem
    statement, starter code, allowed libraries, dataset file) with its hidden expected result
Users, batches and enrolments are not touched.

With ENV=production the script refuses to run unless --force is given.
"""
import sys

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.code_submission import CodeSubmission
from app.models.experiment import Experiment, ExperimentEvaluationSpec
from app.models.quiz import Option, Question, Quiz, QuizType, RevealPolicy
from scripts.experiment_content import ExperimentContent, load_all


def _remove_all(db: Session) -> None:
    for exp in db.query(Experiment).all():
        # Code submissions are not cascaded by the ORM relationship, so remove them first.
        db.query(CodeSubmission).filter(CodeSubmission.experiment_id == exp.id).delete(synchronize_session=False)
        db.flush()
        db.delete(exp)
    db.flush()


def _add_quiz(db: Session, exp: Experiment, quiz_type: QuizType, title: str, questions) -> None:
    quiz = Quiz(
        experiment_id=exp.id,
        quiz_type=quiz_type,
        is_scored=quiz_type == QuizType.assignment,
        title=title,
        deadline=None,
        reveal_policy=RevealPolicy.immediate,
    )
    db.add(quiz)
    db.flush()
    for q_index, (text, options, correct) in enumerate(questions, start=1):
        question = Question(quiz_id=quiz.id, question_text=text, order_index=q_index)
        db.add(question)
        db.flush()
        for o_index, option_text in enumerate(options, start=1):
            db.add(Option(
                question_id=question.id,
                option_text=option_text,
                is_correct=(o_index - 1 == correct),
                order_index=o_index,
            ))
    db.flush()


def _create(db: Session, c: ExperimentContent) -> Experiment:
    exp = Experiment(
        title=c.title,
        slug=c.slug,
        order_index=c.number,
        overview=c.overview,
        aim=c.aim,
        objective=c.objective,
        notes=c.notes,
        video_url=c.video_url,
        starter_code=c.starter_code,
        allowed_imports=c.allowed_imports,
        code_problem_statement=c.code_problem_statement,
        code_dataset_url=c.dataset_url,
        is_published=True,
    )
    db.add(exp)
    db.flush()
    _add_quiz(db, exp, QuizType.pre, "Pre-Quiz", c.pre_quiz)
    _add_quiz(db, exp, QuizType.post, "Post-Quiz", c.post_quiz)
    _add_quiz(db, exp, QuizType.assignment, "Assignment", c.assignment)
    db.add(ExperimentEvaluationSpec(
        experiment_id=exp.id,
        expected_output=c.expected_result,
        comparison_tolerance=None,  # exact match
    ))
    return exp


def load(db: Session) -> list[Experiment]:
    """Replace every experiment with the ten in scripts/experiment_content."""
    _remove_all(db)
    created = [_create(db, c) for c in load_all()]
    db.commit()
    return created


def main() -> None:
    if settings.ENV == "production" and "--force" not in sys.argv:
        raise SystemExit("ENV is production: this deletes all experiments and student progress. Use --force if you are sure.")
    db = SessionLocal()
    try:
        for exp in load(db):
            print(f"Loaded experiment {exp.order_index}: {exp.title} ({exp.slug})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
