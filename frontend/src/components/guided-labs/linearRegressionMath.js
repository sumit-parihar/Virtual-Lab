// Small, dependency-free helpers for the Simple Linear Regression guided lab.
// Everything here is a pure function so it can be unit-tested against reference values.
import { parseCsv } from "../../utils/csv.js";

/** Parse a numeric CSV (with a header row) into [{x, y}] using the two named columns. */
export function parseCsvPoints(text, xColumn, yColumn) {
  const { header, rows } = parseCsv(text);
  const xi = header.indexOf(xColumn);
  const yi = header.indexOf(yColumn);
  if (xi === -1 || yi === -1)
    throw new Error(`Columns ${xColumn} and ${yColumn} not found`);
  return rows
    .map((cells) => ({ x: Number(cells[xi]), y: Number(cells[yi]) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

/** ŷ = m·x + c */
export function predict(m, c, x) {
  return m * x + c;
}

/** Least-squares line: the slope and intercept with the smallest total squared residual. */
export function leastSquaresFit(points) {
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - meanX) * (p.y - meanY);
    sxx += (p.x - meanX) ** 2;
  }
  const m = sxy / sxx;
  return { m, c: meanY - m * meanX };
}

/** MAE, MSE and R² of the line ŷ = m·x + c on the points (residual = actual − predicted). */
export function lineMetrics(points, m, c) {
  const n = points.length;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let absSum = 0;
  let sqSum = 0;
  let totalSq = 0;
  for (const p of points) {
    const residual = p.y - predict(m, c, p.x);
    absSum += Math.abs(residual);
    sqSum += residual * residual;
    totalSq += (p.y - meanY) ** 2;
  }
  return { mae: absSum / n, mse: sqSum / n, r2: 1 - sqSum / totalSq };
}
