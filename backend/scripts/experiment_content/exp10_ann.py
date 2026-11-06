"""Experiment 10: Artificial Neural Network (ANN) for Classification. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'Artificial Neural Network (ANN) for Classification'
SLUG = 'artificial-neural-network'

OVERVIEW = 'Your phone can read handwritten digits, and the program behind it was not given rules for what a "7" looks like. It learned from thousands of examples. An artificial neural network is a model made of many small computing units, called neurons, connected in layers. Each connection has a weight that is adjusted during training until the network gives the right answers. In this experiment you learn what a neuron computes, how layers are stacked, how a network learns by gradient descent, and how to train a small network to recognise handwritten digits.'

AIM = 'To understand the structure and training of a feed-forward neural network, and to train and evaluate a neural network classifier in Python.'

OBJECTIVE = "After completing this experiment, students will be able to: describe a neuron: inputs, weights, bias and activation function; explain input, hidden and output layers and count a network's parameters; name common activation functions and say why they are needed; explain, in simple terms, how a network learns with a loss function and gradient descent; explain why features must be scaled and how overfitting is controlled; and train and use `MLPClassifier` in scikit-learn and evaluate it on test data."

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. The artificial neuron

A single **neuron** takes several numbers as input, multiplies each by a **weight**, adds them up together with a **bias**, and passes the total through an **activation function**:

**output = activation(w₁x₁ + w₂x₂ + … + b)**

The weights say how much each input matters; the bias shifts the result. Example: for inputs (2, 3), weights (0.5, −1) and bias 1, the total is 2 × 0.5 + 3 × (−1) + 1 = −1.

## 2. Activation functions

Without an activation function, stacking neurons would still give only a linear model. Activation functions add the non-linearity that lets networks learn complex patterns. Common choices:

- **ReLU:** output = max(0, z). It is simple, fast and the usual default for hidden layers. For z = −1 the output is 0; for z = 2 it is 2.
- **Sigmoid:** squeezes z into the range 0 to 1.
- **Tanh:** squeezes z into the range −1 to 1.
- **Softmax:** used in the output layer for several classes. It turns the final scores into probabilities that add up to 1.

## 3. Layers

Neurons are arranged in **layers**. The **input layer** holds the features (one unit per feature, no computation). One or more **hidden layers** compute intermediate features. The **output layer** gives the result: for ten classes it has ten units, one per class. In a **feed-forward** network the information moves only forward, from the inputs to the output.

**Counting parameters:** a layer with n inputs and m neurons has n × m weights and m biases. A network with 4 inputs, one hidden layer of 3 neurons and 2 outputs has 4 × 3 + 3 = 15 parameters in the first layer and 3 × 2 + 2 = 8 in the second, so 23 in total.

## 4. How a network learns

1. **Forward pass:** the network computes predictions for the training examples.
2. **Loss:** a **loss function** measures how wrong the predictions are. For classification the usual loss is **cross-entropy**, which is small when the network gives high probability to the correct class and large when it is confidently wrong.
3. **Backpropagation:** the algorithm works out how much each weight contributed to the loss.
4. **Gradient descent:** each weight is nudged a small step in the direction that lowers the loss. The size of the step is the **learning rate**.

This cycle is repeated over the training data many times. One full pass over the data is an **epoch**. Training stops after a set number of iterations (`max_iter`) or when the loss stops improving.

## 5. Preparation and settings

- **Scale the features.** Neural networks train much better when the inputs have similar ranges, for example a mean of 0 and a spread of 1, learned from the training data only.
- **Random start.** Weights begin as small random numbers, so results vary between runs unless `random_state` is set.
- **Architecture.** The number of hidden layers and neurons (`hidden_layer_sizes`) controls the capacity: too small underfits, too large overfits.
- **Regularisation.** A penalty on large weights (`alpha` in scikit-learn) and early stopping on a validation set help to prevent overfitting.

## 6. Using scikit-learn

- `StandardScaler` for scaling (fit on training data, apply to both parts).
- `MLPClassifier(hidden_layer_sizes=(64,), max_iter=300, random_state=42)` creates a network with one hidden layer of 64 neurons. "MLP" stands for multi-layer perceptron.
- `fit(X_train_scaled, y_train)` trains it.
- `predict(X_test_scaled)` returns the classes; `predict_proba` returns the softmax probabilities.
- `score(X_test_scaled, y_test)` returns the accuracy.
- `loss_curve_` shows the loss after each iteration; a ConvergenceWarning means training stopped before the loss settled.

**The dataset:** the digits dataset has 1,797 small images of handwritten digits. Each image is 8 × 8 pixels with brightness values from 0 to 16, so each example has 64 features. The class is the digit, 0 to 9.

## 7. Evaluation

Accuracy is the share of test images classified correctly. A confusion matrix shows which digits are mixed up, for example 3 with 8. As always, judge the network on test data it was not trained on.

## 8. Strengths and weaknesses

**Strengths:** can learn very complex patterns; works with many kinds of data; improves with more data and larger networks.

**Weaknesses:** needs a lot of data for hard problems; many settings to tune; results depend on the random start; hard to interpret (a "black box"); training can be slow.

## Summary

A neural network is a stack of layers of neurons, each computing a weighted sum passed through an activation function. It learns by repeatedly reducing a loss with gradient descent. Scaling the inputs, choosing a sensible size, and judging it on unseen data are essential.

## References
1. scikit-learn documentation, Neural network models (supervised): https://scikit-learn.org/stable/modules/neural_networks_supervised.html
2. scikit-learn documentation, Toy datasets: https://scikit-learn.org/stable/datasets/toy_dataset.html"""

