# main-backend/storage/debts.py
import json
from datetime import datetime
from dateutil.relativedelta import relativedelta
from utils.db import get_db_connection

def get_all_debts(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE user_id = ?', (user_id,))
    debts = [dict(row) for row in cursor.fetchall()]
    for debt in debts:
        # Ensure fields are valid JSON strings
        payment_history = debt.get('payment_history', '[]')
        interest_rate_history = debt.get('interest_rate_history', '[]')
        details = debt.get('details', '{}')

        if not payment_history or payment_history == '':
            debt['payment_history'] = '[]'
        if not interest_rate_history or interest_rate_history == '':
            debt['interest_rate_history'] = '[]'
        if not details or details == '':
            debt['details'] = '{}'

        debt['payment_history'] = json.loads(debt['payment_history'])
        debt['interest_rate_history'] = json.loads(debt['interest_rate_history'])
        debt['details'] = json.loads(debt['details'])

        # Calculate debt metrics
        metrics = calculate_debt_metrics(
            principal=debt['amount'],
            interest_rate=debt['interest_rate'],
            term=debt['term'],
            start_date=debt['date']
        )
        debt['principal_paid'] = metrics['principal_paid']
        debt['principal_pending'] = metrics['principal_pending']
        debt['interest_paid'] = metrics['interest_paid']
        debt['interest_pending'] = metrics['interest_pending']
        debt['progress_percentage'] = metrics['progress_percentage']
        # Update remaining_balance in the database
        debt['remaining_balance'] = debt['principal_pending']
        cursor.execute(
            'UPDATE debts SET remaining_balance = ? WHERE id = ? AND user_id = ?',
            (debt['remaining_balance'], debt['id'], user_id)
        )
    conn.commit()
    conn.close()
    return debts


def calculate_debt_metrics(principal, interest_rate, term, start_date):
    principal = float(principal)
    interest_rate = float(interest_rate) / 100
    term = int(term)
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    monthly_rate = interest_rate / 12

    if monthly_rate == 0:
        monthly_payment = principal / term
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** term) / ((1 + monthly_rate) ** term - 1)

    current_date = datetime.now()
    elapsed_months = (current_date.year - start_date.year) * 12 + current_date.month - start_date.month
    elapsed_months = min(elapsed_months, term)

    remaining_principal = principal
    principal_paid = 0
    interest_paid = 0

    # Calculate principal and interest paid over elapsed months
    for month in range(elapsed_months):
        interest_payment = remaining_principal * monthly_rate
        principal_payment = monthly_payment - interest_payment
        remaining_principal -= principal_payment
        principal_paid += principal_payment
        interest_paid += interest_payment

    remaining_principal = max(remaining_principal, 0)
    remaining_months = term - elapsed_months

    # Calculate remaining interest (interest pending) over the remaining term
    interest_pending = 0
    temp_principal = remaining_principal
    for month in range(remaining_months):
        interest_payment = temp_principal * monthly_rate
        principal_payment = monthly_payment - interest_payment
        temp_principal -= principal_payment
        interest_pending += interest_payment

    progress_percentage = (principal_paid / principal) * 100 if principal > 0 else 0
    progress_percentage = min(progress_percentage, 100)

    return {
        'principal_paid': round(principal_paid, 2),
        'principal_pending': round(remaining_principal, 2),
        'interest_paid': round(interest_paid, 2),
        'interest_pending': round(interest_pending, 2),
        'progress_percentage': round(progress_percentage, 2),
    }


