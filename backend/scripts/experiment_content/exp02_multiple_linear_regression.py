"""Experiment 2: Multiple Linear Regression. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Multiple Linear Regression'
SLUG = 'multiple-linear-regression'

OVERVIEW = "Real outcomes rarely depend on a single factor. How a patient's condition changes over a year depends on age, body weight, blood pressure and several lab measurements together. Multiple linear regression extends the straight-line idea to many inputs at once. In this experiment you learn how several inputs are combined into one prediction, how to read the weight given to each input, and how to train and test such a model on a real medical teaching dataset."

AIM = 'To understand how a numeric output can be predicted from several inputs with a linear model, and to train, use and evaluate such a model in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: explain why more than one input is often needed to predict an outcome; write the multiple linear regression equation and identify the intercept and the coefficients; interpret a coefficient as the effect of one feature while the others stay fixed; explain why features on different scales and strongly related features need care; train a multiple regression model in scikit-learn and read `coef_` and `intercept_`; and evaluate predictions with MAE, MSE, RMSE and R², and recognise signs of overfitting.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. From one input to many

With one input, a line is enough. But a house price depends on floor area, the number of rooms, the age of the building and its location. Using only one of these throws information away. Multiple linear regression keeps all of them: it still predicts one number, but from a list of inputs called **features**.

## 2. The equation

**ŷ = b₀ + b₁x₁ + b₂x₂ + … + bₙxₙ**

- **x₁ … xₙ** are the feature values for one example.
- **b₀** is the **intercept**: the prediction when every feature is zero.
- **b₁ … bₙ** are the **coefficients**: one weight per feature.
- **ŷ** is the predicted value.

Example: ŷ = 10 + 2x₁ + 3x₂. For x₁ = 4 and x₂ = 5 the prediction is 10 + 8 + 15 = 33. Geometrically, one input gives a line, two inputs give a flat plane, and more inputs give a flat "hyperplane" that is hard to draw but works the same way.

## 3. Reading a coefficient

A coefficient says how much the prediction changes when **that feature rises by one unit while all the other features stay the same**. If the coefficient of body-mass index is 5, then two patients who differ only in body-mass index by one unit are predicted to differ by 5 in the outcome. The sign tells the direction: positive means the prediction goes up, negative means it goes down.

Two cautions. The size of a coefficient depends on the unit of its feature, so a feature measured in grams will have a much smaller coefficient than the same feature measured in kilograms. And a coefficient describes an association in the data, not necessarily a cause.

## 4. How the model is fitted

The idea is the same as for a single input. Training chooses b₀ … bₙ to make the sum of the squared residuals on the training data as small as possible (the least-squares method). Scikit-learn solves this directly; there is nothing to tune for ordinary linear regression.

## 5. Preparing the data

- Features must be numbers. Categories such as "city" must first be converted to numbers.
- Missing values must be handled before training.
- **Scaling** (for example, giving every feature a mean of 0 and a spread of 1) does not change the predictions of ordinary linear regression, but it makes coefficients comparable and helps many other models. The dataset used in this experiment is already scaled.

## 6. When features overlap: multicollinearity

If two features carry almost the same information (for example, weight in kilograms and weight in pounds), the model cannot decide how to share the credit between them. The predictions may still be fine, but the individual coefficients become unstable and can even take odd signs. Checking how strongly features are related, and dropping or combining redundant ones, avoids the problem.

## 7. Too many features: overfitting

A model with many features can start to learn the noise in the training data, scoring well there but poorly on new data. Always judge a model on test data that it has not seen, and prefer the simplest model that works. Adding features never lowers the training error, so a better training score alone does not mean a better model.

## 8. Using scikit-learn

The calls are the same as in Experiment 1; only `X` now has several columns:

- `fit(X_train, y_train)` learns the intercept and one coefficient per column.
- `predict(X_test)` gives predictions.
- `coef_` is an array with one coefficient per feature; `intercept_` is the intercept.

**The dataset:** scikit-learn ships a small teaching dataset on diabetes with 442 patients and 10 features (age, sex, body-mass index, blood pressure and six blood-serum measurements). The features are already scaled. The target is a numeric measure of how the disease progressed one year later. It is a teaching dataset and not for medical use.

## 9. Evaluating the model

- **MAE:** average absolute error, in the units of the target.
- **MSE:** average squared error.
- **RMSE:** the square root of MSE, again in the units of the target, and easier to read than MSE.
- **R²:** how much better the model is than always predicting the average (1 is perfect, 0 is no better, negative is worse).

When many features are used, an **adjusted R²** is sometimes reported; it reduces the score when a feature adds little, so it discourages needless features.

## 10. Limits

A linear model cannot capture curved relationships or interactions unless those are built into the features. It is sensitive to outliers, and its coefficients are hard to trust when features overlap strongly.

## Summary

Multiple linear regression predicts a number as a weighted sum of several features plus an intercept. Each coefficient shows the effect of one feature with the others held fixed. Good practice means numeric, clean features, watching for overlapping features and overfitting, and judging the model on unseen test data.

## References
1. scikit-learn documentation, Linear Models: https://scikit-learn.org/stable/modules/linear_model.html
2. scikit-learn documentation, the Diabetes dataset: https://scikit-learn.org/stable/datasets/toy_dataset.html"""

