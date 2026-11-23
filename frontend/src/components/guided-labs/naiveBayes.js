// Gaussian Naive Bayes for the guided lab (Experiment 5). Pure functions, unit-tested against scikit-learn.

/**
 * Learn, for every class: the prior (share of training rows) and, for every feature, the mean and variance.
 * Like scikit-learn's GaussianNB, a tiny amount (1e-9 × the largest feature variance) is added to every variance.
 * X: rows of feature values, y: class values. Returns { classes, priors, means, vars }.
 */
export function fitGaussianNB(X, y) {
  const classes = [...new Set(y)].sort((a, b) => a - b);
  const p = X[0].length;
  const column = (j, rows) => rows.map((r) => r[j]);
  const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length;
  const variance = (v) => {
    const m = mean(v);
    return v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length;
  };
  let epsilon = 0;
  for (let j = 0; j < p; j += 1)
    epsilon = Math.max(epsilon, variance(column(j, X)));
  epsilon *= 1e-9;
  const priors = [];
  const means = [];
  const vars = [];
  for (const c of classes) {
    const rows = X.filter((_, i) => y[i] === c);
    priors.push(rows.length / X.length);
    means.push(Array.from({ length: p }, (_, j) => mean(column(j, rows))));
    vars.push(
      Array.from({ length: p }, (_, j) => variance(column(j, rows)) + epsilon),
    );
  }
  return { classes, priors, means, vars };
}

/** Height of the bell curve (normal density) of class index ci, feature j, at value x: P(x | class). */
export function likelihood(model, ci, j, x) {
  const v = model.vars[ci][j];
  return (
    Math.exp(-((x - model.means[ci][j]) ** 2) / (2 * v)) /
    Math.sqrt(2 * Math.PI * v)
  );
}

/**
 * For the feature values x (one per feature): per class the likelihoods, prior × likelihood and the posterior
 * P(class | x) (normalised so the posteriors add up to 1). Computed with logarithms so nothing underflows.
 */
export function posterior(model, x) {
  const logJoint = model.classes.map((_, ci) =>
    x.reduce(
      (s, v, j) =>
        s -
        0.5 * Math.log(2 * Math.PI * model.vars[ci][j]) -
        (v - model.means[ci][j]) ** 2 / (2 * model.vars[ci][j]),
      Math.log(model.priors[ci]),
    ),
  );
  const top = Math.max(...logJoint);
  const shares = logJoint.map((l) => Math.exp(l - top));
  const total = shares.reduce((s, v) => s + v, 0);
  return model.classes.map((cls, ci) => ({
    cls,
    prior: model.priors[ci],
    likelihoods: x.map((v, j) => likelihood(model, ci, j, v)),
    joint: Math.exp(logJoint[ci]),
    posterior: shares[ci] / total,
  }));
}

export function predictNB(model, x) {
  const rows = posterior(model, x);
  return rows.reduce((best, r) => (r.posterior > best.posterior ? r : best))
    .cls;
}
