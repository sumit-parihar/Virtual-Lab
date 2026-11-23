// Two-class support vector machine for the guided lab (Experiment 8). Pure functions, unit-tested.
// Trained with SMO using the same working-set rule and update as libsvm (the library behind scikit-learn's SVC).

export function kernelFunction(kernel, gamma) {
  if (kernel === "rbf")
    return (a, b) =>
      Math.exp(-gamma * ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2));
  return (a, b) => a[0] * b[0] + a[1] * b[1];
}

/**
 * Fit a soft-margin SVM. X: rows of features, y: +1 / -1. Returns { alpha, rho, X, y, K }, where the decision value
 * is f(x) = Σ alpha_i·y_i·K(x_i, x) − rho; f > 0 means class +1, |f| = 1 marks the edges of the margin.
 */
export function fitSVM(
  X,
  y,
  { kernel = "rbf", C = 1, gamma = 0.5, tol = 1e-3, maxIter = 100000 } = {},
) {
  const n = X.length;
  const K = kernelFunction(kernel, gamma);
  const Q = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => y[i] * y[j] * K(X[i], X[j])),
  );
  const alpha = new Array(n).fill(0);
  const G = new Array(n).fill(-1);
  const TAU = 1e-12;

  for (let iter = 0; iter < maxIter; iter += 1) {
    // Maximal violating pair.
    let i = -1;
    let j = -1;
    let gMax = -Infinity;
    let gMin = Infinity;
    for (let t = 0; t < n; t += 1) {
      const v = -y[t] * G[t];
      if ((y[t] === 1 && alpha[t] < C) || (y[t] === -1 && alpha[t] > 0)) {
        if (v >= gMax) {
          gMax = v;
          i = t;
        }
      }
      if ((y[t] === 1 && alpha[t] > 0) || (y[t] === -1 && alpha[t] < C)) {
        if (v <= gMin) {
          gMin = v;
          j = t;
        }
      }
    }
    if (i === -1 || j === -1 || gMax - gMin < tol) break;

    const oldI = alpha[i];
    const oldJ = alpha[j];
    if (y[i] !== y[j]) {
      const quad = Math.max(Q[i][i] + Q[j][j] + 2 * Q[i][j], TAU);
      const delta = (-G[i] - G[j]) / quad;
      const diff = alpha[i] - alpha[j];
      alpha[i] += delta;
      alpha[j] += delta;
      if (diff > 0) {
        if (alpha[j] < 0) {
          alpha[j] = 0;
          alpha[i] = diff;
        }
      } else if (alpha[i] < 0) {
        alpha[i] = 0;
        alpha[j] = -diff;
      }
      if (diff > 0) {
        if (alpha[i] > C) {
          alpha[i] = C;
          alpha[j] = C - diff;
        }
      } else if (alpha[j] > C) {
        alpha[j] = C;
        alpha[i] = C + diff;
      }
    } else {
      const quad = Math.max(Q[i][i] + Q[j][j] - 2 * Q[i][j], TAU);
      const delta = (G[i] - G[j]) / quad;
      const sum = alpha[i] + alpha[j];
      alpha[i] -= delta;
      alpha[j] += delta;
      if (sum > C) {
        if (alpha[i] > C) {
          alpha[i] = C;
          alpha[j] = sum - C;
        }
      } else if (alpha[j] < 0) {
        alpha[j] = 0;
        alpha[i] = sum;
      }
      if (sum > C) {
        if (alpha[j] > C) {
          alpha[j] = C;
          alpha[i] = sum - C;
        }
      } else if (alpha[i] < 0) {
        alpha[i] = 0;
        alpha[j] = sum;
      }
    }
    const dI = alpha[i] - oldI;
    const dJ = alpha[j] - oldJ;
    for (let t = 0; t < n; t += 1) G[t] += Q[t][i] * dI + Q[t][j] * dJ;
  }

  // Offset rho, as libsvm computes it.
  let ub = Infinity;
  let lb = -Infinity;
  let freeSum = 0;
  let freeCount = 0;
  for (let t = 0; t < n; t += 1) {
    const yG = y[t] * G[t];
    if (alpha[t] >= C) {
      if (y[t] === -1) ub = Math.min(ub, yG);
      else lb = Math.max(lb, yG);
    } else if (alpha[t] <= 0) {
      if (y[t] === 1) ub = Math.min(ub, yG);
      else lb = Math.max(lb, yG);
    } else {
      freeSum += yG;
      freeCount += 1;
    }
  }
  const rho = freeCount > 0 ? freeSum / freeCount : (ub + lb) / 2;
  return { alpha, rho, X, y, K };
}

export function decision(model, x) {
  let f = -model.rho;
  for (let i = 0; i < model.X.length; i += 1) {
    if (model.alpha[i] > 0)
      f += model.alpha[i] * model.y[i] * model.K(model.X[i], x);
  }
  return f;
}

export function supportVectorIndices(model) {
  const out = [];
  model.alpha.forEach((a, i) => {
    if (a > 0) out.push(i);
  });
  return out;
}
