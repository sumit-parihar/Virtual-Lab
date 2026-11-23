// K-Nearest Neighbours for the guided lab (Experiment 4). Pure functions, unit-tested.

export const DISTANCES = {
  euclidean: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  manhattan: (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by),
};

/**
 * Classify the point (x, y) by a majority vote of its k nearest training points ({x, y, cls}).
 * Equal distances keep the training order; a tied vote goes to the smallest class number (as in scikit-learn).
 * Returns { cls, neighbors: [{ point, distance }], votes: Map(class -> count) }.
 */
export function knnClassify(train, x, y, k, metric = "euclidean") {
  const dist = DISTANCES[metric];
  // Measurements such as 4.9 − 4.8 carry tiny floating-point noise; rounding makes equal distances really equal,
  // so ties are always broken the same way (training order).
  const neighbors = train
    .map((point, i) => ({
      point,
      i,
      distance: Math.round(dist(x, y, point.x, point.y) * 1e9) / 1e9,
    }))
    .sort((a, b) => a.distance - b.distance || a.i - b.i)
    .slice(0, k);
  const votes = new Map();
  for (const n of neighbors)
    votes.set(n.point.cls, (votes.get(n.point.cls) || 0) + 1);
  let best = null;
  for (const [cls, count] of votes) {
    if (
      best === null ||
      count > votes.get(best) ||
      (count === votes.get(best) && cls < best)
    )
      best = cls;
  }
  return { cls: best, neighbors, votes };
}

/** Share of points classified correctly by KNN trained on `train`. */
export function knnAccuracy(train, points, k, metric = "euclidean") {
  let right = 0;
  for (const p of points)
    if (knnClassify(train, p.x, p.y, k, metric).cls === p.cls) right += 1;
  return right / points.length;
}
