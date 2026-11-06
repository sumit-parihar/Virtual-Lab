# Experiment 2: Multiple Linear Regression (built-in Diabetes dataset, 10 features)
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

X, y = load_diabetes(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
result = [round(float(p), 2) for p in predictions[:10]]  # the first 10 test predictions
print(result)
