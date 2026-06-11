Final project structure — Personal Expense Tracker

Top-level layout (final):

- app.py                # Flask application factory / routes registration
- auth.py               # Authentication blueprint (register/login/logout)
- config.py             # Configuration and constants
- models.py             # DB access helpers and models (sqlite)
- requirements.txt      # Python dependencies
- schema.sql            # DB schema (for sqlite)
- instance/             # Instance folder for runtime DB and local config
  - .keep
- static/               # Static assets
  - style.css
  - charts.js
  - currencies.json
  - (other JS/CSS/images)
- templates/            # Jinja2 templates
  - base.html
  - dashboard.html
  - expenses.html
  - login.html
  - register.html
- venv/                 # (optional) local virtual environment (not committed)
- .git/                 # git repo

Docs & helper files (added):

- README.md             # Project overview, setup, and run instructions
- .gitignore            # Files to ignore in git
- PROJECT_STRUCTURE.md  # (this file) final structure and notes

Notes & recommendations
- Keep `instance/` out of version control; use `.keep` to ensure folder exists.
- Consider moving to a package layout (e.g., `tracker/` package) if project grows.
- Persist user currency preference in DB (optional enhancement) and add an admin seed script for currencies.

Running locally
1. Create and activate virtualenv (Windows PowerShell):

   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt

2. Initialize DB (only if schema.sql changed):

   sqlite3 instance/expenses.db < schema.sql

3. Run the app:

   set FLASK_APP=app.py
   set FLASK_ENV=development
   flask run

(Replace `set` with PowerShell `$env:FLASK_APP = 'app.py'` if using PowerShell.)
