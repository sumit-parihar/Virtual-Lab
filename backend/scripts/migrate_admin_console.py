"""Database changes for the admin console. Safe to re-run.

Run from the backend directory with the project's virtualenv active:
    python -m scripts.migrate_admin_console

  * users.credentials_status      (result of the last invitation email)
  * batches.is_archived           (archive instead of delete)
  * one batch per student         (enrollments.student_id becomes unique)

If a student is enrolled in more than one batch, the earliest enrolment is kept and the
others are deleted (no backup). This is meant for development data.
"""
from sqlalchemy import inspect, text

from app.database import engine


def main() -> None:
    with engine.begin() as connection:
        inspector = inspect(connection)

        user_columns = {c["name"] for c in inspector.get_columns("users")}
        if "credentials_status" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN credentials_status VARCHAR(16)"))
            print("Added users.credentials_status")

        batch_columns = {c["name"] for c in inspector.get_columns("batches")}
        if "is_archived" not in batch_columns:
            connection.execute(text("ALTER TABLE batches ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE"))
            print("Added batches.is_archived")

        unique_names = {c["name"] for c in inspector.get_unique_constraints("enrollments")}
        if "uq_enrollment_student" not in unique_names:
            removed = connection.execute(text(
                "DELETE FROM enrollments WHERE id IN ("
                "  SELECT id FROM ("
                "    SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY enrolled_at, id) AS n"
                "    FROM enrollments"
                "  ) ranked WHERE n > 1)"
            )).rowcount
            if removed:
                print(f"Removed {removed} extra enrolment(s): kept each student's earliest batch")
            connection.execute(text(
                "ALTER TABLE enrollments ADD CONSTRAINT uq_enrollment_student UNIQUE (student_id)"
            ))
            if "uq_student_batch" in unique_names:
                connection.execute(text("ALTER TABLE enrollments DROP CONSTRAINT uq_student_batch"))
            print("Enforced one batch per student")

    print("Admin console migration finished.")


if __name__ == "__main__":
    main()
