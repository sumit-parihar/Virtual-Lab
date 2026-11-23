import { useMemo, useState } from "react";
import ClassifierPlot, { ClassLegend } from "./ClassifierPlot.jsx";
import GuidedSteps from "./GuidedSteps.jsx";
import PlotFrame from "./PlotFrame.jsx";
import useFeaturePair from "./useFeaturePair.js";
import useLabData from "./useLabData.js";
import { forestVote, growForest, outOfBagAccuracy } from "./forest.js";
import { growTree, predictTree } from "./tree.js";

/**
 * Guided Lab for Random Forests (Experiment 7).
 *
 * Two features at a time (presets). 100 trees are grown once (bootstrap samples, a random feature at each split,
 * a fixed seed); the slider decides how many of them vote. The lab shows the forest's regions, three individual
 * trees, a single full tree for comparison, the out-of-bag estimate, accuracy against the number of trees, and the
 * vote for a clicked point.
 *
 * config: kind "random-forest", dataset_url, split_url, target_column, classes [{ value, label }],
 *   feature_pairs [{ label, x, y, query: [x, y] }], trees { min, max, start }, steps
 */
const pct = (v) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

export default function RandomForestLab({ config }) {
  const { data, error } = useLabData(config.dataset_url, config.split_url);
  const [pairIndex, setPairIndex] = useState(0);
  const [nTrees, setNTrees] = useState(config.trees.start);
  const [seed, setSeed] = useState(1);
  const pairCfg = config.feature_pairs[pairIndex];
  const pair = useMemo(() => [pairCfg.x, pairCfg.y], [pairCfg]);
  const [query, setQuery] = useState(pairCfg.query);
  const points = useFeaturePair(data, pair, config.target_column);
  const classes = useMemo(
    () => config.classes.map((c) => c.value),
    [config.classes],
  );

  const grown = useMemo(() => {
    if (!points) return null;
    const asTree = (p) => ({ f: [p.x, p.y], cls: p.cls });
    const trainPts = points.train.map(asTree);
    const testPts = points.test.map(asTree);
    const forest = growForest(trainPts, classes, {
      nTrees: config.trees.max,
      seed,
    });
    const single = growTree(trainPts, classes);
    // Accuracy of the first n trees, for every n (votes added one tree at a time).
    const votes = testPts.map(() => new Map(classes.map((c) => [c, 0])));
    const curve = forest.map((member, t) => {
      testPts.forEach((p, i) => {
        const cls = predictTree(member.tree, p.f);
        votes[i].set(cls, votes[i].get(cls) + 1);
      });
      const right = testPts.filter((p, i) => {
        let best = classes[0];
        for (const c of classes)
          if (votes[i].get(c) > votes[i].get(best)) best = c;
        return best === p.cls;
      }).length;
      return { n: t + 1, test: right / testPts.length };
    });
    const singleTest =
      testPts.filter((p) => predictTree(single, p.f) === p.cls).length /
      testPts.length;
    return { forest, trainPts, curve, singleTest };
  }, [points, classes, seed, config.trees.max]);

  const predict = useMemo(
    () =>
      grown
        ? (x, y) => forestVote(grown.forest, [x, y], classes, nTrees).cls
        : null,
    [grown, classes, nTrees],
  );
  const treePredictors = useMemo(
    () =>
      grown
        ? grown.forest
            .slice(0, 3)
            .map((m) => (x, y) => predictTree(m.tree, [x, y]))
        : [],
    [grown],
  );
  const oob = useMemo(
    () =>
      grown
        ? outOfBagAccuracy(grown.forest, grown.trainPts, classes, nTrees)
        : null,
    [grown, classes, nTrees],
  );

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!points || !grown)
    return <p className="lab__note">Loading the dataset…</p>;

  const vote = forestVote(grown.forest, query, classes, nTrees);
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
            <h4 className="lab__card-title">
              The forest: {nTrees} tree{nTrees === 1 ? "" : "s"} voting
            </h4>
            <ClassifierPlot
              id="rf-plot"
              domain={points.domain}
              xLabel={pairCfg.x}
              yLabel={pairCfg.y}
              classes={config.classes}
              train={points.train}
              test={points.test}
              predict={predict}
              cells={56}
              onPick={(x, y) =>
                setQuery([Number(x.toFixed(3)), Number(y.toFixed(3))])
              }
            >
              {(s) => (
                <rect
                  x={s.x(query[0]) - 7}
                  y={s.y(query[1]) - 7}
                  width={14}
                  height={14}
                  transform={`rotate(45 ${s.x(query[0])} ${s.y(query[1])})`}
                  fill="#ffffff"
                  stroke="var(--color-text)"
                  strokeWidth={2.5}
                  pointerEvents="none"
                />
              )}
            </ClassifierPlot>
            <ClassLegend classes={config.classes} />
            <p className="lab__note" style={{ padding: "0 0.5rem" }}>
              Click anywhere to place a new sample (◆) and see how the trees
              vote for it.
            </p>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Three of the trees on their own (each saw a different bootstrap
              sample)
            </h4>
            <div className="lab-minis">
              {treePredictors.map((p, i) => (
                <div key={i}>
                  <ClassifierPlot
                    id={`rf-tree-${i}`}
                    domain={points.domain}
                    xLabel=""
                    yLabel=""
                    classes={config.classes}
                    train={points.train}
                    test={[]}
                    predict={p}
                    cells={36}
                  />
                  <p className="lab__note" style={{ textAlign: "center" }}>
                    Tree {i + 1}
                  </p>
                </div>
              ))}
            </div>
          </figure>

          <figure className="lab__card">
            <h4 className="lab__card-title">
              Test accuracy for every number of trees (the current number is
              marked)
            </h4>
            <PlotFrame
              id="rf-curve"
              height={250}
              xDomain={[0, config.trees.max]}
              yDomain={[0.8, 1]}
              xLabel="number of trees"
              yLabel="test accuracy"
              ariaLabel="Test accuracy for each number of trees"
            >
              {(s) => (
                <>
                  <line
                    x1={s.x(nTrees)}
                    x2={s.x(nTrees)}
                    y1={s.top}
                    y2={s.bottom}
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                  />
                  <line
                    className="lab-plot__diagonal"
                    x1={s.left}
                    x2={s.right}
                    y1={s.y(grown.singleTest)}
                    y2={s.y(grown.singleTest)}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--color-text)"
                    strokeWidth={2.5}
                    points={grown.curve
                      .map((c) => `${s.x(c.n)},${s.y(Math.max(0.8, c.test))}`)
                      .join(" ")}
                  />
                </>
              )}
            </PlotFrame>
            <div className="lab__legend">
              <span>
                <i className="lab-key lab-key--line" /> forest
              </span>
              <span>
                <i
                  className="lab-key lab-key--line"
                  style={{
                    borderTopStyle: "dashed",
                    borderColor: "var(--color-text-muted)",
                  }}
                />{" "}
                one full tree
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
            <label htmlFor="rf-trees" className="lab-slider__label">
              <span>Number of trees</span>
              <span className="lab-slider__value">{nTrees}</span>
            </label>
            <input
              id="rf-trees"
              type="range"
              className="lab-slider__input"
              min={config.trees.min}
              max={config.trees.max}
              step={1}
              value={nTrees}
              onChange={(e) => setNTrees(Number(e.target.value))}
            />
          </div>

          <h4 className="lab__heading">Votes for the new sample ◆</h4>
          <table className="lab__metrics">
            <tbody>
              {config.classes.map((c) => (
                <tr key={c.value}>
                  <th scope="row">{c.label}</th>
                  <td>{vote.votes.get(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="lab__note">
            The forest predicts <strong>{label(vote.cls)}</strong> (
            {vote.votes.get(vote.cls)} of {nTrees} trees).
          </p>

          <table className="lab__metrics">
            <tbody>
              <tr>
                <th scope="row">Forest, test accuracy</th>
                <td>{pct(grown.curve[nTrees - 1].test)}</td>
              </tr>
              <tr>
                <th scope="row">Out-of-bag estimate</th>
                <td>{pct(oob)}</td>
              </tr>
              <tr>
                <th scope="row">One full tree, test accuracy</th>
                <td>{pct(grown.singleTest)}</td>
              </tr>
            </tbody>
          </table>

          <div className="lab__buttons">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSeed((s) => s + 1)}
            >
              Grow a different forest
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setNTrees(config.trees.start);
                setSeed(1);
                setQuery(pairCfg.query);
              }}
            >
              Reset
            </button>
          </div>
          <p className="lab__note">
            Forest number {seed}. The random choices are fixed, so each number
            always grows the same forest.
          </p>
        </div>
      </div>

      <GuidedSteps steps={config.steps} />
    </div>
  );
}
