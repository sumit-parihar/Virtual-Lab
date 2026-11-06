"""Experiment 7: Random Forest Classification. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Random Forest Classification'
SLUG = 'random-forest'

OVERVIEW = "One doctor's opinion can be wrong, but when many independent doctors agree, we trust the result more. A random forest applies this idea to machine learning. It grows many different decision trees, each on a slightly different view of the data, and lets them vote. The crowd is usually more accurate and more stable than any single tree. In this experiment you learn how the trees are made different from each other, why that helps, and how to train and inspect a random forest on a dataset of cell-sample measurements."

AIM = 'To understand how combining many randomised decision trees improves prediction, and to train and evaluate a random forest classifier in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: explain the idea of an ensemble and why combining models can help; describe bootstrap sampling and random feature selection; explain how a forest makes a prediction by voting; describe the effect of the number of trees and other main settings; train and use `RandomForestClassifier` in scikit-learn and read feature importances; and compare a random forest with a single decision tree.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. The problem with a single tree

A single deep decision tree fits its training data very closely and is **unstable**: change a few training rows and the tree can look completely different. Such a model has high **variance**. Its predictions swing from one training sample to another, and it overfits.

## 2. Ensembles and the wisdom of a crowd

An **ensemble** combines several models into one. If the models make different mistakes, the mistakes tend to cancel out when the models vote. The key condition is that the models must not all be wrong in the same way. A random forest makes sure of this by building trees that are deliberately different.

## 3. Two sources of randomness

**Bagging (bootstrap sampling).** Each tree is trained on its own **bootstrap sample**: a sample of the same size as the training set, drawn *with replacement*. Some rows are picked several times and others not at all. On average, about 63% of the distinct rows appear in any one sample. The rows that were left out of a tree's sample are called its **out-of-bag** rows.

**Random features at each split.** When a tree looks for the best question at a node, it considers only a random subset of the features, not all of them. For classification, the common default is about the square root of the number of features. This stops a few strong features from dominating every tree, so the trees become less alike.

## 4. Making a prediction

To classify a new example, every tree votes for a class and the forest predicts the class with the most votes. (For regression, the trees' values are averaged.) The share of votes can also be read as a rough probability. If 100 trees vote 73 for class A and 27 for class B, the forest predicts A.

## 5. The main settings

- `n_estimators`: the number of trees. More trees give a more stable result and rarely hurt, but cost time. After a few hundred trees there is little gain.
- `max_depth`, `min_samples_leaf`: limit how complex each tree can get.
- `max_features`: how many features are considered at each split.
- `random_state`: makes the random choices repeatable.

## 6. Out-of-bag score and feature importance

Because each tree has rows it never saw, those rows can be used to test it. Setting `oob_score=True` gives an **out-of-bag score**, a free estimate of test accuracy that needs no separate validation set.

`feature_importances_` shows how much each feature contributed to the splits across all trees. It is a helpful guide to which measurements matter, though it can favour features with many distinct values.

## 7. Using scikit-learn

- `RandomForestClassifier(n_estimators=100, random_state=42)` creates the model.
- `fit(X_train, y_train)` grows all the trees.
- `predict(X_test)` returns the classes chosen by vote.
- `predict_proba(X_test)` returns the average class probabilities of the trees.

**The dataset:** the breast-cancer dataset has 569 samples, each with 30 measurements computed from images of cell samples. The class is 0 (malignant) or 1 (benign). It is a teaching dataset, not for medical use.

## 8. Strengths and weaknesses

**Strengths:** usually much more accurate and stable than one tree; works well with little tuning; no feature scaling needed; handles many features; gives feature importances.

**Weaknesses:** harder to interpret than a single tree; slower to train and to predict; larger in memory; may still struggle with very high-dimensional sparse data.

## Summary

A random forest is an ensemble of decision trees, each trained on a bootstrap sample and restricted to random features at every split. The trees vote, which cancels out much of their individual noise, so the forest is more accurate and more stable than a single tree.

## References
1. scikit-learn documentation, Ensembles (Random forests): https://scikit-learn.org/stable/modules/ensemble.html#random-forests
2. scikit-learn documentation, Toy datasets: https://scikit-learn.org/stable/datasets/toy_dataset.html"""

PRE_QUIZ = [
    (
        'What is a decision tree?',
        [
            'A model that classifies by asking a sequence of questions about features',
            'A table of numbers',
            'A kind of plot',
            'A distance measure',
        ],
        0,
    ),
    (
        'In a vote among 5 models with answers A, A, B, A, B, the winner is:',
        [
            'A',
            'B',
            'A tie',
            'None',
        ],
        0,
    ),
    (
        'Sampling "with replacement" means that:',
        [
            'An item can be chosen more than once',
            'Every item can be chosen at most once',
            'Items are removed forever',
            'No item is chosen',
        ],
        0,
    ),
    (
        'A model that is very sensitive to small changes in its training data has high:',
        [
            'Bias',
            'Accuracy',
            'Speed',
            'Variance',
        ],
        3,
    ),
    (
        'What is overfitting?',
        [
            'Fitting too little',
            'Using too few rows',
            'Learning the noise in the training data so that new data is predicted poorly',
            'Using test data for fitting',
        ],
        2,
    ),
    (
        'Why is a test set used?',
        [
            'To make the model bigger',
            'To add noise',
            'To remove outliers',
            'To estimate performance on unseen data',
        ],
        3,
    ),
    (
        'The square root of 30 is closest to:',
        [
            '3',
            '5.5',
            '10',
            '15',
        ],
        1,
    ),
    (
        'If a model gets 95 of 100 test examples right, its accuracy is:',
        [
            '0.05',
            '0.5',
            '0.95',
            '9.5',
        ],
        2,
    ),
    (
        'True or False: If several models make different mistakes, averaging them can reduce the overall error.',
        [
            'True',
            'False',
        ],
        0,
    ),
    (
        'A feature in a dataset is:',
        [
            'A measurable input used to describe an example',
            'A prediction',
            'A mistake',
            'A model',
        ],
        0,
    ),
]

