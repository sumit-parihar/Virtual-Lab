# Experiment 5: Naive Bayes (built-in Wine dataset, 3 classes)
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB

X, y = load_wine(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = GaussianNB()
model.fit(X_train, y_train)

result = [int(v) for v in model.predict(X_test)]
print(result)
