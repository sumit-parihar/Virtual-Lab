"""Experiment 4: K-Nearest Neighbors (KNN). Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'K-Nearest Neighbors (KNN)'
SLUG = 'k-nearest-neighbors'

OVERVIEW = 'When you meet a new fruit, you might decide what it is by thinking of the fruits it most resembles. K-Nearest Neighbors works in exactly this way. To classify a new example, it looks up the k most similar examples it has already seen and lets them vote. In this experiment you learn how similarity is measured, how the choice of k changes the result, why feature scaling matters so much, and how to build a KNN classifier on the classic iris flower dataset.'

AIM = 'To understand how a classifier can make predictions from the closest stored examples, and to train, tune and evaluate a KNN classifier in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: describe how KNN classifies a new example using its nearest neighbours; compute the Euclidean distance between two points; explain how a small or large value of k affects the model; explain why features must be scaled before distances are compared; train and use `KNeighborsClassifier` in scikit-learn; and evaluate a classifier on test data and name the main limits of KNN.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. Learning by resemblance

Many models learn a formula from the training data. KNN does something simpler: it keeps the training examples and, when asked about a new one, finds the examples that are most similar to it. The idea is that similar inputs tend to have similar answers. A house is probably priced like the houses nearby; a flower with petals like those of a known species probably belongs to that species.

## 2. The algorithm

To predict for a new example:

1. Choose a number **k** (for example 5).
2. Measure the distance from the new example to every training example.
3. Pick the k training examples with the smallest distances: its **nearest neighbours**.
4. For classification, take a **majority vote** of their classes. For regression, take the average of their values.

There is no training step beyond storing the data, which is why KNN is called a **lazy learner**.

## 4. Measuring distance

The most common choice is the **Euclidean distance**, the straight-line distance. For two points with features (a₁, a₂, …) and (b₁, b₂, …):

**d = √[(a₁ − b₁)² + (a₂ − b₂)² + …]**

Example: for the points (1, 2) and (4, 6) the differences are 3 and 4, so d = √(9 + 16) = 5. Another option is the **Manhattan distance**, which adds the absolute differences: 3 + 4 = 7. Which distance is best depends on the data, but Euclidean is the usual default.

## 5. Choosing k

- A **very small k** (such as 1) follows every detail of the training data, including noise and outliers. The model overfits and its boundaries are jagged.
- A **very large k** averages over so many neighbours that local patterns disappear. The model underfits and tends to favour the most common class.
- For two classes, an **odd k** avoids tied votes.

A good k is found by trying several values and comparing their scores on data that was not used for training (for example with cross-validation).

## 6. Scaling the features

Distance adds up the differences of all features. If one feature is measured in thousands and another between 0 and 1, the large one decides almost everything and the small one is ignored. To give every feature a fair say, scale them first, for example to a mean of 0 and a spread of 1. The scaling must be learned from the training data only.

## 7. Using scikit-learn

- `KNeighborsClassifier(n_neighbors=5)` creates the model.
- `fit(X_train, y_train)` stores the training data.
- `predict(X_test)` classifies each test example by voting.
- `predict_proba(X_test)` gives the share of the neighbours' votes for each class.
- `kneighbors(X)` shows which training examples were the nearest neighbours.

**The dataset:** the iris dataset has 150 flowers of three species (50 each). Each flower has four measurements in centimetres: sepal length, sepal width, petal length and petal width. The four features have similar ranges, so scaling matters less here than in most real data.

## 8. Evaluating the classifier

Accuracy is the share of test examples classified correctly. A confusion matrix shows which classes are mixed up. As always, scores must come from test data, never from the examples used for fitting. (With KNN, scoring a training example against its own stored copy would make k = 1 look perfect, which is meaningless.)

## 9. Limits

- Prediction is slow for large datasets, because the new example is compared with every stored one.
- With many features, distances become less meaningful (the "curse of dimensionality").
- Irrelevant features add noise to the distance.
- Unbalanced classes can dominate the vote.
- The model needs all training data kept in memory.

## Summary

KNN classifies a new example by a majority vote of its k nearest training examples. The choice of k trades noise against over-smoothing, distances need scaled features, and the cost of prediction grows with the size of the stored data.

## References
1. scikit-learn documentation, Nearest Neighbors: https://scikit-learn.org/stable/modules/neighbors.html
2. scikit-learn documentation, Toy datasets: https://scikit-learn.org/stable/datasets/toy_dataset.html"""

PRE_QUIZ = [
    (
        'What is the straight-line distance between the points (0, 0) and (3, 4)?',
        [
            '3',
            '4',
            '5',
            '7',
        ],
        2,
    ),
    (
        'Five neighbours have classes A, A, B, A, B. What does a majority vote give?',
        [
            'A',
            'B',
            'A tie',
            'Neither',
        ],
        0,
    ),
    (
        'Which of these is a classification task?',
        [
            "Predicting tomorrow's rainfall in millimetres",
            'Deciding which species a flower belongs to',
            'Forecasting sales',
            'Estimating a house price',
        ],
        1,
    ),
    (
        'Why is a test set kept apart from training data?',
        [
            'To make training faster',
            'To shrink the dataset',
            'To check performance on examples the model has not seen',
            'To remove noise',
        ],
        2,
    ),
    (
        'One feature is measured in thousands and another between 0 and 1. In a distance calculation, which feature will dominate?',
        [
            'The one measured in thousands',
            'The one between 0 and 1',
            'Neither',
            'The one with the longer name',
        ],
        0,
    ),
    (
        'In supervised classification, a class label is:',
        [
            'The known category of an example',
            'A feature',
            'A distance',
            'A prediction error',
        ],
        0,
    ),
    (
        'A classifier gets 27 of 30 test examples right. What is its accuracy?',
        [
            '0.27',
            '0.80',
            '0.90',
            '0.97',
        ],
        2,
    ),
    (
        'If two points are close together in feature space, they are probably:',
        [
            'Unrelated',
            'Similar to each other',
            'Always in different classes',
            'Outliers',
        ],
        1,
    ),
    (
        'True or False: The best model is always the one with the lowest error on the training data.',
        [
            'True',
            'False',
        ],
        1,
    ),
    (
        'What does the mean of the numbers 2, 4 and 6 equal?',
        [
            '3',
            '4',
            '5',
            '12',
        ],
        1,
    ),
]

