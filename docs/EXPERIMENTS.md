# The experiments

Ten experiments, numbered 1 to 10. Each has an overview, aim, learning objectives, a video link, theory with references, a Pre-Quiz,
a Post-Quiz and an Assignment (10 questions each), and a Code Exercise.

| # | Experiment | Code Exercise: what `result` holds |
|---|---|---|
| 1 | Simple Linear Regression | the test predictions, rounded to 2 decimals (Salary dataset) |
| 2 | Multiple Linear Regression | the first 10 test predictions, rounded to 2 decimals (Diabetes) |
| 3 | Logistic Regression | the predicted class of every test sample (Breast Cancer) |
| 4 | K-Nearest Neighbors (KNN) | the predicted class of every test sample (Iris) |
| 5 | Naive Bayes Classification | the predicted class of every test sample (Wine) |
| 6 | Decision Tree Classification | the predicted class of every test sample (Iris) |
| 7 | Random Forest Classification | the predicted class of every test sample (Breast Cancer) |
| 8 | Support Vector Machine (SVM) | the predicted class of every test sample (Wine, scaled features) |
| 9 | K-Means Clustering | a dictionary: sorted `cluster_sizes` and the rounded `inertia` (Iris, no labels) |
| 10 | Artificial Neural Network (ANN) for Classification | the test accuracy, rounded to 2 decimals (Digits) |

Every exercise splits the data with `train_test_split(..., test_size=0.2, random_state=42)` (except K-Means, which has no split). The
student's answer must be in the variable `result` and is compared exactly with the stored answer.

## Where things are
`backend/scripts/experiment_content/`
- `exp01_...py` to `exp10_...py`: the text, quizzes and Code Exercise of each experiment. Quizzes are lists of
  `(question, [options], index of the correct option)`.
- `solutions/`: a working solution for each exercise. They are also useful for practice (each prints `result`).
- `expected_results.json`: the stored answers, by experiment.

## Changing the content
1. Edit the module of the experiment.
2. Run `python -m scripts.load_experiments` from `backend/`.

**The loader deletes all experiments and the progress, quiz scores and submissions that belong to them**, then creates the ten again. Use
it on development data. With `ENV=production` it stops unless you add `--force`. Users, batches and enrolments are not touched.

## Expected answers and the browser Python
Students run their code in the browser (Pyodide), which ships its own version of scikit-learn. The stored answers were first computed with
scikit-learn on the development computer, so some of them (forests, SVM, K-Means, the neural network) could differ slightly from what the
browser produces. To compute them with the browser Python:
```bash
cd frontend
npm run compute:expected            # saves backend/scripts/experiment_content/expected_results.json
cd ../backend
python -m scripts.load_experiments  # puts the new answers into the database
```
`npm run compute:expected -- --check` only compares and reports. The script needs the internet once to download numpy, pandas and
scikit-learn, or `npm run setup:editor` first to use the local copy.

## Guided Lab
The Guided Lab is an interactive page (graph, sliders, toggles) that runs entirely in the browser and saves nothing; the student can
only move the controls it provides.
- `LAB_CONFIG` in an experiment module holds **data only**: the lab `kind`, the dataset file (a fixed file in `frontend/public/datasets/`),
  slider ranges and start values, and the guided `steps` (`task` + `explanation`). It never contains code.
- The lab itself is a React component in `frontend/src/components/guided-labs/`, chosen by `kind` in
  `frontend/src/components/GuidedLab.jsx` (`LABS`). Its maths is in a separate file with unit tests.
