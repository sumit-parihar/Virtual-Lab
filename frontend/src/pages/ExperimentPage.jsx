import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { experimentsApi } from "../api/experiments.js";
import { useAuth } from "../context/AuthContext.jsx";
import QuizPanel from "../components/QuizPanel.jsx";
import { SECTION_LABELS } from "../constants/sections.js";
import GuidedLab from "../components/GuidedLab.jsx";
import CodeEditor from "../components/CodeEditor.jsx";
import DatasetPanel from "../components/DatasetPanel.jsx";
import { simpleMarkdown } from "../utils/contentFormat.js";
import VideoPlayer from "../components/VideoPlayer.jsx";
import { shortSectionLabel } from "../utils/progress.js";
import "./ExperimentPage.css";

// Sidebar sections in the approved order. Keep the same stable section keys so
// saved completion records remain valid.
const SECTIONS = [
  { id: "overview", label: SECTION_LABELS.overview, completionKey: "overview" },
  { id: "aim", label: SECTION_LABELS["aim-objectives"], completionKey: "aim-objectives" },
  { id: "pre-quiz", label: SECTION_LABELS["pre-quiz"] },
  { id: "video", label: SECTION_LABELS.video, completionKey: "video" },
  { id: "theory", label: SECTION_LABELS.theory, completionKey: "theory" },
  { id: "guided-lab", label: SECTION_LABELS["guided-lab"], completionKey: "guided-lab" },
  { id: "code-editor", label: SECTION_LABELS["code-exercise"], completionKey: "code-exercise" },
  { id: "post-quiz", label: SECTION_LABELS["post-quiz"] },
  { id: "assignment", label: SECTION_LABELS.assignment },
];
// Sections that open only after the Pre-Quiz is submitted (server: CONTENT_SECTION_KEYS).
const CONTENT_SECTION_IDS = new Set(["video", "theory", "guided-lab", "code-editor"]);

