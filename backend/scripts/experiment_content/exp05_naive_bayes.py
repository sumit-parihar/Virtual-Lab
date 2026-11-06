"""Experiment 5: Naive Bayes Classification. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Naive Bayes Classification'
SLUG = 'naive-bayes'

OVERVIEW = 'A doctor, a spam filter and a weather forecaster all do the same thing: they start with how common something is and update their belief when new evidence appears. Naive Bayes turns this habit into a classifier. It uses probability rules to ask, for an example with given feature values, which class is the most likely. In this experiment you learn the idea behind Bayes\' theorem, why the method is called "naive", and how to train a Gaussian Naive Bayes model on a dataset of wine measurements.'

AIM = "To understand how probability and Bayes' theorem can be used to classify examples, and to train and evaluate a Naive Bayes classifier in Python."

OBJECTIVE = 'After completing this experiment, students will be able to: explain prior probability, likelihood and posterior probability; state Bayes\' theorem and use it in a simple calculation; explain the "naive" independence assumption and its effect; describe how Gaussian Naive Bayes models numeric features; train and use `GaussianNB` in scikit-learn; and name the strengths and weaknesses of Naive Bayes.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. Probability in a nutshell

The probability of an event is a number from 0 (impossible) to 1 (certain). For independent events, the probability that both happen is the product of their probabilities: the chance of two heads in two fair tosses is 0.5 × 0.5 = 0.25. A **conditional probability** P(A | B) is the probability of A once we know that B has happened.

## 2. Bayes' theorem

Suppose we want the probability of a class C given the feature values x we have observed. Bayes' theorem says:

**P(C | x) = P(x | C) × P(C) / P(x)**

- **P(C)** is the **prior**: how common the class is before we look at the features.
- **P(x | C)** is the **likelihood**: how probable these feature values are for examples of that class.
- **P(C | x)** is the **posterior**: our updated belief after seeing the features.
- **P(x)** is the overall probability of the features; it is the same for every class, so it can be ignored when we only want to compare classes.

To classify, we compute prior × likelihood for each class and choose the class with the largest value.

## 3. Why "naive"?

With several features, the exact likelihood P(x₁, x₂, … | C) is hard to estimate. Naive Bayes assumes that, once the class is known, the features are **independent** of each other. Then the likelihood is simply a product:

**P(x | C) = P(x₁ | C) × P(x₂ | C) × …**

This assumption is rarely exactly true, which is why it is called naive. Yet the classifier often works well anyway, because it only needs to rank the classes, not to produce exact probabilities.

## 4. A small example

A message filter knows that 40% of messages are spam and 60% are not. For a message with two words, the chances of seeing them are P(w₁ | spam) = 0.5, P(w₂ | spam) = 0.2, P(w₁ | not spam) = 0.1 and P(w₂ | not spam) = 0.3.

- Spam score = 0.4 × 0.5 × 0.2 = 0.04
- Not-spam score = 0.6 × 0.1 × 0.3 = 0.018

Spam has the larger score, so the message is classified as spam. Dividing by the total, the posterior for spam is 0.04 / (0.04 + 0.018) ≈ 0.69.

## 5. Numeric features: Gaussian Naive Bayes

For measurements such as alcohol content we cannot count how often an exact value occurs. **Gaussian Naive Bayes** assumes that, within each class, a feature follows a bell-shaped normal distribution. Training only has to compute, for every class and feature, the **mean** and the **variance**, plus the prior of each class. To classify, the model evaluates the bell curves of each class at the observed values and multiplies them with the prior.

## 6. Practical details

- Multiplying many small numbers can underflow to zero, so implementations add **logarithms** of the probabilities instead.
- For word counts, **Multinomial** Naive Bayes is common; for yes/no features, **Bernoulli** Naive Bayes.
- If a feature value never occurred for a class in the training data, its probability would be 0 and wipe out the whole product. **Laplace smoothing** adds a small count to avoid this.

## 7. Using scikit-learn

- `GaussianNB()` creates the model.
- `fit(X_train, y_train)` computes priors, means and variances.
- `predict(X_test)` returns the most probable class.
- `predict_proba(X_test)` returns posterior probabilities (they are often too extreme, so treat them as a ranking more than as exact values).

**The dataset:** the wine dataset has 178 wines from three growers (cultivars). Each wine has 13 chemical measurements such as alcohol, acidity and colour intensity.

## 8. Strengths and weaknesses

**Strengths:** very fast to train and to predict; works with small datasets; handles many features; a good first baseline.

**Weaknesses:** the independence assumption is often false; the Gaussian shape may not fit the data; strongly related features are counted twice; the probabilities it reports are poorly calibrated.

## Summary

Naive Bayes combines the prior of each class with the likelihood of the observed features, assuming the features are independent given the class. Gaussian Naive Bayes models each numeric feature with a bell curve per class, which makes it fast, simple and surprisingly effective, though not always well calibrated.

## References
1. scikit-learn documentation, Naive Bayes: https://scikit-learn.org/stable/modules/naive_bayes.html
2. scikit-learn documentation, Toy datasets: https://scikit-learn.org/stable/datasets/toy_dataset.html"""