def get_debt_by_id(user_id, debt_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if debt:
        debt = dict(debt)
        # Ensure fields are valid JSON strings
        payment_history = debt.get('payment_history', '[]')
        interest_rate_history = debt.get('interest_rate_history', '[]')
        details = debt.get('details', '{}')

        if not payment_history or payment_history == '':
            debt['payment_history'] = '[]'
        if not interest_rate_history or interest_rate_history == '':
            debt['interest_rate_history'] = '[]'
        if not details or details == '':
            debt['details'] = '{}'

        debt['payment_history'] = json.loads(debt['payment_history'])
        debt['interest_rate_history'] = json.loads(debt['interest_rate_history'])
        debt['details'] = json.loads(debt['details'])

        # Calculate debt metrics
        metrics = calculate_debt_metrics(
            principal=debt['amount'],
            interest_rate=debt['interest_rate'],
            term=debt['term'],
            start_date=debt['date']
        )
        debt['principal_paid'] = metrics['principal_paid']
        debt['principal_pending'] = metrics['principal_pending']
        debt['interest_paid'] = metrics['interest_paid']
        debt['interest_pending'] = metrics['interest_pending']
        debt['progress_percentage'] = metrics['progress_percentage']
        # Update remaining_balance in the database
        debt['remaining_balance'] = debt['principal_pending']
        cursor.execute(
            'UPDATE debts SET remaining_balance = ? WHERE id = ? AND user_id = ?',
            (debt['remaining_balance'], debt_id, user_id)
        )
    conn.commit()
    conn.close()
    return debt


def add_debt(user_id, data):
    required_fields = ['amount', 'creditor', 'interest_rate', 'term', 'date', 'debt_type']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    if data['debt_type'] not in ['fixed', 'variable']:
        raise ValueError("Debt type must be 'fixed' or 'variable'")
    try:
        amount = float(data['amount'])
        interest_rate = float(data['interest_rate'])
        term = int(data['term'])
        if amount < 0 or interest_rate < 0 or term <= 0:
            raise ValueError("Amount, interest rate, and term must be positive")
    except (ValueError, TypeError):
        raise ValueError("Amount, interest rate, and term must be valid numbers")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO debts (user_id, amount, creditor, interest_rate, term, date, category, debt_type, remaining_balance, payment_history, interest_rate_history, details) VALUES (_, _, _, _, _, _, _, _, _, _, _, _)',
        (user_id, amount, data['creditor'], interest_rate, term, data['date'], data.get('category', 'Other'), data['debt_type'], amount, json.dumps([]), json.dumps([]), json.dumps({}))
    )
    conn.commit()
    debt_id = cursor.lastrowid
    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    debt = dict(cursor.fetchone())
    debt['payment_history'] = json.loads(debt.get('payment_history', '[]')) if debt.get('payment_history') and debt.get('payment_history') != '' else []
    debt['interest_rate_history'] = json.loads(debt.get('interest_rate_history', '[]')) if debt.get('interest_rate_history') and debt.get('interest_rate_history') != '' else []
    debt['details'] = json.loads(debt.get('details', '{}')) if debt.get('details') and debt.get('details') != '' else {}
    conn.close()
    return debt

def update_debt(user_id, debt_id, data):
    required_fields = ['amount', 'creditor', 'interest_rate', 'term', 'date', 'debt_type']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    if data['debt_type'] not in ['fixed', 'variable']:
        raise ValueError("Debt type must be 'fixed' or 'variable'")
    try:
        amount = float(data['amount'])
        interest_rate = float(data['interest_rate'])
        term = int(data['term'])
        if amount < 0 or interest_rate < 0 or term <= 0:
            raise ValueError("Amount, interest rate, and term must be positive")
    except (ValueError, TypeError):
        raise ValueError("Amount, interest rate, and term must be valid numbers")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return None

    debt = dict(debt)
    cursor.execute(
        'UPDATE debts SET amount = ?, creditor = ?, interest_rate = ?, term = ?, date = ?, category = ?, debt_type = ?, remaining_balance = ? WHERE id = ? AND user_id = ?',
        (amount, data['creditor'], interest_rate, term, data['date'], data.get('category', 'Other'), data['debt_type'], amount, debt_id, user_id)
    )
    conn.commit()
    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    updated_debt = dict(cursor.fetchone())
    updated_debt['payment_history'] = json.loads(updated_debt.get('payment_history', '[]')) if updated_debt.get('payment_history') and updated_debt.get('payment_history') != '' else []
    updated_debt['interest_rate_history'] = json.loads(updated_debt.get('interest_rate_history', '[]')) if updated_debt.get('interest_rate_history') and updated_debt.get('interest_rate_history') != '' else []
    updated_debt['details'] = json.loads(updated_debt.get('details', '{}')) if updated_debt.get('details') and updated_debt.get('details') != '' else {}
    conn.close()
    return updated_debt

