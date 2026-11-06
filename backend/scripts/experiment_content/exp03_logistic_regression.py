"""Experiment 3: Logistic Regression. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Logistic Regression'
SLUG = 'logistic-regression'

OVERVIEW = 'Some questions have a yes-or-no answer: will a customer leave, is an email spam, is a tumour sample benign or malignant? Despite its name, logistic regression is a classification method. It turns a weighted sum of the inputs into a probability between 0 and 1 and uses that probability to choose a class. In this experiment you learn how that works, how to read the model, and how to measure the quality of a classifier on a real teaching dataset.'

AIM = 'To understand how logistic regression predicts a class from numeric inputs, and to train, use and evaluate a binary classifier in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: explain the difference between regression and classification; describe how the sigmoid function turns a score into a probability; explain how a threshold turns a probability into a class and how changing it affects results; interpret the sign of a coefficient in a logistic regression model; train and use a `LogisticRegression` model, with scaled features, in scikit-learn; and read a confusion matrix and compute accuracy, precision and recall.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. Classification

In classification the answer is a category. With two categories the problem is **binary classification**: the classes are often called positive and negative, or 1 and 0. The model learns from examples whose class is known and then assigns a class to new examples.

## 2. Why not an ordinary straight line?

A straight line can output any number, including −3 or 17, which makes no sense as a probability or a class. What we want is a number that always stays between 0 and 1, so that it can be read as "the chance that this example belongs to class 1".

## 3. The sigmoid function

Logistic regression first computes a score, exactly like linear regression:

**z = b₀ + b₁x₁ + … + bₙxₙ**

and then passes it through the **sigmoid** function:

**p = 1 / (1 + e^(−z))**

The sigmoid squeezes any score into the range 0 to 1. A large positive z gives p close to 1, a large negative z gives p close to 0, and z = 0 gives exactly 0.5. The result p is the model's estimated probability of class 1.

## 4. From probability to class

The usual rule is to predict class 1 when p is at least 0.5 and class 0 otherwise. The value 0.5 is a **threshold** and it can be changed. Lowering it makes the model say "positive" more often, which catches more true positives but also raises false alarms; raising it does the opposite. Which choice is best depends on the cost of each kind of mistake.

## 5. The decision boundary

The model switches class where z = 0. Because z is a weighted sum of the features, this boundary is a straight line with two features, a flat plane with three, and so on. Logistic regression is therefore a **linear classifier**: it cannot separate classes that only a curved boundary could divide.

## 6. How it learns

Training chooses the coefficients that make the observed classes most likely. This is usually written as minimising the **log loss** (also called cross-entropy). Log loss is small when the model gives a high probability to the correct class and becomes very large when the model is confident and wrong, so confident mistakes are punished heavily. Unlike ordinary linear regression there is no one-line formula; the coefficients are found by an iterative search, which is why scikit-learn has a `max_iter` setting.

## 7. Reading the coefficients

A positive coefficient means that a larger value of that feature raises the score z, and so raises the probability of class 1, with the other features held fixed. A negative coefficient does the reverse. As with linear regression, the size of a coefficient depends on the scale of its feature.

## 8. Scaling and regularisation

Features measured on very different scales slow down or destabilise the search and make coefficients hard to compare, so it is good practice to **scale** them, for example by giving each a mean of 0 and a spread of 1. The scaling must be learned from the training data only and then applied to the test data.

Scikit-learn's logistic regression applies **regularisation** by default: a penalty that discourages very large coefficients and so reduces overfitting. The setting `C` controls it: a smaller C means a stronger penalty.

## 9. Evaluating a classifier

A **confusion matrix** counts the predictions in four groups:

- **True positives (TP):** predicted positive, really positive.
- **True negatives (TN):** predicted negative, really negative.
- **False positives (FP):** predicted positive, really negative.
- **False negatives (FN):** predicted negative, really positive.

From these:

- **Accuracy** = (TP + TN) / all examples.
- **Precision** = TP / (TP + FP): of the examples called positive, how many really are.
- **Recall** = TP / (TP + FN): of the really positive examples, how many were found.

Accuracy can mislead when one class is rare. If 95 of 100 emails are not spam, a model that always says "not spam" is 95% accurate and completely useless. Precision and recall show what accuracy hides.

## 10. Using scikit-learn

- `LogisticRegression(max_iter=1000)` creates the model.
- `fit(X_train, y_train)` trains it.
- `predict(X_test)` returns the predicted classes.
- `predict_proba(X_test)` returns the probability of each class, which lets you use a different threshold.
- `StandardScaler` does the scaling; fit it on the training data and apply it with `transform`.

**The dataset:** scikit-learn includes a teaching dataset of 569 samples with 30 numeric measurements computed from images of cell samples. The class is 0 (malignant) or 1 (benign). It is for learning only and not for medical use.

## 11. Limits

Logistic regression assumes a straight-line boundary, can be thrown off by badly scaled features, and needs care when one class is rare. Its probabilities are only as trustworthy as the data it was trained on.

## Summary

Logistic regression computes a linear score, converts it to a probability with the sigmoid, and applies a threshold to pick a class. It is trained by minimising log loss, works best with scaled features, and should be judged with a confusion matrix and with precision and recall as well as accuracy.

## References
1. scikit-learn documentation, Logistic regression: https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression
2. scikit-learn documentation, Classification metrics: https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics"""