PRE_QUIZ = [
    (
        'The probability of an impossible event is:',
        [
            '1',
            '0',
            '0.5',
            '−1',
        ],
        1,
    ),
    (
        'A fair coin is tossed twice. What is the probability of two heads?',
        [
            '0.5',
            '0.25',
            '0.75',
            '1',
        ],
        1,
    ),
    (
        'If the probability that it rains is 0.2, the probability that it does not rain is:',
        [
            '0.2',
            '0.8',
            '1.2',
            '0',
        ],
        1,
    ),
    (
        'P(A | B) is the probability of:',
        [
            'A given that B has happened',
            'B given A',
            'A and B added together',
            'Neither',
        ],
        0,
    ),
    (
        'What does "prior probability" mean?',
        [
            'The probability after seeing new evidence',
            'What we believe before looking at the new evidence',
            'A probability above 1',
            'The error of a model',
        ],
        1,
    ),
    (
        'Which statistic measures how spread out values are around the mean?',
        [
            'The count',
            'The minimum',
            'The variance',
            'The median',
        ],
        2,
    ),
    (
        'A bell-shaped curve describes which distribution?',
        [
            'Uniform',
            'Binary',
            'Constant',
            'Normal (Gaussian)',
        ],
        3,
    ),
    (
        'In supervised classification, what is the model trying to predict?',
        [
            'A feature',
            'A class label',
            'A distance',
            'A mean',
        ],
        1,
    ),
    (
        'True or False: Probabilities of all possible, mutually exclusive outcomes add up to 1.',
        [
            'True',
            'False',
        ],
        0,
    ),
    (
        '30% of emails are spam. Out of 200 emails, about how many are spam?',
        [
            '30',
            '60',
            '90',
            '170',
        ],
        1,
    ),
]

