import { useEffect, useRef, useState } from "react";
import { quizzesApi } from "../api/quizzes.js";
import { scoreTone } from "../utils/format.js";
import "./QuizPanel.css";

/**
 * QuizPanel — reused for pre-quiz, post-quiz, and graded assignment.
 *
 * Pre/post quizzes show an introduction first. After a submission, the current
 * attempt score is shown alongside the saved best score. Leaving the section or
 * refreshing remounts this component, so the introduction shows only the saved
 * best score (not the previous attempt's transient result).
 *
 * Layout (student): answered counter + bar on top, one card per question with
 * lettered option cards (radio semantics), Submit at the bottom. After submitting,
 * a large score card appears at the top and the page scrolls to it. A submitted
 * assignment switches to its review: score card first, then every answer.
 *
 * Props:
 *   quiz             — quiz object from the backend
 *   quizType         — "pre" | "post" | "assignment"
 *   experimentNumber — experiment order number for the intro screen
 *   experimentTitle  — experiment title for the intro screen
 *   onComplete       — refreshes authoritative experiment/progress data
 *   readOnly         — true for instructors/admins
 */

const LETTERS = "ABCDEFGHIJ";

function sortedOptions(question) {
  return question.options.slice().sort((a, b) => a.order_index - b.order_index);
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M6 6l8 8M14 6l-8 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Large score card: ring with the percentage, a heading and a line such as "8 of 10 correct". */
function ScoreCard({ score, eyebrow, heading, detail, children }) {
  const tone = scoreTone(score);
  const pct = score == null ? 0 : Math.max(0, Math.min(100, Number(score)));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className={`quiz-score quiz-score--${tone}`} role="status">
      <div className="quiz-score__ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={r} className="quiz-score__track" />
          <circle
            cx="50" cy="50" r={r}
            className="quiz-score__arc"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
          />
        </svg>
        <span className="quiz-score__value">{score == null ? "—" : `${score}%`}</span>
      </div>
      <div className="quiz-score__body">
        {eyebrow && <p className="quiz-score__eyebrow">{eyebrow}</p>}
        <p className="quiz-score__heading">{heading}</p>
        {detail && <p className="quiz-score__detail">{detail}</p>}
        {children && <div className="quiz-score__extra">{children}</div>}
      </div>
    </div>
  );
}

