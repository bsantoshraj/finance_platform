# main-backend/storage/expenses.py
from utils.db import get_db_connection
from .resources import initialize_db

def get_all_expenses(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses WHERE user_id = ?', (user_id,))
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses

def add_expense(user_id, data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO expenses (user_id, amount, category, date) VALUES (?, ?, ?, ?)',
        (user_id, data['amount'], data['category'], data['date'])
    )
    conn.commit()
    expense_id = cursor.lastrowid
    cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
    expense = dict(cursor.fetchone())
    conn.close()
    return expense

def update_expense(user_id, expense_id, data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE expenses SET amount = ?, category = ?, date = ? WHERE id = ? AND user_id = ?',
        (data['amount'], data['category'], data['date'], expense_id, user_id)
    )
    conn.commit()
    cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
    expense = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
    conn.close()
    return expense

def delete_expense(user_id, expense_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM expenses WHERE id = ? AND user_id = ?', (expense_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success
