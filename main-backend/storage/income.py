# main-backend/storage/income.py
import json
from datetime import datetime
from utils.db import get_db_connection
from .resources import initialize_db

def get_all_income(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM income WHERE user_id = ?', (user_id,))
    incomes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return incomes

def get_income_by_id(user_id, income_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM income WHERE id = ? AND user_id = ?', (income_id, user_id))
    income = cursor.fetchone()
    conn.close()
    return dict(income) if income else None

def add_income(user_id, data):
    required_fields = ['name', 'amount', 'term', 'date']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    if data['term'] not in ['monthly', 'quarterly', 'yearly']:
        raise ValueError("Term must be 'monthly', 'quarterly', or 'yearly'")

    # Convert amount to float and validate
    try:
        amount = float(data['amount'])
    except (ValueError, TypeError):
        raise ValueError("Amount must be a valid number")

    if amount < 0:
        raise ValueError("Amount must be a non-negative number")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO income (user_id, name, amount, term, date) VALUES (?, ?, ?, ?, ?)',
        (user_id, data['name'], amount, data['term'], data['date'])
    )
    conn.commit()
    income_id = cursor.lastrowid
    cursor.execute('SELECT * FROM income WHERE id = ?', (income_id,))
    income = dict(cursor.fetchone())
    conn.close()
    return income

def update_income(user_id, income_id, data):
    required_fields = ['name', 'amount', 'term', 'date']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    if data['term'] not in ['monthly', 'quarterly', 'yearly']:
        raise ValueError("Term must be 'monthly', 'quarterly', or 'yearly'")

    # Convert amount to float and validate
    try:
        amount = float(data['amount'])
    except (ValueError, TypeError):
        raise ValueError("Amount must be a valid number")

    if amount < 0:
        raise ValueError("Amount must be a non-negative number")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE income SET name = ?, amount = ?, term = ?, date = ? WHERE id = ? AND user_id = ?',
        (data['name'], amount, data['term'], data['date'], income_id, user_id)
    )
    conn.commit()
    cursor.execute('SELECT * FROM income WHERE id = ?', (income_id,))
    income = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
    conn.close()
    return income

def delete_income(user_id, income_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM income WHERE id = ? AND user_id = ?', (income_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success
