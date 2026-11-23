import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/dashboard.js";
import { scoreTone } from "../utils/format.js";
import "./AssignmentScores.css";

// Assignment Scores: exactly three columns. Values come from saved backend state.
// On phones the table turns into one card per experiment (labels come from data-label).
function scoreCell(exp) {
  if (!exp.has_assignment) return <span className="score-pill score-pill--none">Assignment not Available</span>;
  if (exp.assignment === "completed") {
    if (exp.assignment_score == null) return <span className="score-pill score-pill--good">Submitted</span>;
    return <span className={`score-pill score-pill--${scoreTone(exp.assignment_score)}`}>{exp.assignment_score}%</span>;
  }
  return <span className="score-pill score-pill--pending">Not Submitted</span>;
}

export default function AssignmentScores() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .student()
      .then(setRows)
      .catch(() => setError("Failed to load your assignment scores. Please refresh and try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading assignment scores…</div>;

  return (
    <div className="scores-page">
      <Link to="/dashboard" className="scores-page__back">← View Progress</Link>
      <h1 className="scores-page__title">Assignment Scores</h1>

      {error && <div className="alert alert--error">{error}</div>}

      {!error && rows.length === 0 && (
        <p className="scores-page__empty">No experiments available yet.</p>
      )}

      {!error && rows.length > 0 && (
        <div className="scores-page__table-wrap">
          <table className="scores-page__table">
            <thead>
              <tr>
                <th>Experiment No.</th>
                <th>Experiment Name</th>
                <th>Assignment Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((exp) => (
                <tr key={exp.experiment_id}>
                  <td data-label="Experiment No." className="scores-page__num">
                    {String(exp.experiment_number).padStart(2, "0")}
                  </td>
                  <td data-label="Experiment Name" className="scores-page__name">{exp.experiment_title}</td>
                  <td data-label="Assignment Score" className="scores-page__score">{scoreCell(exp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