PRE_QUIZ = [
    (
        'Which of these is a classification task?',
        [
            "Predicting tomorrow's rainfall in millimetres",
            'Estimating a house price',
            'Deciding whether an email is spam',
            'Forecasting a stock price',
        ],
        2,
    ),
    (
        'A probability can take values:',
        [
            'From −1 to 1',
            'From 0 to 100 only',
            'From 0 to 1',
            'Any positive number',
        ],
        2,
    ),
    (
        'A fair coin has probability 0.5 of landing heads. What does this mean?',
        [
            'It lands heads every second toss exactly',
            'It never lands tails',
            'In many tosses, about half should be heads',
            'The coin is broken',
        ],
        2,
    ),
    (
        'A model makes 90 correct predictions out of 100. What is its accuracy?',
        [
            '9%',
            '10%',
            '90%',
            '100%',
        ],
        2,
    ),
    (
        'Which target is binary?',
        [
            "A person's height",
            'Whether a customer renews a subscription (yes or no)',
            'A temperature',
            'A salary',
        ],
        1,
    ),
    (
        'In supervised learning, what are labels?',
        [
            'Names of columns',
            "The model's mistakes",
            'The known correct answers for the training examples',
            'The features',
        ],
        2,
    ),
    (
        'If 5 of 100 transactions are fraud, a model that always says "not fraud" would be:',
        [
            '95% accurate, but it would never find any fraud',
            '5% accurate',
            'Perfect',
            '50% accurate',
        ],
        0,
    ),
    (
        'What does a feature scale such as "mean 0, spread 1" do?',
        [
            'Removes the target',
            'Puts features on a comparable scale',
            'Adds new rows',
            'Changes the classes',
        ],
        1,
    ),
    (
        'True or False: A model should be tested on examples it has already trained on.',
        [
            'True',
            'False',
        ],
        1,
    ),
    (
        'Which of these values could NOT be a probability?',
        [
            '0',
            '0.35',
            '1',
            '1.4',
        ],
        3,
    ),
]

