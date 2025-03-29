# main-backend/storage/budgets.py
import json
from datetime import datetime
from utils.db import get_db_connection
from .resources import init_db
from .income import get_all_income
from .expenses import get_all_expenses
from .goals import get_monthly_allocations

# Define valid budget categories
VALID_CATEGORIES = [
    "Debts", "Transports", "Saving", "Grocery", "Insurance", "Subscriptions", "Entertainment", "Utilities", "Other"
]

def validate_budget_data(data):
    """
    Validate budget data.
    Returns (is_valid, error_message).
    """
    if not isinstance(data['categories'], dict):
        return False, "Categories must be a dictionary"
    
    for category, amount in data['categories'].items():
        if category not in VALID_CATEGORIES:
            return False, f"Invalid category: {category}. Must be one of {VALID_CATEGORIES}"
        if not isinstance(amount, (int, float)) or amount < 0:
            return False, f"Budget amount for category {category} must be a non-negative number"
    
    return True, None

def get_budget(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM budgets WHERE user_id = ?', (user_id,))
    budget = cursor.fetchone()
    if budget:
        budget = dict(budget)
        budget['categories'] = json.loads(budget['categories']) if budget['categories'] else {}
    conn.close()
    return budget

def add_budget(user_id, data):
    is_valid, error = validate_budget_data(data)
    if not is_valid:
        raise ValueError(error)

    # Check if a budget already exists for the user
    existing_budget = get_budget(user_id)
    if existing_budget:
        raise ValueError("A budget already exists for this user. Use the update endpoint to modify it.")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO budgets (user_id, categories, total_income, total_expenses) VALUES (?, ?, ?, ?)',
            (user_id, json.dumps(data['categories']), 0, 0)
        )
        budget_id = cursor.lastrowid

        # Add to budget history
        cursor.execute(
            'INSERT INTO budget_history (user_id, budget_id, categories, updated_at) VALUES (?, ?, ?, ?)',
            (user_id, budget_id, json.dumps(data['categories']), datetime.now().strftime('%Y-%m-%d'))
        )
        conn.commit()

        cursor.execute('SELECT * FROM budgets WHERE id = ?', (budget_id,))
        budget = dict(cursor.fetchone())
        budget['categories'] = json.loads(budget['categories']) if budget['categories'] else {}
        conn.close()
        return budget
    except Exception as e:
        conn.close()
        raise ValueError(f"Error adding budget: {str(e)}")

def update_budget(user_id, budget_id, data):
    is_valid, error = validate_budget_data(data)
    if not is_valid:
        raise ValueError(error)

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE budgets SET categories = ? WHERE id = ? AND user_id = ?',
        (json.dumps(data['categories']), budget_id, user_id)
    )
    conn.commit()

    # Add to budget history
    cursor.execute(
        'INSERT INTO budget_history (user_id, budget_id, categories, updated_at) VALUES (?, ?, ?, ?)',
        (user_id, budget_id, json.dumps(data['categories']), datetime.now().strftime('%Y-%m-%d'))
    )
    conn.commit()

    cursor.execute('SELECT * FROM budgets WHERE id = ?', (budget_id,))
    budget = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
    if budget:
        budget['categories'] = json.loads(budget['categories']) if budget['categories'] else {}
    conn.close()
    return budget

