"""Experiment 9: K-Means Clustering. Content approved for loading; edit here and re-run `python -m scripts.load_experiments`."""

TITLE = 'K-Means Clustering'
SLUG = 'k-means-clustering'

OVERVIEW = "A librarian who receives a pile of unlabelled books will sort them into piles of similar books without being told the categories. Clustering does the same with data. K-Means is the most widely used clustering method: it divides the data into k groups so that the members of each group are close to the group's centre. In this experiment you learn how the algorithm alternates between assigning points and moving centres, how to judge a clustering and choose k, and you apply it to iris flower measurements without using the species labels."

AIM = 'To understand how K-Means groups unlabelled data into clusters, and to run, evaluate and interpret K-Means clustering in Python.'

OBJECTIVE = 'After completing this experiment, students will be able to: explain the difference between supervised and unsupervised learning; describe the steps of the K-Means algorithm; compute a centroid and assign points to the nearest centroid; explain inertia and use the elbow idea to choose k; explain why scaling and the starting centres matter; and run `KMeans` in scikit-learn and read `labels_`, `cluster_centers_` and `inertia_`.'

# Dummy link until the real video is provided.
VIDEO_URL = "https://example.com/placeholder-video"

NOTES = """## 1. Learning without answers

In **supervised** learning every training example comes with a known answer. In **unsupervised** learning there are no answers: the algorithm looks for structure in the data itself. **Clustering** is the best-known unsupervised task. It groups examples so that those in the same group (cluster) are more similar to each other than to those in other groups. Typical uses are grouping customers by behaviour, grouping documents by topic, and compressing colours in an image.

## 2. The idea of K-Means

K-Means represents each cluster by its **centroid**, the mean position of its members. The number of clusters **k** is chosen by you before the algorithm runs. The goal is to place k centroids so that every point is close to the centroid of its own cluster.

## 3. The algorithm

1. **Initialise:** choose k starting centroids (scikit-learn uses a careful method called k-means++ that spreads them out).
2. **Assign:** give every point to its nearest centroid, using the Euclidean distance.
3. **Update:** move each centroid to the mean of the points assigned to it.
4. Repeat steps 2 and 3 until the assignments stop changing (or change very little).

Example: if a cluster contains the points (1, 2), (3, 4) and (5, 6), its centroid is the mean of each coordinate: ((1 + 3 + 5) / 3, (2 + 4 + 6) / 3) = (3, 4).

## 4. Inertia: how tight are the clusters?

**Inertia** is the sum, over all points, of the squared distance from each point to its own centroid. K-Means tries to make it as small as possible. A lower inertia means tighter clusters. Inertia always decreases as k increases (with k equal to the number of points it would be 0), so it cannot be used alone to pick k.

## 5. Choosing k

- **Elbow method:** run K-Means for k = 1, 2, 3, … and plot the inertia. The curve falls quickly at first and then flattens; the bend, or "elbow", suggests a reasonable k.
- **Silhouette score:** compares, for each point, the closeness to its own cluster with the closeness to the nearest other cluster. Values near 1 mean well-separated clusters.
- **Domain knowledge:** sometimes the application tells you how many groups you need.

## 6. Things that affect the result

- **Starting centres:** K-Means finds a local best, which depends on where it starts. The setting `n_init` runs the algorithm several times with different starts and keeps the best; `random_state` makes the result repeatable.
- **Scaling:** K-Means uses distances, so features with large ranges dominate unless the data is scaled first.
- **Cluster shape:** it works best when clusters are roughly round and of similar size. It struggles with long, curved or very differently sized clusters.
- **Outliers:** because centroids are means, a few extreme points can pull a centroid away.
- **Numbering:** the cluster numbers 0, 1, 2 are arbitrary names. Cluster 0 does not have to correspond to class 0 of any labels.

## 7. Using scikit-learn

- `KMeans(n_clusters=3, n_init=10, random_state=42)` creates the model.
- `fit(X)` or `fit_predict(X)` runs the algorithm; there is no `y`.
- `labels_` holds the cluster of each point; `cluster_centers_` holds the centroids.
- `inertia_` holds the inertia.
- `predict(X_new)` assigns new points to the nearest existing centroid.

**The dataset:** the iris data has 150 flowers with four measurements each. Its three species are known, but in this experiment we ignore them and see whether K-Means finds three groups by itself. Because the labels are not part of the algorithm, they can be used afterwards, as a check, to see how well the clusters match the species.

## 8. Limits

K-Means needs k in advance, depends on its starting points, assumes round clusters, and cannot handle categories directly. A clustering has no single "correct" answer, so it must always be judged against the purpose it serves.

## Summary

K-Means alternates between assigning each point to the nearest centroid and moving each centroid to the mean of its points, until the groups settle. Inertia measures how tight the clusters are, the elbow method helps to choose k, and scaling, starting points and cluster shape all affect the result.

## References
1. scikit-learn documentation, K-means: https://scikit-learn.org/stable/modules/clustering.html#k-means
2. scikit-learn documentation, Toy datasets: https://scikit-learn.org/stable/datasets/toy_dataset.html"""

