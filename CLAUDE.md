# CLAUDE.md

Context for anyone (human or AI) working on this repo. Read this before
making changes — it explains decisions that aren't obvious from the code
alone.

## What this is
A web-based ML Virtual Lab: 10 Machine Learning experiments, each with an
overview, aim, a video, theory, a guided lab, a code exercise, a pre-quiz, a
post-quiz, and a graded assignment.
Linked from the university LMS but run as an independent app — its own
accounts, data, and hosting.

Three roles: **student** (added by the admin from a file, never
self-registers), **instructor** (created by the admin, scoped to their
assigned batch(es) only), **admin** (manages batches, instructors and students;
no access to the instructor console, no experiment management for now).

## Tech stack
- **DB**: PostgreSQL, SQLAlchemy 2.0 (declarative, `Mapped[...]` style)
- **Backend**: FastAPI (Python), Pydantic v2 for schemas
- **Frontend**: React + Vite, Monaco editor, Pyodide (Python-in-WASM)
- **Auth**: JWT bearer tokens (no sessions, no refresh tokens — see below)

## Non-obvious decisions (don't "fix" these without discussing)

**Code execution is 100% client-side.** Student code runs in the browser
via Pyodide, inside a Web Worker. The backend never executes student code
and has no sandbox, no job queue, no Celery/Redis. `POST /code_submissions`
only *compares* the output the browser already computed against a hidden
expected answer (`ExperimentEvaluationSpec`, admin/instructor-only,
never serialized to a student-facing response). This is why the earlier
"Docker sandbox" design was dropped — don't reintroduce server-side
execution.

**No self-registration.** Only the admin creates accounts (`/admin/*`). New students
(from a CSV/Excel file) and new instructors get a `User` with a random temporary
password (`must_change_password = True`) and a background email with that password
(`app/core/mailer.py`), whose result (sent / failed / console) is saved in
`users.credentials_status`. "Resend invitation" issues a new temporary password; it never
creates another account. `get_current_active_user` (in `app/core/deps.py`) blocks every
endpoint except login/me/change-password until the temporary password has been changed.
Account state shown to the admin: Invited (`must_change_password`), Active, Deactivated
(`is_active = false`).

**IDs are UUIDs, not auto-increment ints** — avoids sequential IDs being
guessable/enumerable in a public-ish API.

**Roles are enforced with FastAPI dependencies, not decorators or
middleware**: `require_roles(UserRole.admin, ...)` in
`app/core/deps.py`. An instructor's batch-scoping (only their own assigned
batches) is checked per-endpoint, not just per-role — see `_own_batch` in
`app/routers/instructor.py` as the pattern to copy for any new instructor-facing,
batch-scoped endpoint.

## Folder structure
```
backend/
  app/
    core/        # security.py (hashing/JWT), deps.py (auth deps), mailer.py
    models/      # SQLAlchemy ORM — one file per module's tables
    schemas/     # Pydantic request/response models — mirrors models/
    routers/     # one file per module (auth, batches, experiments, quizzes,
                 # code_submissions, dashboards, instructor)
    services/    # progress.py (status/prerequisite rules), section_tracking.py,
                 # exports.py (Excel downloads)
    config.py    # all env vars, one Settings object
    database.py  # engine/session/Base
    main.py      # FastAPI app + router registration
  scripts/       # one-off CLI scripts: create_admin, seeders, migrate_*,
                 # load_linear_regression (+ its content module)
  tests/         # pytest suite
  requirements.txt / requirements-dev.txt
frontend/
  src/
    pages/       # one file per route in App.jsx (student, instructor, admin)
    api/         # axios calls, one file per backend module
    editor/      # Monaco + Pyodide (client-side execution)
    components/  # shared UI (Layout, Navbar, QuizPanel, DataTable, AnswerKey, ...)
    constants/   # section names and order
    content/     # editable Home page text (student and instructor)
    utils/       # shared helpers (content formatting, downloads, score format)
docs/            # STUDENT_CONSOLE.md, INSTRUCTOR_CONSOLE.md, DEVELOPMENT_HISTORY.md
```

## Conventions
- **Emails are always stored/compared lowercase.** Normalize at the
  boundary (schema or router), not scattered through business logic.
