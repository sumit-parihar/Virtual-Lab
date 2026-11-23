import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import { splitRows } from "./labMath.js";
import { fitGaussianNB, posterior, predictNB } from "./naiveBayes.js";

// Reference values: scikit-learn GaussianNB() on the same file and the Code Exercise's split.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(readFileSync(`${dir}/wine.csv`, "utf8"));
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/wine_split.json`, "utf8"),
);
const { train, test } = splitRows(data.length, testRows);
const target = header.indexOf("target");

function fit(cols) {
  const idx = cols.map((c) => header.indexOf(c));
  const X = (rowsIdx) => rowsIdx.map((i) => idx.map((j) => data[i][j]));
  const model = fitGaussianNB(
    X(train),
    train.map((i) => data[i][target]),
  );
  const testX = X(test);
  const right = test.filter(
    (i, k) => predictNB(model, testX[k]) === data[i][target],
  ).length;
  return { model, accuracy: right / test.length };
}

describe("Gaussian Naive Bayes lab maths", () => {
  it("learns priors, means and variances like scikit-learn", () => {
    const { model } = fit(["alcohol"]);
    expect(model.priors.map((p) => Number(p.toFixed(4)))).toEqual([
      0.3169, 0.4014, 0.2817,
    ]);
    expect(model.means.map((m) => Number(m[0].toFixed(4)))).toEqual([
      13.7262, 12.2854, 13.127,
    ]);
    expect(model.vars[0][0]).toBeCloseTo(0.25073, 5);
  });

  it("gives the same posteriors as predict_proba", () => {
    const one = fit(["alcohol"]).model;
    const at13 = posterior(one, [13.0]).map((r) => r.posterior);
    [0.214, 0.3071, 0.4788].forEach((v, i) =>
      expect(at13[i]).toBeCloseTo(v, 4),
    );
    const two = fit(["alcohol", "flavanoids"]).model;
    const low = posterior(two, [13.0, 0.8]).map((r) => r.posterior);
    [0, 0.0488, 0.9512].forEach((v, i) => expect(low[i]).toBeCloseTo(v, 4));
  });

  it("matches scikit-learn's test accuracy for one, two and all features", () => {
    expect(fit(["alcohol"]).accuracy).toBeCloseTo(0.8056, 4);
    expect(fit(["flavanoids"]).accuracy).toBeCloseTo(0.8333, 4);
    expect(fit(["alcohol", "flavanoids"]).accuracy).toBeCloseTo(0.9167, 4);
    expect(fit(["proline", "flavanoids"]).accuracy).toBeCloseTo(0.9444, 4);
    expect(fit(header.slice(0, -1)).accuracy).toBe(1);
  });

  it("computes the prior × likelihood products whose shares are the posteriors", () => {
    const rowsAt = posterior(fit(["alcohol"]).model, [12.0]);
    const total = rowsAt.reduce((s, r) => s + r.joint, 0);
    rowsAt.forEach((r) => {
      expect(r.joint).toBeCloseTo(r.prior * r.likelihoods[0], 10);
      expect(r.posterior).toBeCloseTo(r.joint / total, 10);
    });
  });
});
