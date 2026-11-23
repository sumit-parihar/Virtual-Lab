import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import { fitScaler } from "./classifyMath.js";
import { splitRows } from "./labMath.js";
import { decision, fitSVM, supportVectorIndices } from "./svm.js";

// Reference values: scikit-learn SVC on growers 0 and 1 of the wine data, the Code Exercise's split.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(readFileSync(`${dir}/wine.csv`, "utf8"));
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/wine_split.json`, "utf8"),
);
const split = splitRows(data.length, testRows);
const target = header.indexOf("target");
const keep = (idx) =>
  idx.filter((i) => data[i][target] === 0 || data[i][target] === 1);
const train = keep(split.train);
const test = keep(split.test);

function run(pair, options, scaled = true) {
  const cols = pair.map((c) => header.indexOf(c));
  const raw = (idx) => idx.map((i) => cols.map((c) => data[i][c]));
  const y = (idx) => idx.map((i) => (data[i][target] === 1 ? 1 : -1));
  const scaler = fitScaler(raw(train));
  const prep = (rowsX) => (scaled ? rowsX.map(scaler.transform) : rowsX);
  const model = fitSVM(prep(raw(train)), y(train), options);
  const acc = (idx) => {
    const X = prep(raw(idx));
    const Y = y(idx);
    return (
      X.filter((x, k) => Math.sign(decision(model, x)) === Y[k]).length /
      X.length
    );
  };
  return {
    train: acc(train),
    test: acc(test),
    nSV: supportVectorIndices(model).length,
  };
}
const AP = ["alcohol", "proline"];
const FC = ["flavanoids", "color_intensity"];

describe("SVM lab maths", () => {
  it("uses the same 102 training and 28 test wines as the reference", () => {
    expect([train.length, test.length]).toEqual([102, 28]);
  });

  it("matches scikit-learn for linear kernels and different C", () => {
    expect(run(AP, { kernel: "linear", C: 1 })).toEqual({
      train: 0.9411764705882353,
      test: 1,
      nSV: 17,
    });
    expect(run(AP, { kernel: "linear", C: 0.01 }).nSV).toBe(72);
    expect(run(AP, { kernel: "linear", C: 0.01 }).train).toBeCloseTo(0.951, 3);
    expect(run(FC, { kernel: "linear", C: 1 })).toMatchObject({
      test: 0.8571428571428571,
      nSV: 34,
    });
  });

  it("matches scikit-learn for RBF kernels", () => {
    expect(run(AP, { kernel: "rbf", C: 1, gamma: 0.5 })).toEqual({
      train: 0.9705882352941176,
      test: 1,
      nSV: 22,
    });
    expect(run(FC, { kernel: "rbf", C: 1, gamma: 0.5 })).toMatchObject({
      train: 0.9411764705882353,
      nSV: 32,
    });
    expect(run(FC, { kernel: "rbf", C: 1, gamma: 0.5 }).test).toBeCloseTo(
      0.8929,
      4,
    );
    expect(run(FC, { kernel: "rbf", C: 100, gamma: 10 })).toMatchObject({
      train: 1,
      nSV: 65,
    });
  });

  it("shows what happens without scaling (proline dominates the distance)", () => {
    const r = run(AP, { kernel: "rbf", C: 1, gamma: 0.5 }, false);
    expect(r.train).toBe(1);
    expect(r.test).toBeCloseTo(0.7143, 4);
    expect(r.nSV).toBe(98);
  });
});
