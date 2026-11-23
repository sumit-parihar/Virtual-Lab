import { useMemo, useState } from "react";
import ClassifierPlot, { ClassLegend, classColor } from "./ClassifierPlot.jsx";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useFeaturePair from "./useFeaturePair.js";
import useLabData from "./useLabData.js";
import { knnAccuracy, knnClassify } from "./knn.js";

/**
 * Guided Lab for K-Nearest Neighbours (Experiment 4).
 *
 * Two features at a time (presets). The student sets k and the distance, and clicks the plot to place a new
 * example: lines join it to its k nearest training examples and their vote decides its class. The shaded regions,
 * training and test accuracy, and a chart of accuracy against k update at once.
 *
 * config: kind "knn", dataset_url, split_url, target_column, classes [{ value, label }],
 *   feature_pairs [{ label, x, y, query: [x, y] }], k { min, max, step, start }, steps
 */
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const METRIC_LABELS = {
  euclidean: "Euclidean (straight line)",
  manhattan: "Manhattan (sum of differences)",
};

export default function KnnLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const [pairIndex, setPairIndex] = useState(0);
  const [k, setK] = useState(config.k.start);
  const [metric, setMetric] = useState("euclidean");
  const pairCfg = config.feature_pairs[pairIndex];
  const pair = useMemo(() => [pairCfg.x, pairCfg.y], [pairCfg]);
  const [query, setQuery] = useState(pairCfg.query);
  const points = useFeaturePair(data, pair, config.target_column);

  const predict = useMemo(
    () =>
      points ? (x, y) => knnClassify(points.train, x, y, k, metric).cls : null,
    [points, k, metric],
  );
  const curve = useMemo(() => {
    if (!points) return [];
    const out = [];
    for (let kk = config.k.min; kk <= config.k.max; kk += 1) {
      out.push({
        k: kk,
        train: knnAccuracy(points.train, points.train, kk, metric),
        test: knnAccuracy(points.train, points.test, kk, metric),
      });
    }
    return out;
  }, [points, metric, config.k.min, config.k.max]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!points) return <p className="lab__note">Loading the dataset…</p>;

  const result = knnClassify(points.train, query[0], query[1], k, metric);
  const current = curve.find((c) => c.k === k);
  const label = (cls) =>
    config.classes.find((c) => c.value === cls)?.label ?? cls;
  const changePair = (i) => {
    setPairIndex(i);
    setQuery(config.feature_pairs[i].query);
  };

  return (
    <div className="lab">
      <div className="lab__layout">
        <div className="lab__left">
          <figure className="lab__card">
            <ClassifierPlot
              id="knn-plot"
              domain={points.domain}
              xLabel={pairCfg.x}
              yLabel={pairCfg.y}
              classes={config.classes}
              train={points.train}
              test={points.test}
              predict={predict}
              cells={56}
              onPick={(x, y) =>
                setQuery([Number(x.toFixed(2)), Number(y.toFixed(2))])
              }
            >
              {(s) => (
                <g pointerEvents="none">
                  {result.neighbors.map((n, i) => (
                    <line
                      key={i}
                      x1={s.x(query[0])}
                      y1={s.y(query[1])}
                      x2={s.x(n.point.x)}
                      y2={s.y(n.point.y)}
                      stroke="var(--color-text)"
                      strokeWidth={1.2}
                      strokeOpacity={0.7}
                    />
                  ))}
                  {result.neighbors.map((n, i) => (
                    <circle
                      key={`n${i}`}
                      cx={s.x(n.point.x)}
                      cy={s.y(n.point.y)}
                      r={7.5}
                      fill="none"
                      stroke="var(--color-text)"
                      strokeWidth={1.5}
                    />
                  ))}
                  <rect
                    x={s.x(query[0]) - 7}
                    y={s.y(query[1]) - 7}
                    width={14}
                    height={14}
                    transform={`rotate(45 ${s.x(query[0])} ${s.y(query[1])})`}
                    fill={classColor(config.classes, result.cls)}
                    stroke="var(--color-text)"
                    strokeWidth={2}
                  />
                </g>
              )}
            </ClassifierPlot>
            <ClassLegend classes={config.classes} />
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              Click anywhere on the plot to place a new flower (◆). Lines join
              it to its {k} nearest training flowers.
            </p>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Accuracy for every k (the current k is marked)
            </h4>
            <PlotFrame
              id="knn-curve"
              height={250}
              xDomain={[0, config.k.max + 1]}
              yDomain={[0.5, 1.02]}
              xLabel="k (number of neighbours)"
              yLabel="accuracy"
              ariaLabel="Training and test accuracy for each k"
            >
              {(s) => (
                <>
                  <line
                    x1={s.x(k)}
                    x2={s.x(k)}
                    y1={s.top}
                    y2={s.bottom}
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--color-text-muted)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    points={curve
                      .map((c) => `${s.x(c.k)},${s.y(c.train)}`)
                      .join(" ")}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--color-text)"
                    strokeWidth={2.5}
                    points={curve
                      .map((c) => `${s.x(c.k)},${s.y(c.test)}`)
                      .join(" ")}
                  />
                </>
              )}
            </PlotFrame>
            <div className="lab__legend">
              <span>
                <i className="lab-key lab-key--line" /> test accuracy
              </span>
              <span>
                <i
                  className="lab-key lab-key--line"
                  style={{
                    borderTopStyle: "dashed",
                    borderColor: "var(--color-text-muted)",
                  }}
                />{" "}
                training accuracy
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
              onChange={(e) => changePair(Number(e.target.value))}
            >
              {config.feature_pairs.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <div className="lab-slider">
            <label htmlFor="knn-k" className="lab-slider__label">
              <span>Number of neighbours k</span>
              <span className="lab-slider__value">{k}</span>
            </label>
            <input
              id="knn-k"
              type="range"
              className="lab-slider__input"
              min={config.k.min}
              max={config.k.max}
              step={config.k.step}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
            />
          </div>

          <label className="lab__field">
            Distance
            <select
              className="lab__select"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              {Object.entries(METRIC_LABELS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>

          <h4 className="lab__heading">
            The new flower ◆ at ({query[0]}, {query[1]})
          </h4>
          <table className="lab__metrics">
            <thead>
              <tr>
                <th scope="col">Species</th>
                <th scope="col">Votes</th>
              </tr>
            </thead>
            <tbody>
              {config.classes.map((c) => (
                <tr key={c.value}>
                  <th scope="row">{c.label}</th>
                  <td>{result.votes.get(c.value) || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="lab__note">
            Majority vote: <strong>{label(result.cls)}</strong>. Nearest
            distance {result.neighbors[0].distance.toFixed(2)}, k-th distance{" "}
            {result.neighbors[k - 1].distance.toFixed(2)}.
          </p>

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">Training accuracy</th>
                <td>{pct(current.train)}</td>
              </tr>
              <tr>
                <th scope="row">Test accuracy</th>
                <td>{pct(current.test)}</td>
              </tr>
            </tbody>
          </table>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setK(config.k.start);
              setMetric("euclidean");
              setQuery(pairCfg.query);
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
