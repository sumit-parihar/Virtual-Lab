"""Experiment 8: Support Vector Machine (SVM). Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Support Vector Machine (SVM)'
SLUG = 'support-vector-machine'

OVERVIEW = 'Suppose two groups of points lie on a table and you must lay a ruler between them. There are many places where the ruler separates them, but the safest place is the one that leaves the widest empty gap on both sides. A Support Vector Machine finds exactly that boundary. With a clever trick called a kernel it can also draw curved boundaries. In this experiment you learn the idea of the margin, the role of the support vectors and of the settings C and gamma, and you train an SVM on a dataset of wine measurements.'

AIM = 'To understand how an SVM separates classes with a maximum-margin boundary, and to train, scale and evaluate an SVM classifier in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: describe the separating boundary, the margin and the support vectors; explain what the parameter C controls in a soft-margin SVM; explain, in simple terms, what a kernel does and when the RBF kernel is useful; describe the effect of the `gamma` parameter; explain why feature scaling is essential for SVMs; and train and use `SVC` in scikit-learn and evaluate it on test data.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. A boundary with room to spare

For two classes that can be separated by a straight line (or a flat plane in more dimensions), infinitely many separating lines exist. An SVM chooses the one with the **largest margin**: the widest empty strip between the line and the nearest training points of both classes. A wide margin is a sign of a robust boundary, since small changes in a point are less likely to flip its class.

## 2. Support vectors

The boundary is determined only by the training points that lie closest to it, on the edge of the margin. These points are the **support vectors**. All the other points could be moved around or removed without changing the boundary. This makes the model compact, because only the support vectors need to be remembered.

## 3. Soft margins and the parameter C

Real data is rarely separable perfectly; classes overlap and there is noise. A **soft-margin** SVM allows some points to be inside the margin or even on the wrong side, at a cost. The parameter **C** sets how expensive those violations are:

- **Large C:** violations are costly, so the model tries hard to classify every training point correctly. The margin becomes narrow and the model can overfit.
- **Small C:** violations are cheap, so the margin is wider and the model is simpler. Too small a value can underfit.

## 4. Kernels: curved boundaries

If the classes cannot be separated by a straight line, an SVM can use a **kernel**. A kernel lets the SVM behave as if the data had been moved into a space with many more dimensions, where a flat boundary can separate the classes, without ever computing the new coordinates. This is known as the **kernel trick**. Common kernels:

- **Linear:** a straight boundary.
- **Polynomial:** a boundary with polynomial curves.
- **RBF (radial basis function):** a flexible kernel that bases similarity on distance; it is the usual default.

## 5. The gamma parameter

For the RBF kernel, **gamma** controls how far the influence of a single training point reaches.

- **Large gamma:** each point influences only its close surroundings. The boundary is very wiggly and can overfit.
- **Small gamma:** each point influences a wide area. The boundary is smooth and can underfit.

In scikit-learn, `gamma="scale"` picks a sensible value from the data, and is the default.

## 6. Scaling is essential

An SVM depends on distances between points. If one feature has a much larger range than the others, it will dominate. So features should be scaled, for example to a mean of 0 and a spread of 1, using values learned from the training data only.

## 7. More than two classes

An SVM is naturally a two-class method. For several classes, scikit-learn's `SVC` combines several two-class SVMs (a "one-versus-one" scheme) behind the scenes, so you simply call `fit` and `predict` as usual.

## 8. Using scikit-learn

- `StandardScaler` scales the features: fit it on the training part and apply `transform` to both parts.
- `SVC(kernel="rbf", C=1.0, gamma="scale")` creates the classifier.
- `fit(X_train_scaled, y_train)` trains it.
- `predict(X_test_scaled)` returns the classes.
- `support_vectors_` and `n_support_` show the support vectors.

**The dataset:** the wine dataset has 178 wines from three growers, with 13 chemical measurements for each wine. The measurements have very different ranges (for example, proline is in the hundreds while hue is below 2), which makes the scaling step important.

## 9. Strengths and weaknesses

**Strengths:** effective in high-dimensional spaces; flexible through kernels; only the support vectors matter, so the model is compact; works well on small and medium datasets.

**Weaknesses:** training becomes slow on very large datasets; needs scaling and a good choice of C and gamma; does not directly give probabilities; harder to interpret than a tree.

## Summary

An SVM finds the boundary with the widest margin, defined by a few support vectors. C controls how strictly the training points must be classified, kernels such as RBF allow curved boundaries, gamma sets how local the boundary is, and scaled features are essential.

## References
1. scikit-learn documentation, Support Vector Machines: https://scikit-learn.org/stable/modules/svm.html
2. scikit-learn documentation, Preprocessing data: https://scikit-learn.org/stable/modules/preprocessing.html"""

