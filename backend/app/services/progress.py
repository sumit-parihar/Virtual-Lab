"""Progress derivation and assignment-prerequisite checks.

Manually tracked sections (including the Code Exercise) are read from
SectionCompletion rows. Pre/post quiz completion comes from best-score-only
StudentQuizProgress rows. Assignment completion is derived from the accepted
submission record. Code submissions never affect progress.
"""
import uuid
from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.quiz import Quiz, QuizSubmission, QuizType, RevealPolicy
from app.models.student_quiz_progress import StudentQuizProgress
from app.schemas.dashboard import ExperimentProgress, SectionProgress
from app.schemas.quiz import QuestionReview
from app.services.section_tracking import (
    STATIC_SECTION_LABELS,
    get_completed_section_keys,
)

_NS = "not_started"
_IP = "in_progress"
_CO = "completed"


def derive_experiment_progress(
    student_id: uuid.UUID,
    experiments: Sequence[Experiment],
    db: Session,
    *,
    student_view: bool = False,
) -> list[ExperimentProgress]:
    """Return one progress entry per published experiment.

    ``student_view`` makes the assignment score visible immediately to the
    student after submission. Instructor-facing calls retain the configured
    reveal policy; their response schema still excludes pre/post quiz scores.
    """
    results: list[ExperimentProgress] = []

    for exp in experiments:
        if not exp.is_published:
            continue

        quizzes_by_type: dict[str, Quiz] = {q.quiz_type.value: q for q in exp.quizzes}
        completed_static = get_completed_section_keys(student_id, exp.id, db)
        section_statuses = {
            key: (_CO if key in completed_static else _NS)
            for key in STATIC_SECTION_LABELS
        }

        # Pre-quiz: the single best-score record means at least one submission occurred.
        pre_q = quizzes_by_type.get(QuizType.pre.value)
        pre_quiz_status = _NS
        if pre_q:
            has_sub = db.query(StudentQuizProgress.id).filter(
                StudentQuizProgress.student_id == student_id,
                StudentQuizProgress.quiz_id == pre_q.id,
            ).first() is not None
            pre_quiz_status = _CO if has_sub else _NS

        # Code exercise: ticked only by Mark Completed, like the other manual
        # sections. Submitting code (matched or not) does not change progress.
        code_status = section_statuses["code-exercise"]

        # Post-quiz: the single best-score record means at least one submission occurred.
        post_q = quizzes_by_type.get(QuizType.post.value)
        post_quiz_status = _NS
        if post_q:
            has_sub = db.query(StudentQuizProgress.id).filter(
                StudentQuizProgress.student_id == student_id,
                StudentQuizProgress.quiz_id == post_q.id,
            ).first() is not None
            post_quiz_status = _CO if has_sub else _NS

        # Assignment: any accepted submission makes it complete regardless of score.
        assignment_status = _NS
        assignment_score: float | None = None
        asgn_q = quizzes_by_type.get(QuizType.assignment.value)
        if asgn_q:
            latest_sub = (
                db.query(QuizSubmission)
                .filter(
                    QuizSubmission.student_id == student_id,
                    QuizSubmission.quiz_id == asgn_q.id,
                )
                .order_by(QuizSubmission.attempt_number.desc())
                .first()
            )
            if latest_sub:
                assignment_status = _CO
                if student_view or score_is_revealed(asgn_q):
                    assignment_score = latest_sub.score

        # Every configured section in the approved order. Manually tracked
        # sections (including the Code Exercise) are always configured; quiz and
        # assignment sections only when they exist for this experiment.
        sections: list[tuple[str, str]] = [
            ("overview", section_statuses["overview"]),
            ("aim-objectives", section_statuses["aim-objectives"]),
        ]
        if pre_q:
            sections.append(("pre-quiz", pre_quiz_status))
        sections += [
            ("video", section_statuses["video"]),
            ("theory", section_statuses["theory"]),
            ("guided-lab", section_statuses["guided-lab"]),
            ("code-exercise", section_statuses["code-exercise"]),
        ]
        if post_q:
            sections.append(("post-quiz", post_quiz_status))
        if asgn_q:
            sections.append(("assignment", assignment_status))
        trackable = [status for _, status in sections]

        # Decided status rule (ticks only): none ticked -> not started; every
        # configured section ticked (including the assignment) -> completed;
        # anything in between -> in progress.
        done = sum(1 for s in trackable if s == _CO)
        if done == 0:
            overall = _NS
        elif done == len(trackable):
            overall = _CO
        else:
            overall = _IP

        results.append(ExperimentProgress(
            experiment_id=exp.id,
            experiment_title=exp.title,
            experiment_number=exp.order_index,
            has_assignment=asgn_q is not None,
            pre_quiz=pre_quiz_status,
            code_exercise=code_status,
            post_quiz=post_quiz_status,
            assignment=assignment_status,
            assignment_score=assignment_score,
            overall_status=overall,
            section_statuses=section_statuses,
            sections=[
                SectionProgress(key=key, completed=status == _CO)
                for key, status in sections
            ],
        ))

    return results