- **Passwords**: bcrypt via `app/core/security.py`'s `hash_password` /
  `verify_password`. Never log or return a plaintext password anywhere
  except the one background email at creation time.
- **Errors**: raise `HTTPException` with a plain-English `detail` string;
  don't leak which specific field/reason failed for auth endpoints (e.g.
  login returns the same 401 for "no such user" and "wrong password").
  Use 409 for uniqueness conflicts, 422 for validation, 403 for
  role/ownership failures, 404 for missing resources.
- **New tables** need: `UUIDPKMixin` + (usually) `TimestampMixin` from
  `app/models/common.py`, an entry in `app/models/__init__.py`'s
  `__all__`, and — as there is no Alembic — a one-off script in
  `backend/scripts/` (`migrate_*.py`, safe to re-run) for databases that
  already exist. A fresh DB gets everything from `init_db.py` (`create_all`).
- **New endpoints**: add the Pydantic schema in `schemas/`, the route in
  the matching `routers/` file, and update `openapi.yaml` in the same PR
  — the spec is meant to stay accurate, not aspirational.
- **Background work** (anything that shouldn't block the response, like
  sending email) goes through FastAPI's `BackgroundTasks`, following the
  pattern in `routers/admin.py`'s `_invite`.

## Running locally
```bash
docker compose up -d postgres
cd backend && pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
python init_db.py
python -m scripts.create_admin --email admin@college.edu --name "Admin" --password "ChangeMe123"
uvicorn app.main:app --reload
```
`EMAIL_ENABLED=false` (the `.env.example` default) prints generated
passwords to the console instead of sending mail — no SMTP needed for
local dev.

```bash
cd frontend && npm install && npm run dev
```

## Testing status
A pytest suite lives in `backend/tests` (SQLite test DB via `conftest.py`).
Run it from `backend` with the virtual environment active: `python -m pytest -q`.
It covers section completion, quiz best-score rules, assignment locking, status
rules, role access, the instructor console API and Excel downloads, one instructor
per batch, the code problem statement and the Linear Regression experiment loader.
New endpoints should add tests there and also be checked manually via `/docs`.
The frontend has no automated tests yet; `npm run build` is the minimum check.

## What's implemented
- **Backend**: auth (login/me/change-password), experiments (with their quizzes), quizzes
  (submit + assignment lock), code_submissions, student dashboard, the instructor console
  API (`/instructor/*`) and the admin console API (`/admin/*`).
- **Frontend**: student console, instructor console, admin console (batches, instructors,
  students, student import), change-password.
- Consoles are described in `docs/STUDENT_CONSOLE.md`, `docs/INSTRUCTOR_CONSOLE.md` and
  `docs/ADMIN_CONSOLE.md`;
  pending work is listed in the README ("Pending work").
- `openapi.yaml` documents the API; its `x-status` markers can lag behind the code, so
  check the router file itself for what is actually live.
- `GET /dashboards/instructor` and `GET /dashboards/instructor/export` (the older
  instructor dashboard) still exist, for instructors only. No page uses them any more.

## Role and quiz rules (keep in sync with the code)
- **Roles**: student, instructor, admin. Students take quizzes, submit code and
  see their own progress. Instructors and admins only *view*: they cannot submit
  quizzes or code, and `/dashboards/student` is students-only (the frontend
  hides "My Progress").
- **Instructor scope**: the instructor console lives under `/instructor/*` and is
  for instructors only (admins and students get 403). An instructor reaches only
  their own batches. **One instructor per batch** is enforced (unique `batch_id`
  on `instructor_assignments`; assigning a second instructor returns 409), while
  one instructor can have several batches. The admin changes instructors through
  `PUT/DELETE /admin/batches/{id}/instructor` (replace / remove in one transaction).
  A student belongs to exactly one batch (`enrollments.student_id` is unique); moving a
  student keeps their progress and scores (they belong to the student, not the batch).
  Archived batches (`batches.is_archived`) are hidden from lists and from instructors;
  users are deactivated, never deleted. Deactivated students stay visible to their
  instructor with an Inactive label.