POST_QUIZ = [
    (
        'A random forest is:',
        [
            'A collection of decision trees whose predictions are combined',
            'One very deep decision tree',
            'A nearest-neighbour model',
            'A linear model',
        ],
        0,
    ),
    (
        'What is a bootstrap sample?',
        [
            'A sample drawn without replacement and smaller than the data',
            'A sample of the same size drawn with replacement',
            'The test set',
            'A sample with only one class',
        ],
        1,
    ),
    (
        'Why does each tree consider only a random subset of features at every split?',
        [
            'To save memory only',
            'To make the trees less alike so their mistakes cancel out',
            'To remove the labels',
            'To avoid voting',
        ],
        1,
    ),
    (
        'How does a random forest classify a new example?',
        [
            'The first tree decides',
            'The trees vote and the class with the most votes wins',
            'The smallest tree decides',
            'The class is chosen at random',
        ],
        1,
    ),
    (
        'What does `n_estimators` set?',
        [
            'The number of trees in the forest',
            'The depth of each tree',
            'The number of classes',
            'The number of features',
        ],
        0,
    ),
    (
        'What is the out-of-bag score?',
        [
            'The score on the training data',
            'An estimate of test accuracy from the rows each tree did not see',
            'The number of unused features',
            'The depth of the forest',
        ],
        1,
    ),
    (
        'Compared with a single tree, a forest usually has:',
        [
            'Lower variance and more stable predictions',
            'Higher variance',
            'Fewer parameters',
            'Easier explanations',
        ],
        0,
    ),
    (
        'Do random forests need feature scaling?',
        [
            'Yes, always',
            'No, trees compare each feature only with thresholds',
            'Only for the labels',
            'Only the first tree',
        ],
        1,
    ),
    (
        'Which is a drawback of a random forest compared with a single tree?',
        [
            'It is harder to interpret and slower',
            'It always overfits more',
            'It cannot handle numbers',
            'It needs labels removed',
        ],
        0,
    ),
    (
        'True or False: Setting `random_state` makes the random choices in a forest repeatable.',
        [
            'True',
            'False',
        ],
        0,
    ),
]

ASSIGNMENT = [
    (
        'In a forest of 100 trees, 73 vote for class A and 27 for class B. What does the forest predict, and what is the share of votes for A?',
        [
            'B, 0.27',
            'A, 0.27',
            'A, 0.73',
            'B, 0.73',
        ],
        2,
    ),
    (
        'A forest of 5 trees votes A, B, B, A, B. What is predicted?',
        [
            'A',
            'A tie',
            'B',
            'Nothing',
        ],
        2,
    ),
    (
        'A dataset has 36 features. About how many features does a tree consider at each split with the common default for classification (the square root)?',
        [
            '2',
            '6',
            '18',
            '36',
        ],
        1,
    ),
    (
        'A single deep tree scores 100% on training data and 82% on test data. A forest scores 100% and 94%. What does this suggest?',
        [
            'Combining many trees reduced the variance and helped generalisation',
            'The forest overfits more',
            'Test data is wrong',
            'The tree is better',
        ],
        0,
    ),
    (
        'Increasing `n_estimators` from 10 to 300 will usually:',
        [
            'Make results less stable',
            'Make every tree deeper',
            'Make results more stable at the cost of more time',
            'Remove the need for `random_state`',
        ],
        2,
    ),
    (
        'A bootstrap sample of 100 rows is drawn. Which statement is true?',
        [
            'All 100 rows appear exactly once',
            'Only half the rows are used',
            'Some rows appear several times and some not at all',
            'Rows are removed from the dataset',
        ],
        2,
    ),
    (
        'A forest has an out-of-bag score of 0.95. What does that approximately estimate?',
        [
            'The training accuracy',
            'The number of trees',
            'The importance of one feature',
            'The accuracy on unseen data',
        ],
        3,
    ),
    (
        'The feature importances show one feature with 0.6. How should this be read?',
        [
            'That feature caused the class',
            'It has 60% missing values',
            'It must be removed',
            'That feature contributed a large part to the splits that reduced impurity',
        ],
        3,
    ),
    (
        'Which change would most directly make each tree simpler and reduce overfitting?',
        [
            'Increase `max_depth` greatly',
            'Lower `max_depth` or raise `min_samples_leaf`',
            'Use fewer rows',
            'Remove `random_state`',
        ],
        1,
    ),
    (
        'True or False: A random forest can be interpreted as easily as one small decision tree.',
        [
            'True',
            'False',
        ],
        1,
    ),
]

ALLOWED_IMPORTS = ["numpy", "pandas", "sklearn"]
DATASET_URL = None

CODE_PROBLEM_STATEMENT = """## Problem Statement

Classify cell samples as malignant or benign with a random forest.

### Steps

1. Load the built-in breast-cancer dataset: `from sklearn.datasets import load_breast_cancer` and `X, y = load_breast_cancer(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Train `RandomForestClassifier(n_estimators=100, random_state=42)` on the training part.
4. Predict the classes of the test part and store them as a list of whole numbers in `result`.

### Important

- The answer must be stored in the variable `result` (a list of whole numbers, one for each test sample). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex07_random_forest.py).
SOLUTION_FILE = 'ex07_random_forest.py'
