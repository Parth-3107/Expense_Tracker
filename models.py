import sqlite3
from datetime import datetime, date
from contextlib import contextmanager
from flask import g
from config import Config

@contextmanager
def get_db():
    conn = sqlite3.connect(Config.DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        with open('schema.sql','r') as f:
            conn.executescript(f.read())
        conn.commit()

class User:
    @staticmethod
    def create(username, email, password_hash):
        with get_db() as conn:
            cursor = conn.cursor()
            try: 
                cursor.execute('''
                    INSERT INTO users (username, email, password_hash)
                    VALUES (?, ?, ?)
                ''',(username, email, password_hash))
                conn.commit()
                return cursor.lastrowid
            except sqlite3.IntegrityError:
                return None
    @staticmethod
    def find_by_id(user_id):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT* FROM users WHERE id = ?',(user_id,))
            return cursor.fetchone()

    @staticmethod
    def find_by_username(username):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?',(username,))
            return cursor.fetchone()

    @staticmethod
    def find_by_email(email):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?',(email,))
            return cursor.fetchone()

class Expense:
    @staticmethod
    def create(user_id, amount, category, description, expense_date):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO expenses (user_id, amount, category, description, expense_date)
                VALUES(?, ?, ?, ?, ?)
            ''',(user_id, amount, category, description, expense_date))      
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def find_by_id(expense_id, user_id):
        """Find expense by ID (scoped to user)"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM expenses 
                WHERE id = ? AND user_id = ?
            ''', (expense_id, user_id))
            return cursor.fetchone()
    
    @staticmethod
    def find_by_user(user_id, limit=None, offset=None):
        """Get all expenses for a user"""
        with get_db() as conn:
            cursor = conn.cursor()
            query = 'SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC'
            params = [user_id]
            
            if limit:
                query += ' LIMIT ?'
                params.append(limit)
            if offset:
                query += ' OFFSET ?'
                params.append(offset)
            
            cursor.execute(query, params)
            return cursor.fetchall()  

    @staticmethod
    def find_by_month(user_id, year, month):
        """Get expenses for specific month"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM expenses 
                WHERE user_id = ? 
                AND strftime('%Y', expense_date) = ? 
                AND strftime('%m', expense_date) = ?
                ORDER BY expense_date DESC
            ''', (user_id, str(year), f'{month:02d}'))
            return cursor.fetchall()
    
    @staticmethod
    def update(expense_id, user_id, amount, category, description, expense_date):
        """Update an existing expense"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE expenses 
                SET amount = ?, category = ?, description = ?, expense_date = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            ''', (amount, category, description, expense_date, expense_id, user_id))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def delete(expense_id, user_id):
        """Delete an expense"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM expenses WHERE id = ? AND user_id = ?', 
                         (expense_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def get_category_summary(user_id, year, month):
        """Get expense summary by category for a month"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT category, SUM(amount) as total, COUNT(*) as count
                FROM expenses
                WHERE user_id = ? 
                AND strftime('%Y', expense_date) = ? 
                AND strftime('%m', expense_date) = ?
                GROUP BY category
                ORDER BY total DESC
            ''', (user_id, str(year), f'{month:02d}'))
            return cursor.fetchall()

    @staticmethod
    def get_monthly_totals(user_id, year):
        """Get total expenses per month for a year"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT strftime('%m', expense_date) as month, 
                       SUM(amount) as total,
                       COUNT(*) as count
                FROM expenses
                WHERE user_id = ? AND strftime('%Y', expense_date) = ?
                GROUP BY month
                ORDER BY month
            ''', (user_id, str(year)))
            return cursor.fetchall()
    
    @staticmethod
    def get_total_by_category_all_time(user_id):
        """Get all-time totals by category"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT category, SUM(amount) as total, COUNT(*) as count
                FROM expenses
                WHERE user_id = ?
                GROUP BY category
                ORDER BY total DESC
            ''', (user_id,))
            return cursor.fetchall()