import { useMemo, useState } from "react";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useLabData from "./useLabData.js";
import {
  leastSquares,
  predictLinear,
  regressionMetrics,
  splitRows,
} from "./labMath.js";

/**
 * Guided Lab for Multiple Linear Regression (Experiment 2).
 *
 * The student ticks which features the model may use. The least-squares model ŷ = b0 + b1·x1 + … is refitted
 * at once on the training rows (the Code Exercise's split), and the lab shows the equation, a bar per
 * coefficient, predicted vs actual for the test rows, and training vs test R², MAE and RMSE.
 *
 * config: kind "multiple-regression", dataset_url, split_url, target_column, target_label,
 *   features: [{ name, label }], start_features: [names], axis_max, steps
 */
const two = (v) => v.toFixed(2);

function CoefficientBars({ names, coef }) {
  const width = 520;
  const rowH = 28;
  const labelW = 70;
  const height = names.length * rowH + 10;
  const mid = labelW + (width - labelW) / 2;
  const half = (width - labelW) / 2 - 70;
  const max = Math.max(...coef.map(Math.abs), 1e-9);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="lab-bars"
      role="img"
      aria-label="Coefficient of each feature"
    >
      <line className="lab-bars__zero" x1={mid} x2={mid} y1={0} y2={height} />
      {names.map((name, i) => {
        const len = (Math.abs(coef[i]) / max) * half;
        const positive = coef[i] >= 0;
        const y = 6 + i * rowH;
        return (
          <g key={name}>
            <text className="lab-bars__label" x={0} y={y + 16}>
              {name}
            </text>
            <rect
              className={
                positive ? "lab-bars__bar--positive" : "lab-bars__bar--negative"
              }
              x={positive ? mid : mid - len}
              y={y + 3}
              width={Math.max(len, 1)}
              height={rowH - 10}
              rx={3}
            />
            <text
              className="lab-bars__value"
              x={positive ? mid + len + 6 : mid - len - 6}
              y={y + 16}
              textAnchor={positive ? "start" : "end"}
            >
              {two(coef[i])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function MultipleRegressionLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const [selected, setSelected] = useState(config.start_features);

  const result = useMemo(() => {
    if (!data) return null;
    const names = config.features
      .map((f) => f.name)
      .filter((n) => selected.includes(n));
    const cols = names.map((n) => data.header.indexOf(n));
    const yCol = data.header.indexOf(config.target_column);
    const { train, test } = splitRows(data.rows.length, data.testRows);
    const X = (idx) => idx.map((i) => cols.map((c) => data.rows[i][c]));
    const y = (idx) => idx.map((i) => data.rows[i][yCol]);
    const model = leastSquares(X(train), y(train));
    const predict = (idx) => X(idx).map((x) => predictLinear(model, x));
    const testPred = predict(test);
    return {
      names,
      model,
      trainMetrics: regressionMetrics(y(train), predict(train)),
      testMetrics: regressionMetrics(y(test), testPred),
      testPoints: y(test).map((actual, k) => ({
        actual,
        predicted: testPred[k],
      })),
      trainCount: train.length,
      testCount: test.length,
    };
  }, [data, selected, config.features, config.target_column]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!result) return <p className="lab__note">Loading the dataset…</p>;

  const toggle = (name) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  const max = config.axis_max;
  const { model, names, trainMetrics, testMetrics } = result;

  return (
    <div className="lab">
      <div className="lab__layout">
        <div className="lab__left">
          <figure className="lab__card">
            <h4 className="lab__card-title">
              {config.target_label}: predicted vs actual ({result.testCount}{" "}
              test patients)
            </h4>
            <PlotFrame
              id="mlr-plot"
              xDomain={[0, max]}
              yDomain={[0, max]}
              xLabel="Actual (y)"
              yLabel="Predicted (ŷ)"
              ariaLabel="Predicted against actual values for the test patients"
            >
              {(s) => (
                <>
                  <line
                    className="lab-plot__diagonal"
                    x1={s.x(0)}
                    y1={s.y(0)}
                    x2={s.x(max)}
                    y2={s.y(max)}
                  />
                  {result.testPoints.map((p, i) => (
                    <circle
                      key={i}
                      className="lab-plot__point"
                      cx={s.x(p.actual)}
                      cy={s.y(p.predicted)}
                      r={4.5}
                    />
                  ))}
                </>
              )}
            </PlotFrame>
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              Each dot is one test patient. Dots on the dashed line are
              predicted perfectly; the further a dot is from it, the bigger the
              error.
            </p>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Coefficients (one per ticked feature)
            </h4>
            <CoefficientBars names={names} coef={model.coef} />
          </figure>
        </div>

        <div className="lab__panel">
          <h4 className="lab__heading">Features used by the model</h4>
          <div className="lab__checks">
            {config.features.map((f) => {
              const on = selected.includes(f.name);
              return (
                <label key={f.name} className="lab__check">
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={on && selected.length === 1}
                    onChange={() => toggle(f.name)}
                  />
                  <span>
                    <code>{f.name}</code>
                    <small>{f.label}</small>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="lab__buttons">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSelected(config.start_features)}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSelected(config.features.map((f) => f.name))}
            >
              Use all {config.features.length}
            </button>
          </div>

          <p className="lab__equation">
            ŷ = {two(model.intercept)}
            {names.map((n, j) => (
              <span key={n}>
                {model.coef[j] < 0 ? " − " : " + "}
                {two(Math.abs(model.coef[j]))}·{n}
              </span>
            ))}
          </p>

          <table className="lab__metrics">
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Training ({result.trainCount})</th>
                <th scope="col">Test ({result.testCount})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">R²</th>
                <td>{trainMetrics.r2.toFixed(3)}</td>
                <td>{testMetrics.r2.toFixed(3)}</td>
              </tr>
              <tr>
                <th scope="row">MAE</th>
                <td>{trainMetrics.mae.toFixed(1)}</td>
                <td>{testMetrics.mae.toFixed(1)}</td>
              </tr>
              <tr>
                <th scope="row">RMSE</th>
                <td>{trainMetrics.rmse.toFixed(1)}</td>
                <td>{testMetrics.rmse.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
          <p className="lab__note">
            The model is trained on the training rows only. The test rows are
            the same ones the Code Exercise uses (test_size=0.2,
            random_state=42).
          </p>
        </div>
      </div>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
