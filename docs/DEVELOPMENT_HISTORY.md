# Development History

What was built, in order. Each step that changed the database came with a one-off script in `backend/scripts/`
(see the README, "Upgrading an existing database").

## Student console
1. **Section completion**: `SectionCompletion` table and **Mark Completed** saved in the database; Title / Overview
   section with `experiments.overview`; assignment prerequisites include the manual sections and Guided Lab.
   (`migrate_student_section_tracking`)
2. **Quiz best score**: Pre-Quiz and Post-Quiz keep one best-score record per student and quiz in
   `student_quiz_progress`; no attempt history. (`migrate_quiz_best_score_only`)
3. **Quiz screens**: Start Now screen, This Attempt versus My Best Score, completion tick after the saved status is
   fetched back.
4. **Fixes**: Code Exercise tick and saved state restored; the Assignment click re-fetches status from the backend;
   the experiment status rule based on ticks only; experiment numbers fixed to 1 to 10 (`order_index`, unique).
5. **Code editor fixes**: valid `from ... import ...` lines accepted; `if __name__ == "__main__":` blocks run; the
   button reads Submit.
6. **Navigation**: new navbar with profile menu, Home page, Experiments page, left sidebar inside an experiment,
   read-only Profile page.
7. **Progress**: View Progress with overall percentage and expandable experiments, Assignment Scores page, circles
   instead of ticks, review of a submitted assignment (correct answer, own answer, Correct/Incorrect).

## Instructor console
8. **Backend**: instructor-only `/instructor/*` API, one instructor per batch (unique `batch_id`; a second assignment
   returns 409), admins removed from instructor endpoints, instructor tests. (`migrate_one_instructor_per_batch`)
9. **Shell**: instructor navbar, Home, Batches cards, batch workspace with Batch information and student list.
10. **Experiments section**: sidebar submenu, read-only experiment content with answer keys, Students Status table.
11. **Assignment section**: assignment page, Assignment Status table, submission page.
12. **Excel downloads**: both downloads are `.xlsx` with merged detail rows on top (`openpyxl`).
13. Shared helpers: `utils/contentFormat.js` (video links and theory text for both consoles), `DataTable`
    (search, sorting, 25 per page), `AnswerKey`.

## Content
14. **Code Exercise problem statement**: optional `experiments.code_problem_statement`, shown above the editor.
    (`migrate_code_problem_statement`)
15. **Linear Regression experiment**: loaded as experiment 8 with `scripts/load_linear_regression.py`
    (Pre-Quiz, Post-Quiz and Assignment of 10 questions each; Code Exercise on the Salary dataset with
    `random_state=42`, answer stored in `result`).
16. **Code Exercise by Mark Completed**: the Code Exercise is completed with Mark Completed like Theory and Video and counts
    for every experiment; Submit only shows a verdict, and a code match is no longer needed to unlock the
    Assignment. The editor starts with a minimal snippet (`result = None`). Experiments can name a dataset file
    (`experiments.code_dataset_url`) that is copied into the browser's Python environment; the Linear Regression dataset is
    `frontend/public/datasets/Salary_dataset.csv`. (`migrate_code_dataset_url`)

## Appearance
17. **UI restyle**: teal-green theme and a cleaner look for all built pages (navbar, login, student pages, instructor
    pages, quiz and code editor panels), done with CSS only. No feature, text, route or behaviour changed.

## Admin console
18. **Admin console**: admin-only `/admin/*` API and pages. Batches (create, edit, archive/restore), one instructor per batch
    with replace and remove, instructors (add, edit), students (edit, move, one batch per student), student import from
    CSV or Excel with a preview and a download of rows with problems, temporary-password invitations with a saved
    result and resend, deactivate/reactivate. Instructors can no longer add students. The old `/batches` endpoints,
    `/auth/instructors`, `/auth/users` and the old admin panel were removed. (`migrate_admin_console`)
19. **Accounts**: a form to add a single student (batch page and Students page), a read-only Profile for every role with a
    Change password link, and forgot password (single-use link, neutral reply, rate limited, reset link printed in the
    console while email is off). (`migrate_password_reset`)
20. **Code Exercise result**: after Submit the student sees their own output and a Correct or Incorrect verdict.
21. **Security hardening**: lockout after 5 wrong passwords, a generous per-address limit on the sign-in endpoints, login tokens that
    end on logout, password change/reset and deactivation (`token_version`), the same error for unknown emails and wrong
    passwords, API docs off in production, and removal of the unused `GET /quizzes/{id}` endpoint. (`migrate_security`)
22. **Editor files, tests and loading**: the code editor can use its own copy of Pyodide and Monaco (`npm run setup:editor`), frontend
    unit tests (Vitest) and end-to-end smoke tests (Playwright), pages loaded on demand with shared libraries in their own files, and
    short user guides for each role.

