"""Experiment 1: Simple Linear Regression. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Simple Linear Regression'
SLUG = 'simple-linear-regression'

OVERVIEW = 'Many everyday questions ask how one quantity changes when another one does: how a salary grows with years of experience, or how a plant grows with hours of sunlight. Simple linear regression answers such questions by fitting a straight line through the data. In this experiment you learn what that line means, how it is found, how to use it to make predictions, and how to judge whether it is any good.'

AIM = 'To understand how a straight line can describe the relationship between one input and one numeric output, and to train and evaluate such a model in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: describe a regression problem and say how it differs from a classification problem; write and interpret the equation ŷ = mx + c, including the slope and the intercept; explain what a residual is and why the least-squares line is chosen; split data into training and test sets and explain why this is done; train a `LinearRegression` model with scikit-learn and use it to make predictions; and evaluate a model with MAE, MSE and R², and name the main limitations of a straight-line model.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. Learning from examples

In supervised learning, a model is shown many examples where the right answer is already known and learns a rule that links the inputs to that answer. When the answer is a number that can take any value in a range, such as a price, a temperature or a salary, the task is called **regression**. When the answer is a category, such as spam or not spam, it is called **classification**. This experiment is about regression with a single input.

## 2. A straight-line relationship

Imagine plotting years of experience on the horizontal axis and salary on the vertical axis, with one dot for each person. If the dots rise roughly along a straight path, a straight line can summarise the trend. Simple linear regression finds the line that follows the dots most closely. "Simple" means there is only one input; "linear" means the relationship is a straight line.

## 3. The equation of the line

The line is written as:

**ŷ = mx + c**

- **x** is the input (for example, years of experience).
- **ŷ** (read "y hat") is the value the model predicts.
- **m** is the **slope**: how much the prediction changes when x increases by one unit.
- **c** is the **intercept**: the prediction when x is zero.

Example: if a model says ŷ = 5000x + 20000, a person with 3 years of experience is predicted to earn 5000 × 3 + 20000 = 35000. Each extra year adds 5000 to the prediction. The numbers m and c are called the **parameters** of the model; training means finding good values for them.

## 4. Residuals and the best line

Many lines could be drawn through a cloud of dots, so we need a way to say which is best. For each dot, the **residual** is the gap between the real value and the predicted value:

**Residual = actual − predicted**

A positive residual means the line predicted too low; a negative one means it predicted too high. The method of **least squares** squares every residual, adds them up, and chooses the line with the smallest total. Squaring stops positive and negative gaps from cancelling out and makes large mistakes count more than small ones.

## 5. The workflow

1. **Collect data:** examples with an input and a known output.
2. **Look at the data:** plot it, check for missing or strange values.
3. **Split the data:** keep most rows for training and set some aside for testing.
4. **Train:** let the model find m and c from the training rows only.
5. **Predict:** use the line on the test inputs.
6. **Evaluate:** compare predictions with the real test values.

The test rows must not be used for training. They stand in for future, unseen data, so the score on them is an honest estimate of real performance.

## 6. Using scikit-learn

The `LinearRegression` class in scikit-learn does the fitting:

- `LinearRegression()` creates an untrained model.
- `fit(X, y)` learns the slope and intercept from training inputs `X` and answers `y`.
- `predict(X)` returns predictions for new inputs.
- `coef_` holds the learned slope; `intercept_` holds the learned intercept.

scikit-learn expects `X` to be two-dimensional (rows and columns), even when there is only one column, so a single column is written like `data[["YearsExperience"]]`.

## 7. Measuring how good the line is

Three common measures, all computed on test data:

- **Mean Absolute Error (MAE):** the average size of the errors, in the same units as the target.
- **Mean Squared Error (MSE):** the average of the squared errors; it punishes large errors strongly.
- **R² (coefficient of determination):** compares the model with a simple guess that always predicts the average. 1 means a perfect fit, 0 means no better than that guess, and below 0 means worse than it.

R² is not a percentage of correct answers, and no single measure tells the whole story.

## 8. Limits to keep in mind

- A straight line cannot capture a curved relationship.
- A few extreme points (outliers) can pull the line towards them.
- Predictions far outside the range of the training inputs are unreliable (extrapolation).
- A strong relationship between two quantities does not prove that one causes the other.
- Poor or unrepresentative data gives a poor model, whatever the method.

## 9. Where it is used

Estimating a salary from experience, forecasting sales from advertising spend, predicting crop yield from rainfall, and estimating fuel use from distance travelled are all natural uses of one-input regression.

## Summary

Simple linear regression models one numeric output as a straight-line function of one input. Training finds the slope and intercept that make the squared residuals as small as possible, and a separate test set tells us how well the line generalises.

## References
1. scikit-learn documentation, Linear Models: https://scikit-learn.org/stable/modules/linear_model.html
2. scikit-learn documentation, LinearRegression: https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LinearRegression.html"""

