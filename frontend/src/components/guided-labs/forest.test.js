import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import { splitRows } from "./labMath.js";
import { forestVote, growForest, outOfBagAccuracy } from "./forest.js";
import { growTree, predictTree } from "./tree.js";

// A forest's random draws differ from scikit-learn's, so these tests check the behaviour. For reference, scikit-learn
// on the same two features and split: one full tree test 0.877; 100-tree forests 0.895-0.939 (10 seeds), OOB ≈ 0.86.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(
  readFileSync(`${dir}/breast_cancer.csv`, "utf8"),
);
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/breast_cancer_split.json`, "utf8"),
);
const { train, test } = splitRows(data.length, testRows);
const cols = ["mean radius", "mean texture"].map((c) => header.indexOf(c));
const target = header.indexOf("target");
const make = (idx) =>
  idx.map((i) => ({ f: cols.map((c) => data[i][c]), cls: data[i][target] }));
const tr = make(train);
const te = make(test);
const classes = [0, 1];
const forest = growForest(tr, classes, { nTrees: 100, seed: 1 });
const acc = (predict, pts) =>
  pts.filter((p) => predict(p.f) === p.cls).length / pts.length;

describe("random forest lab maths", () => {
  it("gives every tree a bootstrap sample with about 63% of the distinct rows", () => {
    const shares = forest.map((t) => t.inBag.size / tr.length);
    const mean = shares.reduce((s, v) => s + v, 0) / shares.length;
    expect(mean).toBeGreaterThan(0.6);
    expect(mean).toBeLessThan(0.66);
    expect(forest[0].oob.length + forest[0].inBag.size).toBe(tr.length);
  });

  it("is the same forest for the same seed and a different one for another seed", () => {
    const again = growForest(tr, classes, { nTrees: 3, seed: 1 });
    const other = growForest(tr, classes, { nTrees: 3, seed: 2 });
    expect([...again[0].inBag]).toEqual([...forest[0].inBag]);
    expect([...other[0].inBag]).not.toEqual([...forest[0].inBag]);
  });

  it("does better on the test set than one full tree, within scikit-learn's range", () => {
    const single = growTree(tr, classes);
    expect(acc((f) => predictTree(single, f), tr)).toBe(1);
    // 0.868 here, 0.877 in scikit-learn: one test sample, decided by equally good questions deep in the full tree.
    expect(acc((f) => predictTree(single, f), te)).toBeCloseTo(0.8684, 4);
    const forestAcc = acc((f) => forestVote(forest, f, classes).cls, te);
    expect(forestAcc).toBeGreaterThanOrEqual(0.89);
    expect(forestAcc).toBeLessThanOrEqual(0.94);
  });

  it("estimates the accuracy from out-of-bag rows, near scikit-learn's estimate", () => {
    const oob = outOfBagAccuracy(forest, tr, classes);
    expect(oob).toBeGreaterThan(0.82);
    expect(oob).toBeLessThan(0.9);
  });

  it("counts the votes of the first n trees", () => {
    const { votes } = forestVote(forest, te[0].f, classes, 10);
    expect(votes.get(0) + votes.get(1)).toBe(10);
  });
});