def delete_debt(user_id, debt_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def add_payment(user_id, debt_id, data):
    required_fields = ['amount', 'date']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    try:
        amount = float(data['amount'])
        if amount <= 0:
            raise ValueError("Payment amount must be positive")
    except (ValueError, TypeError):
        raise ValueError("Payment amount must be a valid number")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return None

    debt = dict(debt)
    remaining_balance = float(debt['remaining_balance']) - amount
    if remaining_balance < 0:
        remaining_balance = 0

    cursor.execute(
        'UPDATE debts SET remaining_balance = ? WHERE id = ? AND user_id = ?',
        (remaining_balance, debt_id, user_id)
    )

    payment_history = json.loads(debt.get('payment_history', '[]')) if debt.get('payment_history') and debt.get('payment_history') != '' else []
    payment_history.append({'amount': amount, 'date': data['date']})

    cursor.execute(
        'UPDATE debts SET payment_history = ? WHERE id = ? AND user_id = ?',
        (json.dumps(payment_history), debt_id, user_id)
    )
    conn.commit()

    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    updated_debt = dict(cursor.fetchone())
    updated_debt['payment_history'] = json.loads(updated_debt.get('payment_history', '[]')) if updated_debt.get('payment_history') and updated_debt.get('payment_history') != '' else []
    updated_debt['interest_rate_history'] = json.loads(updated_debt.get('interest_rate_history', '[]')) if updated_debt.get('interest_rate_history') and updated_debt.get('interest_rate_history') != '' else []
    updated_debt['details'] = json.loads(updated_debt.get('details', '{}')) if updated_debt.get('details') and updated_debt.get('details') != '' else {}
    # Recalculate metrics after payment
    metrics = calculate_debt_metrics(
        principal=updated_debt['amount'],
        interest_rate=updated_debt['interest_rate'],
        term=updated_debt['term'],
        start_date=updated_debt['date']
    )
    updated_debt['principal_paid'] = metrics['principal_paid']
    updated_debt['principal_pending'] = metrics['principal_pending']
    updated_debt['interest_paid'] = metrics['interest_paid']
    updated_debt['interest_pending'] = metrics['interest_pending']
    updated_debt['progress_percentage'] = metrics['progress_percentage']
    updated_debt['remaining_balance'] = updated_debt['principal_pending']
    cursor.execute(
        'UPDATE debts SET remaining_balance = ? WHERE id = ? AND user_id = ?',
        (updated_debt['remaining_balance'], debt_id, user_id)
    )
    conn.commit()
    conn.close()
    return updated_debt


def add_interest_rate_change(user_id, debt_id, data):
    required_fields = ['interest_rate', 'date']
    if not all(field in data for field in required_fields):
        raise ValueError("Missing required fields")

    try:
        interest_rate = float(data['interest_rate'])
        if interest_rate < 0:
            raise ValueError("Interest rate must be non-negative")
    except (ValueError, TypeError):
        raise ValueError("Interest rate must be a valid number")

    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return None

    debt = dict(debt)
    cursor.execute(
        'UPDATE debts SET interest_rate = ? WHERE id = ? AND user_id = ?',
        (interest_rate, debt_id, user_id)
    )

    interest_rate_history = json.loads(debt.get('interest_rate_history', '[]')) if debt.get('interest_rate_history') and debt.get('interest_rate_history') != '' else []
    interest_rate_history.append({'interest_rate': interest_rate, 'date': data['date']})

    cursor.execute(
        'UPDATE debts SET interest_rate_history = ? WHERE id = ? AND user_id = ?',
        (json.dumps(interest_rate_history), debt_id, user_id)
    )
    conn.commit()

    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    updated_debt = dict(cursor.fetchone())
    updated_debt['payment_history'] = json.loads(updated_debt.get('payment_history', '[]')) if updated_debt.get('payment_history') and updated_debt.get('payment_history') != '' else []
    updated_debt['interest_rate_history'] = json.loads(updated_debt.get('interest_rate_history', '[]')) if updated_debt.get('interest_rate_history') and updated_debt.get('interest_rate_history') != '' else []
    updated_debt['details'] = json.loads(updated_debt.get('details', '{}')) if updated_debt.get('details') and updated_debt.get('details') != '' else {}
    # Recalculate metrics after interest rate change
    metrics = calculate_debt_metrics(
        principal=updated_debt['amount'],
        interest_rate=updated_debt['interest_rate'],
        term=updated_debt['term'],
        start_date=updated_debt['date']
    )
    updated_debt['principal_paid'] = metrics['principal_paid']
    updated_debt['principal_pending'] = metrics['principal_pending']
    updated_debt['interest_paid'] = metrics['interest_paid']
    updated_debt['interest_pending'] = metrics['interest_pending']
    updated_debt['progress_percentage'] = metrics['progress_percentage']
    updated_debt['remaining_balance'] = updated_debt['principal_pending']
    cursor.execute(
        'UPDATE debts SET remaining_balance = ? WHERE id = ? AND user_id = ?',
        (updated_debt['remaining_balance'], debt_id, user_id)
    )
    conn.commit()
    conn.close()
    return updated_debt

def get_amortization_schedule(user_id, debt_id, extra_payment=None, interest_rate=None, term=None, ignore_history=False):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return None

    debt = dict(debt)
    payment_history = json.loads(debt.get('payment_history', '[]')) if debt.get('payment_history') and debt.get('payment_history') != '' else []
    interest_rate_history = json.loads(debt.get('interest_rate_history', '[]')) if debt.get('interest_rate_history') and debt.get('interest_rate_history') != '' else []

    payments = payment_history if not ignore_history else []
    rate_changes = interest_rate_history if not ignore_history else []

    principal = float(debt['amount'])
    term = int(term if term is not None else debt['term'])
    start_date = datetime.strptime(debt['date'], '%Y-%m-%d')
    interest_rate = float(interest_rate if interest_rate is not None else debt['interest_rate']) / 100
    monthly_rate = interest_rate / 12
    extra_payment = float(extra_payment) if extra_payment is not None else 0

    if monthly_rate == 0:
        monthly_payment = principal / term
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** term) / ((1 + monthly_rate) ** term - 1)

    schedule = []
    remaining_principal = principal
    total_interest_paid = 0
    month = 0

    payments = sorted(payments, key=lambda x: x['date'])
    rate_changes = sorted(rate_changes, key=lambda x: x['date'])

    payment_idx = 0
    rate_change_idx = 0

    while remaining_principal > 0 and month < term:
        payment_date = start_date + relativedelta(months=month)
        payment_date_str = payment_date.strftime('%Y-%m-%d')

        while rate_change_idx < len(rate_changes) and rate_changes[rate_change_idx]['date'] <= payment_date_str:
            interest_rate = float(rate_changes[rate_change_idx]['interest_rate']) / 100
            monthly_rate = interest_rate / 12
            if monthly_rate == 0:
                monthly_payment = remaining_principal / (term - month)
            else:
                monthly_payment = remaining_principal * (monthly_rate * (1 + monthly_rate) ** (term - month)) / ((1 + monthly_rate) ** (term - month) - 1)
            rate_change_idx += 1

        interest_payment = remaining_principal * monthly_rate
        principal_payment = monthly_payment - interest_payment
        total_payment = monthly_payment + extra_payment

        while payment_idx < len(payments) and payments[payment_idx]['date'] <= payment_date_str:
            total_payment += float(payments[payment_idx]['amount'])
            principal_payment += float(payments[payment_idx]['amount'])
            payment_idx += 1

        remaining_principal -= principal_payment
        total_interest_paid += interest_payment

        if remaining_principal < 0:
            principal_payment += remaining_principal
            total_payment = principal_payment + interest_payment
            remaining_principal = 0

        schedule.append({
            'month': month + 1,
            'date': payment_date_str,
            'payment': round(total_payment, 2),
            'principal_payment': round(principal_payment, 2),
            'interest_payment': round(interest_payment, 2),
            'remaining_principal': round(max(remaining_principal, 0), 2),
            'total_interest_paid': round(total_interest_paid, 2),
        })

        month += 1
        if remaining_principal <= 0:
            break

    conn.close()
    return schedule



