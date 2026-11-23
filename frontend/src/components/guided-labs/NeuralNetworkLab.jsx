import { useEffect, useMemo, useRef, useState } from "react";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useLabData from "./useLabData.js";
import { confusionMatrix, fitScaler } from "./classifyMath.js";
import { splitRows } from "./labMath.js";
import {
  ACTIVATIONS,
  accuracyOf,
  createNetwork,
  forward,
  neuron,
  parameterCount,
  predictClass,
  trainEpoch,
} from "./mlp.js";

/**
 * Guided Lab for Artificial Neural Networks (Experiment 10).
 *
 * Part 1: one neuron, activation(w1·x1 + w2·x2 + b), with sliders for the weights and the bias.
 * Part 2: a network with one hidden layer trained in the browser on the digits (the Code Exercise's split,
 * scaled with the training images): choose the hidden neurons and the learning rate, train epoch by epoch, and
 * watch the loss, the accuracy, a confusion matrix and the predictions for some test images.
 *
 * config: kind "neural-network", dataset_url, split_url, target_column, neuron { inputs, weights, bias },
 *   hidden_sizes [...], hidden_start, learning_rates [...], learning_rate_start, epochs_per_click, steps
 */
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const SAMPLE_COUNT = 12;

function OneNeuron({ cfg }) {
  const [w, setW] = useState(cfg.weights);
  const [b, setB] = useState(cfg.bias);
  const [act, setAct] = useState("relu");
  const { z, output } = neuron(cfg.inputs, w, b, act);
  const slider = (id, label, value, onChange, min, max) => (
    <div className="lab-slider" key={id}>
      <label htmlFor={id} className="lab-slider__label">
        <span>{label}</span>
        <span className="lab-slider__value">{value}</span>
      </label>
      <input
        id={id}
        type="range"
        className="lab-slider__input"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
  return (
    <figure className="lab__card">
      <h4 className="lab__card-title">
        Part 1: one neuron with inputs x₁ = {cfg.inputs[0]} and x₂ ={" "}
        {cfg.inputs[1]}
      </h4>
      <div className="lab-neuron">
        <div className="lab-neuron__controls">
          {slider("ann-w1", "weight w₁", w[0], (v) => setW([v, w[1]]), -2, 2)}
          {slider("ann-w2", "weight w₂", w[1], (v) => setW([w[0], v]), -2, 2)}
          {slider("ann-b", "bias b", b, setB, -3, 3)}
          <label className="lab__field">
            Activation
            <select
              className="lab__select"
              value={act}
              onChange={(e) => setAct(e.target.value)}
            >
              <option value="relu">ReLU: max(0, z)</option>
              <option value="sigmoid">sigmoid: 1 / (1 + e^(−z))</option>
              <option value="tanh">tanh</option>
            </select>
          </label>
          <p className="lab__equation">
            z = {w[0]}·{cfg.inputs[0]} + ({w[1]})·{cfg.inputs[1]} + ({b}) ={" "}
            <strong>{Number(z.toFixed(3))}</strong>
            <br />
            output = {act}(z) = <strong>{Number(output.toFixed(3))}</strong>
          </p>
        </div>
        <PlotFrame
          id="ann-act"
          height={260}
          xDomain={[-6, 6]}
          yDomain={
            act === "tanh"
              ? [-1.1, 1.1]
              : act === "sigmoid"
                ? [0, 1.05]
                : [0, 6]
          }
          xLabel="z (weighted sum + bias)"
          yLabel="output"
          ariaLabel="Activation function with the neuron's value"
        >
          {(s) => (
            <>
              <polyline
                fill="none"
                stroke="var(--color-text)"
                strokeWidth={2.5}
                points={Array.from({ length: 121 }, (_, i) => -6 + i * 0.1)
                  .map((v) => `${s.x(v)},${s.y(ACTIVATIONS[act](v))}`)
                  .join(" ")}
              />
              <circle
                cx={s.x(Math.max(-6, Math.min(6, z)))}
                cy={s.y(output)}
                r={7}
                fill="var(--color-primary)"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </>
          )}
        </PlotFrame>
      </div>
    </figure>
  );
}

export default function NeuralNetworkLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const [hidden, setHidden] = useState(config.hidden_start);
  const [learningRate, setLearningRate] = useState(config.learning_rate_start);
  const [seed, setSeed] = useState(1);
  const [history, setHistory] = useState([]); // [{ epoch, loss, train, test }]
  const [training, setTraining] = useState(false);
  const netRef = useRef(null);
  const stopRef = useRef(false);

  const prepared = useMemo(() => {
    if (!data) return null;
    const ti = data.header.indexOf(config.target_column);
    const features = (r) => r.filter((_, j) => j !== ti);
    const { train, test } = splitRows(data.rows.length, data.testRows);
    const scaler = fitScaler(train.map((i) => features(data.rows[i])));
    const make = (idx) => ({
      X: idx.map((i) => scaler.transform(features(data.rows[i]))),
      raw: idx.map((i) => features(data.rows[i])),
      y: idx.map((i) => data.rows[i][ti]),
    });
    return {
      train: make(train),
      test: make(test),
      nIn: features(data.rows[0]).length,
    };
  }, [data, config.target_column]);

  // A new untrained network whenever its size, the learning rate or the random start changes.
  useEffect(() => {
    if (!prepared) return;
    stopRef.current = true;
    netRef.current = createNetwork(prepared.nIn, hidden, 10, seed);
    setHistory([]);
    setTraining(false);
  }, [prepared, hidden, learningRate, seed]);
  useEffect(
    () => () => {
      stopRef.current = true;
    },
    [],
  );

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!prepared || !netRef.current)
    return <p className="lab__note">Loading the dataset…</p>;

  const net = netRef.current;
  function train(epochs) {
    stopRef.current = false;
    setTraining(true);
    let done = 0;
    const tick = () => {
      if (stopRef.current || netRef.current !== net) return;
      const loss = trainEpoch(net, prepared.train.X, prepared.train.y, {
        learningRate,
      });
      const row = {
        loss,
        train: accuracyOf(net, prepared.train.X, prepared.train.y),
        test: accuracyOf(net, prepared.test.X, prepared.test.y),
      };
      setHistory((h) => [...h, { epoch: h.length + 1, ...row }]);
      done += 1;
      if (done < epochs) requestAnimationFrame(tick);
      else setTraining(false);
    };
    requestAnimationFrame(tick);
  }

  const last = history[history.length - 1];
  const predictions = prepared.test.X.map((x) => predictClass(net, x));
  const cm = confusionMatrix(
    prepared.test.y,
    predictions,
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  const cmMax = Math.max(...cm.flat());
  const lossMax = Math.max(
    2.5,
    ...history.map((h) => (Number.isFinite(h.loss) ? h.loss : 0)),
  );
  const epochsMax = Math.max(20, history.length);

  return (
    <div className="lab">
      <OneNeuron cfg={config.neuron} />

      <div className="lab__layout">
        <div className="lab__left">
          <figure className="lab__card">
            <h4 className="lab__card-title">
              Part 2: loss during training (one point per epoch)
            </h4>
            <PlotFrame
              id="ann-loss"
              height={260}
              xDomain={[0, epochsMax]}
              yDomain={[0, lossMax]}
              xLabel="epoch"
              yLabel="loss (cross-entropy)"
              ariaLabel="Training loss for each epoch"
            >
              {(s) => (
                <polyline
                  fill="none"
                  stroke="var(--color-text)"
                  strokeWidth={2.5}
                  points={history
                    .map(
                      (h) =>
                        `${s.x(h.epoch)},${s.y(Math.min(h.loss, lossMax))}`,
                    )
                    .join(" ")}
                />
              )}
            </PlotFrame>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Test images: actual digit → the network&apos;s guess
            </h4>
            <div className="lab-digits">
              {prepared.test.raw.slice(0, SAMPLE_COUNT).map((pixels, i) => {
                const { probs } = forward(net, prepared.test.X[i]);
                const guess = predictions[i];
                const right = guess === prepared.test.y[i];
                return (
                  <figure
                    key={i}
                    className={`lab-digit ${right ? "" : "lab-digit--wrong"}`}
                  >
                    <svg
                      viewBox="0 0 8 8"
                      width={48}
                      height={48}
                      role="img"
                      aria-label={`Image of a ${prepared.test.y[i]}`}
                    >
                      {pixels.map((v, p) => {
                        const shade = Math.round(255 - (v / 16) * 255);
                        return (
                          <rect
                            key={p}
                            x={p % 8}
                            y={Math.floor(p / 8)}
                            width={1.05}
                            height={1.05}
                            fill={`rgb(${shade},${shade},${shade})`}
                          />
                        );
                      })}
                    </svg>
                    <figcaption>
                      {prepared.test.y[i]} → <strong>{guess}</strong>
                      <br />
                      <small>{(probs[guess] * 100).toFixed(0)}% sure</small>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Confusion matrix on the {prepared.test.y.length} test images
            </h4>
            <div style={{ overflowX: "auto" }}>
              <table className="lab-cm10">
                <thead>
                  <tr>
                    <th>actual ↓ / guess →</th>
                    {cm.map((_, k) => (
                      <th key={k} scope="col">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cm.map((row, a) => (
                    <tr key={a}>
                      <th scope="row">{a}</th>
                      {row.map((n, p) => (
                        <td
                          key={p}
                          style={{
                            background:
                              n === 0
                                ? undefined
                                : a === p
                                  ? `rgba(21,128,61,${0.15 + (0.6 * n) / cmMax})`
                                  : `rgba(220,38,38,${0.2 + (0.6 * n) / cmMax})`,
                          }}
                        >
                          {n || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              The diagonal (green) counts correct guesses; any other cell (red)
              shows which digit was mistaken for which.
            </p>
          </figure>
        </div>

        <div className="lab__panel">
          <div className="lab-slider">
            <label htmlFor="ann-hidden" className="lab-slider__label">
              <span>Hidden neurons</span>
              <span className="lab-slider__value">{hidden}</span>
            </label>
            <input
              id="ann-hidden"
              type="range"
              className="lab-slider__input"
              min={0}
              max={config.hidden_sizes.length - 1}
              step={1}
              value={config.hidden_sizes.indexOf(hidden)}
              disabled={training}
              onChange={(e) =>
                setHidden(config.hidden_sizes[Number(e.target.value)])
              }
            />
          </div>
          <label className="lab__field">
            Learning rate
            <select
              className="lab__select"
              value={learningRate}
              disabled={training}
              onChange={(e) => setLearningRate(Number(e.target.value))}
            >
              {config.learning_rates.map((lr) => (
                <option key={lr} value={lr}>
                  {lr}
                </option>
              ))}
            </select>
          </label>
          <p className="lab__note">
            Network: {prepared.nIn} inputs (pixels) → {hidden} hidden ReLU
            neurons → 10 outputs (softmax), so {prepared.nIn}×{hidden} +{" "}
            {hidden} + {hidden}×10 + 10 ={" "}
            <strong>{parameterCount(prepared.nIn, hidden, 10)}</strong> weights
            and biases to learn.
          </p>

          <div className="lab__buttons">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={training}
              onClick={() => train(config.epochs_per_click)}
            >
              {training
                ? "Training…"
                : `Train ${config.epochs_per_click} epochs`}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSeed((v) => v + 1)}
            >
              New random start
            </button>
          </div>

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">Epochs trained</th>
                <td>{history.length}</td>
              </tr>
              <tr>
                <th scope="row">Loss</th>
                <td>{last ? last.loss.toFixed(3) : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Training accuracy</th>
                <td>{last ? pct(last.train) : "—"}</td>
              </tr>
              <tr>
                <th scope="row">Test accuracy</th>
                <td>
                  {last
                    ? pct(last.test)
                    : pct(accuracyOf(net, prepared.test.X, prepared.test.y))}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="lab__note">
            {prepared.train.y.length} training and {prepared.test.y.length} test
            images (the Code Exercise&apos;s split), pixels scaled with the
            training images. Changing the size or the learning rate starts a
            new, untrained network.
          </p>
        </div>
      </div>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
