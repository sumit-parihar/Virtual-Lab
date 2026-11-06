"""Experiment 6: Decision Tree Classification. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Decision Tree Classification'
SLUG = 'decision-tree'

OVERVIEW = 'Imagine a game of twenty questions: each answer narrows down the possibilities until only one remains. A decision tree plays this game with data. It learns a series of yes-or-no questions about the features, such as "is the petal length below 2.5 cm?", and follows the answers down to a final class. In this experiment you learn how a tree chooses its questions, how to stop it from memorising the data, and how to train and read a tree on the iris flower dataset.'

AIM = 'To understand how a decision tree splits data to classify examples, and to train, limit and evaluate a decision tree classifier in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: describe the parts of a decision tree: root, internal nodes, branches and leaves; calculate the Gini impurity of a node; explain how the best split is chosen; explain overfitting in trees and how limiting the depth helps; train and use `DecisionTreeClassifier` in scikit-learn; and read feature importances and name the strengths and weaknesses of trees.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. A tree of questions

A decision tree is a flowchart. The **root node** asks the first question. Each answer leads along a **branch** to another node with its own question, and so on, until a **leaf** is reached. A leaf does not ask anything; it gives the predicted class. To classify an example, you start at the root and follow the branches that match its feature values.

## 2. What makes a good question?

At each node the tree wants a question that separates the classes as cleanly as possible. A node is **pure** if all of its training examples belong to one class, and **impure** if they are mixed. The tree measures how mixed a node is with an **impurity measure**.

The most common measure is the **Gini impurity**:

**Gini = 1 − (p₁² + p₂² + …)**

where p₁, p₂, … are the shares of each class in the node.

- A pure node has Gini = 0.
- A node with 8 examples of one class and 2 of another has p = 0.8 and 0.2, so Gini = 1 − (0.64 + 0.04) = 0.32.
- A node split 50 / 50 between two classes has Gini = 1 − (0.25 + 0.25) = 0.5, the highest value for two classes.

Another measure is **entropy**, which is 0 for a pure node and 1 for a 50 / 50 two-class node. The reduction in impurity from a split is called the **information gain**.

## 3. Choosing a split

For each node the algorithm tries many possible questions of the form "is feature j less than or equal to a value t?" For each, it computes the impurity of the two resulting groups (weighted by their sizes) and keeps the question that lowers the impurity the most. Then it repeats the same procedure on each of the two groups. This is called **recursive partitioning**.

## 4. When to stop

If the tree keeps splitting until every leaf is pure, it will memorise the training data, noise included. That is **overfitting**: perfect on the training set, poor on new data. To prevent it we stop early or prune:

- `max_depth`: the largest number of questions allowed on any path.
- `min_samples_split`: the fewest examples a node needs before it may be split.
- `min_samples_leaf`: the fewest examples a leaf must contain.

A shallow tree is easier to read and often generalises better.

## 5. Using scikit-learn

- `DecisionTreeClassifier(max_depth=3, random_state=42)` creates the model. The `random_state` makes the result repeatable when several splits are equally good.
- `fit(X_train, y_train)` grows the tree.
- `predict(X_test)` classifies the test examples.
- `feature_importances_` shows how much each feature contributed to reducing impurity.
- `export_text(tree)` and `plot_tree(tree)` display the learned questions.

**The dataset:** the iris dataset has 150 flowers of three species with four measurements each (sepal length, sepal width, petal length, petal width). A very shallow tree separates one species perfectly using a single petal measurement and needs only a few more questions for the other two.

## 6. Strengths and weaknesses

**Strengths:** easy to understand and explain; no feature scaling needed; handles numbers and categories; shows which features matter.

**Weaknesses:** prone to overfitting if not limited; unstable (small changes in the data can change the tree a lot); splits are always parallel to a feature axis, so diagonal boundaries need many splits; a single tree is usually less accurate than an ensemble of trees.

## Summary

A decision tree classifies by asking a sequence of feature questions. It chooses each question to make the resulting groups as pure as possible, measured by Gini impurity or entropy, and it must be limited (for example by depth) so that it does not memorise the training data.

## References
1. scikit-learn documentation, Decision Trees: https://scikit-learn.org/stable/modules/tree.html
2. scikit-learn documentation, Toy datasets: https://scikit-learn.org/stable/datasets/toy_dataset.html"""

PRE_QUIZ = [
    (
        'A flowchart is a diagram that:',
        [
            'Shows only numbers',
            'Shows steps and decisions connected by arrows',
            'Stores a dataset',
            'Draws a graph of a function',
        ],
        1,
    ),
    (
        'Which question can be answered with yes or no?',
        [
            'How tall are you?',
            'What is your name?',
            'How old are you?',
            'Is the petal longer than 2 cm?',
        ],
        3,
    ),
    (
        'A group contains 10 fruits, all apples. This group is:',
        [
            'Mixed',
            'Empty',
            'Random',
            'Pure',
        ],
        3,
    ),
    (
        'If 3 of 10 items are red, what share is red?',
        [
            '0.03',
            '0.3',
            '0.7',
            '3',
        ],
        1,
    ),
    (
        'What is 0.8 squared?',
        [
            '0.16',
            '0.64',
            '1.6',
            '0.8',
        ],
        1,
    ),
    (
        'In classification, the prediction is:',
        [
            'A class label',
            'A number on a scale',
            'A line',
            'A distance',
        ],
        0,
    ),
    (
        'Why is a test set used?',
        [
            'To train faster',
            'To add features',
            'To clean the data',
            'To measure performance on unseen examples',
        ],
        3,
    ),
    (
        'A model that memorises its training data but fails on new data is:',
        [
            'Underfitted',
            'Overfitted',
            'Calibrated',
            'Scaled',
        ],
        1,
    ),
    (
        'True or False: More questions always make a model better on new data.',
        [
            'True',
            'False',
        ],
        1,
    ),
    (
        'The sum of the shares of all classes in a group equals:',
        [
            '0',
            '1',
            '2',
            'The number of classes',
        ],
        1,
    ),
]