- **Instructor views**: published experiments only; read-only content with answer
  keys; Students Status (Not Attempted / In Progress / Completed by the student
  tick rule); Assignment Status with saved percentage immediately (reveal policy
  ignored) and per-student submission review; the download is an Excel (.xlsx)
  file (`app/services/exports.py`, openpyxl) for only the open experiment or
  assignment, with batch, academic year, experiment number and name in merged
  cells on top of a URN / Student Name / Status-or-Marks table.
- **Pre/post quizzes**: self-assessment, unlimited attempts. Persist one best-score
  record per student/quiz; do not store individual attempt or answer history. The
  student sees only the best score. Current-submission correctness may be returned
  transiently for immediate feedback.
- **Assignment**: one accepted submission only (409 on a second). Its score is
  visible to the submitting student immediately. It is locked, and its
  questions are hidden, until all manual sections (including the Code Exercise)
  are marked complete and the pre-quiz and post-quiz are submitted (see
  `missing_assignment_prerequisites` in `app/services/progress.py`). A code
  match is not required. The server enforces this; the UI only mirrors it. A
  quiz the experiment does not have is skipped.
- **Code Exercise**: completed with **Mark Completed** (section key `code-exercise`), like Theory
  and Video, and counted for every experiment. The editor and Submit button remain: the student's
  answer is the value of the variable `result`, computed in the browser and compared by the
  backend with the hidden `ExperimentEvaluationSpec` result (exact comparison for now), and
  Submit shows the student's own output and a Correct/Incorrect verdict. A match does not tick the section.
  `experiments.code_problem_statement` (optional) is shown above the editor and
  `experiments.code_dataset_url` (optional) names a dataset file that the code runner copies into
  the browser's Python environment under its file name. The expected result is never sent to students.
- **Experiment content**: `seed_experiments.py` creates demo content; `scripts/load_linear_regression.py`
  (content in `scripts/linear_regression_content.py`) replaces experiment 8 with the real
  Linear Regression experiment and is safe to re-run.
- **Experiments are fixed (1-10)**: `order_index` is the experiment number. It must be
  1-10, unique, and cannot be changed after creation (the update schema ignores it).
- **Experiment status (ticks only)**: Not Attempted (`not_started`) = no section ticked in the database;
  In progress = at least one ticked but not all; Completed = every configured section
  ticked, including the assignment. A section is ticked when: manual sections have a
  saved `SectionCompletion` (this includes the Code Exercise); a quiz is submitted at least
  once; the assignment has an accepted submission. Code submissions are not progress.
- **Assignment lock check**: the student UI re-fetches the experiment from the backend
  every time the Assignment is clicked; the server also re-checks on view and submit.
- **Overall progress (View Progress)**: completed sections / all configured sections across
  the published experiments, as a whole-number percentage (100% only when every section is
  complete). Per experiment only the status is shown (Not Attempted / In Progress /
  Completed), plus the list of sections with an empty/filled circle.
- **Assignment Scores page**: exactly three columns (Experiment No., Experiment Name,
  Assignment Score). Cell = score %, "Not Submitted", or "Assignment not Available" when
  the experiment has no assignment.
- **Submitted assignment review**: after submitting, the student can reopen the assignment
  and see each question with the correct answer, their own answer and Correct/Incorrect.
  `my_review` is returned only to the submitting student and only after submission.


## UI styling
The look of the app is defined by the CSS variables in `frontend/src/styles/global.css`
(teal-green palette, radii, shadows, font stack). Change the colours there and every page
follows. Shared pieces (buttons, forms, cards, badges, tables, alerts, login card) are in the
same file; the navbar is `components/Navbar.css`. Page stylesheets end with an "Appearance
refresh" block. Styling changes do not touch behaviour, text or routes. No UI or icon
packages are used.

## Security notes
- Sign-in lockout and token versioning are in `app/routers/auth.py` and `app/core/deps.py`; the per-IP limiter is
  `app/core/ratelimit.py` (in memory, per process). Tests reset it in `tests/conftest.py`.
- Anything that should end a user's logins bumps `users.token_version` (logout, password change/reset, admin reset, deactivation).
- `GET /quizzes/{quiz_id}` was removed (nothing used it); quiz data reaches students only through `GET /experiments/{slug}` and
  instructors through `/instructor/*`.
- API docs are off when `ENV=production` (`create_app` in `app/main.py`).
