# main-backend/utils/db.py
import sqlite3
import os
#from storage.resources import initialize_db  # Import initialize_db from resources

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def get_db_path(user_id, db_name='finance.db'):
    if user_id is None:
        return os.path.join('storage', db_name)
    return os.path.join('storage', f'user_{user_id}_{db_name}')


def get_db_connection(user_id):
    # Construct the absolute path: main-backend/db/user_<user_id>/finance.db
    db_dir = os.path.join(project_root, 'db', f'user_{user_id}')
    db_path = os.path.join(db_dir, 'finance.db')
    os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

#def get_db_connection(user_id):
#    # Construct the absolute path: main-backend/db/user_<user_id>/finance.db
#    db_dir = os.path.join(project_root, 'db', f'user_{user_id}')
#    db_path = os.path.join(db_dir, 'finance.db')
#    os.makedirs(db_dir, exist_ok=True)  # Ensure the user-specific directory exists
#    conn = sqlite3.connect(db_path)
#    conn.row_factory = sqlite3.Row
#    return conn

#def get_db_connection(user_id, db_name='finance.db'):
#    db_path = get_db_path(user_id, db_name)
#    conn = sqlite3.connect(db_path)
#    conn.row_factory = sqlite3.Row
#    return conn

def init_db(user_id, table_definitions, db_name='finance.db'):
    conn = get_db_connection(user_id, db_name)
    cursor = conn.cursor()
    for table_def in table_definitions:
        cursor.execute(table_def)
    conn.commit()
    conn.close()