# Learning order (learner study): the content sections open only after the Pre-Quiz is
# submitted, so its first attempt is a true "before" score; the Post-Quiz opens only after
# every earlier section is complete; the Assignment opens after the Post-Quiz.
CONTENT_SECTION_KEYS: tuple[str, ...] = ("video", "theory", "guided-lab", "code-exercise")


def _quiz_of_type(exp: Experiment, quiz_type: QuizType) -> Quiz | None:
    return next((q for q in exp.quizzes if q.quiz_type == quiz_type), None)


def _quiz_submitted(student_id: uuid.UUID, quiz: Quiz | None, db: Session) -> bool:
    if quiz is None:
        return False
    return db.query(StudentQuizProgress.id).filter(
        StudentQuizProgress.student_id == student_id,
        StudentQuizProgress.quiz_id == quiz.id,
    ).first() is not None


def content_locked(student_id: uuid.UUID, exp: Experiment, db: Session) -> bool:
    """True while the experiment has a Pre-Quiz that this student has not submitted yet.

    Video, Theory, Guided Lab and Code Exercise stay locked until then (they cannot be
    marked completed and code cannot be submitted). Without a Pre-Quiz nothing is locked.
    """
    pre_q = _quiz_of_type(exp, QuizType.pre)
    return pre_q is not None and not _quiz_submitted(student_id, pre_q, db)


def missing_post_quiz_prerequisites(
    student_id: uuid.UUID,
    exp: Experiment,
    db: Session,
) -> list[str]:
    """Unmet steps before the Post-Quiz, in workflow order.

    Every manually tracked section (including the Code Exercise) and the Pre-Quiz, when
    the experiment has one. Shared by experiment details and quiz submission.
    """
    completed_static = get_completed_section_keys(student_id, exp.id, db)
    pre_q = _quiz_of_type(exp, QuizType.pre)
    pre_missing = pre_q is not None and not _quiz_submitted(student_id, pre_q, db)

    # The order reflects the experiment flow. Change it only together with the
    # approved section ordering in the student workspace.
    missing: list[str] = []
    for key in ("overview", "aim-objectives"):
        if key not in completed_static:
            missing.append(STATIC_SECTION_LABELS[key])
    if pre_missing:
        missing.append("Pre-Quiz")
    for key in CONTENT_SECTION_KEYS:
        if key not in completed_static:
            missing.append(STATIC_SECTION_LABELS[key])
    return missing


def missing_assignment_prerequisites(
    student_id: uuid.UUID,
    exp: Experiment,
    db: Session,
) -> list[str]:
    """Return unmet prerequisites in the same order as the student workflow.

    All manually tracked sections (including the Code Exercise) are required.
    Pre/post quizzes are prerequisites when they are defined.
    This function is shared by experiment details, quiz access and submission.
    """
    missing = missing_post_quiz_prerequisites(student_id, exp, db)
    post_q = _quiz_of_type(exp, QuizType.post)
    if post_q is not None and not _quiz_submitted(student_id, post_q, db):
        missing.append("Post-Quiz")
    return missing


def score_is_revealed(quiz: Quiz) -> bool:
    """Apply the configured score-release policy for non-student-facing views."""
    if quiz.reveal_policy == RevealPolicy.immediate:
        return True
    if quiz.reveal_policy == RevealPolicy.after_deadline:
        return quiz.deadline is None or datetime.now(timezone.utc) >= quiz.deadline
    return False


def student_quiz_status(
    student_id: uuid.UUID, quiz: Quiz, db: Session
) -> tuple[bool, float | None]:
    """Return submitted status and the student-visible saved score.

    Pre/post quizzes use one best-score row and never store individual attempts.
    Assignments continue using their single accepted QuizSubmission record, and
    student assignment scores are visible immediately after submission.
    """
    if quiz.quiz_type in (QuizType.pre, QuizType.post):
        result = db.query(StudentQuizProgress).filter(
            StudentQuizProgress.student_id == student_id,
            StudentQuizProgress.quiz_id == quiz.id,
        ).first()
        return (result is not None, result.best_score if result is not None else None)

    submission = db.query(QuizSubmission).filter(
        QuizSubmission.student_id == student_id,
        QuizSubmission.quiz_id == quiz.id,
    ).first()
    return (submission is not None, submission.score if submission is not None else None)


def assignment_review(
    student_id: uuid.UUID, quiz: Quiz, db: Session
) -> list[QuestionReview] | None:
    """The student's own graded answers for a submitted assignment, else None.

    Returns None for pre/post quizzes and for an assignment this student has not
    submitted, so correct answers are never exposed before submission.
    """
    if quiz.quiz_type != QuizType.assignment:
        return None
    submission = db.query(QuizSubmission).filter(
        QuizSubmission.student_id == student_id,
        QuizSubmission.quiz_id == quiz.id,
    ).first()
    if submission is None:
        return None

    answers = {a.question_id: a for a in submission.answers}
    review: list[QuestionReview] = []
    for question in sorted(quiz.questions, key=lambda q: q.order_index):
        answer = answers.get(question.id)
        review.append(QuestionReview(
            question_id=question.id,
            selected_option_id=answer.selected_option_id if answer else None,
            correct_option_ids=[o.id for o in question.options if o.is_correct],
            is_correct=bool(answer and answer.is_correct),
        ))
    return review
