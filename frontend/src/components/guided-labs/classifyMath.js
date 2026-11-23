// Shared maths for the classification labs. Pure functions, unit-tested.

/** Learn a mean and spread for every column from the training rows (like StandardScaler, ddof = 0). */
export function fitScaler(rows) {
  const p = rows[0].length;
  const mean = new Array(p).fill(0);
  const std = new Array(p).fill(0);
  for (const r of rows)
    for (let j = 0; j < p; j += 1) mean[j] += r[j] / rows.length;
  for (const r of rows)
    for (let j = 0; j < p; j += 1)
      std[j] += (r[j] - mean[j]) ** 2 / rows.length;
  for (let j = 0; j < p; j += 1) std[j] = Math.sqrt(std[j]) || 1;
  return {
    mean,
    std,
    transform: (row) => row.map((v, j) => (v - mean[j]) / std[j]),
  };
}

export function accuracy(actual, predicted) {
  let right = 0;
  for (let i = 0; i < actual.length; i += 1)
    if (actual[i] === predicted[i]) right += 1;
  return right / actual.length;
}

/** counts[a][p] = how many examples of actual class a were predicted as class p. */
export function confusionMatrix(actual, predicted, classes) {
  const index = new Map(classes.map((c, i) => [c, i]));
  const counts = classes.map(() => classes.map(() => 0));
  for (let i = 0; i < actual.length; i += 1)
    counts[index.get(actual[i])][index.get(predicted[i])] += 1;
  return counts;
}

/** TP, FP, FN, TN, precision and recall for a binary problem with the given positive class. */
export function binaryCounts(actual, predicted, positive = 1) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (let i = 0; i < actual.length; i += 1) {
    const isPos = actual[i] === positive;
    const saidPos = predicted[i] === positive;
    if (isPos && saidPos) tp += 1;
    else if (!isPos && saidPos) fp += 1;
    else if (isPos && !saidPos) fn += 1;
    else tn += 1;
  }
  return {
    tp,
    fp,
    fn,
    tn,
    accuracy: (tp + tn) / actual.length,
    precision: tp + fp === 0 ? 0 : tp / (tp + fp),
    recall: tp + fn === 0 ? 0 : tp / (tp + fn),
  };
}

/** A small seeded random number generator (mulberry32), so random choices are the same every time. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
