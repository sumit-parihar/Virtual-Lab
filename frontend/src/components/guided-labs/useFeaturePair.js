import { useMemo } from "react";
import { splitRows } from "./labMath.js";

/**
 * From the loaded dataset (useLabData) and a pair of feature column names, build the training and test points
 * of a classification lab: { train: [{x, y, cls}], test: [...], domain: {x:[min,max], y:[min,max]} }.
 * x and y are in the original units of the two features; cls is the class number of the target column.
 */
export default function useFeaturePair(data, pair, targetColumn = "target") {
  return useMemo(() => {
    if (!data) return null;
    const xi = data.header.indexOf(pair[0]);
    const yi = data.header.indexOf(pair[1]);
    const ti = data.header.indexOf(targetColumn);
    const point = (i) => ({
      x: data.rows[i][xi],
      y: data.rows[i][yi],
      cls: data.rows[i][ti],
      row: i,
    });
    const { train, test } = splitRows(data.rows.length, data.testRows);
    const all = data.rows;
    const range = (col) => {
      let lo = Infinity;
      let hi = -Infinity;
      for (const r of all) {
        lo = Math.min(lo, r[col]);
        hi = Math.max(hi, r[col]);
      }
      const pad = (hi - lo) * 0.06 || 1;
      return [lo - pad, hi + pad];
    };
    return {
      train: train.map(point),
      test: test.map(point),
      domain: { x: range(xi), y: range(yi) },
    };
  }, [data, pair, targetColumn]);
}
