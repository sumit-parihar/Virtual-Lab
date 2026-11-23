import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { experimentsApi } from "../api/experiments.js";
import { dashboardApi } from "../api/dashboard.js";
import { useAuth } from "../context/AuthContext.jsx";
import { STATUS_BADGE, STATUS_LABEL, mergeProgress } from "../utils/progress.js";
import { useUrlParams } from "../utils/useUrlParams.js";
import "./Experiments.css";

const FILTERS = [
  { id: "", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "not_started", label: "Not Attempted" },
];

// The lab's experiments. Students also see their status and progress on each card and can filter by status.
export default function Experiments() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [params, update] = useUrlParams();
  const filter = FILTERS.some((f) => f.id === params.get("status")) ? params.get("status") : "";

  useEffect(() => {
    let cancelled = false;
    setError("");
    Promise.all([experimentsApi.list(), isStudent ? dashboardApi.student() : Promise.resolve([])])
      .then(([experiments, progress]) => !cancelled && setRows(mergeProgress(experiments, progress)))
      .catch(() => !cancelled && setError("Could not load the experiments. Please try again."));
    return () => {
      cancelled = true;
    };
  }, [isStudent, reloadKey]);

  if (!rows && !error) return <div className="page-loading">Loading experiments…</div>;

  const shown = (rows || []).filter((r) => !filter || r.status === filter);
  const count = (id) => (rows || []).filter((r) => !id || r.status === id).length;

  return (
    <div className="experiments-page">
      <header>
        <h1 className="experiments-page__title">Experiments</h1>
        <p className="experiments-page__subtitle">
          Ten experiments, from regression to neural networks. Each one has the same sections, from the overview to the assignment.
        </p>
      </header>

      {error && (
        <div className="alert alert--error experiments-page__alert">
          <span>{error}</span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </button>
        </div>
      )}

      {isStudent && rows && rows.length > 0 && (
        <div className="experiments-filter" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.id || "all"}
              type="button"
              aria-pressed={filter === f.id}
              className={`experiments-filter__btn${filter === f.id ? " experiments-filter__btn--on" : ""}`}
              onClick={() => update({ status: f.id })}
            >
              {f.label} <span className="experiments-filter__count">{count(f.id)}</span>
            </button>
          ))}
        </div>
      )}

      {rows && rows.length === 0 && <div className="experiments-page__empty">No experiments are published yet. Check back soon.</div>}
      {rows && rows.length > 0 && shown.length === 0 && (
        <div className="experiments-page__empty">No experiments match this filter.</div>
      )}

      <div className="experiment-grid">
        {shown.map((exp) => (
          <Link to={`/experiments/${exp.slug}`} key={exp.id} className="exp-card">
            <div className="exp-card__top">
              <span className="exp-card__index">EXP {String(exp.order_index).padStart(2, "0")}</span>
              {isStudent && <span className={`badge ${STATUS_BADGE[exp.status]}`}>{STATUS_LABEL[exp.status]}</span>}
            </div>
            <div className="exp-card__body">
              <h2 className="exp-card__title">{exp.title}</h2>
              <p className="exp-card__aim">{exp.aim}</p>
            </div>
            {isStudent && exp.total > 0 && (
              <div className="exp-card__progress">
                <span className="progress-bar" aria-hidden="true">
                  <span style={{ width: `${Math.round((exp.done / exp.total) * 100)}%` }} />
                </span>
                <span className="exp-card__count">
                  {exp.done} / {exp.total}
                  <span className="sr-only"> sections done</span>
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
