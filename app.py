# app.py - Main Flask application
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from datetime import datetime, timedelta
import json
from config import config
from models import Expense, User, init_db
from auth import auth_bp
import os
from flask import jsonify

# Create Flask app
app = Flask(__name__)

# Load configuration
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Set secret key for sessions
app.secret_key = app.config['SECRET_KEY']

# Register blueprints
app.register_blueprint(auth_bp)

# Initialize database if it doesn't exist
if not os.path.exists(app.config['DATABASE']):
    os.makedirs(os.path.dirname(app.config['DATABASE']), exist_ok=True)
    init_db()

# Context processor for templates
@app.context_processor
def utility_processor():
    """Make common variables available to all templates"""
    def get_current_datetime():
        return datetime.now()
    return dict(now=get_current_datetime())

# Helper function to check login
def login_required(f):
    """Decorator to check if user is logged in"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

# Main routes
@app.route('/')
def index():
    """Landing page"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard with charts and summary"""
    return render_template('dashboard.html', 
                         username=session.get('username'),
                         current_year=datetime.now().year,
                         current_month=datetime.now().month)

@app.route('/expenses')
@login_required
def expenses_page():
    """Expenses list and management page"""
    return render_template('expenses.html',
                         username=session.get('username'))

# API Endpoints for expenses
@app.route('/api/expenses', methods=['GET'])
@login_required
def api_get_expenses():
    """Get expenses with filters"""
    user_id = session['user_id']
    
    # Get query parameters
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    limit = request.args.get('limit', type=int)
    
    if month and year:
        expenses = Expense.find_by_month(user_id, year, month)
    else:
        expenses = Expense.find_by_user(user_id, limit=limit)
    
    # Convert to list of dicts for JSON response
    expenses_list = []
    for expense in expenses:
        expenses_list.append({
            'id': expense['id'],
            'amount': expense['amount'],
            'category': expense['category'],
            'description': expense['description'],
            'expense_date': expense['expense_date'],
            'created_at': expense['created_at']
        })
    
    return jsonify(expenses_list)

@app.route('/api/expenses', methods=['POST'])
@login_required
def api_create_expense():
    """Create a new expense"""
    data = request.json
    user_id = session['user_id']
    
    # Validate required fields
    required_fields = ['amount', 'category', 'expense_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    try:
        expense_id = Expense.create(
            user_id=user_id,
            amount=float(data['amount']),
            category=data['category'],
            description=data.get('description', ''),
            expense_date=data['expense_date']
        )
        return jsonify({
            'id': expense_id,
            'message': 'Expense created successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def api_update_expense(expense_id):
    """Update an existing expense"""
    data = request.json
    user_id = session['user_id']
    
    # Check if expense exists and belongs to user
    expense = Expense.find_by_id(expense_id, user_id)
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    success = Expense.update(
        expense_id=expense_id,
        user_id=user_id,
        amount=float(data.get('amount', expense['amount'])),
        category=data.get('category', expense['category']),
        description=data.get('description', expense['description']),
        expense_date=data.get('expense_date', expense['expense_date'])
    )
    
    if success:
        return jsonify({'message': 'Expense updated successfully'})
    return jsonify({'error': 'Update failed'}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def api_delete_expense(expense_id):
    """Delete an expense"""
    user_id = session['user_id']
    success = Expense.delete(expense_id, user_id)
    
    if success:
        return jsonify({'message': 'Expense deleted successfully'})
    return jsonify({'error': 'Expense not found'}), 404

@app.route('/api/summary/<int:year>/<int:month>')
@login_required
def api_get_summary(year, month):
    """Get expense summary for a specific month"""
    user_id = session['user_id']
    
    # Get category summary
    categories = Expense.get_category_summary(user_id, year, month)
    total = sum(cat['total'] for cat in categories)
    
    # Get all expenses for the month (for trends)
    expenses = Expense.find_by_month(user_id, year, month)
    
    return jsonify({
        'categories': [dict(cat) for cat in categories],
        'total': float(total),
        'month': month,
        'year': year,
        'expense_count': len(expenses)
    })

@app.route('/api/trends/<int:year>')
@login_required
def api_get_trends(year):
    """Get monthly trends for a year"""
    user_id = session['user_id']
    monthly_totals = Expense.get_monthly_totals(user_id, year)
    
    # Prepare data for chart
    trends = []
    for mt in monthly_totals:
        trends.append({
            'month': int(mt['month']),
            'total': float(mt['total']),
            'count': mt['count']
        })
    
    return jsonify(trends)

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


# Currency API for client-side selection
@app.route('/api/currency', methods=['GET', 'POST'])
def api_currency():
    from flask import request
    if request.method == 'GET':
        return jsonify({'currency': session.get('currency', 'USD')})

    data = request.get_json() or {}
    code = data.get('currency')
    if not code:
        return jsonify({'error': 'No currency provided'}), 400
    session['currency'] = code
    return jsonify({'currency': session['currency']})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)