- All ten experiments have a lab (basic fundamentals only). Each trains on the Code Exercise's training rows
  (`<name>_split.json`, the test rows of `train_test_split(test_size=0.2, random_state=42)`) unless noted:

  | # | `kind` | Component | What the student does |
  |---|---|---|---|
  | 1 | `linear-regression` | `LinearRegressionLab.jsx` | slope/intercept sliders, residuals, least-squares line, outlier, MAE/MSE/R², prediction (all 30 rows) |
  | 2 | `multiple-regression` | `MultipleRegressionLab.jsx` | tick features, equation, coefficient bars, predicted vs actual, training vs test R² |
  | 3 | `logistic-regression` | `LogisticRegressionLab.jsx` | two features, threshold slider, straight boundary, sigmoid, confusion matrix, precision/recall |
  | 4 | `knn` | `KnnLab.jsx` | k slider, Euclidean/Manhattan, click to place a flower and see its neighbours vote, accuracy vs k |
  | 5 | `naive-bayes` | `NaiveBayesLab.jsx` | bell curve per grower, value slider, prior × likelihood → posterior table, optional second feature |
  | 6 | `decision-tree` | `DecisionTreeLab.jsx` | max depth and min leaf size, rectangular regions, the learned questions with Gini, accuracy vs depth |
  | 7 | `random-forest` | `RandomForestLab.jsx` | number of trees, three single trees, votes for a clicked point, out-of-bag estimate, accuracy vs trees |
  | 8 | `svm` | `SvmLab.jsx` | two growers, linear/RBF, C and gamma, margin and support vectors, scaling on/off |
  | 9 | `kmeans` | `KMeansLab.jsx` | k, step-by-step assign/move, new starting centroids, compare with species, elbow chart (all 150 rows) |
  | 10 | `neural-network` | `NeuralNetworkLab.jsx` | one neuron (weights, bias, activation); train a network on the digits: hidden size, learning rate, loss, confusion matrix |

- Shared pieces: `PlotFrame.jsx` (axes), `ClassifierPlot.jsx` (decision regions), `GuidedSteps.jsx`, `useLabData.js`, `labs.css`.
  The maths files (`labMath.js`, `logistic.js`, `knn.js`, `naiveBayes.js`, `tree.js`, `forest.js`, `svm.js`, `kmeans.js`,
  `mlp.js`) have unit tests that compare them with scikit-learn on the same files. Numbers quoted in the steps come from these.
- The instructor view does not show the Guided Lab.

To change the steps or slider ranges, edit `LAB_CONFIG` and run the loader again.

## About the dataset panel
A read-only panel shown at the top of the **Guided Lab** (closed until clicked) and above the **Code Exercise** editor (open). It is
content inside those sections: it adds no sidebar section and does not change Mark Completed. There is no download button.
- `DATASET_INFO` in an experiment module holds **data only**: `name`, `file_url` (a fixed file in `frontend/public/datasets/`),
  `description`, `row_meaning` ("one employee"), `load_hint` (how the student's code loads it), `columns`
  (`name`, `meaning`, `unit`, `role`: `feature` or `target`), `class_column` (for classification, to count the rows per class; `None`
  for regression) and `sample_rows` (how many rows to show).
- The row and column counts, the sample rows and the class counts are read by the browser from the file itself, so they always match
  what the student's code loads.
- All ten experiments have the panel. Experiment 1 describes `Salary_dataset.csv`; Experiments 2-10 use the shared descriptions in
  `experiment_content/datasets.py` (Diabetes, Breast Cancer, Iris, Wine, Digits). Extra fields: `class_names`, `count` (a group of
  columns in one row), role `unused` (Experiment 9's species), `sample_spread` (rows spread through a file sorted by class) and
  `sample_images` (Digits samples drawn as 8 × 8 images). Very long decimals are shortened to 4 places for display only.
- A database created earlier needs `python -m scripts.migrate_dataset_info` once.

## Dataset files for the panel and the labs
`frontend/public/datasets/` holds `Salary_dataset.csv` and, for Experiments 2-10, `diabetes.csv`, `breast_cancer.csv`, `iris.csv`,
`wine.csv` and `digits.csv` with a `<name>_split.json` each. The CSV files are exactly what `load_<name>(return_X_y=True)` returns
(scikit-learn's feature names, then `target`); the students' code still loads the data from scikit-learn. They are written by
`python -m scripts.export_datasets` (from `backend/`, with a Python that has scikit-learn; the app itself does not need it).

## Videos
Every experiment currently uses the placeholder link `https://example.com/placeholder-video`. Replace `VIDEO_URL` in the module and load again
when the real links are available.
