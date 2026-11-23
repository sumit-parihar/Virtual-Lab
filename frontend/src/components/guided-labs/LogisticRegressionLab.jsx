import { useMemo, useState } from "react";
import ClassifierPlot, { ClassLegend, classColor } from "./ClassifierPlot.jsx";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useFeaturePair from "./useFeaturePair.js";
import useLabData from "./useLabData.js";
import { binaryCounts, fitScaler } from "./classifyMath.js";
import { fitLogistic, logisticScore, sigmoid } from "./logistic.js";

/**
 * Guided Lab for Logistic Regression (Experiment 3).
 *
 * Two features at a time (presets), scaled with the training rows only. The model computes z = b0 + b1·x1 + b2·x2,
 * turns it into p = sigmoid(z) and predicts class 1 when p ≥ threshold. The student moves the threshold and sees
 * the straight decision boundary move, the test confusion matrix, accuracy, precision and recall, and the sigmoid.
 *
 * config: kind "logistic-regression", dataset_url, split_url, target_column, positive_class,
 *   classes [{ value, label }], feature_pairs [{ label, x, y }], threshold { min, max, step, start }, steps
 */
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const fmt = (v) =>
  v < 0 ? `− ${Math.abs(v).toFixed(2)}` : `+ ${v.toFixed(2)}`;

