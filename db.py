# utils/db.py
import os
import sqlite3

def get_db_path(user_id, db_name='finance.db'):
    """
    Generate the database path for a given user_id.
    For auth-service, user_id can be None (global database).
    """
    if user_id is None:  # For auth-service
        db_dir = 'db'
    else:  # For per-user databases
        db_dir = os.path.join('db', f'user_{user_id}')
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    return os.path.join(db_dir, db_name)

def get_db_connection(user_id, db_name='finance.db'):
    """
    Get a database connection for a given user_id.
    """
    db_path = get_db_path(user_id, db_name)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(user_id, table_definitions, db_name='finance.db'):
    """
    Initialize the database for a given user_id with the provided table definitions.
    table_definitions: List of SQL statements to create tables.
    """
    conn = get_db_connection(user_id, db_name)
    cursor = conn.cursor()
    for table_def in table_definitions:
        cursor.execute(table_def)
    conn.commit()
    conn.close()
