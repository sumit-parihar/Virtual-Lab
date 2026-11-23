// K-Means clustering for the guided lab (Experiment 9). Works for points with any number of features.
// Pure functions, unit-tested (including against the Code Exercise's stored answer).
import { seededRandom } from "./classifyMath.js";

const sqDist = (a, b) => a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0);

/** k different points of the data, chosen at random (fixed by the seed), as starting centroids. */
export function randomCentroids(points, k, seed) {
  const rng = seededRandom(seed);
  const chosen = new Set();
  while (chosen.size < Math.min(k, points.length))
    chosen.add(Math.floor(rng() * points.length));
  return [...chosen].map((i) => [...points[i]]);
}

/**
 * k-means++ starting centroids (what scikit-learn uses): the first is a random point, each next one is a point
 * chosen with probability proportional to its squared distance from the nearest centroid so far, which spreads
 * the starting centroids out.
 */
export function kMeansPlusPlusCentroids(points, k, seed) {
  const rng = seededRandom(seed);
  const centroids = [[...points[Math.floor(rng() * points.length)]]];
  while (centroids.length < Math.min(k, points.length)) {
    const d2 = points.map((p) =>
      Math.min(...centroids.map((c) => sqDist(p, c))),
    );
    const total = d2.reduce((s, v) => s + v, 0);
    let target = rng() * total;
    let pick = 0;
    for (; pick < points.length - 1; pick += 1) {
      target -= d2[pick];
      if (target <= 0) break;
    }
    centroids.push([...points[pick]]);
  }
  return centroids;
}

/** Step "assign": every point joins its nearest centroid. */
export function assign(points, centroids) {
  return points.map((p) => {
    let best = 0;
    for (let c = 1; c < centroids.length; c += 1)
      if (sqDist(p, centroids[c]) < sqDist(p, centroids[best])) best = c;
    return best;
  });
}

/** Step "update": every centroid moves to the mean of its points (a centroid with no points stays put). */
export function update(points, labels, centroids) {
  return centroids.map((old, c) => {
    const members = points.filter((_, i) => labels[i] === c);
    if (members.length === 0) return old;
    return old.map(
      (_, j) => members.reduce((s, p) => s + p[j], 0) / members.length,
    );
  });
}

/** Sum of squared distances from each point to its own centroid. */
export function inertia(points, labels, centroids) {
  return points.reduce((s, p, i) => s + sqDist(p, centroids[labels[i]]), 0);
}

/**
 * Run assign/update until the assignments stop changing, from random starting points or k-means++.
 * Returns { centroids, labels, inertia, iterations }.
 */
export function runKMeans(
  points,
  k,
  seed,
  { init = "random", maxIter = 300 } = {},
) {
  let centroids =
    init === "kmeans++"
      ? kMeansPlusPlusCentroids(points, k, seed)
      : randomCentroids(points, k, seed);
  let labels = assign(points, centroids);
  let iterations = 0;
  for (; iterations < maxIter; iterations += 1) {
    centroids = update(points, labels, centroids);
    const next = assign(points, centroids);
    const changed = next.some((l, i) => l !== labels[i]);
    labels = next;
    if (!changed) break;
  }
  return {
    centroids,
    labels,
    inertia: inertia(points, labels, centroids),
    iterations: iterations + 1,
  };
}

/** Best of several k-means++ runs with different seeds (like scikit-learn's n_init=10). */
export function bestKMeans(points, k, runs = 10, firstSeed = 1) {
  let best = null;
  for (let r = 0; r < runs; r += 1) {
    const result = runKMeans(points, k, firstSeed + r, { init: "kmeans++" });
    if (best === null || result.inertia < best.inertia) best = result;
  }
  return best;
}
