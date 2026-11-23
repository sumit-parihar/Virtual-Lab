// Shared, dependency-free maths for the guided labs. Pure functions, unit-tested.

/** Split row indices into train and test using the presaved test rows (the Code Exercise's split). */
export function splitRows(rowCount, testRows) {
  const isTest = new Set(testRows);
  const train = [];
  for (let i = 0; i < rowCount; i += 1) if (!isTest.has(i)) train.push(i);
  return { train, test: [...testRows] };
}

/** Solve A·x = b (A square) by Gaussian elimination with partial pivoting. */
export function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12)
      throw new Error("The system has no single solution");
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r += 1) {
      const factor = M[r][col] / M[col][col];
      for (let k = col; k <= n; k += 1) M[r][k] -= factor * M[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r -= 1) {
    let sum = M[r][n];
    for (let k = r + 1; k < n; k += 1) sum -= M[r][k] * x[k];
    x[r] = sum / M[r][r];
  }
  return x;
}

/**
 * Ordinary least squares with an intercept: ŷ = b0 + b1·x1 + … + bn·xn.
 * X is an array of rows (each an array of feature values), y the targets.
 */
export function leastSquares(X, y) {
  const p = X[0].length + 1;
  const XtX = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty = new Array(p).fill(0);
  for (let i = 0; i < X.length; i += 1) {
    const row = [1, ...X[i]];
    for (let a = 0; a < p; a += 1) {
      Xty[a] += row[a] * y[i];
      for (let b = 0; b < p; b += 1) XtX[a][b] += row[a] * row[b];
    }
  }
  const [intercept, ...coef] = solveLinearSystem(XtX, Xty);
  return { intercept, coef };
}

export function predictLinear(model, x) {
  return x.reduce((sum, v, j) => sum + model.coef[j] * v, model.intercept);
}

/** MAE, MSE, RMSE and R² of predictions against the actual values. */
export function regressionMetrics(actual, predicted) {
  const n = actual.length;
  const mean = actual.reduce((s, v) => s + v, 0) / n;
  let abs = 0;
  let sq = 0;
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    const r = actual[i] - predicted[i];
    abs += Math.abs(r);
    sq += r * r;
    total += (actual[i] - mean) ** 2;
  }
  return {
    mae: abs / n,
    mse: sq / n,
    rmse: Math.sqrt(sq / n),
    r2: 1 - sq / total,
  };
}
