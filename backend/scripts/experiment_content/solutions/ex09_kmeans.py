# Experiment 9: K-Means Clustering (Iris measurements only, labels not used)
from sklearn.datasets import load_iris
from sklearn.cluster import KMeans

X, _ = load_iris(return_X_y=True)

model = KMeans(n_clusters=3, n_init=10, random_state=42)
labels = model.fit_predict(X)

sizes = sorted(int((labels == k).sum()) for k in range(3))
result = {"cluster_sizes": sizes, "inertia": round(float(model.inertia_), 2)}
print(result)