def delete_budget(user_id, budget_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    # Delete budget history
    cursor.execute('DELETE FROM budget_history WHERE budget_id = ? AND user_id = ?', (budget_id, user_id))
    # Delete budget
    cursor.execute('DELETE FROM budgets WHERE id = ? AND user_id = ?', (budget_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def get_budget_history(user_id, budget_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM budget_history WHERE budget_id = ? AND user_id = ? ORDER BY updated_at ASC', (budget_id, user_id))
    history = [dict(row) for row in cursor.fetchall()]
    for entry in history:
        entry['categories'] = json.loads(entry['categories']) if entry['categories'] else {}
    conn.close()
    return history

def get_active_budget_for_month(user_id, month):
    """
    Retrieve the budget that was active for a given month based on budget history.
    """
    budget = get_budget(user_id)
    if not budget:
        return None

    history = get_budget_history(user_id, budget['id'])
    if not history:
        return budget

    # Find the most recent budget update before or on the given month
    target_date = datetime.strptime(month + '-01', '%Y-%m-%d')
    active_budget = budget.copy()
    for entry in history:
        entry_date = datetime.strptime(entry['updated_at'], '%Y-%m-%d')
        if entry_date <= target_date:
            active_budget['categories'] = entry['categories']
        else:
            break

    return active_budget

def update_budget_totals(user_id, month):
    """
    Update total_income and total_expenses for a budget based on income, expenses, and goals for a specific month.
    Returns the updated budget with calculated totals.
    """
    budget = get_budget(user_id)
    if not budget:
        return None

    # Calculate total income for the month
    incomes = get_all_income(user_id)
    total_income = 0
    for income in incomes:
        # Only include monthly incomes
        if income['term'] != 'monthly':
            continue
        # Check if the income was active for the given month
        income_date = datetime.strptime(income['date'], '%Y-%m-%d')
        income_month = income_date.strftime('%Y-%m')
        target_month = datetime.strptime(month + '-01', '%Y-%m-%d')
        if income_month <= month:
            total_income += float(income['amount'])

    # Calculate total expenses for the month
    expenses = get_all_expenses(user_id)
    total_expenses = 0
    for expense in expenses:
        expense_date = datetime.strptime(expense['date'], '%Y-%m-%d')
        expense_month = expense_date.strftime('%Y-%m')
        if expense_month == month:
            total_expenses += float(expense['amount'])

    # Include insurance premiums for active policies
    from .insurance import get_all_insurance
    insurances = get_all_insurance(user_id)
    for insurance in insurances:
        if not insurance['is_active']:
            continue
        start_date = datetime.strptime(insurance['start_date'], '%Y-%m-%d')
        end_date = datetime.strptime(insurance['end_date'], '%Y-%m-%d')
        budget_date = datetime.strptime(month + '-01', '%Y-%m-%d')
        if start_date <= budget_date <= end_date:
            if insurance['premium_term'] == 'monthly':
                total_expenses += float(insurance['premium'])
            elif insurance['premium_term'] == 'quarterly' and budget_date.month % 3 == 1:
                total_expenses += float(insurance['premium'])
            elif insurance['premium_term'] == 'yearly' and budget_date.month == 1:
                total_expenses += float(insurance['premium'])

    # Update the budget totals in the database
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE budgets SET total_income = ?, total_expenses = ? WHERE user_id = ?',
        (total_income, total_expenses, user_id)
    )
    conn.commit()
    conn.close()

    budget['total_income'] = total_income
    budget['total_expenses'] = total_expenses
    return budget

def get_budget_variance(user_id, month):
    """
    Calculate financial variances for a specific month using the active budget.
    Returns a dictionary with:
    - income_to_expense_variance: Total income minus total expenses (including insurance premiums).
    - budget_to_expense_variance: Total budgeted amount minus total expenses.
    - total_savings: Income-to-expense variance minus total allocations to goals.
    - total_allocations: Total amount allocated to goals in the month.
    - total_income: Total income for the month.
    - total_expenses: Total expenses for the month (including insurance premiums).
    - total_budgeted: Total budgeted amount across all categories.
    - categories: The active budget categories for the month.
    """
    budget = get_active_budget_for_month(user_id, month)
    if not budget:
        return None

    # Update totals for the month
    budget = update_budget_totals(user_id, month)
    if not budget:
        return None

    # Calculate variances
    income_to_expense_variance = budget['total_income'] - budget['total_expenses']
    
    # Calculate total budgeted amount
    total_budgeted = sum(float(amount) for amount in budget['categories'].values())
    budget_to_expense_variance = total_budgeted - budget['total_expenses']

    # Calculate total savings (including allocations to goals)
    monthly_allocations = get_monthly_allocations(user_id, month + '-01', month + '-31')
    total_allocations = monthly_allocations.get(month, 0)
    total_savings = income_to_expense_variance - total_allocations

    return {
        'income_to_expense_variance': income_to_expense_variance,
        'budget_to_expense_variance': budget_to_expense_variance,
        'total_savings': total_savings,
        'total_allocations': total_allocations,
        'total_income': budget['total_income'],
        'total_expenses': budget['total_expenses'],
        'total_budgeted': total_budgeted,
        'categories': budget['categories']
    }
