Personal Expense Tracker

Quick start

1. Create a virtual environment and activate it (PowerShell):

   python -m venv venv
   .\venv\Scripts\Activate.ps1

2. Install dependencies:

   pip install -r requirements.txt

3. Create instance DB (if not present):

   mkdir instance
   sqlite3 instance/expenses.db < schema.sql

4. Run the app (PowerShell):

   $env:FLASK_APP = 'app.py'
   $env:FLASK_ENV = 'development'
   flask run

Project layout

See PROJECT_STRUCTURE.md for the final folder and file layout and descriptions.

Contributing

- Ensure `instance/` contains runtime DB files and is ignored by git.
- Run tests (if added) and keep dependencies in `requirements.txt`.

License

Add a license file if you intend to open-source the project.
