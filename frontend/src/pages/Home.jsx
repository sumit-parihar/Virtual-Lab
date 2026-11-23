import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { experimentsApi } from "../api/experiments.js";
import { dashboardApi } from "../api/dashboard.js";
import { homeIntro, homeTopics } from "../content/homeContent.js";
import { instructorHomeIntro, instructorHomeTopics } from "../content/instructorHomeContent.js";
import { formatScore } from "../utils/format.js";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  mergeProgress,
  overallPercent,
  pickContinue,
  sectionPageId,
  shortSectionLabel,
} from "../utils/progress.js";
import "./Home.css";

// Students get their dashboard (continue card, counts, experiments, ML basics).
// Instructors and admins get general content about the lab.
export default function Home() {
  const { user } = useAuth();
  if (user?.role === "student") return <StudentHome user={user} />;
  const isInstructor = user?.role === "instructor";
  return (
    <GeneralHome
      user={user}
      intro={isInstructor ? instructorHomeIntro : homeIntro}
      topics={isInstructor ? instructorHomeTopics : homeTopics}
    />
  );
}

function GeneralHome({ user, intro, topics }) {
  return (
    <div className="home">
      <header className="home__head">
        <div>
          <p className="home__eyebrow">{intro.title}</p>
          <h1 className="home__title">Welcome, {user?.full_name}</h1>
          <p className="home__subtitle">{intro.subtitle}</p>
        </div>
      </header>
      <Topics topics={topics} heading="About the lab" />
    </div>
  );
}

function Topics({ topics, heading }) {
  return (
    <section aria-labelledby="home-topics">
      <h2 className="home__h2" id="home-topics">{heading}</h2>
      <div className="home__topics">
        {topics.map((topic) => (
          <article key={topic.title} className="home__topic">
            <h3 className="home__topic-title">{topic.title}</h3>
            <p className="home__topic-body">{topic.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StudentHome({ user }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError("");
    Promise.all([experimentsApi.list(), dashboardApi.student()])
      .then(([experiments, progress]) => !cancelled && setRows(mergeProgress(experiments, progress)))
      .catch(() => !cancelled && setError("Could not load your progress. Please try again."));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const percent = rows ? overallPercent(rows) : 0;
  const next = rows ? pickContinue(rows) : null;
  const scores = (rows || []).filter((r) => r.assignmentScore !== null).map((r) => r.assignmentScore);

  return (
    <div className="home">
      <header className="home__head">
        <div>
          <p className="home__eyebrow">ML Virtual Lab</p>
          <h1 className="home__title">Welcome back, {user.full_name}</h1>
        </div>
        {rows && (
          <div className="home__overall">
            <div className="home__overall-row">
              <span>Overall progress</span>
              <strong>{percent}%</strong>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress">
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
      </header>

      {error && (
        <div className="alert alert--error home__alert">
          <span>{error}</span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </button>
        </div>
      )}

      {!rows && !error && <div className="page-loading home__loading">Loading your progress…</div>}

      {rows && rows.length > 0 && (
        <>
          <ContinueCard row={next} />

          <div className="home__stats">
            <Stat label="Experiments completed" value={rows.filter((r) => r.status === "completed").length} of={rows.length} />
            <Stat label="Sections done" value={rows.reduce((n, r) => n + r.done, 0)} of={rows.reduce((n, r) => n + r.total, 0)} />
            <Stat
              label="Assignments submitted"
              value={rows.filter((r) => r.assignmentDone).length}
              of={rows.filter((r) => r.hasAssignment).length}
            />
            <Stat label="Best assignment score" value={scores.length ? formatScore(Math.max(...scores)) : "—"} />
          </div>

          <section className="home__card home__list" aria-labelledby="home-exps">
            <div className="home__list-head">
              <h2 className="home__h2" id="home-exps">Your experiments</h2>
              <Link to="/experiments" className="home__link">View all</Link>
            </div>
            <ul className="home__rows">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link to={`/experiments/${r.slug}`} className="home__row">
                    <span className="home__row-num">{String(r.order_index).padStart(2, "0")}</span>
                    <span className="home__row-title">{r.title}</span>
                    <span className="progress-bar home__row-bar" aria-hidden="true">
                      <span style={{ width: `${r.total ? Math.round((r.done / r.total) * 100) : 0}%` }} />
                    </span>
                    <span className={`badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {rows && rows.length === 0 && <div className="home__card home__empty">No experiments are published yet. Check back soon.</div>}

      <Topics topics={homeTopics} heading="ML basics" />
    </div>
  );
}

function Stat({ label, value, of }) {
  return (
    <div className="home__stat">
      <p className="home__stat-label">{label}</p>
      <p className="home__stat-value">
        {value}
        {of !== undefined && <span> / {of}</span>}
      </p>
    </div>
  );
}

function ContinueCard({ row }) {
  if (!row) {
    return (
      <section className="home__card home__continue">
        <div className="home__continue-main">
          <span className="badge badge--green">All done</span>
          <h2 className="home__continue-title">You have completed every experiment</h2>
          <p className="home__continue-text">You can reopen any experiment to revise it or review your assignment answers.</p>
        </div>
      </section>
    );
  }
  const nextLabel = row.nextKey ? shortSectionLabel(row.nextKey) : "Overview";
  const href = `/experiments/${row.slug}${row.nextKey && row.nextKey !== "overview" ? `?section=${sectionPageId(row.nextKey)}` : ""}`;
  const started = row.status === "in_progress";
  return (
    <section className="home__card home__continue" aria-labelledby="continue-title">
      <div className="home__continue-main">
        <span className="badge badge--yellow">{started ? "Continue where you left off" : "Start your next experiment"}</span>
        <h2 className="home__continue-title" id="continue-title">
          Experiment {String(row.order_index).padStart(2, "0")} · {row.title}
        </h2>
        <p className="home__continue-text">
          Next up: <strong>{nextLabel}</strong>
        </p>
        <div className="home__continue-actions">
          <Link to={href} className="btn btn--primary home__cta">
            {started ? `Continue ${nextLabel}` : "Start experiment"}
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
      {row.sections.length > 0 && (
        <div className="home__steps">
          <p className="home__steps-count">
            {row.done} of {row.total} sections done
          </p>
          <ol className="home__step-list">
            {row.sections.map((s) => {
              const state = s.completed ? "done" : s.key === row.nextKey ? "next" : "todo";
              return (
                <li key={s.key} className={`home__step home__step--${state}`}>
                  <span className="home__step-dot" aria-hidden="true" />
                  {shortSectionLabel(s.key)}
                  <span className="sr-only">{state === "done" ? " (done)" : state === "next" ? " (next)" : ""}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