PRE_QUIZ = [
    (
        'In machine learning, what is a "feature"?',
        [
            'The value the model must predict',
            'A mistake in the data',
            'A type of chart',
            'A measurable input used to make a prediction',
        ],
        3,
    ),
    (
        'Which task predicts a continuous number?',
        [
            'Estimating the fare for a taxi ride',
            'Deciding whether a photo shows a cat or a dog',
            'Sorting emails into folders',
            'Naming the language of a sentence',
        ],
        0,
    ),
    (
        'What does supervised learning need?',
        [
            'Examples where the correct answer is already known',
            'No data at all',
            'Only images',
            'A person watching every prediction',
        ],
        0,
    ),
    (
        'For y = 3x + 2, what is y when x = 5?',
        [
            '13',
            '15',
            '17',
            '20',
        ],
        2,
    ),
    (
        'On a graph, a line that rises from left to right shows that:',
        [
            'y falls as x grows',
            'x and y are unrelated',
            'x never changes',
            'y grows as x grows',
        ],
        3,
    ),
    (
        'What is a scatter plot used for?',
        [
            'Showing only averages',
            'Storing data',
            'Showing each observation as a point to see how two quantities relate',
            'Encrypting data',
        ],
        2,
    ),
    (
        'Why is some data kept aside for testing?',
        [
            'To make training faster',
            'To reduce file size',
            'Because the model needs fewer rows',
            'To check performance on data the model has not seen',
        ],
        3,
    ),
    (
        'Which of these is a numeric target?',
        [
            "Tomorrow's temperature in °C",
            'Spam or not spam',
            'Colour of a flower',
            'Name of a country',
        ],
        0,
    ),
    (
        'What is the mean of 4, 6 and 8?',
        [
            '5',
            '6',
            '7',
            '18',
        ],
        1,
    ),
    (
        'True or False: A model that fits its training data perfectly is guaranteed to predict new data well.',
        [
            'True',
            'False',
        ],
        1,
    ),
]

POST_QUIZ = [
    (
        'In ŷ = mx + c, what does m represent?',
        [
            'The intercept',
            'The number of data points',
            'The change in the prediction for a one-unit increase in x',
            'The error',
        ],
        2,
    ),
    (
        'What is the intercept c?',
        [
            'The steepness of the line',
            'The largest residual',
            'The number of features',
            'The predicted value when x is 0',
        ],
        3,
    ),
    (
        'A model is ŷ = 6x + 10. What does it predict for x = 4?',
        [
            '24',
            '34',
            '40',
            '64',
        ],
        1,
    ),
    (
        'The actual value is 52 and the prediction is 47. Using residual = actual − predicted, the residual is:',
        [
            '−5',
            '0',
            '+5',
            '99',
        ],
        2,
    ),
    (
        'Why does least squares square the residuals?',
        [
            'To make the numbers smaller',
            'To remove outliers automatically',
            'So positive and negative errors do not cancel and larger errors count more',
            'Because the line must pass through zero',
        ],
        2,
    ),
    (
        'Which scikit-learn call trains a LinearRegression model?',
        [
            '`predict(X)`',
            '`coef_`',
            '`intercept_`',
            '`fit(X, y)`',
        ],
        3,
    ),
    (
        'Where is the learned slope stored after training?',
        [
            '`intercept_`',
            '`predict`',
            '`coef_`',
            '`fit`',
        ],
        2,
    ),
    (
        'What does Mean Absolute Error (MAE) tell you?',
        [
            'The number of correct predictions',
            'The percentage of variance in the inputs',
            'The slope of the line',
            'The average size of the prediction errors, in the units of the target',
        ],
        3,
    ),
    (
        'A test R² of 0 means the model is:',
        [
            'Perfect',
            'Wrong for every row',
            'No better than always predicting the average of the target',
            '0% accurate',
        ],
        2,
    ),
    (
        'True or False: Simple linear regression uses exactly one input feature.',
        [
            'True',
            'False',
        ],
        0,
    ),
]

