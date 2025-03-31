# main-backend/storage/budgets.py
import json
from datetime import datetime
from utils.db import get_db_connection
from storage.expenses import get_all_expenses
from storage.goals import get_monthly_allocations

def get_budget(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM budgets WHERE user_id = ?', (user_id,))
    budget = cursor.fetchone()
    if budget:
        budget = dict(budget)
        budget['categories'] = json.loads(budget.get('categories', '{}')) if budget.get('categories') else {}
    conn.close()
    return budget

def add_budget(user_id, data):
    if 'categories' not in data:
        raise ValueError("Categories are required")

    categories = data['categories']
    if not isinstance(categories, dict):
        raise ValueError("Categories must be a dictionary")

    for category, amount in categories.items():
        try:
            amount = float(amount)
            if amount < 0:
                raise ValueError(f"Amount for category '{category}' must be non-negative")
        except (ValueError, TypeError):
            raise ValueError(f"Amount for category '{category}' must be a valid number")
        categories[category] = amount

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO budgets (user_id, categories, total_income, total_expenses) VALUES (?, ?, ?, ?)',
        (user_id, json.dumps(categories), 0, 0)
    )
    conn.commit()
    cursor.execute('SELECT * FROM budgets WHERE user_id = ?', (user_id,))
    budget = dict(cursor.fetchone())
    budget['categories'] = json.loads(budget.get('categories', '{}')) if budget.get('categories') else {}
    conn.close()
    return budget

def update_budget(user_id, data):
    if 'categories' not in data:
        raise ValueError("Categories are required")

    categories = data['categories']
    if not isinstance(categories, dict):
        raise ValueError("Categories must be a dictionary")

    for category, amount in categories.items():
        try:
            amount = float(amount)
            if amount < 0:
                raise ValueError(f"Amount for category '{category}' must be non-negative")
        except (ValueError, TypeError):
            raise ValueError(f"Amount for category '{category}' must be a valid number")
        categories[category] = amount

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM budgets WHERE user_id = ?', (user_id,))
    budget = cursor.fetchone()
    if not budget:
        conn.close()
        return None

    budget = dict(budget)
    cursor.execute(
        'UPDATE budgets SET categories = ?, total_income = ?, total_expenses = ? WHERE user_id = ?',
        (json.dumps(categories), budget['total_income'], budget['total_expenses'], user_id)
    )

    cursor.execute(
        'INSERT INTO budget_history (user_id, budget_id, categories, updated_at) VALUES (?, ?, ?, ?)',
        (user_id, budget['id'], json.dumps(categories), datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    )
    conn.commit()

    cursor.execute('SELECT * FROM budgets WHERE user_id = ?', (user_id,))
    updated_budget = dict(cursor.fetchone())
    updated_budget['categories'] = json.loads(updated_budget.get('categories', '{}')) if updated_budget.get('categories') else {}
    conn.close()
    return updated_budget

def delete_budget(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM budgets WHERE user_id = ?', (user_id,))
    success = cursor.rowcount > 0
    if success:
        cursor.execute('DELETE FROM budget_history WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()
    return success

def get_budget_history(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM budget_history WHERE user_id = ? ORDER BY updated_at DESC', (user_id,))
    history = [dict(row) for row in cursor.fetchall()]
    for entry in history:
        entry['categories'] = json.loads(entry.get('categories', '{}')) if entry.get('categories') else {}
    conn.close()
    return history

def get_budget_variance(user_id, month):
    budget = get_budget(user_id)
    if not budget:
        return None

    expenses = get_all_expenses(user_id)
    monthly_expenses = [expense for expense in expenses if expense['date'].startswith(month)]
    total_expenses = sum(float(expense['amount']) for expense in monthly_expenses)

    total_allocations = 0
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM goals WHERE user_id = ?', (user_id,))
    goals = cursor.fetchall()
    for goal in goals:
        goal_id = goal['id']
        allocations = get_monthly_allocations(user_id, goal_id, month)
        total_allocations += sum(float(allocation['amount']) for allocation in allocations)

    conn.close()

    categories = budget['categories']
    total_budgeted_expenses = sum(float(amount) for amount in categories.values())
    total_savings = budget['total_income'] - total_expenses - total_allocations

    return {
        'total_budgeted_expenses': total_budgeted_expenses,
        'total_expenses': total_expenses,
        'total_savings': total_savings,
        'total_allocations': total_allocations,
        'variance': total_budgeted_expenses - total_expenses
    }