PRE_QUIZ = [
    (
        'In ŷ = 2x + 1, what is the slope?',
        [
            '1',
            '2',
            '3',
            '0',
        ],
        1,
    ),
    (
        'How many input features does simple linear regression use?',
        [
            'None',
            'Two',
            'Any number',
            'One',
        ],
        3,
    ),
    (
        'Which of these is a numeric feature?',
        [
            "A patient's age in years",
            "A patient's name",
            "A patient's blood-group letter",
            "A patient's city name",
        ],
        0,
    ),
    (
        'What does ŷ stand for?',
        [
            'The real value',
            'The error',
            'The input',
            'The value predicted by the model',
        ],
        3,
    ),
    (
        'A residual is:',
        [
            'The prediction minus a constant',
            'The number of rows',
            'The actual value minus the predicted value',
            'The slope',
        ],
        2,
    ),
    (
        'A model with test R² close to 1 generally means:',
        [
            'It never makes mistakes on new data',
            'It uses many features',
            'The data has no noise',
            'Its predictions follow the real values very closely',
        ],
        3,
    ),
    (
        'Why is a separate test set used?',
        [
            'To make the model larger',
            'To replace the training set',
            'To remove outliers',
            'To estimate how well the model handles unseen data',
        ],
        3,
    ),
    (
        'If y = 2x₁ + 3x₂ + 1, what is y when x₁ = 2 and x₂ = 1?',
        [
            '6',
            '7',
            '8',
            '9',
        ],
        2,
    ),
    (
        'True or False: Two quantities rising together proves that one causes the other.',
        [
            'True',
            'False',
        ],
        1,
    ),
    (
        'A target that can take any value in a range, such as a temperature, is called:',
        [
            'Categorical',
            'Binary',
            'Continuous',
            'Missing',
        ],
        2,
    ),
]

POST_QUIZ = [
    (
        'What is the main difference between simple and multiple linear regression?',
        [
            'Multiple regression predicts categories',
            'Multiple regression uses two or more input features',
            'Simple regression has no intercept',
            'Multiple regression needs no training data',
        ],
        1,
    ),
    (
        'In ŷ = b₀ + b₁x₁ + b₂x₂, what is b₀?',
        [
            'The first feature',
            'The intercept',
            'The error',
            'The number of features',
        ],
        1,
    ),
    (
        'For ŷ = 10 + 2x₁ + 3x₂, the prediction for x₁ = 4 and x₂ = 5 is:',
        [
            '23',
            '28',
            '33',
            '45',
        ],
        2,
    ),
    (
        'How should the coefficient of a feature be interpreted?',
        [
            'As the average value of the feature',
            'As the error of the model',
            'As the change in the prediction for a one-unit rise in that feature with the others held fixed',
            'As the number of times the feature appears',
        ],
        2,
    ),
    (
        'Two features carry almost the same information. What problem does this create?',
        [
            'The model cannot be trained at all',
            'The predictions must be wrong',
            'The individual coefficients become unstable and hard to interpret',
            'The intercept becomes zero',
        ],
        2,
    ),
    (
        'Why can a training score alone be misleading when features are added?',
        [
            'Adding features never raises the training error, even if they only fit noise',
            'Features reduce the training data',
            'Training scores are always random',
            'It only works for categories',
        ],
        0,
    ),
    (
        'Which attribute holds one learned weight per feature in scikit-learn?',
        [
            '`intercept_`',
            '`coef_`',
            '`fit`',
            '`predict`',
        ],
        1,
    ),
    (
        'RMSE is:',
        [
            'The average of the residuals',
            'A percentage of correct answers',
            'The square root of the mean squared error, in the units of the target',
            'The same as R²',
        ],
        2,
    ),
    (
        'A model has a very good training score but a poor test score. This usually points to:',
        [
            'Underfitting',
            'A perfect model',
            'Overfitting',
            'Missing coefficients',
        ],
        2,
    ),
    (
        'True or False: A linear model can capture any curved relationship without changes to its features.',
        [
            'True',
            'False',
        ],
        1,
    ),
]

