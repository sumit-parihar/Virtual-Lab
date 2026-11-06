# Experiment 10: Artificial Neural Network (built-in Digits dataset, 10 classes)
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier

X, y = load_digits(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler().fit(X_train)
X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)

model = MLPClassifier(hidden_layer_sizes=(64,), max_iter=300, random_state=42)
model.fit(X_train_s, y_train)

result = round(float(model.score(X_test_s, y_test)), 2)  # test accuracy
print(result)
