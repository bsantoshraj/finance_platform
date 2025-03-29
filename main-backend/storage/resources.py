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
            allocations TEXT
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            categories TEXT NOT NULL,
            total_income REAL NOT NULL DEFAULT 0,
            total_expenses REAL NOT NULL DEFAULT 0,
            UNIQUE(user_id)
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS budget_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            budget_id INTEGER NOT NULL,
            categories TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (budget_id) REFERENCES budgets(id)
        )
        ''',
        '''
        CREATE TABLE IF NOT EXISTS advisories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            cfa_id INTEGER NOT NULL,
            advice_type TEXT NOT NULL CHECK(advice_type IN ('product_recommendation', 'investment_diversification', 'debt_restructuring')),
            details TEXT NOT NULL,  -- JSON: {"recommendation": "Invest in low-risk bonds", "details": "..."}
            created_at TEXT NOT NULL
        )
        '''
    ]
    init_db(user_id, table_definitions)
