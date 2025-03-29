# main-backend/storage/investments.py
import json
from utils.db import get_db_connection
from .resources import init_db

# Define required fields for each investment type
INVESTMENT_TYPE_FIELDS = {
    "Mutual Funds": ["nav", "units", "current_nav", "purchase_date"],
    "Stocks": ["purchase_price", "quantity", "current_price", "purchase_date"],
    "Real Estate": ["purchase_price", "current_value", "purchase_date", "location"],
    "Gold": ["purchase_price", "weight", "current_market_value", "purchase_date"]
}

def validate_investment_details(type, details):
    """
    Validate that the details dictionary contains all required fields for the given investment type.
    Returns (is_valid, error_message).
    """
    if type not in INVESTMENT_TYPE_FIELDS:
        return False, f"Invalid investment type: {type}. Must be one of {list(INVESTMENT_TYPE_FIELDS.keys())}"

    required_fields = INVESTMENT_TYPE_FIELDS[type]
    for field in required_fields:
        if field not in details:
            return False, f"Missing required field '{field}' for investment type '{type}'"
        if field.endswith("date") and (not isinstance(details[field], str) or not details[field].strip()):
            return False, f"'{field}' must be a non-empty string"
        elif field in ["nav", "units", "current_nav", "purchase_price", "quantity", "current_price", "current_value", "weight", "current_market_value"]:
            try:
                float(details[field])
                if float(details[field]) <= 0:
                    return False, f"'{field}' must be a positive number"
            except (ValueError, TypeError):
                return False, f"'{field}' must be a valid number"
        elif field == "location" and (not isinstance(details[field], str) or not details[field].strip()):
            return False, f"'{field}' must be a non-empty string"

    return True, None

def get_all_investments(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM investments WHERE user_id = ?', (user_id,))
    investments = [dict(row) for row in cursor.fetchall()]
    for investment in investments:
        if investment['details']:
            investment['details'] = json.loads(investment['details'])
        else:
            investment['details'] = {}
    conn.close()
    return investments

def add_investment(user_id, data):
    type = data['type']
    details = data.get('details', {})
    is_valid, error = validate_investment_details(type, details)
    if not is_valid:
        raise ValueError(error)

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO investments (user_id, name, type, date, details) VALUES (?, ?, ?, ?, ?)',
        (user_id, data['name'], type, data['date'], json.dumps(details))
    )
    conn.commit()
    investment_id = cursor.lastrowid
    cursor.execute('SELECT * FROM investments WHERE id = ?', (investment_id,))
    investment = dict(cursor.fetchone())
    investment['details'] = json.loads(investment['details']) if investment['details'] else {}
    conn.close()
    return investment

def update_investment(user_id, investment_id, data):
    type = data['type']
    details = data.get('details', {})
    is_valid, error = validate_investment_details(type, details)
    if not is_valid:
        raise ValueError(error)

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE investments SET name = ?, type = ?, date = ?, details = ? WHERE id = ? AND user_id = ?',
        (data['name'], type, data['date'], json.dumps(details), investment_id, user_id)
    )
    conn.commit()
    cursor.execute('SELECT * FROM investments WHERE id = ?', (investment_id,))
    investment = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
    if investment:
        investment['details'] = json.loads(investment['details']) if investment['details'] else {}
    conn.close()
    return investment

def delete_investment(user_id, investment_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM investments WHERE id = ? AND user_id = ?', (investment_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success
