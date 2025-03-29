# main-backend/utils/db.py
import sqlite3
import os

def get_db_path(user_id, db_name='finance.db'):
    if user_id is None:
        return os.path.join('storage', db_name)
    return os.path.join('storage', f'user_{user_id}_{db_name}')

def get_db_connection(user_id, db_name='finance.db'):
    db_path = get_db_path(user_id, db_name)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(user_id, table_definitions, db_name='finance.db'):
    conn = get_db_connection(user_id, db_name)
    cursor = conn.cursor()
    for table_def in table_definitions:
        cursor.execute(table_def)
    conn.commit()
    conn.close()