PRE_QUIZ = [
    (
        'In supervised learning, the training examples:',
        [
            'Come with known answers',
            'Have no answers',
            'Are always images',
            'Are never numbers',
        ],
        0,
    ),
    (
        'Which task is an example of grouping similar items without labels?',
        [
            'Predicting a price',
            'Spam detection with known labels',
            'Predicting a class from labels',
            'Grouping customers by their buying behaviour',
        ],
        3,
    ),
    (
        'What is the mean of the numbers 2, 4 and 9?',
        [
            '4',
            '5',
            '6',
            '15',
        ],
        1,
    ),
    (
        'The straight-line distance between (0, 0) and (6, 8) is:',
        [
            '8',
            '9',
            '10',
            '14',
        ],
        2,
    ),
    (
        'The mean of the points (2, 2) and (4, 6) is:',
        [
            '(2, 4)',
            '(3, 4)',
            '(6, 8)',
            '(4, 6)',
        ],
        1,
    ),
    (
        'What is a "feature"?',
        [
            'A prediction',
            'A measurable property used to describe an example',
            'A label',
            'A cluster',
        ],
        1,
    ),
    (
        'Why do features with very different ranges cause trouble in distance-based methods?',
        [
            'The feature with the larger range dominates the distance',
            'They do not',
            'They change the labels',
            'They remove outliers',
        ],
        0,
    ),
    (
        'What does "unlabelled data" mean?',
        [
            'Data without any numbers',
            'Data with no known category or answer for each example',
            'Data with errors',
            'Data that is too small',
        ],
        1,
    ),
    (
        'True or False: Squared distances are always zero or positive.',
        [
            'True',
            'False',
        ],
        0,
    ),
    (
        'A "cluster" is best described as:',
        [
            'A single outlier',
            'A group of examples that are similar to one another',
            'A prediction error',
            'A kind of label',
        ],
        1,
    ),
]

POST_QUIZ = [
    (
        'K-Means is an example of:',
        [
            'Unsupervised clustering',
            'Supervised classification',
            'Regression',
            'Reinforcement learning',
        ],
        0,
    ),
    (
        'What is a centroid?',
        [
            'The farthest point in a cluster',
            'The mean position of the points in a cluster',
            'A label',
            'The number of clusters',
        ],
        1,
    ),
    (
        'Which step comes right after assigning every point to its nearest centroid?',
        [
            'Choosing the labels',
            'Moving each centroid to the mean of its assigned points',
            'Scaling the data',
            'Stopping always',
        ],
        1,
    ),
    (
        'When does the K-Means algorithm usually stop?',
        [
            'After one step',
            'When inertia is negative',
            'When k is zero',
            'When the assignments stop changing (or change very little)',
        ],
        3,
    ),
    (
        'What is inertia?',
        [
            'The number of iterations',
            'The number of clusters',
            'The sum of squared distances from points to their own centroid',
            'The average label',
        ],
        2,
    ),
    (
        'What happens to inertia as k increases?',
        [
            'It always increases',
            'It stays constant',
            'It becomes negative',
            'It always decreases (or stays the same)',
        ],
        3,
    ),
    (
        'The elbow method helps to:',
        [
            'Scale the data',
            'Choose the number of clusters k',
            'Find labels',
            'Remove outliers',
        ],
        1,
    ),
    (
        'What does the `n_init` setting do?',
        [
            'Sets the number of clusters',
            'Runs the algorithm several times from different starting points and keeps the best result',
            'Sets the number of features',
            'Limits the distance',
        ],
        1,
    ),
    (
        'Why is scaling often needed before K-Means?',
        [
            'Distances are used, so features with large ranges would dominate',
            'K-Means needs labels',
            'K-Means only accepts integers',
            'It sets k',
        ],
        0,
    ),
    (
        'True or False: Cluster number 0 produced by K-Means must correspond to class 0 of the true labels.',
        [
            'True',
            'False',
        ],
        1,
    ),
]

