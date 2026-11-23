// Decision tree (CART with Gini impurity) for the guided labs (Experiments 6 and 7). Pure functions, unit-tested.

export function gini(counts) {
  const n = counts.reduce((s, c) => s + c, 0);
  if (n === 0) return 0;
  return 1 - counts.reduce((s, c) => s + (c / n) ** 2, 0);
}

/**
 * Grow a tree on points [{ f: [feature values], cls }] with class values `classes`.
 * At each node every question "feature j ≤ t" is tried (t halfway between neighbouring values, as in scikit-learn)
 * and the one that lowers the weighted Gini impurity most is kept; equally good questions keep the first one found
 * (unless `featureOrder` gives another order, used by the random forest). Growth stops at max_depth, at a pure node,
 * or when a split would leave fewer than min_samples_leaf points on a side.
 *
 * Returns a node: { counts, gini, n, prediction, depth, feature?, threshold?, left?, right? }.
 */
export function growTree(points, classes, options = {}, depth = 0) {
  // rng + maxFeatures (random forests): at every node the features are shuffled and only the first maxFeatures
  // features that allow a split are tried, as in scikit-learn's max_features.
  const {
    maxDepth = Infinity,
    minSamplesLeaf = 1,
    minSamplesSplit = 2,
    featureOrder,
    rng,
    maxFeatures,
  } = options;
  const index = new Map(classes.map((c, i) => [c, i]));
  const counts = classes.map(() => 0);
  for (const p of points) counts[index.get(p.cls)] += 1;
  let best = 0;
  for (let i = 1; i < counts.length; i += 1)
    if (counts[i] > counts[best]) best = i;
  const node = {
    counts,
    gini: gini(counts),
    n: points.length,
    prediction: classes[best],
    depth,
  };

  if (depth >= maxDepth || node.gini === 0 || points.length < minSamplesSplit)
    return node;

  const features = [...(featureOrder ?? points[0].f.map((_, j) => j))];
  if (rng) {
    for (let i = features.length - 1; i > 0; i -= 1) {
      const r = Math.floor(rng() * (i + 1));
      [features[i], features[r]] = [features[r], features[i]];
    }
  }
  let split = null;
  let tried = 0;
  for (const j of features) {
    if (maxFeatures && tried >= maxFeatures) break;
    let usable = false;
    const sorted = [...points].sort((a, b) => a.f[j] - b.f[j]);
    const left = classes.map(() => 0);
    const right = [...counts];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const ci = index.get(sorted[i].cls);
      left[ci] += 1;
      right[ci] -= 1;
      const v = sorted[i].f[j];
      const next = sorted[i + 1].f[j];
      if (v === next) continue;
      const nLeft = i + 1;
      const nRight = sorted.length - nLeft;
      if (nLeft < minSamplesLeaf || nRight < minSamplesLeaf) continue;
      usable = true;
      const weighted =
        (nLeft * gini(left) + nRight * gini(right)) / sorted.length;
      const decrease = node.gini - weighted;
      if (split === null || decrease > split.decrease + 1e-12) {
        split = { feature: j, threshold: (v + next) / 2, decrease };
      }
    }
    if (usable) tried += 1;
  }
  if (split === null) return node;

  node.feature = split.feature;
  node.threshold = split.threshold;
  node.left = growTree(
    points.filter((p) => p.f[split.feature] <= split.threshold),
    classes,
    options,
    depth + 1,
  );
  node.right = growTree(
    points.filter((p) => p.f[split.feature] > split.threshold),
    classes,
    options,
    depth + 1,
  );
  return node;
}

export function predictTree(node, f) {
  let n = node;
  while (n.left) n = f[n.feature] <= n.threshold ? n.left : n.right;
  return n.prediction;
}

export function countLeaves(node) {
  return node.left ? countLeaves(node.left) + countLeaves(node.right) : 1;
}

export function treeDepth(node) {
  return node.left
    ? 1 + Math.max(treeDepth(node.left), treeDepth(node.right))
    : 0;
}