PRE_QUIZ = [
    (
        '2 × 0.5 + 3 × (−1) + 1 equals:',
        [
            '1',
            '0',
            '−1',
            '4',
        ],
        2,
    ),
    (
        'Which of these is a classification task?',
        [
            'Estimating a price',
            'Recognising a handwritten digit',
            'Forecasting the temperature',
            'Predicting a salary',
        ],
        1,
    ),
    (
        'A "feature" is:',
        [
            'A measurable input that describes an example',
            'A prediction',
            'A mistake',
            'A model',
        ],
        0,
    ),
    (
        'What does max(0, z) give for z = −3?',
        [
            '−3',
            '0',
            '3',
            '1',
        ],
        1,
    ),
    (
        'Why do we scale the features for many models?',
        [
            'To change the labels',
            'To add rows',
            'So that features with large ranges do not dominate',
            'To remove classes',
        ],
        2,
    ),
    (
        'A model that does well on training data but badly on new data is:',
        [
            'Underfitted',
            'Perfect',
            'Scaled',
            'Overfitted',
        ],
        3,
    ),
    (
        'Gradient descent changes a value step by step in the direction that:',
        [
            'Lowers the error',
            'Raises the error',
            'Keeps the error the same',
            'Removes the data',
        ],
        0,
    ),
    (
        'A grey-scale image of 8 × 8 pixels has how many pixel values?',
        [
            '8',
            '16',
            '64',
            '88',
        ],
        2,
    ),
    (
        'True or False: A test set is used to check performance on unseen data.',
        [
            'True',
            'False',
        ],
        0,
    ),
    (
        'If a model classifies 49 of 50 test images correctly, its accuracy is:',
        [
            '0.49',
            '0.50',
            '0.90',
            '0.98',
        ],
        3,
    ),
]

