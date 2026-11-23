import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import { splitRows } from "./labMath.js";
import { knnAccuracy, knnClassify } from "./knn.js";

// Reference values: scikit-learn KNeighborsClassifier(algorithm="brute") on the same file and split.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(readFileSync(`${dir}/iris.csv`, "utf8"));
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/iris_split.json`, "utf8"),
);
const { train, test } = splitRows(data.length, testRows);

function points(pair) {
  const [xi, yi, ti] = [...pair, "target"].map((c) => header.indexOf(c));
  const make = (idx) =>
    idx.map((i) => ({ x: data[i][xi], y: data[i][yi], cls: data[i][ti] }));
  return { tr: make(train), te: make(test) };
}

describe("KNN lab maths", () => {
  it("matches scikit-learn on the sepal measurements where no distance tie decides a vote", () => {
    const { tr, te } = points(["sepal length (cm)", "sepal width (cm)"]);
    expect(knnAccuracy(tr, tr, 5)).toBeCloseTo(0.825, 4);
    expect(knnAccuracy(tr, te, 5)).toBeCloseTo(0.7667, 4);
    expect(knnAccuracy(tr, tr, 15)).toBeCloseTo(0.775, 4);
    expect(knnAccuracy(tr, te, 15)).toBeCloseTo(0.8333, 4);
  });

  it("shows small k overfitting on the sepal measurements (tie-broken values of this lab)", () => {
    // Sepal values are rounded to 0.1 cm, so many neighbours are exactly equally far away. This lab breaks such ties
    // by training order; scikit-learn's order depends on floating-point noise, so where a tie decides the vote its
    // accuracy differs slightly (k=1: 0.6667, k=25: 0.8667, Manhattan k=5: 0.7667). The lesson is the same.
    const { tr, te } = points(["sepal length (cm)", "sepal width (cm)"]);
    expect(knnAccuracy(tr, tr, 1)).toBeCloseTo(0.9333, 4);
    expect(knnAccuracy(tr, te, 1)).toBeCloseTo(0.7, 4);
    expect(knnAccuracy(tr, te, 25)).toBeCloseTo(0.9, 4);
    expect(knnAccuracy(tr, te, 5, "manhattan")).toBeCloseTo(0.7333, 4);
  });

  it("classifies every test flower correctly with the petal measurements", () => {
    const { tr, te } = points(["petal length (cm)", "petal width (cm)"]);
    for (const k of [1, 5, 25]) expect(knnAccuracy(tr, te, k)).toBe(1);
  });

  it("reports the neighbours and their votes", () => {
    const { tr } = points(["petal length (cm)", "petal width (cm)"]);
    const result = knnClassify(tr, 4.9, 1.6, 5);
    // The same distances as scikit-learn's kneighbors: 0.1, 0.1, 0.1414, 0.1414, 0.2 (the fifth is a tie).
    expect(result.neighbors.map((n) => n.distance)).toEqual([
      0.1, 0.1, 0.141421356, 0.141421356, 0.2,
    ]);
    expect(result.neighbors.slice(0, 4).map((n) => n.point.cls)).toEqual([
      1, 1, 1, 2,
    ]);
    expect(result.cls).toBe(1);
  });

  it("breaks a tied vote towards the smaller class number", () => {
    const tr = [
      { x: 0, y: 0, cls: 2 },
      { x: 1, y: 0, cls: 1 },
    ];
    expect(knnClassify(tr, 0.5, 0, 2).cls).toBe(1);
  });
});
