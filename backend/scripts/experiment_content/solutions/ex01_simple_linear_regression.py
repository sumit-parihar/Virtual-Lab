# Experiment 1: Simple Linear Regression (Salary dataset, Salary_dataset.csv in this folder)
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

data = pd.read_csv("Salary_dataset.csv")
X = data[["YearsExperience"]]
y = data["Salary"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
result = [round(float(p), 2) for p in predictions]
print(result)
