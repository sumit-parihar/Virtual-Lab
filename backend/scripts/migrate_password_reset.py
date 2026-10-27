"""Create the password_reset_tokens table (forgot password). Safe to re-run.

Run from the backend directory with the project's virtualenv active:
    python -m scripts.migrate_password_reset
"""
from sqlalchemy import inspect

from app import models  # noqa: F401  (registers the tables)
from app.database import Base, engine
from app.models import PasswordResetToken


def main() -> None:
    if "password_reset_tokens" in inspect(engine).get_table_names():
        print("password_reset_tokens already exists. Nothing to do.")
        return
    Base.metadata.create_all(bind=engine, tables=[PasswordResetToken.__table__])
    print("Created password_reset_tokens")


if __name__ == "__main__":
    main()
