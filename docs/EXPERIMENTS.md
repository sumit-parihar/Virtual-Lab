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

## Videos
Every experiment currently uses the placeholder link `https://example.com/placeholder-video`. Replace `VIDEO_URL` in the module and load again
when the real links are available.
