# ML Virtual Lab

A web-based virtual lab for Machine Learning experiments. Students work through experiments (overview,
aim, quizzes, video, theory, guided lab, code exercise, assignment). Instructors follow their batch's
experiment status and assignment results. Admins manage the system.

Linked from the university LMS but run as an independent app with its own accounts and data.

## Roles
| Role | What they can do today |
|---|---|
| **Student** | Home, Experiments, View Progress (with Assignment Scores), Profile. Completes experiments and submits quizzes, code and assignments. |
| **Instructor** | Home, Batches, Profile. For their own batch: student list, read-only experiment content with answer keys, Students Status, Assignment Status, submission review, Excel downloads. |
| **Admin** | Home, Batches, Instructors, Students, Profile. Creates batches, adds instructors, imports students from a CSV or Excel file, assigns or replaces a batch's instructor, moves students between batches, resends invitations, deactivates users and archives batches. |

Nobody registers themselves. See "Auth and onboarding" below.

## Stack
- **Database**: PostgreSQL
- **Backend**: FastAPI + SQLAlchemy 2.0 (models in `backend/app/models/`), Pydantic v2, openpyxl for Excel downloads
- **Frontend**: React (Vite), Monaco editor, Pyodide (Python in the browser)

Student code runs fully in the browser (Monaco + Pyodide in a Web Worker). The backend never executes
student code. It stores the output the browser computed and compares it with a hidden expected result
(`ExperimentEvaluationSpec`). See `backend/app/models/code_submission.py`.

## Local setup
```bash
# 1. Postgres
docker compose up -d postgres

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate      # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env        # edit DATABASE_URL / JWT_SECRET_KEY if needed
python init_db.py           # creates all tables
python -m scripts.create_admin --email admin@college.edu --name "Admin" --password "Admin@123"
uvicorn app.main:app --reload

# 3. Frontend
cd ../frontend
npm install
npm run dev
```
Backend: http://localhost:8000/docs · Frontend: http://localhost:5173

## Seed data (development)
```bash
cd backend
source venv/bin/activate
export PYTHONPATH=.
python scripts/seed_experiments.py     # 10 experiments with demo content
python scripts/seed_data.py            # admin, instructors, students, batches
python -m scripts.load_linear_regression   # real content for experiment 8 (see below)
```
Seed credentials created by `seed_data.py`:
- Admin: `admin@college.edu` / `AdminPass123!`
- Instructors: `instructor1@college.edu` to `instructor5@college.edu` / `InstPass123!`
- Students: `student1@college.edu` to `student15@college.edu` / `StudPass123!`

Seeded students have `must_change_password=False` so you can log in immediately.

### Experiment content
- `seed_experiments.py` creates the ten experiments with demo content.
- `scripts/load_linear_regression.py` replaces the demo experiment numbered 8 with the Linear Regression
  experiment (overview, aim, objectives, video, theory with references, Pre-Quiz, Post-Quiz and Assignment
  of 10 questions each, and the Code Exercise with its hidden expected result). The text is in
  `scripts/linear_regression_content.py`; edit it and re-run the loader. Other experiments are not touched.
- The Code Exercise dataset file lives in `frontend/public/datasets/` (`Salary_dataset.csv`) and is served by the app.
  The code runner copies it into the browser's Python environment, so students read it with
  `pd.read_csv("Salary_dataset.csv")`.

## Upgrading an existing database
`init_db.py` creates all tables for a new database. For a database created earlier, run the one-off
scripts that apply (each is safe to re-run), from `backend/` with the virtualenv active:
```bash
python -m scripts.migrate_student_section_tracking   # section_completions table, experiments.overview
python -m scripts.migrate_quiz_best_score_only       # student_quiz_progress table
python -m scripts.migrate_one_instructor_per_batch   # one instructor per batch (stops if a batch has two)
python -m scripts.migrate_code_problem_statement     # experiments.code_problem_statement
python -m scripts.migrate_code_dataset_url           # experiments.code_dataset_url
python -m scripts.migrate_admin_console              # invitation status, archived batches, one batch per student
python -m scripts.migrate_password_reset             # password_reset_tokens (forgot password)
python -m scripts.migrate_security                   # sign-in lockout and token version columns on users
```
`migrate_admin_console` keeps each student's earliest batch if a student is enrolled in more than one and deletes
the other enrolments (no backup).
There is no automated migration tool; schema changes are applied with these scripts.

## Tests and checks
```bash
cd backend && pip install pytest httpx   # once, test tools
cd backend && python -m pytest -q          # backend test suite (SQLite test database)
cd frontend && npm install && npm test     # frontend unit tests (Vitest)
cd frontend && npm run build               # frontend build check
cd frontend && npx playwright install chromium && npm run test:e2e   # end-to-end smoke tests (backend and frontend running, seed data loaded)
```

## Code editor files (offline)
By default the code editor loads Pyodide (Python in the browser), its Python packages and the Monaco editor from a public CDN.
To make the app work without the internet, run once on the machine that builds the frontend:
```bash
cd frontend
npm install
npm run setup:editor        # downloads Pyodide + numpy, pandas, scikit-learn into public/pyodide, copies Monaco into public/monaco
```
then build or run with `VITE_SELF_HOST_EDITOR=true` (for example in `frontend/.env.production`). The worker already prefers
`/pyodide/` and falls back to the CDN if it is missing. Both folders are ignored by Git. To allow another Python package in an
experiment, add it to `PACKAGES` in `frontend/scripts/download-editor-assets.mjs` and run the setup again.

