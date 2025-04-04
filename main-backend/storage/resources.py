# main-backend/storage/resources.py
import sqlite3
import os
import json
from datetime import datetime
import threading
from utils.db import get_db_connection

# Lock for database initialization to prevent race conditions
db_init_lock = threading.Lock()

def initialize_db(user_id):
    with db_init_lock:
        print(f"Starting database initialization for user_id: {user_id}")
        conn = get_db_connection(user_id)
        cursor = conn.cursor()

        # Check if tables already exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        existing_tables = [table[0] for table in cursor.fetchall()]
        print(f"Existing tables before creation for user_id {user_id}: {existing_tables}")

        # Create tables
        try:
            cursor.executescript('''
                CREATE TABLE IF NOT EXISTS debts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    creditor TEXT NOT NULL,
                    interest_rate REAL NOT NULL,
                    term TEXT NOT NULL,
                    date TEXT NOT NULL,
                    category TEXT,
                    remaining_balance REAL,
                    payment_history TEXT,
                    debt_type TEXT NOT NULL,
                    interest_rate_history TEXT,
                    details TEXT
                );

                CREATE TABLE IF NOT EXISTS budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    categories TEXT NOT NULL,
                    total_income REAL NOT NULL,
                    total_expenses REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS budget_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    budget_id INTEGER NOT NULL,
                    categories TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    target_amount REAL NOT NULL,
                    current_amount REAL NOT NULL,
                    target_date TEXT NOT NULL,
                    allocations TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    date TEXT NOT NULL,
                    description TEXT
                );

                CREATE TABLE IF NOT EXISTS income (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    name TEXT NOT NULL,
                    term TEXT NOT NULL,
                    date TEXT NOT NULL,
                    category TEXT
                );

                CREATE TABLE IF NOT EXISTS investments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    type TEXT NOT NULL,
                    date TEXT NOT NULL,
                    description TEXT
                );

                CREATE TABLE IF NOT EXISTS insurance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    premium REAL NOT NULL,
                    coverage_amount REAL NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    provider TEXT NOT NULL
                );
            ''')
            print("Tables created successfully for user_id: {user_id}")
            # Debug: List tables after creation to confirm
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print(f"Tables in database after creation for user_id {user_id}: {[table[0] for table in tables]}")
        except Exception as e:
            print(f"Error creating tables for user_id {user_id}: {str(e)}")

        # Ensure all columns exist in the debts table
        cursor.execute("PRAGMA table_info(debts)")
        columns = [col[1] for col in cursor.fetchall()]
        required_debt_columns = [
            'id', 'user_id', 'amount', 'creditor', 'interest_rate', 'term', 'date',
            'category', 'remaining_balance', 'payment_history', 'debt_type',
            'interest_rate_history', 'details'
        ]
        for column in required_debt_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE debts ADD COLUMN {column} TEXT')
                if column in ['payment_history', 'interest_rate_history', 'details']:
                    default_value = json.dumps([]) if column in ['payment_history', 'interest_rate_history'] else json.dumps({})
                    cursor.execute(f'UPDATE debts SET {column} = ? WHERE {column} IS NULL', (default_value,))

        # Ensure all columns exist in the budget_history table
        cursor.execute("PRAGMA table_info(budget_history)")
        columns = [col[1] for col in cursor.fetchall()]
        required_budget_history_columns = ['id', 'user_id', 'budget_id', 'categories', 'updated_at']
        for column in required_budget_history_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE budget_history ADD COLUMN {column} TEXT')
                if column == 'categories':
                    cursor.execute(f'UPDATE budget_history SET {column} = ? WHERE {column} IS NULL', (json.dumps({}),))
                elif column == 'updated_at':
                    cursor.execute(f'UPDATE budget_history SET {column} = ? WHERE {column} IS NULL', (datetime.now().strftime('%Y-%m-%d %H:%M:%S'),))

        # Ensure all columns exist in the budgets table
        cursor.execute("PRAGMA table_info(budgets)")
        columns = [col[1] for col in cursor.fetchall()]
        required_budget_columns = ['id', 'user_id', 'categories', 'total_income', 'total_expenses']
        for column in required_budget_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE budgets ADD COLUMN {column} TEXT')
                if column == 'categories':
                    cursor.execute(f'UPDATE budgets SET {column} = ? WHERE {column} IS NULL', (json.dumps({}),))
                elif column in ['total_income', 'total_expenses']:
                    cursor.execute(f'UPDATE budgets SET {column} = ? WHERE {column} IS NULL', (0,))

        # Ensure all columns exist in the goals table
        cursor.execute("PRAGMA table_info(goals)")
        columns = [col[1] for col in cursor.fetchall()]
        required_goals_columns = ['id', 'user_id', 'name', 'target_amount', 'current_amount', 'target_date', 'allocations']
        for column in required_goals_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE goals ADD COLUMN {column} TEXT')
                if column == 'allocations':
                    cursor.execute(f'UPDATE goals SET {column} = ? WHERE {column} IS NULL', (json.dumps([]),))

        # Ensure all columns exist in the expenses table
        cursor.execute("PRAGMA table_info(expenses)")
        columns = [col[1] for col in cursor.fetchall()]
        required_expenses_columns = ['id', 'user_id', 'amount', 'category', 'date', 'description']
        for column in required_expenses_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE expenses ADD COLUMN {column} TEXT')

        # Ensure all columns exist in the income table
        cursor.execute("PRAGMA table_info(income)")
        columns = [col[1] for col in cursor.fetchall()]
        required_income_columns = ['id', 'user_id', 'amount', 'source', 'date', 'category']
        for column in required_income_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE income ADD COLUMN {column} TEXT')

        # Ensure all columns exist in the investments table
        cursor.execute("PRAGMA table_info(investments)")
        columns = [col[1] for col in cursor.fetchall()]
        required_investments_columns = ['id', 'user_id', 'amount', 'type', 'date', 'description']
        for column in required_investments_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE investments ADD COLUMN {column} TEXT')

        # Ensure all columns exist in the insurance table
        cursor.execute("PRAGMA table_info(insurance)")
        columns = [col[1] for col in cursor.fetchall()]
        required_insurance_columns = ['id', 'user_id', 'type', 'premium', 'coverage_amount', 'start_date', 'end_date', 'provider']
        for column in required_insurance_columns:
            if column not in columns:
                cursor.execute(f'ALTER TABLE insurance ADD COLUMN {column} TEXT')

        conn.commit()
        # Debug: List tables after commit to confirm persistence
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables in database after commit for user_id {user_id}: {[table[0] for table in tables]}")
        conn.close()
