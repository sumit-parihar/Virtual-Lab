import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import {
  leastSquares,
  predictLinear,
  regressionMetrics,
  solveLinearSystem,
  splitRows,
} from "./labMath.js";

// Reference values: scikit-learn LinearRegression on the same files and the Code Exercise's split.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(readFileSync(`${dir}/diabetes.csv`, "utf8"));
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/diabetes_split.json`, "utf8"),
);
const { train, test } = splitRows(data.length, testRows);
const y = (idx) => idx.map((i) => data[i][header.length - 1]);
const X = (idx, cols) =>
  idx.map((i) => cols.map((c) => data[i][header.indexOf(c)]));

function fitAndScore(cols) {
  const model = leastSquares(X(train, cols), y(train));
  const score = (idx) =>
    regressionMetrics(
      y(idx),
      X(idx, cols).map((x) => predictLinear(model, x)),
    );
  return { model, trainMetrics: score(train), testMetrics: score(test) };
}

describe("guided lab shared maths", () => {
  it("splits rows like the Code Exercise (442 patients, 89 in the test set)", () => {
    expect(data).toHaveLength(442);
    expect(test).toHaveLength(89);
    expect(train).toHaveLength(353);
    expect(new Set([...train, ...test]).size).toBe(442);
  });

  it("solves a small linear system", () => {
    expect(
      solveLinearSystem(
        [
          [2, 1],
          [1, 3],
        ],
        [3, 5],
      ),
    ).toEqual([0.8, 1.4]);
  });

  it("fits bmi alone like scikit-learn", () => {
    const { model, trainMetrics, testMetrics } = fitAndScore(["bmi"]);
    expect(model.intercept).toBeCloseTo(152.0034, 3);
    expect(model.coef[0]).toBeCloseTo(998.5777, 3);
    expect(trainMetrics.r2).toBeCloseTo(0.365724, 5);
    expect(testMetrics.r2).toBeCloseTo(0.23335, 5);
    expect(testMetrics.mae).toBeCloseTo(52.26, 3);
    expect(testMetrics.rmse).toBeCloseTo(63.7325, 3);
  });

  it("fits all ten features like scikit-learn (training R² rises, test R² hardly moves)", () => {
    const all = header.slice(0, -1);
    const { model, trainMetrics, testMetrics } = fitAndScore(all);
    expect(model.intercept).toBeCloseTo(151.3456, 3);
    expect(model.coef[0]).toBeCloseTo(37.904, 2);
    expect(model.coef[1]).toBeCloseTo(-241.9644, 2);
    expect(model.coef[2]).toBeCloseTo(542.4288, 2);
    expect(trainMetrics.r2).toBeCloseTo(0.527919, 5);
    expect(testMetrics.r2).toBeCloseTo(0.452603, 5);
    expect(testMetrics.mae).toBeCloseTo(42.7941, 3);
    expect(fitAndScore(["bmi", "s5"]).testMetrics.r2).toBeCloseTo(0.452293, 5);
  });

  it("shows overlapping features changing each other's coefficients", () => {
    expect(fitAndScore(["s1"]).model.coef[0]).toBeCloseTo(325.9761, 3);
    const both = fitAndScore(["s1", "s2"]).model.coef;
    expect(both[0]).toBeCloseTo(487.6963, 3);
    expect(both[1]).toBeCloseTo(-182.0803, 3);
  });
});
