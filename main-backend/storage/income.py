# main-backend/storage/income.py
from utils.db import get_db_connection
from .resources import init_db

def get_all_income(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM income WHERE user_id = ?', (user_id,))
    income = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return income

def add_income(user_id, data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO income (user_id, name, amount, term, date) VALUES (?, ?, ?, ?, ?)',
        (user_id, data['name'], data['amount'], data['term'], data['date'])
    )
    conn.commit()
    income_id = cursor.lastrowid
    cursor.execute('SELECT * FROM income WHERE id = ?', (income_id,))
    income = dict(cursor.fetchone())
    conn.close()
    return income

def update_income(user_id, income_id, data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE income SET name = ?, amount = ?, term = ?, date = ? WHERE id = ? AND user_id = ?',
        (data['name'], data['amount'], data['term'], data['date'], income_id, user_id)
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

def get_income_by_id(user_id, income_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM income WHERE id = ? AND user_id = ?', (income_id, user_id))
    income = cursor.fetchone()
    conn.close()
    return dict(income) if income else None