POST_QUIZ = [
    (
        'What does a neuron compute?',
        [
            'The median of its inputs',
            'The largest input',
            'A weighted sum of its inputs plus a bias, passed through an activation function',
            'A distance',
        ],
        2,
    ),
    (
        'Why are activation functions needed?',
        [
            'To add non-linearity so the network can learn complex patterns',
            'To make the network smaller',
            'To remove the bias',
            'To scale the features',
        ],
        0,
    ),
    (
        'What does ReLU compute?',
        [
            '1 / (1 + e^(−z))',
            'z²',
            'The mean of z',
            'max(0, z)',
        ],
        3,
    ),
    (
        'Which function is typically used in the output layer of a multi-class classifier to give probabilities?',
        [
            'ReLU',
            'Tanh only',
            'Softmax',
            'Identity',
        ],
        2,
    ),
    (
        'A network has 4 inputs, one hidden layer of 3 neurons and 2 outputs. How many parameters (weights and biases) does it have?',
        [
            '14',
            '18',
            '23',
            '30',
        ],
        2,
    ),
    (
        'What is a loss function?',
        [
            'A function that scales features',
            'The number of layers',
            'The learning rate',
            'A measure of how wrong the predictions are',
        ],
        3,
    ),
    (
        'What does backpropagation compute?',
        [
            'The predictions',
            'How much each weight contributed to the loss',
            'The test accuracy',
            'The scaling values',
        ],
        1,
    ),
    (
        'What does the learning rate control?',
        [
            'The number of layers',
            'The size of each step in gradient descent',
            'The number of classes',
            'The number of features',
        ],
        1,
    ),
    (
        'Why should features be scaled before training a neural network?',
        [
            'It is required by the labels',
            'It adds neurons',
            'It makes training much more stable and efficient',
            'It removes overfitting entirely',
        ],
        2,
    ),
    (
        'True or False: Setting `random_state` makes the random starting weights repeatable.',
        [
            'True',
            'False',
        ],
        0,
    ),
]

ASSIGNMENT = [
    (
        'A neuron has inputs (1, 2), weights (3, −1), bias 0 and ReLU activation. What is its output?',
        [
            '−1',
            '1',
            '0',
            '5',
        ],
        1,
    ),
    (
        'The same neuron, but with bias −2. What is its output?',
        [
            '1',
            '−1',
            '0',
            '2',
        ],
        2,
    ),
    (
        'A network takes the 64 pixel values of a digit image, has one hidden layer of 64 neurons, and 10 outputs. How many weights are there between the input and hidden layers (not counting biases)?',
        [
            '64',
            '128',
            '4096',
            '640',
        ],
        2,
    ),
    (
        'In the same network, how many weights are there between the hidden and output layers (not counting biases)?',
        [
            '64',
            '640',
            '4096',
            '74',
        ],
        1,
    ),
    (
        'A network scores 100% on training data and 85% on test data. Which step could help?',
        [
            'Train much longer with no changes',
            'Use regularisation (such as a larger `alpha`), a smaller network or early stopping',
            'Remove the test data',
            'Remove scaling',
        ],
        1,
    ),
    (
        'A network trained on unscaled pixel data, mixed with a feature in the thousands, trains badly. The likely remedy is to:',
        [
            'Remove the labels',
            'Use only one neuron',
            'Use fewer rows',
            'Scale the features using the training data',
        ],
        3,
    ),
    (
        'A ConvergenceWarning appears after training. What does it mean?',
        [
            'Training stopped at `max_iter` before the loss settled',
            'The model is perfect',
            'The labels are wrong',
            'The data is scaled',
        ],
        0,
    ),
    (
        'Two runs of the same code give slightly different accuracies. What is a likely reason?',
        [
            'Different test sets are chosen by magic',
            'The random starting weights differ because `random_state` was not fixed',
            'Accuracy is random',
            'The labels change',
        ],
        1,
    ),
    (
        'Which statement best describes why a neural network is called a "black box"?',
        [
            'It cannot be trained',
            'It has no output',
            'Its many weights are hard to interpret in human terms',
            'It uses no data',
        ],
        2,
    ),
    (
        'True or False: A neural network can learn a curved decision boundary because of its non-linear activation functions.',
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

Recognise handwritten digits with a small neural network.

### Steps

1. Load the built-in digits dataset: `from sklearn.datasets import load_digits` and `X, y = load_digits(return_X_y=True)`.
2. Split with `train_test_split(X, y, test_size=0.2, random_state=42)`.
3. Scale the features with `StandardScaler`, learning the scaling from the training part only.
4. Train `MLPClassifier(hidden_layer_sizes=(64,), max_iter=300, random_state=42)` on the scaled training part.
5. Compute the accuracy on the scaled test part, round it to 2 decimals, and store it in `result`.

### Important

- The answer must be stored in the variable `result` (a single number). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex10_ann.py).
SOLUTION_FILE = 'ex10_ann.py'
