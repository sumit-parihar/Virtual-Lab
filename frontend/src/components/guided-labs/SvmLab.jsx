import { useMemo, useState } from "react";
import ClassifierPlot, { ClassLegend } from "./ClassifierPlot.jsx";
import GuidedSteps from "./GuidedSteps.jsx";
import useFeaturePair from "./useFeaturePair.js";
import useLabData from "./useLabData.js";
import { fitScaler } from "./classifyMath.js";
import { decision, fitSVM, supportVectorIndices } from "./svm.js";

/**
 * Guided Lab for Support Vector Machines (Experiment 8).
 *
 * Two classes and two features at a time (presets). The student chooses the kernel, C and gamma, and whether the
 * features are scaled. The plot shows the decision boundary (solid), the edges of the margin (dashed) and the
 * support vectors (circled); the panel shows their number and the training and test accuracy.
 *
 * config: kind "svm", dataset_url, split_url, target_column, classes [{ value, label }] (exactly two),
 *   feature_pairs [{ label, x, y }], c_values [...], gamma_values [...], start { kernel, c, gamma }, steps
 */
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const CELLS = 70;
const ROWS = 56;

function Contours({ s, domain, f }) {
  // Short segments on cell edges where the decision value crosses 0 (boundary) or ±1 (margin edges).
  const [x0, x1] = domain.x;
  const [y0, y1] = domain.y;
  const vx = (c) => x0 + ((c + 0.5) / CELLS) * (x1 - x0);
  const vy = (r) => y0 + ((r + 0.5) / ROWS) * (y1 - y0);
  const grid = [];
  for (let r = 0; r < ROWS; r += 1) {
    const row = [];
    for (let c = 0; c < CELLS; c += 1) row.push(f(vx(c), vy(r)));
    grid.push(row);
  }
  const cw = (s.right - s.left) / CELLS;
  const ch = (s.bottom - s.top) / ROWS;
  const segments = { 0: [], 1: [] };
  const crosses = (a, b, level) => (a - level) * (b - level) < 0;
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < CELLS; c += 1) {
      const v = grid[r][c];
      const xEdge = s.left + (c + 1) * cw;
      const yTop = s.bottom - (r + 1) * ch;
      for (const [level, key] of [
        [0, 0],
        [1, 1],
        [-1, 1],
      ]) {
        if (c + 1 < CELLS && crosses(v, grid[r][c + 1], level)) {
          segments[key].push(`M${xEdge},${yTop}v${ch}`);
        }
        if (r + 1 < ROWS && crosses(v, grid[r + 1][c], level)) {
          segments[key].push(`M${s.left + c * cw},${yTop}h${cw}`);
        }
      }
    }
  }
  return (
    <g pointerEvents="none">
      <path
        d={segments[1].join("")}
        stroke="var(--color-text)"
        strokeWidth={1.6}
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d={segments[0].join("")}
        stroke="var(--color-text)"
        strokeWidth={3}
        fill="none"
      />
    </g>
  );
}

