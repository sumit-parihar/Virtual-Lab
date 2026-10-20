# Code Exercise problem statement field

Adds an optional `code_problem_statement` text to each experiment. When set, it is shown above the code
editor in the student's Code Exercise section (same text formatting as Theory). Nothing else changes.

## Apply
```powershell
$repo = "D:\Virtual Lab\ML-Virtual-Lab"
$zip = "$env:USERPROFILE\Downloads\ML-Virtual-Lab-code-problem-statement-patch.zip"
Expand-Archive -LiteralPath $zip -DestinationPath $repo -Force
cd "$repo\backend"
.\venv\Scripts\Activate.ps1
python -m scripts.migrate_code_problem_statement
python -m pytest -q
cd "$repo\frontend"
npm run build
```

## Files
New: `backend/scripts/migrate_code_problem_statement.py`, `backend/tests/test_code_problem_statement.py`
Changed: `backend/app/models/experiment.py`, `backend/app/schemas/experiment.py`,
`frontend/src/pages/ExperimentPage.jsx`, `frontend/src/pages/ExperimentPage.css`
