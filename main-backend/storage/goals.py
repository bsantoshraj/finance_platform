# main-backend/storage/goals.py
import json
from datetime import datetime
from utils.db import get_db_connection
from .resources import initialize_db
from .income import get_income_by_id

def get_all_goals(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM goals WHERE user_id = ?', (user_id,))
    goals = [dict(row) for row in cursor.fetchall()]
    for goal in goals:
        goal['allocations'] = json.loads(goal['allocations']) if goal['allocations'] else []
    conn.close()
    return goals

def add_goal(user_id, data):
    required_fields = ['name', 'target_amount', 'current_amount', 'target_date']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    # Convert target_amount to float and validate
    try:
        target_amount = float(data['target_amount'])
    except (ValueError, TypeError):
        raise ValueError("Target amount must be a valid number")
    if target_amount <= 0:
        raise ValueError("Target amount must be a positive number")

    # Convert current_amount to float and validate
    try:
        current_amount = float(data['current_amount'])
    except (ValueError, TypeError):
        raise ValueError("Current amount must be a valid number")
    if current_amount < 0:
        raise ValueError("Current amount must be a non-negative number")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, allocations) VALUES (?, ?, ?, ?, ?, ?)',
        (user_id, data['name'], target_amount, current_amount, data['target_date'], json.dumps([]))
    )
    conn.commit()
    goal_id = cursor.lastrowid
    cursor.execute('SELECT * FROM goals WHERE id = ?', (goal_id,))
    goal = dict(cursor.fetchone())
    goal['allocations'] = json.loads(goal['allocations']) if goal['allocations'] else []
    conn.close()
    return goal


def get_goal_by_id(user_id, goal_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
    goal = cursor.fetchone()
    if goal:
        goal = dict(goal)
        goal['allocations'] = json.loads(goal['allocations']) if goal['allocations'] else []
    conn.close()
    return goal


def update_goal(user_id, goal_id, data):
    required_fields = ['name', 'target_amount', 'current_amount', 'target_date']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    # Convert target_amount to float and validate
    try:
        target_amount = float(data['target_amount'])
    except (ValueError, TypeError):
        raise ValueError("Target amount must be a valid number")
    if target_amount <= 0:
        raise ValueError("Target amount must be a positive number")

    # Convert current_amount to float and validate
    try:
        current_amount = float(data['current_amount'])
    except (ValueError, TypeError):
        raise ValueError("Current amount must be a valid number")
    if current_amount < 0:
        raise ValueError("Current amount must be a non-negative number")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
    goal = cursor.fetchone()
    if not goal:
        conn.close()
        return None

    cursor.execute(
        'UPDATE goals SET name = ?, target_amount = ?, current_amount = ?, target_date = ? WHERE id = ? AND user_id = ?',
        (data['name'], target_amount, current_amount, data['target_date'], goal_id, user_id)
    )
    conn.commit()
    cursor.execute('SELECT * FROM goals WHERE id = ?', (goal_id,))
    updated_goal = dict(cursor.fetchone())
    updated_goal['allocations'] = json.loads(updated_goal['allocations']) if updated_goal['allocations'] else []
    conn.close()
    return updated_goal

def delete_goal(user_id, goal_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def add_allocation(user_id, goal_id, data):
    if 'income_id' not in data or 'amount' not in data:
        raise ValueError("Missing required fields: income_id, amount")

    # Convert amount to float and validate
    try:
        amount = float(data['amount'])
    except (ValueError, TypeError):
        raise ValueError("Amount must be a valid number")
    if amount <= 0:
        raise ValueError("Amount must be a positive number")

    # Verify the income record exists and belongs to the user
    income = get_income_by_id(user_id, data['income_id'])
    if not income:
        raise ValueError("Income record not found")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
    goal = cursor.fetchone()
    if not goal:
        conn.close()
        raise ValueError("Goal not found")

    goal = dict(goal)
    allocations = json.loads(goal['allocations']) if goal['allocations'] else []
    current_amount = goal['current_amount'] + amount
    allocations.append({
        'income_id': data['income_id'],
        'amount': amount,
        'date': datetime.now().strftime('%Y-%m-%d')
    })
    cursor.execute(
        'UPDATE goals SET current_amount = ?, allocations = ? WHERE id = ? AND user_id = ?',
        (current_amount, json.dumps(allocations), goal_id, user_id)
    )
    conn.commit()
    cursor.execute('SELECT * FROM goals WHERE id = ?', (goal_id,))
    updated_goal = dict(cursor.fetchone())
    updated_goal['allocations'] = json.loads(updated_goal['allocations']) if updated_goal['allocations'] else []
    conn.close()
    return updated_goal

def get_monthly_allocations(user_id, goal_id, month):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
    goal = cursor.fetchone()
    if not goal:
        conn.close()
        return None

    goal = dict(goal)
    allocations = json.loads(goal['allocations']) if goal['allocations'] else []
    monthly_allocations = [
        allocation for allocation in allocations
        if allocation['date'].startswith(month)
    ]
    conn.close()
    return monthly_allocations

def get_allocation_history(user_id, goal_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
    goal = cursor.fetchone()
    if not goal:
        conn.close()
        return None

    goal = dict(goal)
    allocations = json.loads(goal['allocations']) if goal['allocations'] else []
    conn.close()
    return allocations
