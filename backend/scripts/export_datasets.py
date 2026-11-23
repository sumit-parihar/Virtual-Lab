"""Export the scikit-learn datasets used by Experiments 2-10 to CSV files the browser can show.

Run from the backend directory with a Python that has scikit-learn (not needed by the app itself):
    python -m scripts.export_datasets

Writes frontend/public/datasets/{diabetes,breast_cancer,iris,wine,digits}.csv and <name>_split.json (the test rows
of the Code Exercise's train_test_split(test_size=0.2, random_state=42)). Each CSV file holds exactly the data
that `load_<name>(return_X_y=True)` gives the student's code: the feature columns in the same order, named with
scikit-learn's feature names, followed by a `target` column (y). The "About the dataset" panel and the Guided Labs
read these files; the students' code still loads the data from scikit-learn. Safe to rerun (files are overwritten).
"""
import csv
from pathlib import Path

DATASETS = ["diabetes", "breast_cancer", "iris", "wine", "digits"]
OUT_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "datasets"


def _cell(value: float) -> str:
    """Shortest exact text for a number; whole numbers without a trailing '.0'."""
    value = float(value)
    return str(int(value)) if value.is_integer() else repr(value)


def export(name: str) -> Path:
    from sklearn import datasets  # imported here: only this script needs scikit-learn

    bunch = getattr(datasets, f"load_{name}")()
    path = OUT_DIR / f"{name}.csv"
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow([*bunch.feature_names, "target"])
        for row, target in zip(bunch.data, bunch.target):
            writer.writerow([*(_cell(v) for v in row), _cell(target)])
    return path


def export_split(name: str) -> Path:
    """The rows that `train_test_split(X, y, test_size=0.2, random_state=42)` puts in the test set, in its order.

    The Guided Labs use the same split as the Code Exercise, so their numbers match what the student's code gets.
    """
    import json

    import numpy as np
    from sklearn import datasets
    from sklearn.model_selection import train_test_split

    n_rows = len(getattr(datasets, f"load_{name}")().target)
    _, test_rows = train_test_split(np.arange(n_rows), test_size=0.2, random_state=42)
    path = OUT_DIR / f"{name}_split.json"
    path.write_text(
        json.dumps({"test_size": 0.2, "random_state": 42, "test_rows": [int(i) for i in test_rows]}),
        encoding="utf-8",
    )
    return path


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in DATASETS:
        for path in (export(name), export_split(name)):
            print(f"Wrote {path.relative_to(OUT_DIR.parents[1])}")


if __name__ == "__main__":
    main()
