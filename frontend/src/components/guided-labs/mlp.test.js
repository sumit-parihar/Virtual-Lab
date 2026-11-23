import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import { fitScaler } from "./classifyMath.js";
import { splitRows } from "./labMath.js";
import {
  accuracyOf,
  createNetwork,
  neuron,
  parameterCount,
  trainEpoch,
} from "./mlp.js";

// For reference, scikit-learn MLPClassifier on the same split: 1 hidden neuron 0.29, 2 → 0.57, 4 → 0.89,
// 8 → 0.94, 16 or more → 0.98 test accuracy (the Code Exercise's answer with 64 neurons is 0.98).
const dir = resolve(__dirname, "../../../public/datasets");
const { rows } = parseCsv(readFileSync(`${dir}/digits.csv`, "utf8"));
const data = rows.map((r) => r.map(Number));
const { test_rows: testRows } = JSON.parse(
  readFileSync(`${dir}/digits_split.json`, "utf8"),
);
const { train, test } = splitRows(data.length, testRows);
const raw = (idx) => idx.map((i) => data[i].slice(0, 64));
const labels = (idx) => idx.map((i) => data[i][64]);
const scaler = fitScaler(raw(train));
const Xtr = raw(train).map(scaler.transform);
const Xte = raw(test).map(scaler.transform);
const ytr = labels(train);
const yte = labels(test);

function trained(hidden, epochs, learningRate = 0.01, seed = 1) {
  const net = createNetwork(64, hidden, 10, seed);
  const losses = [];
  for (let e = 0; e < epochs; e += 1)
    losses.push(trainEpoch(net, Xtr, ytr, { learningRate }));
  return { net, losses };
}

describe("neural network lab maths", () => {
  it("computes one neuron like the theory example", () => {
    const { z, output } = neuron([2, 3], [0.5, -1], 1, "relu");
    expect(z).toBe(-1);
    expect(output).toBe(0);
    expect(neuron([2, 3], [0.5, -1], 1, "sigmoid").output).toBeCloseTo(
      0.2689,
      4,
    );
  });

  it("counts parameters like the theory example and the Code Exercise network", () => {
    expect(parameterCount(4, 3, 2)).toBe(23);
    expect(parameterCount(64, 64, 10)).toBe(4810);
  });

  it("uses the Code Exercise's 1437 training and 360 test images", () => {
    expect([Xtr.length, Xte.length]).toEqual([1437, 360]);
  });

  it("learns the digits: the loss falls and a 16-neuron network reaches scikit-learn's level", () => {
    const { net, losses } = trained(16, 20);
    expect(losses[losses.length - 1]).toBeLessThan(losses[0] / 5);
    expect(accuracyOf(net, Xte, yte)).toBeGreaterThan(0.95);
  });

  it("cannot learn ten digits with a single hidden neuron (too little capacity)", () => {
    const { net } = trained(1, 20);
    expect(accuracyOf(net, Xte, yte)).toBeLessThan(0.5);
  });

  it("is repeatable with the same seed and different with another", () => {
    const a = trained(8, 2, 0.01, 3).losses;
    const b = trained(8, 2, 0.01, 3).losses;
    const c = trained(8, 2, 0.01, 4).losses;
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});
