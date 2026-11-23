// Random forest for the guided lab (Experiment 7). Pure functions, unit-tested.
import { seededRandom } from "./classifyMath.js";
import { growTree, predictTree } from "./tree.js";

/**
 * Grow `nTrees` trees. Each tree gets its own bootstrap sample (as many rows as the training set, drawn with
 * replacement) and, at every split, considers only `maxFeatures` randomly chosen features. The seed makes the
 * forest the same every time. Returns [{ tree, inBag: Set(row indices), oob: [row indices] }].
 */
export function growForest(
  points,
  classes,
  { nTrees = 100, seed = 1, maxFeatures = 1 } = {},
) {
  const rng = seededRandom(seed);
  const n = points.length;
  const forest = [];
  for (let t = 0; t < nTrees; t += 1) {
    const picked = Array.from({ length: n }, () => Math.floor(rng() * n));
    const inBag = new Set(picked);
    const tree = growTree(
      picked.map((i) => points[i]),
      classes,
      { rng, maxFeatures },
    );
    const oob = [];
    for (let i = 0; i < n; i += 1) if (!inBag.has(i)) oob.push(i);
    forest.push({ tree, inBag, oob });
  }
  return forest;
}

/** Votes of the first `count` trees for the features f: Map(class -> votes), and the winning class. */
export function forestVote(forest, f, classes, count = forest.length) {
  const votes = new Map(classes.map((c) => [c, 0]));
  for (let t = 0; t < count; t += 1) {
    const cls = predictTree(forest[t].tree, f);
    votes.set(cls, votes.get(cls) + 1);
  }
  let best = classes[0];
  for (const c of classes) if (votes.get(c) > votes.get(best)) best = c;
  return { votes, cls: best };
}

/**
 * Out-of-bag accuracy of the first `count` trees: every training row is classified only by the trees that did
 * not see it in their bootstrap sample. Rows that every tree saw are skipped.
 */
export function outOfBagAccuracy(
  forest,
  points,
  classes,
  count = forest.length,
) {
  let right = 0;
  let used = 0;
  points.forEach((p, i) => {
    const votes = new Map(classes.map((c) => [c, 0]));
    let any = false;
    for (let t = 0; t < count; t += 1) {
      if (forest[t].inBag.has(i)) continue;
      const cls = predictTree(forest[t].tree, p.f);
      votes.set(cls, votes.get(cls) + 1);
      any = true;
    }
    if (!any) return;
    let best = classes[0];
    for (const c of classes) if (votes.get(c) > votes.get(best)) best = c;
    used += 1;
    if (best === p.cls) right += 1;
  });
  return used === 0 ? null : right / used;
}
