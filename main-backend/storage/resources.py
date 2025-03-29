# main-backend/storage/resources.py
from utils.db import init_db

def init_db(user_id):
    table_definitions = [
        '''
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
            interest_rate_history TEXT
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS income (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            term TEXT NOT NULL,
            date TEXT NOT NULL
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            details TEXT
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS insurance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            insurance_type TEXT NOT NULL,
            premium REAL NOT NULL,
            coverage REAL NOT NULL,
            premium_term TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            is_active INTEGER NOT NULL,
            maturity_value REAL NOT NULL
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL NOT NULL,
            target_date TEXT NOT NULL,
            allocations TEXT  -- JSON field to store allocation history
        )
        '''
    ]
    init_db(user_id, table_definitions)