PRE_QUIZ = [
    (
        'A straight line that separates two groups of points is called a:',
        [
            'Cluster',
            'Feature',
            'Residual',
            'Decision boundary',
        ],
        3,
    ),
    (
        'The distance between two points is smallest when the points are:',
        [
            'Far apart',
            'Close together',
            'In different classes',
            'Scaled',
        ],
        1,
    ),
    (
        'A feature with a range of 0 to 10 000 and another with a range of 0 to 1 are combined in a distance. Which feature dominates?',
        [
            'The 0 to 1 feature',
            'Both equally',
            'Neither',
            'The 0 to 10 000 feature',
        ],
        3,
    ),
    (
        'Overfitting means the model:',
        [
            'Is too simple',
            'Fits the noise in the training data and does poorly on new data',
            'Has no parameters',
            'Uses only test data',
        ],
        1,
    ),
    (
        'Which of these is a classification task?',
        [
            'Predicting a salary',
            'Telling which grower made a wine',
            'Forecasting the temperature',
            'Predicting a price',
        ],
        1,
    ),
    (
        'What is scaling a feature to mean 0 and spread 1 called?',
        [
            'Clustering',
            'Sampling',
            'Standardisation',
            'Pruning',
        ],
        2,
    ),
    (
        'True or False: Scaling statistics should be learned from the training data only.',
        [
            'True',
            'False',
        ],
        0,
    ),
    (
        'A parameter that must be chosen before training and is not learned from the data is called a:',
        [
            'Label',
            'Residual',
            'Feature',
            'Hyperparameter',
        ],
        3,
    ),
    (
        'In a two-class problem, how many classes are there?',
        [
            '1',
            '2',
            '3',
            'Any number',
        ],
        1,
    ),
    (
        'If a model gets 18 of 20 test examples right, its accuracy is:',
        [
            '0.18',
            '0.80',
            '0.90',
            '0.98',
        ],
        2,
    ),
]

POST_QUIZ = [
    (
        'What does an SVM try to maximise?',
        [
            'The margin between the classes',
            'The number of support vectors',
            'The number of features',
            'The number of clusters',
        ],
        0,
    ),
    (
        'Which training points define the SVM boundary?',
        [
            'All of them equally',
            'Only the points farthest away',
            'The support vectors, the points closest to the boundary',
            'The test points',
        ],
        2,
    ),
    (
        'What does a large value of C do?',
        [
            'Widens the margin and allows more violations',
            'Penalises violations strongly, giving a narrower margin that may overfit',
            'Removes the kernel',
            'Scales the data',
        ],
        1,
    ),
    (
        'Which situation is a typical use of a kernel?',
        [
            'The classes can be separated by a straight line',
            'There is only one feature',
            'The classes need a curved boundary',
            'There are no labels',
        ],
        2,
    ),
    (
        'What does a very large `gamma` do in an RBF-kernel SVM?',
        [
            'Makes the boundary very smooth',
            'Turns the kernel into a linear one',
            'Makes each point influence only its close surroundings, so the boundary can overfit',
            'Removes the support vectors',
        ],
        2,
    ),
    (
        'Why should features be scaled before an SVM?',
        [
            'To change the labels',
            'To avoid using C',
            'To create more classes',
            'Because the SVM depends on distances, so large-range features would dominate',
        ],
        3,
    ),
    (
        'Which scikit-learn class creates the SVM classifier?',
        [
            '`KMeans`',
            '`GaussianNB`',
            '`LinearRegression`',
            '`SVC`',
        ],
        3,
    ),
    (
        'How does `SVC` handle more than two classes?',
        [
            'It combines several two-class SVMs internally',
            'It cannot',
            'It ignores extra classes',
            'It requires scaling off',
        ],
        0,
    ),
    (
        'Which attribute tells how many support vectors each class has?',
        [
            '`coef_`',
            '`n_support_`',
            '`labels_`',
            '`inertia_`',
        ],
        1,
    ),
    (
        'True or False: Moving a training point that is not a support vector, far from the margin, will not change the boundary.',
        [
            'True',
            'False',
        ],
        0,
    ),
]