POST_QUIZ = [
    (
        'In a decision tree, a leaf node:',
        [
            'Asks a question about a feature',
            'Gives the predicted class',
            'Is the first node',
            'Stores the test data',
        ],
        1,
    ),
    (
        'A node contains 8 examples of class A and 2 of class B. What is its Gini impurity?',
        [
            '0',
            '0.2',
            '0.32',
            '0.5',
        ],
        2,
    ),
    (
        'What is the Gini impurity of a pure node?',
        [
            '1',
            '0.5',
            '0',
            '−1',
        ],
        2,
    ),
    (
        'How does the algorithm choose a split?',
        [
            'At random',
            'It picks the feature with the largest values',
            'It picks the question that lowers the impurity the most',
            'It picks the question with the most branches',
        ],
        2,
    ),
    (
        'What is the main risk of letting a tree grow until all leaves are pure?',
        [
            'Underfitting',
            'Losing the labels',
            'Overfitting to the training data',
            'Needing scaling',
        ],
        2,
    ),
    (
        'Which setting limits the number of questions on any path?',
        [
            '`n_neighbors`',
            '`C`',
            '`n_clusters`',
            '`max_depth`',
        ],
        3,
    ),
    (
        'Do decision trees need feature scaling?',
        [
            'Yes, always',
            'Only for the root',
            'No, their questions only compare a feature with a threshold',
            'Only for leaves',
        ],
        2,
    ),
    (
        'What does `feature_importances_` tell you?',
        [
            'The predicted classes',
            'The depth of the tree',
            'The test accuracy',
            'How much each feature helped to reduce impurity',
        ],
        3,
    ),
    (
        'Which is a known weakness of a single tree?',
        [
            'It cannot be explained',
            'Small changes in the data can change the tree a lot',
            'It needs no training',
            'It only handles two classes',
        ],
        1,
    ),
    (
        'True or False: Decision-tree splits are always parallel to a feature axis.',
        [
            'True',
            'False',
        ],
        0,
    ),
]

ASSIGNMENT = [
    (
        'A node has 5 examples of class A and 5 of class B. What is its Gini impurity?',
        [
            '0',
            '0.25',
            '0.5',
            '1',
        ],
        2,
    ),
    (
        'A node has three classes in equal numbers. Which is its Gini impurity, to two decimals?',
        [
            '0.33',
            '0.50',
            '0.67',
            '1.00',
        ],
        2,
    ),
    (
        'A split turns a node with Gini 0.5 into two pure nodes. What is the impurity of the result?',
        [
            '0.5',
            '0.25',
            '0',
            '1',
        ],
        2,
    ),
    (
        'A tree reaches 100% accuracy on the training set but only 70% on the test set. What is the best step?',
        [
            'Grow it deeper',
            'Remove the test set',
            'Scale the features',
            'Limit its depth or require more examples per leaf',
        ],
        3,
    ),
    (
        'Why can a tree handle a feature measured in thousands next to one measured between 0 and 1 without scaling?',
        [
            'It ignores large features',
            'It averages the features',
            'It converts everything to words',
            'Each question only compares one feature with its own threshold',
        ],
        3,
    ),
    (
        'A feature importance list shows petal length 0.55, petal width 0.40, sepal length 0.04, sepal width 0.01. What does this suggest?',
        [
            'Petal measurements decided most of the splits',
            'Sepal measurements decided most of the splits',
            'The tree is broken',
            'All features were equal',
        ],
        0,
    ),
    (
        'Which setting makes a leaf contain at least 5 training examples?',
        [
            '`max_depth=5`',
            '`min_samples_leaf=5`',
            '`random_state=5`',
            '`n_estimators=5`',
        ],
        1,
    ),
    (
        'A very shallow tree (depth 1) on a hard problem will probably:',
        [
            'Overfit strongly',
            'Be perfect',
            'Need scaling',
            'Underfit because it asks too few questions',
        ],
        3,
    ),
    (
        'Why does the same tree sometimes change when the training data changes slightly?',
        [
            'Trees use random labels',
            'The test set is used for fitting',
            'A small change can make a different split look best at the top, and everything below changes',
            'Depth is random',
        ],
        2,
    ),
    (
        'True or False: A decision tree is easy to explain because its questions can be read directly.',
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

Classify iris flowers with a decision tree.

### Steps

1. Load the built-in iris dataset: `from sklearn.datasets import load_iris` and `X, y = load_iris(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Train `DecisionTreeClassifier(max_depth=3, random_state=42)` on the training part.
4. Predict the classes of the test part and store them as a list of whole numbers in `result`.

### Important

- The answer must be stored in the variable `result` (a list of whole numbers, one for each test sample). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex06_decision_tree.py).
SOLUTION_FILE = 'ex06_decision_tree.py'