ASSIGNMENT = [
    (
        'A cluster contains the points (1, 2), (3, 4) and (5, 6). What is its centroid?',
        [
            '(2, 3)',
            '(3, 4)',
            '(4, 5)',
            '(9, 12)',
        ],
        1,
    ),
    (
        'A point is at (2, 2). Centroid A is at (0, 0) and centroid B is at (3, 3). To which does it belong?',
        [
            'B',
            'A',
            'Neither',
            'It is a tie',
        ],
        0,
    ),
    (
        'The inertia values for k = 1, 2, 3, 4, 5, 6 are 680, 150, 78, 60, 52, 46. Which k does the elbow method suggest?',
        [
            '1',
            '2',
            '3',
            '6',
        ],
        2,
    ),
    (
        'A student sets k equal to the number of data points. What is the inertia?',
        [
            'Very large',
            'Zero, since every point is its own centroid',
            'Negative',
            'Undefined',
        ],
        1,
    ),
    (
        'Two runs of K-Means on the same data give different clusters. What is the most likely reason, and a remedy?',
        [
            'Different random starting points; use `n_init` and a fixed `random_state`',
            'A bug in the data; delete rows',
            'Scaling; remove it',
            'Too few labels',
        ],
        0,
    ),
    (
        'A dataset has income in rupees (tens of thousands) and age in years. Without scaling, K-Means clusters will mostly reflect:',
        [
            'Age',
            'Income',
            'Both equally',
            'Neither',
        ],
        1,
    ),
    (
        'K-Means is run on two long, curved, intertwined groups of points. What is the likely outcome?',
        [
            'It may split them badly, since it prefers round, similar-sized clusters',
            'It finds them perfectly',
            'It crashes',
            'It uses the labels',
        ],
        0,
    ),
    (
        'After clustering the iris data, how could you check how well the clusters match the real species?',
        [
            'You cannot',
            'Use the test accuracy of K-Means',
            'Compare the cluster numbers with the known species labels after the fact',
            'Count the features',
        ],
        2,
    ),
    (
        'Which statement about `predict` on a fitted K-Means model is correct?',
        [
            'It assigns each new point to the nearest existing centroid',
            'It returns the true class',
            'It refits the model',
            'It removes clusters',
        ],
        0,
    ),
    (
        'True or False: One extreme outlier can pull a centroid away from the rest of its cluster.',
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

Cluster iris flowers with K-Means, ignoring the species labels.

### Steps

1. Load the built-in iris dataset: `from sklearn.datasets import load_iris` and `X, _ = load_iris(return_X_y=True)` (the labels are not used).
2. Create `KMeans(n_clusters=3, n_init=10, random_state=42)` and run `fit_predict(X)` on all 150 flowers.
3. Count how many flowers are in each cluster and sort the three counts in ascending order.
4. Store a dictionary in `result` with two keys: `"cluster_sizes"` (the sorted list of counts) and `"inertia"` (the model's `inertia_`, rounded to 2 decimals).

### Important

- The answer must be stored in the variable `result` (a dictionary). It is already created for you in the editor.
- Use exactly the settings given in the steps, including every `random_state`. Different settings give a different answer.
- Click Run to see your output. Submit shows your output and whether it is Correct or Incorrect. Click Mark Completed when you have finished this exercise.
"""

STARTER_CODE = 'result = None  # store your final answer in this variable\n\n# Write your code here\n'

# Solution used to compute the expected result (see solutions/ex09_kmeans.py).
SOLUTION_FILE = 'ex09_kmeans.py'