POST_QUIZ = [
    (
        'How does KNN classify a new example?',
        [
            'It evaluates a stored equation',
            'It picks the most common class overall',
            'It picks the farthest neighbour',
            'It takes a majority vote among the classes of its k nearest training examples',
        ],
        3,
    ),
    (
        'Why is KNN called a "lazy learner"?',
        [
            'It gives poor results',
            'It does almost nothing when fitted and does its work at prediction time',
            'It ignores some of the data',
            'It cannot use labels',
        ],
        1,
    ),
    (
        'What is the Euclidean distance between (1, 2) and (4, 6)?',
        [
            '3',
            '4',
            '5',
            '7',
        ],
        2,
    ),
    (
        'What is the usual effect of choosing k = 1?',
        [
            'The model becomes very smooth',
            'The model follows noise and outliers and overfits',
            'The model ignores every neighbour',
            'The model needs no scaling',
        ],
        1,
    ),
    (
        'What happens when k is very large?',
        [
            'Local patterns are averaged away, so the model can underfit',
            'The model fits every detail',
            'Training becomes impossible',
            'The distances become zero',
        ],
        0,
    ),
    (
        'Why should features be scaled before using KNN?',
        [
            'To change the labels',
            'To add more neighbours',
            'So features with large ranges do not dominate the distance',
            'To remove the need for k',
        ],
        2,
    ),
    (
        'For a two-class problem, why is an odd k often chosen?',
        [
            'It is faster',
            'It improves scaling',
            'It avoids tied votes',
            'It gives probability one',
        ],
        2,
    ),
    (
        'Which scikit-learn argument sets the number of neighbours?',
        [
            '`n_neighbors`',
            '`max_depth`',
            '`C`',
            '`n_clusters`',
        ],
        0,
    ),
    (
        'Prediction time for KNN generally grows with:',
        [
            'The value of the labels',
            'The colour of the plot',
            'Nothing',
            'The number of stored training examples',
        ],
        3,
    ),
    (
        'True or False: KNN builds an explicit formula during `fit`.',
        [
            'True',
            'False',
        ],
        1,
    ),
]

ASSIGNMENT = [
    (
        'A new point has the nearest neighbours with classes A, B, B, A, B (k = 5). What does KNN predict?',
        [
            'B',
            'A',
            'It cannot decide',
            'A and B equally',
        ],
        0,
    ),
    (
        'Distances from a new point to three training points are 2, 5 and 9. For k = 2, which training points are used?',
        [
            'The ones at 5 and 9',
            'The ones at 2 and 9',
            'The ones at 2 and 5',
            'All three',
        ],
        2,
    ),
    (
        'Validation accuracy is 0.82 for k = 1, 0.91 for k = 5, 0.93 for k = 9 and 0.85 for k = 25. Which k is the best choice on this evidence?',
        [
            '1',
            '5',
            '9',
            '25',
        ],
        2,
    ),
    (
        'A dataset has two features: salary in rupees (tens of thousands) and age in years. Without scaling, the distances will mostly depend on:',
        [
            'Salary',
            'Age',
            'Both equally',
            'Neither',
        ],
        0,
    ),
    (
        'After scaling, the mean of a feature is 0 and its spread is 1. The scaling values must be learned from:',
        [
            'The training set only',
            'The test set',
            'The whole dataset before splitting',
            'Any column',
        ],
        0,
    ),
    (
        'A model scores 100% on its training data with k = 1 but much lower on the test data. This is a sign of:',
        [
            'Underfitting',
            'Perfect generalisation',
            'A scaling error',
            'Overfitting',
        ],
        3,
    ),
    (
        'A dataset has 10 000 000 stored examples. What is the main practical problem with KNN?',
        [
            'Every prediction must compare the new point with a very large amount of stored data',
            'It cannot vote',
            'It needs labels removed',
            'It cannot use numbers',
        ],
        0,
    ),
    (
        'Adding 20 features that are pure noise to a KNN model will usually:',
        [
            'Make distances less meaningful and can hurt accuracy',
            'Improve accuracy',
            'Have no effect at all',
            'Remove the need for k',
        ],
        0,
    ),
    (
        'In a binary problem 95% of the training examples belong to class A. With a large k, the predictions will tend to be:',
        [
            'Mostly class B',
            'Random',
            'Always tied',
            'Mostly class A',
        ],
        3,
    ),
    (
        "True or False: For KNN regression, the prediction is usually the average of the neighbours' values.",
        [
            'True',
            'False',
        ],
        0,
    ),
]

ALLOWED_IMPORTS = ["numpy", "pandas", "sklearn"]
DATASET_URL = None

CODE_PROBLEM_STATEMENT = """## Problem Statement

Classify iris flowers with KNN.

### Steps

1. Load the built-in iris dataset: `from sklearn.datasets import load_iris` and `X, y = load_iris(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Train `KNeighborsClassifier(n_neighbors=5)` on the training part.
4. Predict the classes of the test part and store them as a list of whole numbers in `result`.

### Important

- The answer must be stored in the variable `result` (a list of whole numbers, one for each test sample). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex04_knn.py).
SOLUTION_FILE = 'ex04_knn.py'
