import { useMemo, useState } from "react";
import { CLASS_COLORS } from "./ClassifierPlot.jsx";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useLabData from "./useLabData.js";
import { splitRows } from "./labMath.js";
import {
  fitGaussianNB,
  likelihood,
  posterior,
  predictNB,
} from "./naiveBayes.js";

/**
 * Guided Lab for Gaussian Naive Bayes (Experiment 5).
 *
 * The student picks one wine measurement (and optionally a second). For each grower the lab draws the bell curve
 * learned from the training wines (its mean and variance). A slider sets the measured value; the table shows, per
 * grower, the prior, the likelihood(s), prior × likelihood and the posterior, i.e. Bayes' theorem at work.
 *
 * config: kind "naive-bayes", dataset_url, split_url, target_column, classes [{ value, label }],
 *   features [{ name, label, step, start }], first, second (feature names; second may be null), steps
 */
const small = (v) =>
  v === 0 ? "0" : v >= 0.01 ? v.toFixed(3) : v.toExponential(2);
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const nameWithLabel = (f) =>
  f.label && f.label !== f.name ? `${f.name} (${f.label})` : f.name;

function BellChart({ id, feature, model, j, value, values, domain }) {
  const curves = model.classes.map((_, ci) =>
    Array.from({ length: 121 }, (_, i) => {
      const x = domain[0] + (i / 120) * (domain[1] - domain[0]);
      return { x, y: likelihood(model, ci, j, x) };
    }),
  );
  const top = Math.max(...curves.flat().map((p) => p.y)) * 1.12;
  return (
    <PlotFrame
      id={id}
      height={280}
      xDomain={domain}
      yDomain={[0, top]}
      xLabel={feature.name}
      yLabel="likelihood P(x | grower)"
      ariaLabel={`Bell curve of ${feature.name} for each grower`}
    >
      {(s) => (
        <>
          {curves.map((pts, ci) => (
            <polyline
              key={ci}
              fill="none"
              stroke={CLASS_COLORS[ci]}
              strokeWidth={2.5}
              points={pts.map((p) => `${s.x(p.x)},${s.y(p.y)}`).join(" ")}
            />
          ))}
          {values.map((v, i) => (
            <line
              key={i}
              x1={s.x(v.x)}
              x2={s.x(v.x)}
              y1={s.bottom - 2 - v.ci * 7}
              y2={s.bottom - 8 - v.ci * 7}
              stroke={CLASS_COLORS[v.ci]}
              strokeWidth={1.5}
            />
          ))}
          <line
            x1={s.x(value)}
            x2={s.x(value)}
            y1={s.top}
            y2={s.bottom}
            stroke="var(--color-text)"
            strokeWidth={2}
          />
          {model.classes.map((_, ci) => (
            <circle
              key={ci}
              cx={s.x(value)}
              cy={s.y(likelihood(model, ci, j, value))}
              r={5}
              fill={CLASS_COLORS[ci]}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          ))}
        </>
      )}
    </PlotFrame>
  );
}

function ValueSlider({ id, feature, value, domain, onChange }) {
  // Align the slider with round multiples of its step, so start values such as 13.0 can be reached exactly.
  const step = feature.step;
  const decimals = (String(step).split(".")[1] || "").length;
  const round = (v) => Number(v.toFixed(decimals));
  const min = round(Math.floor(domain[0] / step) * step);
  const max = round(Math.ceil(domain[1] / step) * step);
  return (
    <div className="lab-slider">
      <label htmlFor={id} className="lab-slider__label">
        <span>Value of {feature.name}</span>
        <span className="lab-slider__value">{value.toFixed(decimals)}</span>
      </label>
      <input
        id={id}
        type="range"
        className="lab-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(round(Number(e.target.value)))}
      />
    </div>
  );
}

