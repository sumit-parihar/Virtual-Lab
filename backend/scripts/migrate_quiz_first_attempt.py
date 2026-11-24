"""Add student_quiz_progress.first_score and first_submitted_at.

They keep the score of each student's FIRST Pre-Quiz / Post-Quiz attempt, for the
learner study's pre-test/post-test comparison. Existing rows keep NULL (their first
attempt was never recorded); every new row gets them on its first submission.

Run from the backend directory with the project's virtualenv active:
    python -m scripts.migrate_quiz_first_attempt

Safe to rerun. Nothing else is changed.
"""
from sqlalchemy import inspect, text

from app.database import engine

COLUMNS = {
    "first_score": "DOUBLE PRECISION",
    "first_submitted_at": "TIMESTAMP WITH TIME ZONE",
}


def main() -> None:
    with engine.begin() as connection:
        tables = set(inspect(connection).get_table_names())
        if "student_quiz_progress" not in tables:
            raise RuntimeError(
                "student_quiz_progress is missing. Run python -m scripts.migrate_quiz_best_score_only first."
            )
        existing = {c["name"] for c in inspect(connection).get_columns("student_quiz_progress")}
        for name, sql_type in COLUMNS.items():
            if name in existing:
                print(f"student_quiz_progress.{name} already exists. Nothing to do.")
                continue
            connection.execute(text(f"ALTER TABLE student_quiz_progress ADD COLUMN {name} {sql_type}"))
            print(f"Added student_quiz_progress.{name}")


if __name__ == "__main__":
    main()
