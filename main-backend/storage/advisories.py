# main-backend/storage/advisories.py
import json
from datetime import datetime
from utils.db import get_db_connection
from .resources import initialize_db

# Define valid advice types
VALID_ADVICE_TYPES = ['product_recommendation', 'investment_diversification', 'debt_restructuring']

def validate_advisory_data(data):
    """
    Validate advisory data.
    Returns (is_valid, error_message).
    """
    if data['advice_type'] not in VALID_ADVICE_TYPES:
        return False, f"Invalid advice type: {data['advice_type']}. Must be one of {VALID_ADVICE_TYPES}"
    if not isinstance(data['details'], dict):
        return False, "Details must be a dictionary"
    return True, None

def get_advisories_for_user(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM advisories WHERE user_id = ?', (user_id,))
    advisories = [dict(row) for row in cursor.fetchall()]
    for advisory in advisories:
        advisory['details'] = json.loads(advisory['details']) if advisory['details'] else {}
    conn.close()
    return advisories

def get_advisories_by_cfa(cfa_id):
    # Since CFAs can access any user's data, we don't pass user_id to get_db_connection
    conn = get_db_connection(0)  # Use a dummy user_id since CFAs have global access
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM advisories WHERE cfa_id = ?', (cfa_id,))
    advisories = [dict(row) for row in cursor.fetchall()]
    for advisory in advisories:
        advisory['details'] = json.loads(advisory['details']) if advisory['details'] else {}
    conn.close()
    return advisories

def add_advisory(user_id, cfa_id, data):
    is_valid, error = validate_advisory_data(data)
    if not is_valid:
        raise ValueError(error)

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO advisories (user_id, cfa_id, advice_type, details, created_at) VALUES (?, ?, ?, ?, ?)',
        (user_id, cfa_id, data['advice_type'], json.dumps(data['details']), datetime.now().strftime('%Y-%m-%d'))
    )
    conn.commit()
    advisory_id = cursor.lastrowid
    cursor.execute('SELECT * FROM advisories WHERE id = ?', (advisory_id,))
    advisory = dict(cursor.fetchone())
    advisory['details'] = json.loads(advisory['details']) if advisory['details'] else {}
    conn.close()
    return advisory

def delete_advisory(user_id, advisory_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM advisories WHERE id = ? AND user_id = ?', (advisory_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success