export default function ExperimentPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [experiment, setExperiment] = useState(null);
  // The open section is part of the address (?section=…), so refresh, Back/Forward and shared links keep it.
  const [params, setParams] = useSearchParams();
  const requested = params.get("section");
  const activeSection = SECTIONS.some((s) => s.id === requested) ? requested : "overview";
  const setActiveSection = (id) => setParams(id === "overview" ? {} : { section: id });
  // Sections stay mounted once opened (only hidden), so code, quiz answers and lab settings survive tab switches.
  const [visited, setVisited] = useState(() => new Set([activeSection]));
  useEffect(() => {
    setVisited((prev) => (prev.has(activeSection) ? prev : new Set(prev).add(activeSection)));
  }, [activeSection]);
  useEffect(() => {
    setVisited(new Set([activeSection]));
    // a different experiment starts fresh; activeSection is read only at that moment
  }, [slug]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingSection, setSavingSection] = useState(null);
  const [sectionError, setSectionError] = useState("");
  const [showLockRequirements, setShowLockRequirements] = useState(false);
  const [checkingAssignment, setCheckingAssignment] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError("");
    setExperiment(null);
    experimentsApi.get(slug)
      .then((data) => { if (isCurrent) setExperiment(data); })
      .catch(() => {
        if (isCurrent) setError("Experiment not found or you don't have access.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => { isCurrent = false; };
  }, [slug]);

  // Re-fetch authoritative state after quizzes/code submissions. The UI does not
  // derive completion from a click or from a local optimistic flag.
  async function refreshExperiment() {
    try {
      const freshExperiment = await experimentsApi.get(slug);
      setExperiment(freshExperiment);
      return freshExperiment;
    } catch {
      // Keep the last known saved state; do not invent a new completion state.
      return null;
    }
  }

  async function markSectionCompleted(sectionKey) {
    if (!isStudent || !sectionKey || savingSection) return;
    setSavingSection(sectionKey);
    setSectionError("");
    try {
      // First persist completion through the backend. No tick is set here.
      await experimentsApi.markSectionCompleted(slug, sectionKey);
    } catch {
      setSectionError("We couldn't save this section as completed. No new completion tick was added. Please try again.");
      setSavingSection(null);
      return;
    }

    try {
      // Then fetch the database-backed status and render only that response.
      const freshExperiment = await experimentsApi.get(slug);
      setExperiment(freshExperiment);
      setShowLockRequirements(false);
    } catch {
      setSectionError("The completion request succeeded, but the saved status could not be refreshed. No new tick was added locally. Please retry or reload the experiment.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSectionSelect(section) {
    if (checkingAssignment) return;
    setSectionError("");

    if (section.id === "assignment" && isStudent) {
      // Always ask the backend for the current lock state at click time, so stale
      // page data can neither unlock nor wrongly lock the assignment.
      setCheckingAssignment(true);
      const fresh = await refreshExperiment();
      setCheckingAssignment(false);
      if (fresh === null) {
        setSectionError("We couldn't check the assignment status right now. Please try again.");
        return;
      }
      // The missing-prerequisites list appears only after this click, from fresh data.
      setShowLockRequirements(Boolean(fresh.assignment_locked));
      setActiveSection("assignment");
      return;
    }

    setShowLockRequirements(false);
    setActiveSection(section.id);
  }

  if (loading) return <div className="page-loading">Loading experiment…</div>;
  if (error || !experiment) {
    return (
      <div className="exp-page exp-page--error">
        <div className="alert alert--error">{error || "Experiment not found."}</div>
      </div>
    );
  }

  const getQuiz = (type) => experiment.quizzes?.find((q) => q.quiz_type === type);
  const preQuiz = getQuiz("pre");
  const postQuiz = getQuiz("post");
  const assignment = getQuiz("assignment");
  const completions = experiment.section_completions || {};

  // Learning order (students only), as decided by the server: the content opens after the Pre-Quiz,
  // the Post-Quiz after every earlier section, the Assignment after the Post-Quiz.
  const lockOf = (sectionId) => {
    if (!isStudent) return null;
    if (CONTENT_SECTION_IDS.has(sectionId) && experiment.content_locked) {
      return { kind: "content", steps: ["Pre-Quiz"] };
    }
    if (sectionId === "post-quiz" && experiment.post_quiz_locked) {
      return { kind: "post-quiz", steps: experiment.post_quiz_missing_steps || [] };
    }
    if (sectionId === "assignment" && experiment.assignment_locked) {
      return { kind: "assignment", steps: experiment.assignment_missing_steps || [] };
    }
    return null;
  };
  const isOpen = (sectionId) => visited.has(sectionId) && !lockOf(sectionId);

  const sectionKey = (section) => section.completionKey || section.id;
  const isComplete = (section) => {
    if (section.completionKey) return Boolean(completions[section.completionKey]);
    const quiz = section.id === "pre-quiz" ? preQuiz : section.id === "post-quiz" ? postQuiz : section.id === "assignment" ? assignment : null;
    return Boolean(quiz?.my_submitted);
  };
  const doneCount = SECTIONS.filter(isComplete).length;
  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const current = SECTIONS[currentIndex];
  const currentLock = lockOf(current.id);
  const prev = SECTIONS[currentIndex - 1];
  const next = SECTIONS[currentIndex + 1];
  const number = String(experiment.order_index).padStart(2, "0");

  // Mark Completed for the open section (manual sections only; quizzes tick when submitted).
  const completionControl = (key) => isStudent && key ? (
    <div className="section-completion">
      <button
        type="button"
        className={`btn ${completions[key] ? "btn--ghost" : "btn--primary"} section-completion__button`}
        disabled={Boolean(savingSection) || Boolean(completions[key])}
        onClick={() => markSectionCompleted(key)}
      >
        {savingSection === key ? "Saving…" : completions[key] ? "✓ Completed" : "Mark Completed"}
      </button>
    </div>
  ) : null;

  return (
    <div className="exp-page">
      <nav className="exp-crumbs" aria-label="Breadcrumb">
        <Link to="/experiments">Experiments</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Exp {number} · {experiment.title}</span>
      </nav>

      <div className="exp-layout">
        <aside className="exp-side" aria-label="Experiment sections">
          <p className="exp-side__eyebrow">Experiment {number}</p>
          <p className="exp-side__title">{experiment.title}</p>
          {isStudent && (
            <div className="exp-side__progress">
              <div className="exp-side__progress-row">
                <span>Progress</span>
                <strong>{doneCount} / {SECTIONS.length}</strong>
              </div>
              <div className="progress-bar" aria-hidden="true">
                <span style={{ width: `${Math.round((doneCount / SECTIONS.length) * 100)}%` }} />
              </div>
            </div>
          )}
          <ol className="exp-side__list">
            {SECTIONS.map((section) => {
              const locked = Boolean(lockOf(section.id));
              // Every tick comes from saved backend state: manual sections (including the Code Exercise) from
              // section_completions, quizzes/assignment from their saved submission.
              const complete = isComplete(section);
              const active = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    className={`exp-side__item ${active ? "exp-side__item--active" : ""} ${locked ? "exp-side__item--locked" : ""}`}
                    onClick={() => handleSectionSelect(section)}
                    disabled={checkingAssignment}
                    aria-current={active ? "page" : undefined}
                    title={locked ? "Locked: click to see what to complete first" : undefined}
                  >
                    <span className="exp-side__status">
                      {isStudent && (locked ? (
                        <svg className="exp-side__lock" role="img" aria-label="Locked" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                      ) : (
                        <span
                          className={`exp-side__dot ${complete ? "exp-side__dot--done" : ""}`}
                          role="img"
                          aria-label={complete ? "Completed" : "Not completed"}
                        >
                          {complete && (
                            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                        </span>
                      ))}
                    </span>
                    <span className="exp-side__label">{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="exp-main">
          {/* Phones: the sections become a picker above the content. */}
          <label className="exp-picker">
            <span className="sr-only">Section</span>
            <select
              className="form-select exp-picker__select"
              value={activeSection}
              disabled={checkingAssignment}
              onChange={(e) => handleSectionSelect(SECTIONS.find((s) => s.id === e.target.value))}
            >
              {SECTIONS.map((section, i) => (
                <option key={section.id} value={section.id}>
                  {`${i + 1} / ${SECTIONS.length} · ${section.label}`}
                  {isStudent && isComplete(section) ? " ✓" : ""}
                  {lockOf(section.id) ? " (locked)" : ""}
                </option>
              ))}
            </select>
          </label>
          {isStudent && (
            <div className="exp-picker__strip" aria-hidden="true">
              {SECTIONS.map((section) => (
                <span
                  key={section.id}
                  className={`exp-picker__seg${isComplete(section) ? " exp-picker__seg--done" : ""}${section.id === activeSection ? " exp-picker__seg--current" : ""}`}
                />
              ))}
            </div>
          )}

          <header className="exp-page__header">
            <p className="exp-page__eyebrow">
              Section {currentIndex + 1} of {SECTIONS.length}
            </p>
            <h1 className="exp-page__title">{current.label}</h1>
          </header>

          {sectionError && <div className="alert alert--error section-completion__error" role="alert">{sectionError}</div>}

          {currentLock?.kind === "content" && (
            <div className="alert alert--warning exp-page__lock-note" role="status">
              <strong>Locked until you submit the Pre-Quiz.</strong> The Pre-Quiz checks what you already know
              before you study this experiment; the video, theory, guided lab and code exercise open after it.
              <div className="exp-page__lock-action">
                <button type="button" className="btn btn--primary" onClick={() => handleSectionSelect(SECTIONS.find((s) => s.id === "pre-quiz"))}>
                  Go to the Pre-Quiz
                </button>
              </div>
            </div>
          )}
          {currentLock?.kind === "post-quiz" && (
            <div className="alert alert--warning exp-page__lock-note" role="status">
              <strong>Post-Quiz locked.</strong> Complete the following sections first:
              <ul>
                {currentLock.steps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </div>
          )}
          {currentLock?.kind === "assignment" && (
            <div className="alert alert--warning exp-page__lock-note" role="status">
              <strong>Assignment locked.</strong> Complete the following sections first:
              <ul>
                {currentLock.steps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </div>
          )}

          <div className="exp-page__content">
            {visited.has("overview") && (
              <section className="exp-section" hidden={activeSection !== "overview"}>
                <h2 className="exp-section__title">{experiment.title}</h2>
                <p>{experiment.overview || `This experiment introduces the main concepts and practical workflow of ${experiment.title}.`}</p>
              </section>
            )}

            {visited.has("aim") && (
              <section className="exp-section" hidden={activeSection !== "aim"}>
                <h2 className="exp-section__title">Aim</h2>
                <p>{experiment.aim}</p>
                <h2 className="exp-section__title">Learning Objectives</h2>
                <p>{experiment.objective}</p>
              </section>
            )}

            {visited.has("pre-quiz") && (
              <section className="exp-section" hidden={activeSection !== "pre-quiz"}>
                {preQuiz ? (
                  <QuizPanel quiz={preQuiz} quizType="pre" experimentNumber={experiment.order_index} experimentTitle={experiment.title} onComplete={refreshExperiment} readOnly={!isStudent} />
                ) : (
                  <p className="exp-section__placeholder">No pre-quiz available for this experiment yet.</p>
                )}
              </section>
            )}

            {isOpen("video") && (
              <section className="exp-section" hidden={activeSection !== "video"}>
                {experiment.video_url ? (
                  <VideoPlayer
                    url={experiment.video_url}
                    className="exp-video"
                    frameClassName="exp-video-wrapper"
                    active={activeSection === "video"}
                  />
                ) : (
                  <p className="exp-section__placeholder">No video available for this experiment yet.</p>
                )}
              </section>
            )}

            {isOpen("theory") && (
              <section className="exp-section" hidden={activeSection !== "theory"}>
                {experiment.notes ? (
                  <div className="exp-notes" dangerouslySetInnerHTML={{ __html: simpleMarkdown(experiment.notes) }} />
                ) : (
                  <p className="exp-section__placeholder">No theory material available for this experiment yet.</p>
                )}
              </section>
            )}

            {isOpen("guided-lab") && (
              <section className="exp-section" hidden={activeSection !== "guided-lab"}>
                <p className="exp-section__intro">Explore the visual demonstration and adjust its parameters where available.</p>
                {experiment.dataset_info && <DatasetPanel info={experiment.dataset_info} />}
                <GuidedLab labConfig={experiment.lab_config} />
              </section>
            )}

            {isOpen("code-editor") && (
              <section className="exp-section exp-section--code" hidden={activeSection !== "code-editor"}>
                <CodeExerciseLayout experiment={experiment} isStudent={isStudent} />
              </section>
            )}

            {isOpen("post-quiz") && (
              <section className="exp-section" hidden={activeSection !== "post-quiz"}>
                {postQuiz ? (
                  <QuizPanel quiz={postQuiz} quizType="post" experimentNumber={experiment.order_index} experimentTitle={experiment.title} onComplete={refreshExperiment} readOnly={!isStudent} />
                ) : (
                  <p className="exp-section__placeholder">No post-quiz available for this experiment yet.</p>
                )}
              </section>
            )}

            {isOpen("assignment") && (
              <section className="exp-section" hidden={activeSection !== "assignment"}>
                {assignment ? (
                  <QuizPanel quiz={assignment} quizType="assignment" onComplete={refreshExperiment} readOnly={!isStudent} />
                ) : (
                  <p className="exp-section__placeholder">No assignment available for this experiment yet.</p>
                )}
              </section>
            )}
          </div>

          <nav className="exp-pager" aria-label="Section navigation">
            {prev ? (
              <button type="button" className="btn btn--ghost exp-pager__btn" onClick={() => handleSectionSelect(prev)} disabled={checkingAssignment}>
                <span aria-hidden="true">←</span>
                <span className="exp-pager__text" aria-hidden="true">{shortSectionLabel(sectionKey(prev))}</span>
                <span className="sr-only">Previous section: {prev.label}</span>
              </button>
            ) : (
              <span />
            )}
            <div className="exp-pager__middle">{!currentLock && completionControl(current.completionKey)}</div>
            {next ? (
              <button type="button" className="btn btn--ghost exp-pager__btn" onClick={() => handleSectionSelect(next)} disabled={checkingAssignment}>
                <span className="exp-pager__text" aria-hidden="true">{shortSectionLabel(sectionKey(next))}</span>
                <span aria-hidden="true">→</span>
                <span className="sr-only">Next section: {next.label}</span>
              </button>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

// Code Exercise: the task (problem statement and dataset, as tabs) beside the editor and its output.
function CodeExerciseLayout({ experiment, isStudent }) {
  const hasProblem = Boolean(experiment.code_problem_statement);
  const hasDataset = Boolean(experiment.dataset_info);
  const [tab, setTab] = useState(hasProblem ? "problem" : "dataset");
  const tabs = [
    hasProblem && { id: "problem", label: "Problem" },
    hasDataset && { id: "dataset", label: "About the dataset" },
  ].filter(Boolean);

  return (
    <div className={`code-layout${tabs.length ? "" : " code-layout--single"}`}>
      {tabs.length > 0 && (
        <div className="code-layout__task">
          <div className="code-layout__tabs" role="tablist" aria-label="Exercise information">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`code-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`code-panel-${t.id}`}
                className={`code-layout__tab${tab === t.id ? " code-layout__tab--on" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="code-layout__panel" role="tabpanel" id={`code-panel-${tab}`} aria-labelledby={`code-tab-${tab}`}>
            {tab === "problem" && (
              <div className="exp-notes exp-problem" dangerouslySetInnerHTML={{ __html: simpleMarkdown(experiment.code_problem_statement) }} />
            )}
            {tab === "dataset" && <DatasetPanel info={experiment.dataset_info} defaultOpen />}
          </div>
          <p className="code-layout__hint">
            Your answer is the value of <code>result</code>. Submit checks it; it does not tick the section.
          </p>
        </div>
      )}
      <div className="code-layout__editor">
        <CodeEditor experiment={experiment} canSubmit={isStudent} />
      </div>
    </div>
  );
}
