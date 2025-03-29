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
            role TEXT NOT NULL DEFAULT 'user'
        )
        '''
    ]
    init_db(None, table_definitions, 'users.db')

init_user_db()

def add_user(username, password, role='user'):
    conn = get_db_connection(None, 'users.db')
    cursor = conn.cursor()
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    try:
        cursor.execute(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            (username, hashed_password, role)
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
