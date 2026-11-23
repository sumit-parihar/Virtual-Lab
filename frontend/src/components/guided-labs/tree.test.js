import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import { splitRows } from "./labMath.js";
import { countLeaves, gini, growTree, predictTree } from "./tree.js";

// Reference values: scikit-learn DecisionTreeClassifier(random_state=42) on the same file and split.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(readFileSync(`${dir}/iris.csv`, "utf8"));
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/iris_split.json`, "utf8"),
);
const { train, test } = splitRows(data.length, testRows);
const classes = [0, 1, 2];

function pts(pair) {
  const cols = pair.map((c) => header.indexOf(c));
  const make = (idx) =>
    idx.map((i) => ({ f: cols.map((c) => data[i][c]), cls: data[i][4] }));
  return { tr: make(train), te: make(test) };
}
const acc = (tree, points) =>
  points.filter((p) => predictTree(tree, p.f) === p.cls).length / points.length;
const PETAL = ["petal length (cm)", "petal width (cm)"];
const SEPAL = ["sepal length (cm)", "sepal width (cm)"];

describe("decision tree lab maths", () => {
  it("computes Gini impurity like the theory examples", () => {
    expect(gini([8, 2])).toBeCloseTo(0.32, 10);
    expect(gini([5, 5])).toBeCloseTo(0.5, 10);
    expect(gini([7, 0])).toBe(0);
  });

  it("asks the same first questions as scikit-learn on the petals", () => {
    const tree = growTree(pts(PETAL).tr, classes, { maxDepth: 2 });
    expect(tree.gini).toBeCloseTo(0.6665, 4);
    expect(tree.counts).toEqual([40, 41, 39]);
    expect([tree.feature, tree.threshold]).toEqual([0, 2.45]);
    expect(tree.left.counts).toEqual([40, 0, 0]);
    expect([tree.right.feature, tree.right.threshold]).toEqual([0, 4.75]);
    expect(tree.right.left.counts).toEqual([0, 36, 1]);
    expect(tree.right.right.counts).toEqual([0, 5, 38]);
  });

  it("matches scikit-learn's accuracy and leaves on the petals for every depth", () => {
    const { tr, te } = pts(PETAL);
    const expected = {
      1: [0.675, 0.6333, 2],
      2: [0.95, 0.9667, 3],
      3: [0.9583, 1, 5],
      4: [0.975, 1, 7],
    };
    for (const [d, [trainAcc, testAcc, leaves]] of Object.entries(expected)) {
      const tree = growTree(tr, classes, { maxDepth: Number(d) });
      expect(acc(tree, tr)).toBeCloseTo(trainAcc, 4);
      expect(acc(tree, te)).toBeCloseTo(testAcc, 4);
      expect(countLeaves(tree)).toBe(leaves);
    }
  });

  it("overfits the sepals when the depth is not limited", () => {
    const { tr, te } = pts(SEPAL);
    const shallow = growTree(tr, classes, { maxDepth: 3 });
    expect(acc(shallow, te)).toBeCloseTo(0.8333, 4);
    const full = growTree(tr, classes);
    expect(acc(full, tr)).toBeCloseTo(0.9417, 4);
    expect(countLeaves(full)).toBe(41);
    // Deep in the tree many questions are equally good; scikit-learn picks among them with its random_state, this
    // lab takes the first. The full tree's test accuracy is therefore 0.60 here and 0.63 in scikit-learn: both far
    // below the depth-3 tree, which is the point.
    expect(acc(full, te)).toBeCloseTo(0.6, 4);
    expect(acc(full, te)).toBeLessThan(acc(shallow, te) - 0.2);
  });

  it("respects min_samples_leaf", () => {
    const tree = growTree(pts(PETAL).tr, classes, {
      maxDepth: 5,
      minSamplesLeaf: 5,
    });
    const leaves = [];
    const walk = (n) =>
      n.left ? (walk(n.left), walk(n.right)) : leaves.push(n.n);
    walk(tree);
    expect(Math.min(...leaves)).toBeGreaterThanOrEqual(5);
    expect(countLeaves(tree)).toBe(6);
  });
});
