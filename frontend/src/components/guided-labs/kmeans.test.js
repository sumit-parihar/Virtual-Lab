import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../../utils/csv.js";
import { assign, bestKMeans, inertia, runKMeans, update } from "./kmeans.js";

// Reference values: scikit-learn KMeans(n_init=10, random_state=42) and the Code Exercise's stored answer.
const dir = resolve(__dirname, "../../../public/datasets");
const { header, rows } = parseCsv(readFileSync(`${dir}/iris.csv`, "utf8"));
const data = rows.map((r) => r.map(Number));
const columns = (names) =>
  data.map((r) => names.map((n) => r[header.indexOf(n)]));
const PETAL = columns(["petal length (cm)", "petal width (cm)"]);
const ALL4 = columns(header.slice(0, 4));
const sizes = (labels, k) =>
  Array.from(
    { length: k },
    (_, c) => labels.filter((l) => l === c).length,
  ).sort((a, b) => a - b);

describe("K-Means lab maths", () => {
  it("moves a centroid to the mean of its points (the theory example)", () => {
    const pts = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    expect(update(pts, [0, 0, 0], [[0, 0]])).toEqual([[3, 4]]);
    expect(
      assign(
        [
          [0, 0],
          [10, 10],
        ],
        [
          [1, 1],
          [9, 9],
        ],
      ),
    ).toEqual([0, 1]);
    expect(
      inertia(
        [
          [0, 0],
          [2, 0],
        ],
        [0, 0],
        [[1, 0]],
      ),
    ).toBe(2);
  });

  it("reproduces the Code Exercise's answer on all four measurements", () => {
    const best = bestKMeans(ALL4, 3);
    expect(sizes(best.labels, 3)).toEqual([38, 50, 62]);
    expect(Number(best.inertia.toFixed(2))).toBe(78.85);
  });

  it("matches scikit-learn's inertia on the petals for k = 1 to 5 (the elbow is at 3)", () => {
    const expected = [550.8953, 86.3902, 31.3714, 19.466, 13.9169];
    expected.forEach((value, i) =>
      expect(bestKMeans(PETAL, i + 1).inertia).toBeCloseTo(value, 3),
    );
    expect(sizes(bestKMeans(PETAL, 3).labels, 3)).toEqual([48, 50, 52]);
  });

  it("stops when the assignments no longer change, and the result depends on the start", () => {
    const run = runKMeans(PETAL, 3, 1);
    expect(run.iterations).toBeGreaterThan(1);
    expect(assign(PETAL, run.centroids)).toEqual(run.labels);
    const inertias = new Set(
      Array.from({ length: 20 }, (_, s) =>
        runKMeans(PETAL, 4, s + 1).inertia.toFixed(3),
      ),
    );
    expect(inertias.size).toBeGreaterThan(1); // different starts can settle in different places
  });
});