## Sign-in protection
- **Lockout:** 5 wrong passwords lock an account for 15 minutes (`MAX_FAILED_LOGINS`, `LOCKOUT_MINUTES`). A password reset, an admin
  reset or "Forgot password?" unlocks it. Unknown emails, deactivated accounts and wrong passwords all give the same "Invalid credentials".
- **Per-address limit:** sign-in, forgot-password and reset-password are limited per IP address (`AUTH_RATE_LIMIT_PER_MINUTE`, 120 by
  default because a college may share one address). This limit is kept in memory per server process.
- **Old logins end:** logging out, changing or resetting a password, an admin resetting a password and deactivating an account all
  stop earlier login tokens from working (`users.token_version`). Logging out signs out every device of that user.
- **API docs:** `/docs`, `/redoc` and `/openapi.json` are switched off when `ENV=production`.

## Pre-commit (run once per clone, in repo root)
```bash
pip install -r backend/requirements-dev.txt
pre-commit install
```
Every `git commit` then runs formatting/lint (ruff for Python, Prettier for JS) and basic hygiene checks.
Run it manually with `pre-commit run --all-files`.

## Auth and onboarding
There is no self-registration. Only the admin creates accounts. New students (imported from a CSV or Excel
file with the columns URN, Name and Email) and new instructors receive a random temporary password by email
(`app/core/mailer.py`) and must change it at their first login. With `EMAIL_ENABLED=false` (the `.env.example`
default) the password is printed to the backend console instead, and the admin screens show that the email is off.
The admin console also shows whether each invitation email was sent or failed and can resend it (a new temporary
password; no second account is created).

**Forgot password**: the login page has a "Forgot password?" link. It emails a single-use link that expires in 30 minutes
(only a hash of the link is stored). The reply is the same for every email address, deactivated accounts get no link,
and an account gets at most 3 links per 15 minutes. With `EMAIL_ENABLED=false` the link is printed in the backend console.

The first login goes to the change-password page; the server blocks every other endpoint until the password is
changed (`get_current_active_user` in `app/core/deps.py`).

Login tokens are JWTs stored in the browser (8 hours); there are no refresh tokens. Each token carries the user's current
token version, so logging out, changing or resetting a password and deactivation end earlier logins immediately.

## What is built
**Student console** (details: `docs/STUDENT_CONSOLE.md`)
- Navbar: Home, Experiments, View Progress, profile menu (My Profile, Log out)
- Experiments page and an experiment page with a left sidebar of sections, each marked with an empty or filled circle
- Section completion saved in the database (Mark Completed, including the Code Exercise), Pre-Quiz / Post-Quiz with
  best score only, a Code Exercise editor with Submit feedback, Assignment with prerequisite locking and a one-time
  submission, review of the submitted assignment
- View Progress (overall percentage, expandable experiment list) and Assignment Scores
- Profile (read-only: name, email, URN and batch for students) with a Change password link

**Admin console** (details: `docs/ADMIN_CONSOLE.md`)
- Navbar: Home, Batches, Instructors, Students, profile menu
- Batches: create, edit, archive and restore; assign, replace or remove the one instructor
- Students: add one student with a form, or import from a CSV or Excel file with a preview; edit, move to another batch, resend invitation,
  deactivate and reactivate; one batch per student
- Instructors: add, edit, resend invitation, deactivate and reactivate
- Invitation email result and account state (Invited, Active, Deactivated) for every user
- Nothing is deleted permanently

**Instructor console** (details: `docs/INSTRUCTOR_CONSOLE.md`)
- Navbar: Home, Batches, profile menu
- Batch cards, batch information and student list (URN, Name) with search, sorting and pagination
- Experiments: read-only content with answer keys and a Students Status table
- Assignment: questions with answers, an Assignment Status table, and a page for each student's submission
- Excel (.xlsx) downloads for the open experiment or assignment
- One instructor per batch, enforced in the database; instructor pages are for instructors only

## Database schema
Tables by module (`backend/app/models/` is the source of truth):
- **Users**: `users`
- **Batches**: `batches`, `enrollments`, `instructor_assignments`
- **Content**: `experiments`, `experiment_evaluation_specs`
- **Quiz engine**: `quizzes`, `questions`, `options`
- **Assignment submissions (one per student)**: `quiz_submissions`, `quiz_answers`
- **Pre/Post quiz best score only**: `student_quiz_progress`
- **Manual section completion**: `section_completions`
- **Code exercises**: `code_submissions`

All tables use UUID primary keys.

## Pending work
These items are not finished yet:
1. **Home texts**: the student Home text in `frontend/src/content/homeContent.js` is a draft, and the instructor Home text in
   `frontend/src/content/instructorHomeContent.js` is placeholder text. The admin Home shows the general Machine Learning text.
   The final texts are still to be provided.
2. **Experiment content**: only experiment 8 (Linear Regression) has real content. The other experiments still have the
   demo content from `seed_experiments.py`, and no Guided Lab content has been added yet.

## Documentation
- `docs/STUDENT_CONSOLE.md` — how the student console works
- `docs/INSTRUCTOR_CONSOLE.md` — how the instructor console works
- `docs/ADMIN_CONSOLE.md` — how the admin console works
- `docs/GUIDE_STUDENT.md`, `docs/GUIDE_INSTRUCTOR.md`, `docs/GUIDE_ADMIN.md` — short user guides for each role
- `docs/DEVELOPMENT_HISTORY.md` — what was built, in order
- `CLAUDE.md` — developer notes and the rules the code follows
- `openapi.yaml` — API reference
- `CONTRIBUTING.md` — branch, pull request and commit rules
