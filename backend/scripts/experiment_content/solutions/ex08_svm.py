# Experiment 8: Support Vector Machine (built-in Wine dataset, scaled features)
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

X, y = load_wine(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler().fit(X_train)
X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)

model = SVC(kernel="rbf", C=1.0, gamma="scale")
model.fit(X_train_s, y_train)

result = [int(v) for v in model.predict(X_test_s)]
print(result)