ASSIGNMENT = [
    (
        'An SVM is trained with a very large C and a very large gamma. It scores 100% on training data and 70% on test data. What is the most likely problem, and the best step?',
        [
            'Overfitting, so lower C and/or gamma',
            'Underfitting, so increase C',
            'A scaling error only',
            'Too few classes',
        ],
        0,
    ),
    (
        'An SVM scores 62% on both training and test data with a very small C. What is the most likely issue?',
        [
            'Overfitting',
            'Data leakage',
            'Underfitting, so increase C or gamma',
            'Too many support vectors',
        ],
        2,
    ),
    (
        'A student scales the training and test data separately, each with its own mean and spread. What is wrong?',
        [
            'Nothing',
            'The test data must be scaled with the values learned from the training data',
            'Scaling is not allowed',
            'Only labels should be scaled',
        ],
        1,
    ),
    (
        'Which kernel gives a straight-line boundary?',
        [
            'RBF',
            'Linear',
            'Polynomial of high degree',
            'None',
        ],
        1,
    ),
    (
        'What would you expect if you removed one support vector from the training data?',
        [
            'No change in the boundary',
            'The model stops working',
            'The boundary may change',
            'The test accuracy becomes 1',
        ],
        2,
    ),
    (
        'A dataset has 3 000 000 rows. Which is the most likely practical problem with an SVM?',
        [
            'It cannot be scaled',
            'It needs fewer features',
            'It only works with two rows',
            'Training can become very slow',
        ],
        3,
    ),
    (
        'In the wine data, proline has values in the hundreds and hue values below 2. Without scaling, which feature has more influence on the RBF kernel?',
        [
            'Hue',
            'Both equally',
            'Neither',
            'Proline',
        ],
        3,
    ),
    (
        'Which setting could you search over (for example with cross-validation) to tune an RBF-kernel SVM?',
        [
            '`random_state` only',
            'The labels',
            'The test set',
            '`C` and `gamma`',
        ],
        3,
    ),
    (
        'A larger margin generally means:',
        [
            'A more complex model',
            'No support vectors',
            'Higher training error is impossible',
            'A simpler, often more robust boundary',
        ],
        3,
    ),
    (
        'True or False: By default, an SVM directly outputs well-calibrated probabilities.',
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

Classify wines by grower with an SVM.

### Steps

1. Load the built-in wine dataset: `from sklearn.datasets import load_wine` and `X, y = load_wine(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Scale the features with `StandardScaler`, learning the scaling from the training part only.
4. Train `SVC(kernel="rbf", C=1.0, gamma="scale")` on the scaled training part.
5. Predict the classes of the scaled test part and store them as a list of whole numbers in `result`.

### Important

- The answer must be stored in the variable `result` (a list of whole numbers, one for each test sample). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex08_svm.py).
SOLUTION_FILE = 'ex08_svm.py'