function LogSlider({ id, label, values, index, onChange, disabled }) {
  return (
    <div
      className="lab-slider"
      style={disabled ? { opacity: 0.45 } : undefined}
    >
      <label htmlFor={id} className="lab-slider__label">
        <span>{label}</span>
        <span className="lab-slider__value">
          {disabled ? "—" : values[index]}
        </span>
      </label>
      <input
        id={id}
        type="range"
        className="lab-slider__input"
        min={0}
        max={values.length - 1}
        step={1}
        value={index}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function SvmLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const [pairIndex, setPairIndex] = useState(0);
  const [kernel, setKernel] = useState(config.start.kernel);
  const [cIndex, setCIndex] = useState(config.c_values.indexOf(config.start.c));
  const [gIndex, setGIndex] = useState(
    config.gamma_values.indexOf(config.start.gamma),
  );
  const [scaled, setScaled] = useState(true);
  const pairCfg = config.feature_pairs[pairIndex];
  const pair = useMemo(() => [pairCfg.x, pairCfg.y], [pairCfg]);
  const allPoints = useFeaturePair(data, pair, config.target_column);
  const [negClass, posClass] = config.classes.map((c) => c.value);

  const points = useMemo(() => {
    if (!allPoints) return null;
    const keep = (p) => p.cls === negClass || p.cls === posClass;
    const train = allPoints.train.filter(keep);
    const test = allPoints.test.filter(keep);
    const xs = [...train, ...test].map((p) => p.x);
    const ys = [...train, ...test].map((p) => p.y);
    const pad = (lo, hi) => [lo - (hi - lo) * 0.06, hi + (hi - lo) * 0.06];
    return {
      train,
      test,
      domain: {
        x: pad(Math.min(...xs), Math.max(...xs)),
        y: pad(Math.min(...ys), Math.max(...ys)),
      },
    };
  }, [allPoints, negClass, posClass]);

  const C = config.c_values[cIndex];
  const gamma = config.gamma_values[gIndex];
  const fitted = useMemo(() => {
    if (!points) return null;
    const scaler = fitScaler(points.train.map((p) => [p.x, p.y]));
    const prep = scaled ? scaler.transform : (row) => row;
    const model = fitSVM(
      points.train.map((p) => prep([p.x, p.y])),
      points.train.map((p) => (p.cls === posClass ? 1 : -1)),
      { kernel, C, gamma },
    );
    const f = (x, y) => decision(model, prep([x, y]));
    const acc = (list) =>
      list.filter((p) => (f(p.x, p.y) > 0 ? posClass : negClass) === p.cls)
        .length / list.length;
    return {
      f,
      sv: supportVectorIndices(model),
      trainAcc: acc(points.train),
      testAcc: acc(points.test),
    };
  }, [points, scaled, kernel, C, gamma, posClass, negClass]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!points || !fitted)
    return <p className="lab__note">Loading the dataset…</p>;

  const predict = (x, y) => (fitted.f(x, y) > 0 ? posClass : negClass);

  return (
    <div className="lab">
      <div className="lab__layout">
        <div className="lab__left">
          <figure className="lab__card">
            <ClassifierPlot
              id="svm-plot"
              domain={points.domain}
              xLabel={pairCfg.x}
              yLabel={pairCfg.y}
              classes={config.classes}
              train={points.train}
              test={points.test}
              predict={predict}
              cells={CELLS}
            >
              {(s) => (
                <>
                  <Contours s={s} domain={points.domain} f={fitted.f} />
                  {fitted.sv.map((i) => (
                    <circle
                      key={i}
                      cx={s.x(points.train[i].x)}
                      cy={s.y(points.train[i].y)}
                      r={7.5}
                      fill="none"
                      stroke="var(--color-text)"
                      strokeWidth={1.6}
                      pointerEvents="none"
                    />
                  ))}
                </>
              )}
            </ClassifierPlot>
            <ClassLegend classes={config.classes} />
            <div className="lab__legend">
              <span>
                <i className="lab-key lab-key--line" /> decision boundary
              </span>
              <span>
                <i
                  className="lab-key lab-key--line"
                  style={{ borderTopStyle: "dashed", borderTopWidth: 2 }}
                />{" "}
                edges of the margin
              </span>
              <span>
                <i
                  className="lab-key lab-key--ring"
                  style={{ borderColor: "var(--color-text)" }}
                />{" "}
                support vector
              </span>
            </div>
          </figure>
        </div>

        <div className="lab__panel">
          <label className="lab__field">
            Features (x and y)
            <select
              className="lab__select"
              value={pairIndex}
              onChange={(e) => setPairIndex(Number(e.target.value))}
            >
              {config.feature_pairs.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="lab__check">
            <input
              type="checkbox"
              checked={scaled}
              onChange={(e) => setScaled(e.target.checked)}
            />
            <span>
              Scale the features (mean 0, spread 1, learned from the training
              wines)
            </span>
          </label>

          <label className="lab__field">
            Kernel
            <select
              className="lab__select"
              value={kernel}
              onChange={(e) => setKernel(e.target.value)}
            >
              <option value="linear">linear (straight boundary)</option>
              <option value="rbf">RBF (curved boundary)</option>
            </select>
          </label>

          <LogSlider
            id="svm-c"
            label="C (cost of margin violations)"
            values={config.c_values}
            index={cIndex}
            onChange={setCIndex}
          />
          <LogSlider
            id="svm-gamma"
            label="gamma (reach of each point, RBF only)"
            values={config.gamma_values}
            index={gIndex}
            onChange={setGIndex}
            disabled={kernel !== "rbf"}
          />

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">Support vectors</th>
                <td>
                  {fitted.sv.length} of {points.train.length}
                </td>
              </tr>
              <tr>
                <th scope="row">Training accuracy</th>
                <td>{pct(fitted.trainAcc)}</td>
              </tr>
              <tr>
                <th scope="row">Test accuracy</th>
                <td>{pct(fitted.testAcc)}</td>
              </tr>
            </tbody>
          </table>
          <p className="lab__note">
            {points.train.length} training and {points.test.length} test wines
            from the two growers (the Code Exercise's split).
          </p>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setKernel(config.start.kernel);
              setCIndex(config.c_values.indexOf(config.start.c));
              setGIndex(config.gamma_values.indexOf(config.start.gamma));
              setScaled(true);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