POST_QUIZ = [
    (
        'Logistic regression is mainly used for:',
        [
            'Predicting a continuous number',
            'Predicting a class',
            'Reducing the number of features',
            'Grouping unlabelled data',
        ],
        1,
    ),
    (
        'The sigmoid function always outputs a value:',
        [
            'Below 0',
            'Above 1',
            'Equal to the input',
            'Between 0 and 1',
        ],
        3,
    ),
    (
        'With a threshold of 0.5, a predicted probability of 0.8 for class 1 leads to the prediction:',
        [
            'Class 0',
            'No prediction',
            'A value of 0.8 as the class',
            'Class 1',
        ],
        3,
    ),
    (
        'Which quantity does logistic regression usually minimise during training?',
        [
            'Mean absolute error',
            'Log loss (cross-entropy)',
            'The number of features',
            'R²',
        ],
        1,
    ),
    (
        'A positive coefficient for a feature means that, with the others fixed, a larger value of the feature:',
        [
            'Lowers the probability of class 1',
            'Has no effect',
            "Raises the model's probability of class 1",
            'Changes the number of classes',
        ],
        2,
    ),
    (
        'Why are features usually scaled before logistic regression?',
        [
            'To put them on comparable scales so training is stable and coefficients are comparable',
            'To change the labels',
            'To remove the intercept',
            'To increase the number of rows',
        ],
        0,
    ),
    (
        'In scikit-learn, a smaller value of `C` means:',
        [
            'No regularisation',
            'Stronger regularisation',
            'More iterations',
            'More features',
        ],
        1,
    ),
    (
        'A confusion matrix shows:',
        [
            'How many predictions of each kind were correct or wrong for each class',
            'The coefficients',
            'The learning rate',
            'The scaling used',
        ],
        0,
    ),
    (
        'Recall is defined as:',
        [
            'TP / (TP + FN)',
            'TP / (TP + FP)',
            '(TP + TN) / all',
            'FP / (FP + TN)',
        ],
        0,
    ),
    (
        'True or False: The probabilities from `predict_proba` can be used to choose a threshold other than 0.5.',
        [
            'True',
            'False',
        ],
        0,
    ),
]

ASSIGNMENT = [
    (
        "A classifier's results on 100 samples are TP = 40, FP = 10, FN = 5, TN = 45. What is its accuracy?",
        [
            '0.80',
            '0.85',
            '0.90',
            '0.95',
        ],
        1,
    ),
    (
        'For the same results, what is the precision?',
        [
            '0.50',
            '0.75',
            '0.80',
            '0.89',
        ],
        2,
    ),
    (
        'For the same results, which value is closest to the recall?',
        [
            '0.50',
            '0.75',
            '0.80',
            '0.89',
        ],
        3,
    ),
    (
        'A hospital screening model should miss as few real cases as possible, even if it raises a few false alarms. What should happen to the threshold?',
        [
            'Raised to 0.9',
            'Left at 0.5 always',
            'Lowered below 0.5',
            'Set to 1',
        ],
        2,
    ),
    (
        'In a dataset 98% of the cases are negative. A model that always predicts negative has accuracy:',
        [
            '2%',
            '50%',
            '98%, yet it finds no positive case',
            '100%',
        ],
        2,
    ),
    (
        'The score z for an example is 0. What probability does the sigmoid give?',
        [
            '0',
            '0.5',
            '1',
            '−1',
        ],
        1,
    ),
    (
        'A feature has a negative coefficient. If its value rises and nothing else changes, the predicted probability of class 1:',
        [
            'Rises',
            'Falls',
            'Stays exactly the same',
            'Becomes negative',
        ],
        1,
    ),
    (
        'A student scales the whole dataset first and splits it afterwards. What is the problem?',
        [
            'Nothing at all',
            'The labels change',
            'The model cannot be trained',
            'Information from the test rows leaks into the scaling learned for training',
        ],
        3,
    ),
    (
        'A model reaches a very high training accuracy but a much lower test accuracy even after scaling. Which setting could help?',
        [
            'A much larger `C`',
            'Removing the test data',
            'Predicting only class 1',
            'A smaller `C` (stronger regularisation)',
        ],
        3,
    ),
    (
        'True or False: A logistic regression model can draw a curved decision boundary with no change to its features.',
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

Classify cell samples as malignant or benign with logistic regression.

### Steps

1. Load the built-in Breast Cancer dataset: `from sklearn.datasets import load_breast_cancer` and `X, y = load_breast_cancer(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Scale the features with `StandardScaler`, learning the scaling from the training part only.
4. Train `LogisticRegression(max_iter=1000, random_state=42)` on the scaled training part.
5. Predict the classes of the scaled test part and store them as a list of whole numbers in `result`.

### Important

- The answer must be stored in the variable `result` (a list of whole numbers, one for each test sample). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex03_logistic_regression.py).
SOLUTION_FILE = 'ex03_logistic_regression.py'