ASSIGNMENT = [
    (
        "A model predicts a car's price (in thousands) as ŷ = 2 + 0.8x₁ − 0.5x₂, where x₁ is engine size in litres and x₂ is age in years. What does it predict for a 3-litre, 4-year-old car?",
        [
            '2.0',
            '2.4',
            '3.9',
            '4.4',
        ],
        1,
    ),
    (
        'In that model, what does the coefficient −0.5 say?',
        [
            'Cars lose 0.5 litres per year',
            'With engine size fixed, each extra year of age lowers the predicted price by 0.5 (thousand)',
            'The error is 0.5',
            'The price is always lower than 0.5',
        ],
        1,
    ),
    (
        'A student compares coefficients of two features and finds one is 1000 times larger. One feature is measured in metres and the other in millimetres. What is the likely reason?',
        [
            'The model is broken',
            'Millimetres are always more important',
            'The coefficient depends on the unit of its feature',
            'The intercept is wrong',
        ],
        2,
    ),
    (
        'Weight in kilograms and weight in pounds are both used as features. What is the most likely effect?',
        [
            'The model cannot make any prediction',
            'R² becomes exactly 1',
            'The predictions may be fine, but the two coefficients become unstable',
            'The intercept disappears',
        ],
        2,
    ),
    (
        'A model has a training R² of 0.98 and a test R² of 0.40. What is the best conclusion?',
        [
            'It generalises very well',
            'The test data is too clean',
            'R² cannot be compared',
            'It is probably overfitted to the training data',
        ],
        3,
    ),
    (
        'A model has a test RMSE of 50 on a target measured in the same units as the diabetes dataset. How should RMSE be read?',
        [
            'Predictions are typically about 50 target units away from the real values, with large errors counting more',
            '50% of predictions are wrong',
            'The model explains 50% of the data',
            'The slope is 50',
        ],
        0,
    ),
    (
        'Which step is needed before a feature such as "city" can be used in a linear regression?',
        [
            'Nothing, text works directly',
            'Delete the target',
            'Convert it into numbers',
            'Multiply it by the intercept',
        ],
        2,
    ),
    (
        'Why is a test set kept separate from training?',
        [
            'So the score reflects performance on data the model never saw',
            'To save memory',
            'To make the model fit better',
            'So coefficients are positive',
        ],
        0,
    ),
    (
        'Adding a new feature that is only random noise will usually:',
        [
            'Make the test score much better',
            'Not lower the training error, but it may hurt performance on new data',
            'Remove the intercept',
            'Make the model categorical',
        ],
        1,
    ),
    (
        'True or False: A positive coefficient proves that the feature causes the outcome to rise.',
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

Predict disease progression from ten patient measurements with multiple linear regression.

### Steps

1. Load the built-in Diabetes dataset: `from sklearn.datasets import load_diabetes` and `X, y = load_diabetes(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Train a `LinearRegression` model on the training part and predict the test part.
4. Round each prediction to 2 decimals and store the **first 10** test predictions as a list in `result`.

### Important

- The answer must be stored in the variable `result` (a list of 10 numbers). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex02_multiple_linear_regression.py).
SOLUTION_FILE = 'ex02_multiple_linear_regression.py'
