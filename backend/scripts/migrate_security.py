"""Sign-in protection columns on users. Safe to re-run.

Run from the backend directory with the project's virtualenv active:
    python -m scripts.migrate_security

  * users.failed_login_attempts, users.locked_until   (lock an account after repeated wrong passwords)
  * users.token_version                               (end old logins on logout / password change)
"""
from sqlalchemy import inspect, text

from app.database import engine

COLUMNS = {
    "failed_login_attempts": "INTEGER NOT NULL DEFAULT 0",
    "locked_until": "TIMESTAMP WITH TIME ZONE",
    "token_version": "INTEGER NOT NULL DEFAULT 0",
}


def main() -> None:
    with engine.begin() as connection:
        existing = {c["name"] for c in inspect(connection).get_columns("users")}
        for name, ddl in COLUMNS.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl}"))
                print(f"Added users.{name}")
    print("Security migration finished.")


if __name__ == "__main__":
    main()