export default function QuizPanel({
  quiz,
  quizType,
  experimentNumber,
  experimentTitle,
  onComplete,
  readOnly = false,
}) {
  const [answers, setAnswers] = useState({}); // { question_id: option_id }
  const [result, setResult] = useState(null); // transient current submission response only
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState("");
  const [showMissing, setShowMissing] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [bestScore, setBestScore] = useState(quiz.my_best_score ?? null);
  const [hasStarted, setHasStarted] = useState(
    quizType === "assignment" || readOnly,
  );
  const topRef = useRef(null);

  const label = quizType === "pre" ? "Pre-Quiz" : quizType === "post" ? "Post-Quiz" : "Assignment";
  const isGraded = quizType === "assignment";
  const isSelfAssessment = quizType === "pre" || quizType === "post";
  const total = quiz.questions.length;
  const answeredCount = quiz.questions.filter((q) => answers[q.id]).length;

  // After a submission the score card is at the top: bring it into view.
  useEffect(() => {
    if (justSubmitted && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [justSubmitted, result, quiz.my_submitted]);

  function selectOption(questionId, optionId) {
    if (result || readOnly || submitting) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  // Arrow keys move between the options of one question, as in a native radio group.
  function onOptionKeyDown(event, question, index) {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const opts = sortedOptions(question);
    const next = (index + keys[event.key] + opts.length) % opts.length;
    selectOption(question.id, opts[next].id);
    event.currentTarget.parentElement?.children[next]?.focus();
  }

  async function handleSubmit() {
    if (answeredCount < total) {
      setShowMissing(true);
      setError(`Please answer all questions before submitting (${total - answeredCount} left).`);
      const first = quiz.questions.find((q) => !answers[q.id]);
      document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError("");
    setSyncWarning("");
    setShowMissing(false);
    setSubmitting(true);
    try {
      const answersPayload = Object.entries(answers).map(([question_id, selected_option_id]) => ({
        question_id,
        selected_option_id,
      }));
      const res = await quizzesApi.submit(quiz.id, answersPayload);

      // The response includes this attempt's score for immediate feedback and,
      // for pre/post quizzes, the persisted best score. Attempt details are not saved.
      setResult(res);
      if (res.best_score != null) setBestScore(res.best_score);
      setJustSubmitted(true);

      // The completion tick must come from refreshed backend state, not from this
      // local submit result. ExperimentPage returns null when refresh fails.
      if (onComplete) {
        const refreshed = await onComplete(res);
        if (refreshed === null) {
          setSyncWarning(
            "Your submission was saved, but progress could not be refreshed. The completion tick will appear after the saved status is refreshed.",
          );
        } else if (isGraded) {
          // The refreshed quiz is marked submitted and carries the review: show it.
          setResult(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function retryQuiz() {
    setAnswers({});
    setResult(null);
    setError("");
    setSyncWarning("");
    setShowMissing(false);
    setJustSubmitted(false);
    // For self-assessment, return to the introduction so every new attempt is
    // explicitly started with Start Now.
    setHasStarted(!isSelfAssessment || readOnly);
  }

  // The assignment can be submitted only once. Reopening it shows the saved result:
  // the score, then every question with the correct answer, the student's own
  // answer and whether it was correct. All of it comes from the backend.
  if (isGraded && !result && quiz.my_submitted) {
    const reviewByQuestion = new Map((quiz.my_review || []).map((r) => [r.question_id, r]));
    const correctCount = (quiz.my_review || []).filter((r) => r.is_correct).length;
    return (
      <div className="quiz-panel" ref={topRef}>
        <div className="quiz-panel__header">
          <h3 className="quiz-panel__title">{quiz.title || label}</h3>
          <span className="badge badge--green">Submitted</span>
        </div>

        {quiz.my_assignment_score != null ? (
          <ScoreCard
            score={quiz.my_assignment_score}
            eyebrow="Your assignment score"
            heading={justSubmitted ? "Assignment submitted" : "Assignment completed"}
            detail={quiz.my_review ? `${correctCount} of ${total} answers correct` : null}
          >
            <span className="quiz-score__note">This score is saved and appears on your Assignment Scores page.</span>
          </ScoreCard>
        ) : (
          <div className="alert alert--warning" role="status">
            The assignment was submitted, but its saved score is not available. Refresh the experiment to retrieve it.
          </div>
        )}

        {total > 0 && !quiz.my_review && (
          <div className="alert alert--warning" role="status">
            Your answers could not be loaded. Refresh the experiment to try again.
          </div>
        )}

        {quiz.my_review && <h4 className="quiz-panel__subhead">Answer review</h4>}

        {quiz.my_review && quiz.questions.map((question, qi) => {
          const review = reviewByQuestion.get(question.id);
          const correctIds = review?.correct_option_ids || [];
          return (
            <div
              key={question.id}
              className={`quiz-question ${review?.is_correct ? "quiz-question--correct" : "quiz-question--wrong"}`}
            >
              <div className="quiz-question__head">
                <span className="quiz-question__num">Question {qi + 1} of {total}</span>
                <span className={`badge ${review?.is_correct ? "badge--green" : "badge--red"}`}>
                  {review?.is_correct ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p className="quiz-question__text">{question.question_text}</p>
              <div className="quiz-options">
                {sortedOptions(question).map((option, oi) => {
                  const isCorrectOption = correctIds.includes(option.id);
                  const isMine = review?.selected_option_id === option.id;
                  let cls = "quiz-option quiz-option--static";
                  if (isCorrectOption) cls += " quiz-option--correct";
                  else if (isMine) cls += " quiz-option--wrong";
                  return (
                    <div key={option.id} className={cls}>
                      <span className="quiz-option__key" aria-hidden="true">
                        {isCorrectOption ? <CheckIcon /> : isMine ? <CrossIcon /> : LETTERS[oi]}
                      </span>
                      <span className="quiz-option__text">{option.option_text}</span>
                      <span className="quiz-option__tags">
                        {isMine && <em>Your answer</em>}
                        {isCorrectOption && <em>Correct answer</em>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Students see the quiz introduction first, including the saved best score.
  // This state is deliberately local/transient; returning to this tab or refreshing
  // reads best score and submitted status again from the backend.
  if (isSelfAssessment && !readOnly && !hasStarted) {
    return (
      <div className="quiz-panel">
        <div className="quiz-intro">
          <p className="quiz-intro__eyebrow">{label}</p>
          <h3 className="quiz-intro__title">{experimentTitle || quiz.title || label}</h3>
          <dl className="quiz-intro__facts">
            <div>
              <dt>Experiment</dt>
              <dd>{experimentNumber != null ? String(experimentNumber).padStart(2, "0") : "—"}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>{total}</dd>
            </div>
            <div>
              <dt>My best score</dt>
              <dd className={bestScore != null ? "quiz-intro__best" : "quiz-intro__not-attempted"}>
                {bestScore != null ? `${bestScore}%` : "Not attempted"}
              </dd>
            </div>
          </dl>
          <p className="quiz-intro__description">
            You can attempt this quiz again whenever you need. Your best score will be saved.
          </p>
          <button
            type="button"
            className="btn btn--primary quiz-intro__start"
            onClick={() => { setError(""); setSyncWarning(""); setHasStarted(true); }}
          >
            Start Now
          </button>
        </div>
      </div>
    );
  }

  const correctCount = result ? (result.answers || []).filter((a) => a.is_correct).length : 0;
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="quiz-panel" ref={topRef}>
      <div className="quiz-panel__header">
        <h3 className="quiz-panel__title">{quiz.title || label}</h3>
        {isGraded && !result && <span className="badge badge--yellow">Graded · one attempt</span>}
        {!readOnly && !result && (
          <span className="quiz-panel__count" aria-live="polite">
            <strong>{answeredCount}</strong> of {total} answered
          </span>
        )}
      </div>

      {!readOnly && !result && (
        <div className="progress-bar quiz-panel__bar" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
      )}

      {isGraded && !readOnly && !result && (
        <div className="alert alert--info">
          You can submit the assignment only once. Check your answers before you submit.
        </div>
      )}

      {result && (
        isSelfAssessment ? (
          <ScoreCard
            score={result.score}
            eyebrow={`${label} result`}
            heading={`${correctCount} of ${total} correct`}
            detail={(result.best_score ?? bestScore) != null ? `My best score: ${result.best_score ?? bestScore}%` : null}
          >
            <button type="button" className="btn btn--primary btn--sm" onClick={retryQuiz}>
              Try Again
            </button>
          </ScoreCard>
        ) : (
          <ScoreCard
            score={result.score}
            eyebrow="Your assignment score"
            heading="Assignment submitted"
            detail={`${correctCount} of ${total} answers correct`}
          />
        )
      )}

      {syncWarning && <div className="alert alert--warning" role="status">{syncWarning}</div>}

      {quiz.questions.map((question, qi) => {
        const answerResult = result?.answers?.find((a) => a.question_id === question.id);
        const missing = showMissing && !answers[question.id];
        let qCls = "quiz-question";
        if (missing) qCls += " quiz-question--missing";
        if (answerResult) qCls += answerResult.is_correct ? " quiz-question--correct" : " quiz-question--wrong";
        return (
          <div key={question.id} id={`q-${question.id}`} className={qCls}>
            <div className="quiz-question__head">
              <span className="quiz-question__num">Question {qi + 1} of {total}</span>
              {answerResult && (
                <span className={`badge ${answerResult.is_correct ? "badge--green" : "badge--red"}`}>
                  {answerResult.is_correct ? "Correct" : "Incorrect"}
                </span>
              )}
            </div>
            <p className="quiz-question__text" id={`qt-${question.id}`}>{question.question_text}</p>
            <div className="quiz-options" role="radiogroup" aria-labelledby={`qt-${question.id}`}>
              {sortedOptions(question).map((option, oi) => {
                const selected = answers[question.id] === option.id;
                const focusable = answers[question.id] ? selected : oi === 0;
                let cls = "quiz-option";
                if (selected) cls += " quiz-option--selected";
                if (selected && answerResult) cls += answerResult.is_correct ? " quiz-option--correct" : " quiz-option--wrong";
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={focusable ? 0 : -1}
                    className={cls}
                    onClick={() => selectOption(question.id, option.id)}
                    onKeyDown={(e) => onOptionKeyDown(e, question, oi)}
                    disabled={!!result || readOnly || submitting}
                  >
                    <span className="quiz-option__key" aria-hidden="true">
                      {selected && answerResult ? (answerResult.is_correct ? <CheckIcon /> : <CrossIcon />) : LETTERS[oi]}
                    </span>
                    <span className="quiz-option__text">{option.option_text}</span>
                  </button>
                );
              })}
            </div>
            {missing && <p className="quiz-question__hint">Choose an answer for this question.</p>}
          </div>
        );
      })}

      {error && <div className="alert alert--error" role="alert">{error}</div>}

      {readOnly ? (
        <div className="quiz-readonly">View only: only students can answer and submit quizzes.</div>
      ) : !result ? (
        <div className="quiz-panel__footer">
          <span className="quiz-panel__footer-count">
            {answeredCount === total ? "All questions answered" : `${answeredCount} of ${total} answered`}
          </span>
          <button
            type="button"
            className="btn btn--primary quiz-panel__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : isGraded ? "Submit Assignment" : "Submit Answers"}
          </button>
        </div>
      ) : isSelfAssessment ? (
        <div className="quiz-panel__footer">
          <span className="quiz-panel__footer-count">
            Score: <strong>{result.score != null ? `${result.score}%` : "—"}</strong>
          </span>
          <button type="button" className="btn btn--ghost" onClick={retryQuiz}>Try Again</button>
        </div>
      ) : null}
    </div>
  );
}