ASSIGNMENT = [
    (
        'A shop models daily sales (₹) from advertising spend (₹). Which quantity is the target?',
        [
            'Advertising spend',
            "The shop's name",
            'Daily sales',
            'The date',
        ],
        2,
    ),
    (
        'A model is ŷ = 4.5x + 120, where x is hours of sunlight and ŷ is plant height in mm. What height does it predict for 6 hours?',
        [
            '130',
            '147',
            '150',
            '27',
        ],
        1,
    ),
    (
        'How should the slope 4.5 in that model be read?',
        [
            'Each extra hour of sunlight goes with about 4.5 mm more predicted height',
            'The plant is 4.5 mm tall at the start',
            'The error is 4.5 mm',
            'The plant needs 4.5 hours of sunlight',
        ],
        0,
    ),
    (
        'For one plant the actual height is 150 mm and the prediction is 147 mm. The residual (actual − predicted) is:',
        [
            '−3',
            '+3',
            '0',
            '297',
        ],
        1,
    ),
    (
        'The model above was trained with sunlight between 1 and 8 hours. It is used to predict for 20 hours. What is the main concern?',
        [
            'The model cannot accept whole numbers',
            'The input is far outside the training range, so the prediction may be unreliable',
            'The slope becomes zero',
            'Linear regression only works for small numbers',
        ],
        1,
    ),
    (
        'A house-price model has a test MAE of 12 (in thousands of rupees). This means:',
        [
            'Every prediction is wrong by exactly 12 thousand',
            'On average the predictions are about 12 thousand away from the true prices',
            'The model is 12% accurate',
            'The prices are all near 12 thousand',
        ],
        1,
    ),
    (
        'A model gets R² = −0.3 on the test set. The best interpretation is:',
        [
            'It does worse than always predicting the average target',
            '30% of predictions are right',
            'It has no errors',
            'The slope is negative',
        ],
        0,
    ),
    (
        'One data point lies extremely far from all the others. What can happen to the least-squares line?',
        [
            'It ignores the point completely',
            'It becomes a curve',
            'Its R² on training data must be 1',
            'It can be pulled towards that point',
        ],
        3,
    ),
    (
        'Ice-cream sales and sunburn cases rise together and a line fits them well. Which conclusion is NOT justified by that data alone?',
        [
            'They tend to increase together',
            'Hot weather might affect both',
            'A straight line describes the trend reasonably',
            'Ice-cream sales cause sunburn',
        ],
        3,
    ),
    (
        'True or False: A model should be judged mainly on the same rows it was trained on.',
        [
            'True',
            'False',
        ],
        1,
    ),
]

ALLOWED_IMPORTS = ["numpy", "pandas", "sklearn"]
DATASET_URL = '/datasets/Salary_dataset.csv'

CODE_PROBLEM_STATEMENT = """## Problem Statement

Use **Linear Regression** to predict a person's salary from their years of experience.

The dataset file `Salary_dataset.csv` (30 records with the columns `YearsExperience` and `Salary`) is available to your code. Load it with `pd.read_csv("Salary_dataset.csv")`.

### Steps

1. Load the dataset. Use `YearsExperience` as the input feature `X` (keep it two-dimensional, for example `data[["YearsExperience"]]`) and `Salary` as the target `y`.
2. Split the data into training and test subsets with `train_test_split(X, y, test_size=0.2, random_state=42)`. Use exactly this test size and this random state.
3. Create a `LinearRegression` model and train it on the training subset.
4. Predict the salaries for the test subset.
5. Round each prediction to 2 decimal places and store the list of predictions, in the order the test subset is returned, in the variable `result`.

### Important

- The answer must be stored in the variable `result` (a list of numbers). It is already created for you in the editor.
- Use only the random state mentioned above. A different value gives a different split and a different answer.
- Click Run to see your output. Submit shows whether your `result` matches the expected result. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex01_simple_linear_regression.py).
SOLUTION_FILE = 'ex01_simple_linear_regression.py'
