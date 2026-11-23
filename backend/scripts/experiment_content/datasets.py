"""Descriptions for the "About the dataset" panel of the scikit-learn datasets (Experiments 2-10).

Data only. The files themselves are written by `python -m scripts.export_datasets` into frontend/public/datasets/
and are exactly what `load_<name>(return_X_y=True)` returns: the feature columns in the same order, then `target`.
The panel reads the row count, the sample rows and the class counts from the file.
"""
import copy

_XY = " In code, X holds the feature columns in the order listed below and y holds the target column."

_DATASETS = {
    "diabetes": {
        "name": "Diabetes dataset (scikit-learn)",
        "file_url": "/datasets/diabetes.csv",
        "description": (
            "442 diabetes patients with 10 measurements taken at the start, and a number showing how much the disease "
            "had progressed one year later. scikit-learn has already scaled the 10 measurements (centred on 0, small "
            "values), so a value such as 0.038 is not an age in years. A teaching dataset, not for medical use." + _XY
        ),
        "row_meaning": "one patient",
        "load_hint": "X, y = load_diabetes(return_X_y=True)",
        "columns": [
            {"name": "age", "meaning": "Age", "unit": "scaled", "role": "feature"},
            {"name": "sex", "meaning": "Sex", "unit": "scaled", "role": "feature"},
            {"name": "bmi", "meaning": "Body-mass index", "unit": "scaled", "role": "feature"},
            {"name": "bp", "meaning": "Average blood pressure", "unit": "scaled", "role": "feature"},
            {"name": "s1", "meaning": "Blood serum: total cholesterol", "unit": "scaled", "role": "feature"},
            {"name": "s2", "meaning": "Blood serum: low-density lipoproteins (LDL)", "unit": "scaled", "role": "feature"},
            {"name": "s3", "meaning": "Blood serum: high-density lipoproteins (HDL)", "unit": "scaled", "role": "feature"},
            {"name": "s4", "meaning": "Blood serum: total cholesterol / HDL", "unit": "scaled", "role": "feature"},
            {"name": "s5", "meaning": "Blood serum: triglycerides (log)", "unit": "scaled", "role": "feature"},
            {"name": "s6", "meaning": "Blood serum: blood sugar", "unit": "scaled", "role": "feature"},
            {"name": "target", "meaning": "Disease progression one year later (the value to predict)", "unit": "",
             "role": "target"},
        ],
        "class_column": None,
        "sample_rows": 8,
    },
    "breast_cancer": {
        "name": "Breast Cancer dataset (scikit-learn)",
        "file_url": "/datasets/breast_cancer.csv",
        "description": (
            "569 cell samples. Each row has 30 measurements computed from a microscope image of the cell nuclei: "
            "ten kinds of measurement (radius, texture, perimeter, area, smoothness, compactness, concavity, concave "
            "points, symmetry, fractal dimension), each given three times as the mean, the error and the worst value. "
            "A teaching dataset, not for medical use." + _XY
        ),
        "row_meaning": "one cell sample (one image)",
        "load_hint": "X, y = load_breast_cancer(return_X_y=True)",
        "columns": [
            {"name": "mean radius … mean fractal dimension", "count": 10, "role": "feature",
             "meaning": "The average of each of the ten measurements over the cells in the image", "unit": "varies"},
            {"name": "radius error … fractal dimension error", "count": 10, "role": "feature",
             "meaning": "How much each of the ten measurements varies (its standard error)", "unit": "varies"},
            {"name": "worst radius … worst fractal dimension", "count": 10, "role": "feature",
             "meaning": "The largest (worst) value of each of the ten measurements", "unit": "varies"},
            {"name": "target", "meaning": "The class: 0 = malignant, 1 = benign", "unit": "", "role": "target"},
        ],
        "class_column": "target",
        "class_names": {"0": "malignant", "1": "benign"},
        "sample_rows": 8,
    },
    "iris": {
        "name": "Iris dataset (scikit-learn)",
        "file_url": "/datasets/iris.csv",
        "description": (
            "150 iris flowers of three species, 50 of each, with four measurements per flower. The rows are sorted "
            "by species, so the samples below are spread through the file." + _XY
        ),
        "row_meaning": "one flower",
        "load_hint": "X, y = load_iris(return_X_y=True)",
        "columns": [
            {"name": "sepal length (cm)", "meaning": "Length of the sepal (outer leaf of the flower)", "unit": "cm",
             "role": "feature"},
            {"name": "sepal width (cm)", "meaning": "Width of the sepal", "unit": "cm", "role": "feature"},
            {"name": "petal length (cm)", "meaning": "Length of the petal", "unit": "cm", "role": "feature"},
            {"name": "petal width (cm)", "meaning": "Width of the petal", "unit": "cm", "role": "feature"},
            {"name": "target", "meaning": "The species: 0 = setosa, 1 = versicolor, 2 = virginica", "unit": "",
             "role": "target"},
        ],
        "class_column": "target",
        "class_names": {"0": "setosa", "1": "versicolor", "2": "virginica"},
        "sample_rows": 9,
        "sample_spread": True,
    },
    "wine": {
        "name": "Wine dataset (scikit-learn)",
        "file_url": "/datasets/wine.csv",
        "description": (
            "178 wines from three growers (cultivars), with 13 chemical measurements per wine. The measurements have "
            "very different ranges (proline is in the hundreds, hue is below 2). The rows are sorted by grower, so "
            "the samples below are spread through the file." + _XY
        ),
        "row_meaning": "one wine",
        "load_hint": "X, y = load_wine(return_X_y=True)",
        "columns": [
            {"name": "alcohol", "meaning": "Alcohol content", "unit": "%", "role": "feature"},
            {"name": "malic_acid", "meaning": "Malic acid", "unit": "", "role": "feature"},
            {"name": "ash", "meaning": "Ash", "unit": "", "role": "feature"},
            {"name": "alcalinity_of_ash", "meaning": "Alkalinity of the ash", "unit": "", "role": "feature"},
            {"name": "magnesium", "meaning": "Magnesium", "unit": "", "role": "feature"},
            {"name": "total_phenols", "meaning": "Total phenols", "unit": "", "role": "feature"},
            {"name": "flavanoids", "meaning": "Flavanoids", "unit": "", "role": "feature"},
            {"name": "nonflavanoid_phenols", "meaning": "Non-flavanoid phenols", "unit": "", "role": "feature"},
            {"name": "proanthocyanins", "meaning": "Proanthocyanins", "unit": "", "role": "feature"},
            {"name": "color_intensity", "meaning": "Colour intensity", "unit": "", "role": "feature"},
            {"name": "hue", "meaning": "Hue (shade of colour)", "unit": "", "role": "feature"},
            {"name": "od280/od315_of_diluted_wines", "meaning": "Light absorbance ratio of the diluted wine",
             "unit": "", "role": "feature"},
            {"name": "proline", "meaning": "Proline (an amino acid)", "unit": "", "role": "feature"},
            {"name": "target", "meaning": "The grower: 0, 1 or 2", "unit": "", "role": "target"},
        ],
        "class_column": "target",
        "class_names": {"0": "grower 0", "1": "grower 1", "2": "grower 2"},
        "sample_rows": 9,
        "sample_spread": True,
    },
    "digits": {
        "name": "Digits dataset (scikit-learn)",
        "file_url": "/datasets/digits.csv",
        "description": (
            "1,797 small images of handwritten digits. Each image is 8 × 8 pixels, and each pixel is one column with "
            "a brightness from 0 to 16, so every row has 64 feature columns. The target is the digit shown." + _XY
        ),
        "row_meaning": "one 8 × 8 image of a handwritten digit",
        "load_hint": "X, y = load_digits(return_X_y=True)",
        "columns": [
            {"name": "pixel_0_0 … pixel_7_7", "count": 64, "role": "feature",
             "meaning": "Brightness of each pixel, row by row (pixel_row_column)", "unit": "0 to 16"},
            {"name": "target", "meaning": "The digit shown in the image, 0 to 9", "unit": "", "role": "target"},
        ],
        "class_column": "target",
        "sample_rows": 10,
        "sample_images": {"width": 8, "height": 8, "max": 16},
    },
}


def dataset_info(key: str, **changes) -> dict:
    """A fresh copy of one dataset's panel description; `changes` replace top-level fields."""
    info = copy.deepcopy(_DATASETS[key])
    info.update(changes)
    return info
