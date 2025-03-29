# main-backend/storage/insurance.py
from utils.db import get_db_connection
from .resources import initialize_db

# Define valid insurance types and premium terms
VALID_INSURANCE_TYPES = ["Medical", "Term", "Asset", "Special"]
VALID_PREMIUM_TERMS = ["monthly", "quarterly", "yearly"]

def validate_insurance_data(data):
    """
    Validate insurance data.
    Returns (is_valid, error_message).
    """
    if data['insurance_type'] not in VALID_INSURANCE_TYPES:
        return False, f"Invalid insurance type: {data['insurance_type']}. Must be one of {VALID_INSURANCE_TYPES}"
    if data['premium_term'] not in VALID_PREMIUM_TERMS:
        return False, f"Invalid premium term: {data['premium_term']}. Must be one of {VALID_PREMIUM_TERMS}"
    if not isinstance(data['is_active'], (int, bool)) or data['is_active'] not in [0, 1]:
        return False, "is_active must be 0 (inactive) or 1 (active)"
    if not isinstance(data['maturity_value'], (int, float)) or data['maturity_value'] < 0:
        return False, "Maturity value must be a non-negative number"
    return True, None

def get_all_insurance(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM insurance WHERE user_id = ?', (user_id,))
    insurance = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return insurance

def add_insurance(user_id, data):
    is_valid, error = validate_insurance_data(data)
    if not is_valid:
        raise ValueError(error)

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO insurance (user_id, name, insurance_type, premium, coverage, premium_term, start_date, end_date, is_active, maturity_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (
            user_id,
            data['name'],
            data['insurance_type'],
            data['premium'],
            data['coverage'],
            data['premium_term'],
            data['start_date'],
            data['end_date'],
            1 if data['is_active'] else 0,
            data['maturity_value']
        )
    )
    conn.commit()
    insurance_id = cursor.lastrowid
    cursor.execute('SELECT * FROM insurance WHERE id = ?', (insurance_id,))
    insurance = dict(cursor.fetchone())
    conn.close()
    return insurance

def update_insurance(user_id, insurance_id, data):
    is_valid, error = validate_insurance_data(data)
    if not is_valid:
        raise ValueError(error)

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE insurance SET name = ?, insurance_type = ?, premium = ?, coverage = ?, premium_term = ?, start_date = ?, end_date = ?, is_active = ?, maturity_value = ? WHERE id = ? AND user_id = ?',
        (
            data['name'],
            data['insurance_type'],
            data['premium'],
            data['coverage'],
            data['premium_term'],
            data['start_date'],
            data['end_date'],
            1 if data['is_active'] else 0,
            data['maturity_value'],
            insurance_id,
            user_id
        )
    )
    conn.commit()
    cursor.execute('SELECT * FROM insurance WHERE id = ?', (insurance_id,))
    insurance = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
    conn.close()
    return insurance

def delete_insurance(user_id, insurance_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM insurance WHERE id = ? AND user_id = ?', (insurance_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success
