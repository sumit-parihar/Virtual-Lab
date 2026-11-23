import { useMemo, useState } from "react";
import ClassifierPlot, { ClassLegend, classColor } from "./ClassifierPlot.jsx";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useFeaturePair from "./useFeaturePair.js";
import useLabData from "./useLabData.js";
import { countLeaves, growTree, predictTree, treeDepth } from "./tree.js";

/**
 * Guided Lab for Decision Trees (Experiment 6).
 *
 * Two features at a time (presets). The student limits the tree (max depth, min samples per leaf) and sees the
 * rectangular regions it creates, the learned questions with their Gini impurity, and training vs test accuracy.
 *
 * config: kind "decision-tree", dataset_url, split_url, target_column, classes [{ value, label }],
 *   feature_pairs [{ label, x, y }], max_depth { min, max, start } (max means "no limit"),
 *   min_samples_leaf { min, max, start }, steps
 */
const pct = (v) => `${(v * 100).toFixed(1)}%`;

function TreeNode({ node, names, classes, answer }) {
  const label = (cls) => classes.find((c) => c.value === cls)?.label ?? cls;
  const info = (
    <span className="lab-tree__info">
      {node.n} flowers [{node.counts.join(", ")}], Gini {node.gini.toFixed(3)}
    </span>
  );
  return (
    <li>
      {answer && <span className="lab-tree__answer">{answer}</span>}
      {node.left ? (
        <>
          <span className="lab-tree__question">
            Is {names[node.feature]} ≤ {Number(node.threshold.toFixed(3))}?
          </span>{" "}
          {info}
          <ul>
            <TreeNode
              node={node.left}
              names={names}
              classes={classes}
              answer="yes →"
            />
            <TreeNode
              node={node.right}
              names={names}
              classes={classes}
              answer="no →"
            />
          </ul>
        </>
      ) : (
        <>
          <span
            className="lab-tree__leaf"
            style={{ color: classColor(classes, node.prediction) }}
          >
            leaf: {label(node.prediction)}
          </span>{" "}
          {info}
        </>
      )}
    </li>
  );
}

export default function DecisionTreeLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const [pairIndex, setPairIndex] = useState(0);
  const [depth, setDepth] = useState(config.max_depth.start);
  const [minLeaf, setMinLeaf] = useState(config.min_samples_leaf.start);
  const pairCfg = config.feature_pairs[pairIndex];
  const pair = useMemo(() => [pairCfg.x, pairCfg.y], [pairCfg]);
  const points = useFeaturePair(data, pair, config.target_column);
  const classValues = useMemo(
    () => config.classes.map((c) => c.value),
    [config.classes],
  );
  const noLimit = (d) => d >= config.max_depth.max;

  const asTree = (p) => ({ f: [p.x, p.y], cls: p.cls });
  const fit = (d, leaf) =>
    growTree(points.train.map(asTree), classValues, {
      maxDepth: noLimit(d) ? Infinity : d,
      minSamplesLeaf: leaf,
    });
  const accuracy = (tree, list) =>
    list.filter((p) => predictTree(tree, [p.x, p.y]) === p.cls).length /
    list.length;

  const tree = useMemo(
    () => (points ? fit(depth, minLeaf) : null),
    [points, depth, minLeaf],
  );
  const curve = useMemo(() => {
    if (!points) return [];
    const out = [];
    for (let d = config.max_depth.min; d <= config.max_depth.max; d += 1) {
      const t = fit(d, minLeaf);
      out.push({
        d,
        train: accuracy(t, points.train),
        test: accuracy(t, points.test),
      });
    }
    return out;
  }, [points, minLeaf]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!points || !tree)
    return <p className="lab__note">Loading the dataset…</p>;

  const predict = (x, y) => predictTree(tree, [x, y]);
  const trainAcc = accuracy(tree, points.train);
  const testAcc = accuracy(tree, points.test);

  return (
    <div className="lab">
      <div className="lab__layout">
        <div className="lab__left">
          <figure className="lab__card">
            <ClassifierPlot
              id="tree-plot"
              domain={points.domain}
              xLabel={pairCfg.x}
              yLabel={pairCfg.y}
              classes={config.classes}
              train={points.train}
              test={points.test}
              predict={predict}
              cells={72}
            />
            <ClassLegend classes={config.classes} />
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              The learned questions (start at the top)
            </h4>
            <div className="lab-tree">
              <ul>
                <TreeNode node={tree} names={pair} classes={config.classes} />
              </ul>
            </div>
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              Each question sends a flower down the yes or no branch until it
              reaches a leaf. The numbers in brackets count the training flowers
              of each species at that point.
            </p>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Accuracy for every depth (the current depth is marked)
            </h4>
            <PlotFrame
              id="tree-curve"
              height={250}
              xDomain={[0.5, config.max_depth.max + 0.5]}
              yDomain={[0.5, 1.02]}
              xLabel={`max depth (${config.max_depth.max} = no limit)`}
              yLabel="accuracy"
              ariaLabel="Training and test accuracy for each depth"
            >
              {(s) => (
                <>
                  <line
                    x1={s.x(depth)}
                    x2={s.x(depth)}
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
                      .map((c) => `${s.x(c.d)},${s.y(c.train)}`)
                      .join(" ")}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--color-text)"
                    strokeWidth={2.5}
                    points={curve
                      .map((c) => `${s.x(c.d)},${s.y(c.test)}`)
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
            <label htmlFor="tree-depth" className="lab-slider__label">
              <span>Max depth</span>
              <span className="lab-slider__value">
                {noLimit(depth) ? "no limit" : depth}
              </span>
            </label>
            <input
              id="tree-depth"
              type="range"
              className="lab-slider__input"
              min={config.max_depth.min}
              max={config.max_depth.max}
              step={1}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
          </div>

          <div className="lab-slider">
            <label htmlFor="tree-leaf" className="lab-slider__label">
              <span>Min samples per leaf</span>
              <span className="lab-slider__value">{minLeaf}</span>
            </label>
            <input
              id="tree-leaf"
              type="range"
              className="lab-slider__input"
              min={config.min_samples_leaf.min}
              max={config.min_samples_leaf.max}
              step={1}
              value={minLeaf}
              onChange={(e) => setMinLeaf(Number(e.target.value))}
            />
          </div>

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">Leaves</th>
                <td>{countLeaves(tree)}</td>
              </tr>
              <tr>
                <th scope="row">Actual depth</th>
                <td>{treeDepth(tree)}</td>
              </tr>
              <tr>
                <th scope="row">Training accuracy</th>
                <td>{pct(trainAcc)}</td>
              </tr>
              <tr>
                <th scope="row">Test accuracy</th>
                <td>{pct(testAcc)}</td>
              </tr>
            </tbody>
          </table>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setDepth(config.max_depth.start);
              setMinLeaf(config.min_samples_leaf.start);
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
