import LinearRegressionLab from "./guided-labs/LinearRegressionLab.jsx";
import MultipleRegressionLab from "./guided-labs/MultipleRegressionLab.jsx";
import LogisticRegressionLab from "./guided-labs/LogisticRegressionLab.jsx";
import KnnLab from "./guided-labs/KnnLab.jsx";
import NaiveBayesLab from "./guided-labs/NaiveBayesLab.jsx";
import DecisionTreeLab from "./guided-labs/DecisionTreeLab.jsx";
import RandomForestLab from "./guided-labs/RandomForestLab.jsx";
import SvmLab from "./guided-labs/SvmLab.jsx";
import KMeansLab from "./guided-labs/KMeansLab.jsx";
import NeuralNetworkLab from "./guided-labs/NeuralNetworkLab.jsx";
import "./GuidedLab.css";

/**
 * GuidedLab — Module 5 (Guided Lab).
 *
 * Each experiment's `lab_config` (set in backend/scripts/experiment_content/) names a lab `kind`.
 * The lab itself is a React component in components/guided-labs/; the config only holds data
 * (dataset file, slider ranges, the guided steps), never code. Everything runs in the browser and
 * nothing is saved: the student can only move the controls the lab provides.
 */
const LABS = {
  "linear-regression": LinearRegressionLab,
  "multiple-regression": MultipleRegressionLab,
  "logistic-regression": LogisticRegressionLab,
  knn: KnnLab,
  "naive-bayes": NaiveBayesLab,
  "decision-tree": DecisionTreeLab,
  "random-forest": RandomForestLab,
  svm: SvmLab,
  kmeans: KMeansLab,
  "neural-network": NeuralNetworkLab,
};

export default function GuidedLab({ labConfig }) {
  if (!labConfig) {
    return (
      <div className="guided-lab guided-lab--empty">
        <p>No interactive lab configured for this experiment yet.</p>
      </div>
    );
  }

  const Lab = LABS[labConfig.kind];
  if (!Lab) {
    return (
      <div className="guided-lab guided-lab--empty">
        <p>This interactive lab is not available yet.</p>
      </div>
    );
  }

  return (
    <div className="guided-lab">
      {labConfig.intro && <p className="guided-lab__desc">{labConfig.intro}</p>}
      <Lab config={labConfig} />
    </div>
  );
}