export default function NaiveBayesLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const byName = (name) => config.features.find((f) => f.name === name);
  const [first, setFirst] = useState(config.first);
  const [second, setSecond] = useState(config.second);
  const [values, setValues] = useState(() =>
    Object.fromEntries(config.features.map((f) => [f.name, f.start])),
  );
  const chosen = useMemo(
    () => (second ? [first, second] : [first]),
    [first, second],
  );

  const fitted = useMemo(() => {
    if (!data) return null;
    const ti = data.header.indexOf(config.target_column);
    const cols = chosen.map((n) => data.header.indexOf(n));
    const { train, test } = splitRows(data.rows.length, data.testRows);
    const X = (idx) => idx.map((i) => cols.map((c) => data.rows[i][c]));
    const model = fitGaussianNB(
      X(train),
      train.map((i) => data.rows[i][ti]),
    );
    const testX = X(test);
    const right = test.filter(
      (i, k) => predictNB(model, testX[k]) === data.rows[i][ti],
    ).length;
    const domains = cols.map((c) => {
      const v = data.rows.map((r) => r[c]);
      return [Math.min(...v), Math.max(...v)];
    });
    const trainValues = cols.map((c) =>
      train.map((i) => ({
        x: data.rows[i][c],
        ci: model.classes.indexOf(data.rows[i][ti]),
      })),
    );
    return {
      model,
      accuracy: right / test.length,
      domains,
      trainValues,
      testCount: test.length,
    };
  }, [data, chosen, config.target_column]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!fitted) return <p className="lab__note">Loading the dataset…</p>;

  const x = chosen.map((n) => values[n]);
  const rows = posterior(fitted.model, x);
  const winner = rows.reduce((best, r) =>
    r.posterior > best.posterior ? r : best,
  );
  const label = (cls) =>
    config.classes.find((c) => c.value === cls)?.label ?? cls;
  const setValue = (name, v) => setValues((prev) => ({ ...prev, [name]: v }));

  return (
    <div className="lab">
      <div className="lab__layout">
        <div className="lab__left">
          {chosen.map((name, j) => (
            <figure className="lab__card" key={name}>
              <h4 className="lab__card-title">
                {j === 0 ? "First" : "Second"} measurement:{" "}
                {nameWithLabel(byName(name))}
              </h4>
              <BellChart
                id={`nb-chart-${j}`}
                feature={byName(name)}
                model={fitted.model}
                j={j}
                value={values[name]}
                values={fitted.trainValues[j]}
                domain={fitted.domains[j]}
              />
              <div className="lab__legend">
                {config.classes.map((c, ci) => (
                  <span key={c.value}>
                    <i
                      className="lab-key lab-key--line"
                      style={{ borderColor: CLASS_COLORS[ci] }}
                    />{" "}
                    {c.label}
                  </span>
                ))}
              </div>
              <p className="lab__note" style={{ padding: "0 0.5rem" }}>
                Each curve is the bell shape learned for one grower (its mean
                and variance in the training wines); the small ticks at the
                bottom are the training wines. The black line is the value set
                with the slider.
              </p>
            </figure>
          ))}
        </div>

        <div className="lab__panel">
          <label className="lab__field">
            First measurement
            <select
              className="lab__select"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            >
              {config.features
                .filter((f) => f.name !== second)
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {nameWithLabel(f)}
                  </option>
                ))}
            </select>
          </label>
          <ValueSlider
            id="nb-value-0"
            feature={byName(first)}
            value={values[first]}
            domain={fitted.domains[0]}
            onChange={(v) => setValue(first, v)}
          />

          <label className="lab__field">
            Second measurement (optional)
            <select
              className="lab__select"
              value={second || ""}
              onChange={(e) => setSecond(e.target.value || null)}
            >
              <option value="">none</option>
              {config.features
                .filter((f) => f.name !== first)
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {nameWithLabel(f)}
                  </option>
                ))}
            </select>
          </label>
          {second && (
            <ValueSlider
              id="nb-value-1"
              feature={byName(second)}
              value={values[second]}
              domain={fitted.domains[1]}
              onChange={(v) => setValue(second, v)}
            />
          )}

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">
                  Test accuracy with{" "}
                  {chosen.length === 1 ? "this measurement" : "these two"}
                </th>
                <td>{pct(fitted.accuracy)}</td>
              </tr>
            </tbody>
          </table>
          <p className="lab__note">
            Measured on the {fitted.testCount} test wines of the Code Exercise's
            split.
          </p>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setFirst(config.first);
              setSecond(config.second);
              setValues(
                Object.fromEntries(
                  config.features.map((f) => [f.name, f.start]),
                ),
              );
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <figure className="lab__card">
        <h4 className="lab__card-title">
          Bayes&apos; theorem for a wine with{" "}
          {chosen.map((n) => `${n} = ${values[n]}`).join(" and ")}
        </h4>
        <div style={{ overflowX: "auto" }}>
          <table className="lab__metrics">
            <thead>
              <tr>
                <th scope="col">Grower</th>
                <th scope="col">Prior</th>
                {chosen.map((n) => (
                  <th scope="col" key={n}>
                    P({n.split("_")[0]} | grower)
                  </th>
                ))}
                <th scope="col">Prior × likelihood</th>
                <th scope="col">Posterior</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ci) => (
                <tr key={r.cls}>
                  <th scope="row" style={{ color: CLASS_COLORS[ci] }}>
                    {label(r.cls)}
                  </th>
                  <td>{r.prior.toFixed(3)}</td>
                  {r.likelihoods.map((l, j) => (
                    <td key={j}>{small(l)}</td>
                  ))}
                  <td>{small(r.joint)}</td>
                  <td>
                    <strong>{pct(r.posterior)}</strong>
                    <div
                      style={{
                        height: 6,
                        marginTop: 3,
                        width: `${Math.max(r.posterior * 100, 1)}%`,
                        background: CLASS_COLORS[ci],
                        borderRadius: 3,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lab__note" style={{ padding: "0.5rem" }}>
          Prediction: <strong>{label(winner.cls)}</strong> (the largest prior ×
          likelihood).{" "}
          {chosen.length === 2 &&
            "With two measurements the likelihood is the product of the two (the naive step). "}
          The posteriors are the products divided by their total, so they add up
          to 100%. A likelihood is the height of a bell curve, not a
          probability, so it can be larger than 1.
        </p>
      </figure>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
