import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import {
  binaryCounts,
  confusionMatrix,
  fitScaler,
  accuracy,
  seededRandom,
} from "./classifyMath.js";
import { splitRows } from "./labMath.js";
import { fitLogistic, logisticScore, sigmoid } from "./logistic.js";

// Reference values: scikit-learn StandardScaler + LogisticRegression() on the same file and split.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(
  readFileSync(`${dir}/breast_cancer.csv`, "utf8"),
);
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/breast_cancer_split.json`, "utf8"),
);
const { train, test } = splitRows(data.length, testRows);
const target = header.indexOf("target");

function run(pair) {
  const cols = pair.map((c) => header.indexOf(c));
  const X = (idx) => idx.map((i) => cols.map((c) => data[i][c]));
  const y = (idx) => idx.map((i) => data[i][target]);
  const scaler = fitScaler(X(train));
  const model = fitLogistic(X(train).map(scaler.transform), y(train));
  const probs = X(test).map((x) =>
    sigmoid(logisticScore(model, scaler.transform(x))),
  );
  const at = (t) =>
    binaryCounts(
      y(test),
      probs.map((p) => (p >= t ? 1 : 0)),
    );
  return { model, at };
}

describe("logistic regression lab maths", () => {
  it("fits mean radius + mean texture like scikit-learn", () => {
    const { model, at } = run(["mean radius", "mean texture"]);
    // scikit-learn run to full convergence (tol=1e-10) gives intercept 0.717037; its default tol=1e-4 stops
    // slightly early (0.716777). Newton's method here reaches the exact optimum.
    expect(model.intercept).toBeCloseTo(0.717037, 5);
    expect(model.coef[0]).toBeCloseTo(-3.105, 3);
    expect(model.coef[1]).toBeCloseTo(-0.8916, 3);
    expect(at(0.5)).toMatchObject({ tp: 67, fp: 7, fn: 4, tn: 36 });
    expect(at(0.5).accuracy).toBeCloseTo(0.9035, 4);
  });

  it("trades precision for recall as the threshold moves", () => {
    const { at } = run(["mean radius", "mean texture"]);
    expect(at(0.2)).toMatchObject({ tp: 71, fp: 12, fn: 0, tn: 31 });
    expect(at(0.2).recall).toBe(1);
    // One test sample has p = 0.8000 exactly at the optimum, so at 0.8 it counts as positive (TP 57).
    expect(at(0.8)).toMatchObject({ tp: 57, fp: 1, fn: 14, tn: 42 });
    expect(at(0.8).precision).toBeCloseTo(0.9828, 4);
    expect(at(0.8).recall).toBeCloseTo(0.8028, 4);
  });

  it("does much better or worse depending on the two features", () => {
    expect(
      run(["worst radius", "worst concave points"]).at(0.5).accuracy,
    ).toBeCloseTo(0.9649, 4);
    expect(
      run(["mean smoothness", "mean symmetry"]).at(0.5).accuracy,
    ).toBeCloseTo(0.6842, 4);
  });
});

describe("shared classification helpers", () => {
  it("scales like StandardScaler (mean 0, spread 1 on the training rows)", () => {
    const s = fitScaler([
      [1, 10],
      [3, 10],
      [5, 10],
    ]);
    expect(s.mean).toEqual([3, 10]);
    expect(s.transform([5, 10])[0]).toBeCloseTo(1.2247, 4);
    expect(s.transform([5, 10])[1]).toBe(0); // a constant column does not divide by zero
  });

  it("counts a confusion matrix and accuracy", () => {
    expect(confusionMatrix([0, 0, 1, 2], [0, 1, 1, 2], [0, 1, 2])).toEqual([
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    expect(accuracy([0, 1, 1, 0], [0, 1, 0, 0])).toBe(0.75);
  });

  it("gives the same random numbers for the same seed", () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