export default function LogisticRegressionLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const [pairIndex, setPairIndex] = useState(0);
  const [threshold, setThreshold] = useState(config.threshold.start);
  const pairCfg = config.feature_pairs[pairIndex];
  const pair = useMemo(() => [pairCfg.x, pairCfg.y], [pairCfg]);
  const points = useFeaturePair(data, pair, config.target_column);
  const positive = config.positive_class;

  const fitted = useMemo(() => {
    if (!points) return null;
    const scaler = fitScaler(points.train.map((p) => [p.x, p.y]));
    const model = fitLogistic(
      points.train.map((p) => scaler.transform([p.x, p.y])),
      points.train.map((p) => (p.cls === positive ? 1 : 0)),
    );
    const z = (x, y) => logisticScore(model, scaler.transform([x, y]));
    return { scaler, model, z };
  }, [points, positive]);

  const predictAt = useMemo(() => {
    if (!fitted) return null;
    const other = config.classes.find((c) => c.value !== positive).value;
    return (x, y) => (sigmoid(fitted.z(x, y)) >= threshold ? positive : other);
  }, [fitted, threshold, positive, config.classes]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!points || !fitted)
    return <p className="lab__note">Loading the dataset…</p>;

  const testZ = points.test.map((p) => fitted.z(p.x, p.y));
  const counts = binaryCounts(
    points.test.map((p) => p.cls),
    points.test.map((p) => predictAt(p.x, p.y)),
    positive,
  );
  const logit = Math.log(threshold / (1 - threshold));
  const { model, scaler } = fitted;
  // Boundary p = threshold, i.e. z = logit(threshold), drawn in the original units of the two features.
  const boundaryY = (x) =>
    scaler.mean[1] +
    (scaler.std[1] *
      (logit -
        model.intercept -
        (model.coef[0] * (x - scaler.mean[0])) / scaler.std[0])) /
      model.coef[1];
  const posLabel = config.classes.find((c) => c.value === positive).label;
  const negLabel = config.classes.find((c) => c.value !== positive).label;

  return (
    <div className="lab">
      <div className="lab__layout">
        <div className="lab__left">
          <figure className="lab__card">
            <ClassifierPlot
              id="logreg-plot"
              domain={points.domain}
              xLabel={pairCfg.x}
              yLabel={pairCfg.y}
              classes={config.classes}
              train={points.train}
              test={points.test}
              predict={predictAt}
            >
              {(s) =>
                Math.abs(model.coef[1]) > 1e-9 && (
                  <line
                    x1={s.x(points.domain.x[0])}
                    y1={s.y(boundaryY(points.domain.x[0]))}
                    x2={s.x(points.domain.x[1])}
                    y2={s.y(boundaryY(points.domain.x[1]))}
                    stroke="var(--color-text)"
                    strokeWidth={2.5}
                  />
                )
              }
            </ClassifierPlot>
            <ClassLegend classes={config.classes} />
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              The shading shows what the model predicts at each spot; the black
              line is the decision boundary, where p = {threshold.toFixed(2)}.
            </p>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              The sigmoid: score z → probability p of class {positive}
            </h4>
            <PlotFrame
              id="logreg-sigmoid"
              height={260}
              xDomain={[-8, 8]}
              yDomain={[0, 1]}
              xLabel="score z"
              yLabel="p"
              yTicks={5}
              ariaLabel="Sigmoid curve with the threshold and the test samples"
            >
              {(s) => (
                <>
                  <polyline
                    fill="none"
                    stroke="var(--color-text)"
                    strokeWidth={2}
                    points={Array.from({ length: 81 }, (_, i) => {
                      const z = -8 + i * 0.2;
                      return `${s.x(z)},${s.y(sigmoid(z))}`;
                    }).join(" ")}
                  />
                  <line
                    className="lab-plot__diagonal"
                    x1={s.left}
                    x2={s.right}
                    y1={s.y(threshold)}
                    y2={s.y(threshold)}
                  />
                  {testZ.map((z, i) => (
                    <circle
                      key={i}
                      cx={s.x(Math.max(-8, Math.min(8, z)))}
                      cy={s.y(sigmoid(z))}
                      r={4}
                      fill="#ffffff"
                      stroke={classColor(config.classes, points.test[i].cls)}
                      strokeWidth={2}
                    />
                  ))}
                </>
              )}
            </PlotFrame>
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              Each ring is a test sample at its score z. Samples above the
              dashed threshold line are predicted as class {positive}.
            </p>
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

          <div className="lab-slider">
            <label htmlFor="logreg-threshold" className="lab-slider__label">
              <span>Threshold</span>
              <span className="lab-slider__value">{threshold.toFixed(2)}</span>
            </label>
            <input
              id="logreg-threshold"
              type="range"
              className="lab-slider__input"
              min={config.threshold.min}
              max={config.threshold.max}
              step={config.threshold.step}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </div>

          <p className="lab__equation">
            z = {model.intercept.toFixed(2)} {fmt(model.coef[0])}·x₁{" "}
            {fmt(model.coef[1])}·x₂
            <br />p = 1 / (1 + e^(−z)) → class {positive} if p ≥{" "}
            {threshold.toFixed(2)}
          </p>
          <p className="lab__note">
            x₁ and x₂ are the two features after scaling (learned from the
            training rows only).
          </p>

          <h4 className="lab__heading">
            Test set ({points.test.length} samples)
          </h4>
          <p className="lab__note">
            Positive = {posLabel}; negative = {negLabel}.
          </p>
          <table className="lab-cm">
            <thead>
              <tr>
                <th />
                <th scope="col">Predicted {positive}</th>
                <th scope="col">Predicted {1 - positive}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Actual {positive}</th>
                <td className="lab-cm__good">
                  <strong>{counts.tp}</strong>
                  <small>TP</small>
                </td>
                <td className="lab-cm__bad">
                  <strong>{counts.fn}</strong>
                  <small>FN</small>
                </td>
              </tr>
              <tr>
                <th scope="row">Actual {1 - positive}</th>
                <td className="lab-cm__bad">
                  <strong>{counts.fp}</strong>
                  <small>FP</small>
                </td>
                <td className="lab-cm__good">
                  <strong>{counts.tn}</strong>
                  <small>TN</small>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">Accuracy</th>
                <td>{pct(counts.accuracy)}</td>
              </tr>
              <tr>
                <th scope="row">Precision</th>
                <td>{pct(counts.precision)}</td>
              </tr>
              <tr>
                <th scope="row">Recall</th>
                <td>{pct(counts.recall)}</td>
              </tr>
            </tbody>
          </table>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setThreshold(config.threshold.start)}
          >
            Reset threshold
          </button>
        </div>
      </div>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
