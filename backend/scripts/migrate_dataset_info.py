"""Add experiments.dataset_info (the read-only "About the dataset" panel).

Run from the backend directory with the project's virtualenv active:
    python -m scripts.migrate_dataset_info

Safe to rerun. Nothing else is changed. Run `python -m scripts.load_experiments` afterwards to fill it.
"""
from sqlalchemy import inspect, text

from app.database import engine


def main() -> None:
    with engine.begin() as connection:
        columns = {c["name"] for c in inspect(connection).get_columns("experiments")}
        if "dataset_info" in columns:
            print("experiments.dataset_info already exists. Nothing to do.")
            return
        column_type = "JSONB" if connection.dialect.name == "postgresql" else "JSON"
        connection.execute(text(f"ALTER TABLE experiments ADD COLUMN dataset_info {column_type}"))
        print("Added experiments.dataset_info")


if __name__ == "__main__":
    main()
