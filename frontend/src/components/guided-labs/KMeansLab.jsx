import { useEffect, useMemo, useState } from "react";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useLabData from "./useLabData.js";
import {
  assign,
  bestKMeans,
  inertia,
  randomCentroids,
  update,
} from "./kmeans.js";

/**
 * Guided Lab for K-Means clustering (Experiment 9).
 *
 * All flowers, two measurements at a time (presets), no labels. The student picks k and steps through the
 * algorithm one half-step at a time (assign points, move centroids), sees the centroids' trails and the inertia,
 * tries new starting centroids, compares the clusters with the real species, and reads the elbow chart.
 *
 * config: kind "kmeans", dataset_url, target_column, species [{ value, label }],
 *   feature_pairs [{ label, x, y }], k { min, max, start }, steps
 */
const COLORS = [
  "#2563eb",
  "#ea580c",
  "#16a34a",
  "#9333ea",
  "#db2777",
  "#0891b2",
  "#ca8a04",
  "#4b5563",
];

export default function KMeansLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, null);
  const [pairIndex, setPairIndex] = useState(0);
  const [k, setK] = useState(config.k.start);
  const [seed, setSeed] = useState(1);
  const [showSpecies, setShowSpecies] = useState(false);
  const [run, setRun] = useState(null); // { centroids, labels, trail, phase, iteration, settled }
  const pairCfg = config.feature_pairs[pairIndex];

  const points = useMemo(() => {
    if (!data) return null;
    const xi = data.header.indexOf(pairCfg.x);
    const yi = data.header.indexOf(pairCfg.y);
    const ti = data.header.indexOf(config.target_column);
    const pts = data.rows.map((r) => [r[xi], r[yi]]);
    const species = data.rows.map((r) => r[ti]);
    const range = (j) => {
      const v = pts.map((p) => p[j]);
      const lo = Math.min(...v);
      const hi = Math.max(...v);
      return [lo - (hi - lo) * 0.06, hi + (hi - lo) * 0.06];
    };
    return { pts, species, domain: { x: range(0), y: range(1) } };
  }, [data, pairCfg, config.target_column]);

  // A fresh run whenever the data, k or the starting centroids change.
  useEffect(() => {
    if (!points) return;
    const start = randomCentroids(points.pts, k, seed);
    setRun({
      centroids: start,
      labels: null,
      trail: [start],
      phase: "assign",
      iteration: 0,
      settled: false,
    });
  }, [points, k, seed]);

  const elbow = useMemo(() => {
    if (!points) return [];
    return Array.from({ length: config.k.max }, (_, i) => ({
      k: i + 1,
      inertia: bestKMeans(points.pts, i + 1).inertia,
    }));
  }, [points, config.k.max]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!points || !run) return <p className="lab__note">Loading the dataset…</p>;

  function step(state) {
    if (state.settled) return state;
    if (state.phase === "assign") {
      const labels = assign(points.pts, state.centroids);
      const unchanged =
        state.labels !== null && labels.every((l, i) => l === state.labels[i]);
      return { ...state, labels, phase: "update", settled: unchanged };
    }
    const centroids = update(points.pts, state.labels, state.centroids);
    return {
      ...state,
      centroids,
      trail: [...state.trail, centroids],
      phase: "assign",
      iteration: state.iteration + 1,
    };
  }
  const runToEnd = () => {
    let s = run;
    for (let i = 0; i < 600 && !s.settled; i += 1) s = step(s);
    setRun(s);
  };

  const currentInertia = run.labels
    ? inertia(points.pts, run.labels, run.centroids)
    : null;
  const sizes = run.labels
    ? Array.from(
        { length: k },
        (_, c) => run.labels.filter((l) => l === c).length,
      )
    : null;
  const pointColor = (i) => {
    if (showSpecies)
      return COLORS[
        config.species.findIndex((s) => s.value === points.species[i])
      ];
    return run.labels ? COLORS[run.labels[i]] : "#9ca3af";
  };
  const status = run.settled
    ? `Settled after ${run.iteration} moves of the centroids: the assignments no longer change.`
    : run.phase === "assign"
      ? "Next: assign every flower to its nearest centroid."
      : "Next: move every centroid to the mean of its flowers.";
  const elbowMax = elbow.length ? elbow[0].inertia : 1;

  return (
    <div className="lab">
      <div className="lab__layout">
        <div className="lab__left">
          <figure className="lab__card">
            <PlotFrame
              id="kmeans-plot"
              xDomain={points.domain.x}
              yDomain={points.domain.y}
              xLabel={pairCfg.x}
              yLabel={pairCfg.y}
              ariaLabel="Flowers coloured by cluster, with the centroids and their paths"
            >
              {(s) => (
                <>
                  {points.pts.map((p, i) => (
                    <circle
                      key={i}
                      cx={s.x(p[0])}
                      cy={s.y(p[1])}
                      r={4.5}
                      fill={pointColor(i)}
                      fillOpacity={0.8}
                      stroke="#ffffff"
                      strokeWidth={0.8}
                    />
                  ))}
                  {run.centroids.map((_, c) => (
                    <polyline
                      key={`t${c}`}
                      fill="none"
                      stroke="var(--color-text)"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      points={run.trail
                        .map((cs) => `${s.x(cs[c][0])},${s.y(cs[c][1])}`)
                        .join(" ")}
                    />
                  ))}
                  {run.centroids.map((cen, c) => {
                    const cx = s.x(cen[0]);
                    const cy = s.y(cen[1]);
                    return (
                      <g key={`c${c}`}>
                        <path
                          d={`M${cx - 9},${cy - 9}L${cx + 9},${cy + 9}M${cx - 9},${cy + 9}L${cx + 9},${cy - 9}`}
                          stroke="#ffffff"
                          strokeWidth={7}
                        />
                        <path
                          d={`M${cx - 9},${cy - 9}L${cx + 9},${cy + 9}M${cx - 9},${cy + 9}L${cx + 9},${cy - 9}`}
                          stroke={COLORS[c]}
                          strokeWidth={4}
                        />
                      </g>
                    );
                  })}
                </>
              )}
            </PlotFrame>
            <div className="lab__legend">
              {showSpecies
                ? config.species.map((sp, i) => (
                    <span key={sp.value}>
                      <i
                        className="lab-key lab-key--dot"
                        style={{ background: COLORS[i] }}
                      />{" "}
                      {sp.label}
                    </span>
                  ))
                : Array.from({ length: k }, (_, c) => (
                    <span key={c}>
                      <i
                        className="lab-key lab-key--dot"
                        style={{ background: COLORS[c] }}
                      />{" "}
                      cluster {c}
                      {sizes ? ` (${sizes[c]})` : ""}
                    </span>
                  ))}
              <span>✕ centroid, dashed line = its path</span>
            </div>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Elbow chart: the best inertia for each k (the current k is marked)
            </h4>
            <PlotFrame
              id="kmeans-elbow"
              height={250}
              xDomain={[0.5, config.k.max + 0.5]}
              yDomain={[0, elbowMax * 1.05]}
              xLabel="k (number of clusters)"
              yLabel="inertia"
              ariaLabel="Inertia for each number of clusters"
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
                    stroke="var(--color-text)"
                    strokeWidth={2.5}
                    points={elbow
                      .map((e) => `${s.x(e.k)},${s.y(e.inertia)}`)
                      .join(" ")}
                  />
                  {elbow.map((e) => (
                    <circle
                      key={e.k}
                      cx={s.x(e.k)}
                      cy={s.y(e.inertia)}
                      r={4}
                      fill="var(--color-text)"
                    />
                  ))}
                </>
              )}
            </PlotFrame>
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              Each point is the lowest inertia of 10 runs with k-means++
              starting centroids, as scikit-learn does.
            </p>
          </figure>
        </div>

        <div className="lab__panel">
          <label className="lab__field">
            Measurements (x and y)
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
            <label htmlFor="kmeans-k" className="lab-slider__label">
              <span>Number of clusters k</span>
              <span className="lab-slider__value">{k}</span>
            </label>
            <input
              id="kmeans-k"
              type="range"
              className="lab-slider__input"
              min={config.k.min}
              max={config.k.max}
              step={1}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
            />
          </div>

          <p className="lab__note" aria-live="polite">
            <strong>{status}</strong>
          </p>
          <div className="lab__buttons">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={run.settled}
              onClick={() => setRun(step(run))}
            >
              {run.settled
                ? "Settled"
                : run.phase === "assign"
                  ? "Assign points"
                  : "Move centroids"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={run.settled}
              onClick={runToEnd}
            >
              Run to the end
            </button>
          </div>
          <div className="lab__buttons">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSeed((v) => v + 1)}
            >
              New starting centroids
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setK(config.k.start);
                setSeed(1);
                setShowSpecies(false);
              }}
            >
              Reset
            </button>
          </div>
          <p className="lab__note">
            Start number {seed}: the starting centroids are {k} flowers picked
            at random.
          </p>

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">Moves of the centroids</th>
                <td>{run.iteration}</td>
              </tr>
              <tr>
                <th scope="row">Inertia</th>
                <td>
                  {currentInertia === null ? "—" : currentInertia.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <label className="lab__check">
            <input
              type="checkbox"
              checked={showSpecies}
              onChange={(e) => setShowSpecies(e.target.checked)}
            />
            <span>
              Colour by the real species instead (only to check the clusters;
              K-Means never saw it)
            </span>
          </label>
        </div>
      </div>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
