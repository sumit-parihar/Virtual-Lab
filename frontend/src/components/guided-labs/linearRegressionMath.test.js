import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  leastSquaresFit,
  lineMetrics,
  parseCsvPoints,
  predict,
} from "./linearRegressionMath.js";

// Reference values computed in Python from the same Salary_dataset.csv (least squares on all 30 rows).
const csv = readFileSync(
  resolve(__dirname, "../../../public/datasets/Salary_dataset.csv"),
  "utf8",
);
const points = parseCsvPoints(csv, "YearsExperience", "Salary");

describe("linear regression guided lab maths", () => {
  it("reads the 30 rows of the salary dataset", () => {
    expect(points).toHaveLength(30);
    expect(points[0]).toEqual({ x: 1.2, y: 39344 });
  });

  it("rejects a file without the expected columns", () => {
    expect(() =>
      parseCsvPoints("a,b\n1,2", "YearsExperience", "Salary"),
    ).toThrow();
  });

  it("predicts with ŷ = mx + c (the theory example)", () => {
    expect(predict(5000, 20000, 3)).toBe(35000);
  });

  it("finds the least-squares line", () => {
    const { m, c } = leastSquaresFit(points);
    expect(m).toBeCloseTo(9449.9623, 3);
    expect(c).toBeCloseTo(24848.204, 3);
  });

  it("computes MAE, MSE and R² of the best line", () => {
    const { m, c } = leastSquaresFit(points);
    const { mae, mse, r2 } = lineMetrics(points, m, c);
    expect(mae).toBeCloseTo(4644.2013, 3);
    expect(mse).toBeCloseTo(31270951.7223, 2);
    expect(r2).toBeCloseTo(0.956957, 5);
  });

  it("gives a negative R² for a line worse than always predicting the average", () => {
    const { mae, r2 } = lineMetrics(points, 5000, 20000);
    expect(mae).toBeCloseTo(28937.3333, 3);
    expect(r2).toBeCloseTo(-0.407852, 5);
  });

  it("is pulled towards an outlier", () => {
    const { m, c } = leastSquaresFit([...points, { x: 2, y: 140000 }]);
    expect(m).toBeCloseTo(8151.3384, 3);
    expect(c).toBeCloseTo(34839.9987, 3);
  });
});