POST_QUIZ = [
    (
        "In Bayes' theorem, P(C | x) is called the:",
        [
            'Prior',
            'Likelihood',
            'Evidence',
            'Posterior',
        ],
        3,
    ),
    (
        'What is the "naive" assumption of Naive Bayes?',
        [
            'The classes are equally common',
            'Features are independent of each other once the class is known',
            'All features are normal',
            'There are no outliers',
        ],
        1,
    ),
    (
        'The prior of a class is:',
        [
            'How common the class is before looking at the features',
            'The probability of the features given the class',
            'The accuracy of the model',
            'The variance of a feature',
        ],
        0,
    ),
    (
        'What does Gaussian Naive Bayes assume about numeric features?',
        [
            'They are always integers',
            'They must all be equal',
            'Within each class, each feature follows a normal distribution',
            'They are binary',
        ],
        2,
    ),
    (
        'What does training Gaussian Naive Bayes compute?',
        [
            'A tree of questions',
            'A set of nearest neighbours',
            'A separating margin',
            'The class priors and the mean and variance of each feature per class',
        ],
        3,
    ),
    (
        'Why do implementations add log-probabilities instead of multiplying small probabilities?',
        [
            'Logs make the classes equal',
            'It removes the need for training',
            'It avoids numbers becoming too small to represent',
            'It improves the prior',
        ],
        2,
    ),
    (
        'Which variant is common for word-count features?',
        [
            'Gaussian',
            'Linear',
            'Multinomial',
            'Circular',
        ],
        2,
    ),
    (
        'What problem does Laplace smoothing solve?',
        [
            'Slow training',
            'A zero probability for a value never seen with a class',
            'Too many classes',
            'Negative probabilities',
        ],
        1,
    ),
    (
        'Why are the probabilities from Naive Bayes often not fully trustworthy?',
        [
            'They are always exactly 0.5',
            'They are rounded to integers',
            'The independence assumption is usually violated, which makes them too extreme',
            'They ignore the prior',
        ],
        2,
    ),
    (
        'True or False: Naive Bayes needs no training data.',
        [
            'True',
            'False',
        ],
        1,
    ),
]

ASSIGNMENT = [
    (
        '40% of messages are spam. A word appears in 50% of spam and in 10% of non-spam. Ignoring other words, which pair of scores (prior × likelihood) is correct for spam and for not spam?',
        [
            '0.20 and 0.10',
            '0.20 and 0.06',
            '0.04 and 0.06',
            '0.50 and 0.10',
        ],
        1,
    ),
    (
        'With the scores 0.20 and 0.06 from the previous question, which is the posterior probability of spam, to two decimals?',
        [
            '0.20',
            '0.50',
            '0.77',
            '0.94',
        ],
        2,
    ),
    (
        'Two classes have scores of 0.04 and 0.018. Which class is predicted?',
        [
            'The one with 0.04',
            'The one with 0.018',
            'Neither',
            'Both',
        ],
        0,
    ),
    (
        'A feature is duplicated three times in the data. What happens in Naive Bayes?',
        [
            'Nothing, it is ignored',
            'The model refuses to train',
            'The priors change',
            'Its influence is counted several times because independence is assumed',
        ],
        3,
    ),
    (
        'A class has priors 0.9 and 0.1 and the features give both classes equal likelihoods. Which class is predicted?',
        [
            'The one with prior 0.9',
            'The one with prior 0.1',
            'Neither',
            'A random one',
        ],
        0,
    ),
    (
        'A word never appears in the training spam messages. Without smoothing, a message containing it would receive a spam score of:',
        [
            'Zero',
            'A very high value',
            '0.5',
            '1',
        ],
        0,
    ),
    (
        'For a measurement like blood sugar, which Naive Bayes variant is most natural?',
        [
            'Multinomial',
            'Gaussian',
            'Bernoulli',
            'None',
        ],
        1,
    ),
    (
        'Why can Naive Bayes work well even though its assumption is false?',
        [
            'The assumption is always true in practice',
            'It memorises the data',
            'It only needs to rank the classes correctly, not give exact probabilities',
            'It uses distances',
        ],
        2,
    ),
    (
        'Which is a clear advantage of Naive Bayes?',
        [
            'It always beats every other model',
            'It needs a large number of parameters',
            'Training and prediction are very fast',
            'It needs no data',
        ],
        2,
    ),
    (
        'True or False: The predicted class is the one with the largest prior × likelihood.',
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

Classify wines by grower with Gaussian Naive Bayes.

### Steps

1. Load the built-in wine dataset: `from sklearn.datasets import load_wine` and `X, y = load_wine(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Train `GaussianNB()` on the training part.
4. Predict the classes of the test part and store them as a list of whole numbers in `result`.

### Important

- The answer must be stored in the variable `result` (a list of whole numbers, one for each test sample). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex05_naive_bayes.py).
SOLUTION_FILE = 'ex05_naive_bayes.py'
