# auth-service/storage/users.py
import sqlite3
import hashlib
from utils.db import get_db_path, get_db_connection, init_db

# auth-service uses a global database (not per-user)
USER_DB_PATH = get_db_path(None, 'users.db')

def init_user_db():
    table_definitions = [
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'CFA', 'admin')),
            status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected'))
        )
        '''
    ]
    init_db(None, table_definitions, 'users.db')

init_user_db()

def add_user(username, password, role='user'):
    if role not in ['user', 'CFA', 'admin']:
        raise ValueError("Role must be 'user', 'CFA', or 'admin'")
    # Set status based on role
    status = 'approved' if role in ['user', 'admin'] else 'pending'
    conn = get_db_connection(None, 'users.db')
    cursor = conn.cursor()
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    try:
        cursor.execute(
            'INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)',
            (username, hashed_password, role, status)
        )
        conn.commit()
        user_id = cursor.lastrowid
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = dict(cursor.fetchone())
        conn.close()
        return user
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_user_by_username(username):
    conn = get_db_connection(None, 'users.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def get_users_by_role(role):
    conn = get_db_connection(None, 'users.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE role = ?', (role,))
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

def get_users_by_role_and_status(role, status):
    conn = get_db_connection(None, 'users.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE role = ? AND status = ?', (role, status))
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

def update_user_status(user_id, status):
    if status not in ['pending', 'approved', 'rejected']:
        raise ValueError("Status must be 'pending', 'approved', or 'rejected'")
    conn = get_db_connection(None, 'users.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET status = ? WHERE id = ?', (status, user_id))
    conn.commit()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
    conn.close()
    return user
