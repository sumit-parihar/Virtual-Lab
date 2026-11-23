import { useEffect, useMemo, useState } from "react";
import GuidedSteps from "./GuidedSteps.jsx";
import {
  leastSquaresFit,
  lineMetrics,
  parseCsvPoints,
  predict,
} from "./linearRegressionMath.js";

/**
 * Guided Lab for Simple Linear Regression (Experiment 1).
 *
 * The student moves the slope (m) and intercept (c) sliders and the line ŷ = mx + c, its residuals
 * and its MAE / MSE / R² update immediately. They can overlay the least-squares line, add one outlier
 * and predict for a chosen x. The dataset is a fixed file served by the app; nothing is saved and the
 * student can only change the controls. Everything is computed in the browser.
 *
 * config (lab_config from the experiment):
 *   kind: "linear-regression", dataset_url, x_column, y_column, x_label, y_label, x_max, y_max,
 *   slope / intercept / predict_x: { min, max, step, start }, outlier: { x, y }, steps: [{ task, explanation }]
 */

const W = 520;
const H = 420;
const PAD = { left: 60, right: 14, top: 14, bottom: 50 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const whole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function ticks(max, count = 5) {
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10]
    .map((f) => f * magnitude)
    .find((s) => s >= raw);
  const out = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

function LabSlider({
  id,
  label,
  value,
  range,
  onChange,
  format = whole.format,
}) {
  return (
    <div className="lab-slider">
      <label htmlFor={id} className="lab-slider__label">
        <span>{label}</span>
        <span className="lab-slider__value">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lab-slider__input"
      />
    </div>
  );
}

export default function LinearRegressionLab({ config }) {
  const [points, setPoints] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [m, setM] = useState(config.slope.start);
  const [c, setC] = useState(config.intercept.start);
  const [x0, setX0] = useState(config.predict_x.start);
  const [showResiduals, setShowResiduals] = useState(false);
  const [showBestFit, setShowBestFit] = useState(false);
  const [withOutlier, setWithOutlier] = useState(false);

  useEffect(() => {
    let current = true;
    fetch(config.dataset_url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((text) => {
        if (current)
          setPoints(parseCsvPoints(text, config.x_column, config.y_column));
      })
      .catch(() => {
        if (current)
          setLoadError(
            "Could not load the dataset for this lab. Please check your connection and reload the page.",
          );
      });
    return () => {
      current = false;
    };
  }, [config.dataset_url, config.x_column, config.y_column]);

  const data = useMemo(() => {
    if (!points) return [];
    return withOutlier && config.outlier
      ? [...points, { ...config.outlier, outlier: true }]
      : points;
  }, [points, withOutlier, config.outlier]);

  const best = useMemo(
    () => (data.length > 1 ? leastSquaresFit(data) : null),
    [data],
  );
  const yours = useMemo(
    () => (data.length > 1 ? lineMetrics(data, m, c) : null),
    [data, m, c],
  );
  const bestMetrics = useMemo(
    () => (best ? lineMetrics(data, best.m, best.c) : null),
    [data, best],
  );

  if (loadError) return <div className="alert alert--error">{loadError}</div>;
  if (!points) return <p className="lab-loading">Loading the dataset…</p>;

  const { x_max: xMax, y_max: yMax } = config;
  const sx = (x) => PAD.left + (x / xMax) * PLOT_W;
  const sy = (y) => PAD.top + PLOT_H - (y / yMax) * PLOT_H;
  const dataMinX = Math.min(...points.map((p) => p.x));
  const dataMaxX = Math.max(...points.map((p) => p.x));
  const yHat = predict(m, c, x0);
  const extrapolating = x0 < dataMinX || x0 > dataMaxX;

  function reset() {
    setM(config.slope.start);
    setC(config.intercept.start);
    setX0(config.predict_x.start);
    setShowResiduals(false);
    setShowBestFit(false);
    setWithOutlier(false);
  }

  return (
    <div className="lr-lab">
      <div className="lr-lab__layout">
        <div className="lr-lab__left">
          <figure className="lr-lab__figure">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="lr-lab__plot"
              role="img"
              aria-label={`Scatter plot of ${config.y_label} against ${config.x_label} with the line ŷ = ${whole.format(m)}x + ${whole.format(c)}`}
            >
              <defs>
                <clipPath id="lr-lab-clip">
                  <rect
                    x={PAD.left}
                    y={PAD.top}
                    width={PLOT_W}
                    height={PLOT_H}
                  />
                </clipPath>
              </defs>

              {/* Grid and axes */}
              {ticks(xMax, 8).map((t) => (
                <g key={`x${t}`}>
                  <line
                    className="lr-lab__grid"
                    x1={sx(t)}
                    x2={sx(t)}
                    y1={PAD.top}
                    y2={PAD.top + PLOT_H}
                  />
                  <text
                    className="lr-lab__tick"
                    x={sx(t)}
                    y={PAD.top + PLOT_H + 18}
                    textAnchor="middle"
                  >
                    {t}
                  </text>
                </g>
              ))}
              {ticks(yMax).map((t) => (
                <g key={`y${t}`}>
                  <line
                    className="lr-lab__grid"
                    x1={PAD.left}
                    x2={PAD.left + PLOT_W}
                    y1={sy(t)}
                    y2={sy(t)}
                  />
                  <text
                    className="lr-lab__tick"
                    x={PAD.left - 8}
                    y={sy(t) + 4}
                    textAnchor="end"
                  >
                    {compact.format(t)}
                  </text>
                </g>
              ))}
              <line
                className="lr-lab__axis"
                x1={PAD.left}
                x2={PAD.left + PLOT_W}
                y1={PAD.top + PLOT_H}
                y2={PAD.top + PLOT_H}
              />
              <line
                className="lr-lab__axis"
                x1={PAD.left}
                x2={PAD.left}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
              />
              <text
                className="lr-lab__axis-label"
                x={PAD.left + PLOT_W / 2}
                y={H - 8}
                textAnchor="middle"
              >
                {config.x_label} (x)
              </text>
              <text
                className="lr-lab__axis-label"
                transform={`translate(14 ${PAD.top + PLOT_H / 2}) rotate(-90)`}
                textAnchor="middle"
              >
                {config.y_label} (y)
              </text>

              <g clipPath="url(#lr-lab-clip)">
                {/* Residuals: vertical gap between each point and your line */}
                {showResiduals &&
                  data.map((p, i) => (
                    <line
                      key={`r${i}`}
                      className="lr-lab__residual"
                      x1={sx(p.x)}
                      x2={sx(p.x)}
                      y1={sy(p.y)}
                      y2={sy(predict(m, c, p.x))}
                    />
                  ))}

                {showBestFit && best && (
                  <line
                    className="lr-lab__best"
                    x1={sx(0)}
                    x2={sx(xMax)}
                    y1={sy(best.c)}
                    y2={sy(predict(best.m, best.c, xMax))}
                  />
                )}
                <line
                  className="lr-lab__line"
                  x1={sx(0)}
                  x2={sx(xMax)}
                  y1={sy(c)}
                  y2={sy(predict(m, c, xMax))}
                />

                {data.map((p, i) => (
                  <circle
                    key={`p${i}`}
                    className={
                      p.outlier
                        ? "lr-lab__point lr-lab__point--outlier"
                        : "lr-lab__point"
                    }
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={p.outlier ? 7 : 5}
                  />
                ))}

                {/* Prediction at the chosen x */}
                <line
                  className="lr-lab__guide"
                  x1={sx(x0)}
                  x2={sx(x0)}
                  y1={PAD.top + PLOT_H}
                  y2={sy(yHat)}
                />
                <line
                  className="lr-lab__guide"
                  x1={PAD.left}
                  x2={sx(x0)}
                  y1={sy(yHat)}
                  y2={sy(yHat)}
                />
                <circle
                  className="lr-lab__prediction"
                  cx={sx(x0)}
                  cy={sy(yHat)}
                  r={6}
                />
              </g>
            </svg>

            <figcaption className="lr-lab__legend">
              <span>
                <i className="lr-lab__key lr-lab__key--point" /> Data point
              </span>
              <span>
                <i className="lr-lab__key lr-lab__key--line" /> Your line
              </span>
              {showBestFit && (
                <span>
                  <i className="lr-lab__key lr-lab__key--best" /> Best-fit line
                </span>
              )}
              {showResiduals && (
                <span>
                  <i className="lr-lab__key lr-lab__key--residual" /> Residual
                </span>
              )}
              <span>
                <i className="lr-lab__key lr-lab__key--prediction" /> Prediction
              </span>
              {withOutlier && (
                <span>
                  <i className="lr-lab__key lr-lab__key--outlier" /> Outlier
                </span>
              )}
            </figcaption>
          </figure>

          <table className="lr-lab__metrics">
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Your line</th>
                {showBestFit && <th scope="col">Best fit</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">MAE</th>
                <td>{whole.format(yours.mae)}</td>
                {showBestFit && <td>{whole.format(bestMetrics.mae)}</td>}
              </tr>
              <tr>
                <th scope="row">MSE</th>
                <td>{whole.format(yours.mse)}</td>
                {showBestFit && <td>{whole.format(bestMetrics.mse)}</td>}
              </tr>
              <tr>
                <th scope="row">R²</th>
                <td className={yours.r2 < 0 ? "lr-lab__negative" : undefined}>
                  {yours.r2.toFixed(3)}
                </td>
                {showBestFit && <td>{bestMetrics.r2.toFixed(3)}</td>}
              </tr>
            </tbody>
          </table>
          {showBestFit && (
            <p className="lr-lab__note">
              Best fit: ŷ = {whole.format(best.m)}·x + {whole.format(best.c)}
            </p>
          )}
        </div>

        <div className="lr-lab__panel">
          <p className="lr-lab__equation">
            ŷ = <strong>{whole.format(m)}</strong>·x +{" "}
            <strong>{whole.format(c)}</strong>
          </p>

          <LabSlider
            id="lr-slope"
            label="Slope m"
            value={m}
            range={config.slope}
            onChange={setM}
          />
          <LabSlider
            id="lr-intercept"
            label="Intercept c"
            value={c}
            range={config.intercept}
            onChange={setC}
          />

          <div className="lr-lab__toggles">
            <label className="lr-lab__toggle">
              <input
                type="checkbox"
                checked={showResiduals}
                onChange={(e) => setShowResiduals(e.target.checked)}
              />
              Show residuals
            </label>
            <label className="lr-lab__toggle">
              <input
                type="checkbox"
                checked={showBestFit}
                onChange={(e) => setShowBestFit(e.target.checked)}
              />
              Show best-fit (least-squares) line
            </label>
            {config.outlier && (
              <label className="lr-lab__toggle">
                <input
                  type="checkbox"
                  checked={withOutlier}
                  onChange={(e) => setWithOutlier(e.target.checked)}
                />
                Add an outlier point
              </label>
            )}
          </div>

          <div className="lr-lab__predict">
            <LabSlider
              id="lr-predict"
              label={`Predict for x (${config.x_label.toLowerCase()})`}
              value={x0}
              range={config.predict_x}
              onChange={setX0}
              format={(v) => v.toFixed(1)}
            />
            <p className="lr-lab__note">
              ŷ = {whole.format(m)} × {x0.toFixed(1)} + {whole.format(c)} ={" "}
              <strong>{whole.format(yHat)}</strong>
            </p>
            {extrapolating && (
              <p className="lr-lab__warning">
                This x is outside the data ({dataMinX} to {dataMaxX}). This is
                extrapolation, so the prediction may be unreliable.
              </p>
            )}
          </div>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={reset}
          >
            Reset
          </button>
        </div>
      </div>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
