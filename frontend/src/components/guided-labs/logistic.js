import { solveLinearSystem } from "./labMath.js";

export const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/**
 * Binary logistic regression, fitted like scikit-learn's default LogisticRegression (L2 penalty, C = 1):
 * minimise ½·|w|² + C·Σ log loss, the intercept not penalised. Solved with Newton's method.
 * X: rows of (already scaled) features, y: 0 or 1. Returns { intercept, coef }.
 */
export function fitLogistic(X, y, { C = 1, iterations = 50 } = {}) {
  const p = X[0].length + 1;
  let w = new Array(p).fill(0); // w[0] is the intercept
  for (let it = 0; it < iterations; it += 1) {
    const grad = w.map((v, j) => (j === 0 ? 0 : v));
    const hess = Array.from({ length: p }, (_, a) =>
      Array.from({ length: p }, (_, b) => (a === b && a > 0 ? 1 : 0)),
    );
    for (let i = 0; i < X.length; i += 1) {
      const row = [1, ...X[i]];
      const prob = sigmoid(row.reduce((s, v, j) => s + v * w[j], 0));
      const weight = prob * (1 - prob);
      for (let a = 0; a < p; a += 1) {
        grad[a] += C * (prob - y[i]) * row[a];
        for (let b = 0; b < p; b += 1)
          hess[a][b] += C * weight * row[a] * row[b];
      }
    }
    const step = solveLinearSystem(hess, grad);
    w = w.map((v, j) => v - step[j]);
    if (Math.max(...step.map(Math.abs)) < 1e-10) break;
  }
  return { intercept: w[0], coef: w.slice(1) };
}

/** The score z = b0 + b1·x1 + … and the probability of class 1. */
export function logisticScore(model, x) {
  return x.reduce((s, v, j) => s + model.coef[j] * v, model.intercept);
}
