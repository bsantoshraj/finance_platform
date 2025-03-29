# main-backend/storage/debts.py
import json
import math
from datetime import datetime, timedelta
from utils.db import get_db_connection
from .resources import initialize_db

def get_all_debts(user_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE user_id = ?', (user_id,))
    debts = [dict(row) for row in cursor.fetchall()]
    for debt in debts:
        if debt['payment_history']:
            debt['payment_history'] = json.loads(debt['payment_history'])
        else:
            debt['payment_history'] = []
        if debt['interest_rate_history']:
            debt['interest_rate_history'] = json.loads(debt['interest_rate_history'])
        else:
            debt['interest_rate_history'] = []
    conn.close()
    return debts

def add_debt(user_id, data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO debts (user_id, amount, creditor, interest_rate, term, date, category, remaining_balance, payment_history, debt_type, interest_rate_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (
            user_id,
            data['amount'],
            data['creditor'],
            data['interest_rate'],
            data['term'],
            data['date'],
            data.get('category', 'Other'),
            data['amount'],
            json.dumps([]),
            data['debt_type'],
            json.dumps([])
        )
    )
    conn.commit()
    debt_id = cursor.lastrowid
    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    debt = dict(cursor.fetchone())
    debt['payment_history'] = json.loads(debt['payment_history']) if debt['payment_history'] else []
    debt['interest_rate_history'] = json.loads(debt['interest_rate_history']) if debt['interest_rate_history'] else []
    conn.close()
    return debt

def update_debt(user_id, debt_id, data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE debts SET amount = ?, creditor = ?, interest_rate = ?, term = ?, date = ?, category = ?, remaining_balance = ?, payment_history = ?, debt_type = ?, interest_rate_history = ? WHERE id = ? AND user_id = ?',
        (
            data['amount'],
            data['creditor'],
            data['interest_rate'],
            data['term'],
            data['date'],
            data.get('category', 'Other'),
            data.get('remaining_balance', data['amount']),
            json.dumps(data.get('payment_history', [])),
            data['debt_type'],
            json.dumps(data.get('interest_rate_history', [])),
            debt_id,
            user_id
        )
    )
    conn.commit()
    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    debt = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
    if debt:
        debt['payment_history'] = json.loads(debt['payment_history']) if debt['payment_history'] else []
        debt['interest_rate_history'] = json.loads(debt['interest_rate_history']) if debt['interest_rate_history'] else []
    conn.close()
    return debt

def delete_debt(user_id, debt_id):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def add_payment(user_id, debt_id, payment_data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return None

    debt = dict(debt)
    payment_history = json.loads(debt['payment_history']) if debt['payment_history'] else []
    payment_history.append(payment_data)
    remaining_balance = debt['remaining_balance'] - payment_data['amount']

    cursor.execute(
        'UPDATE debts SET payment_history = ?, remaining_balance = ? WHERE id = ? AND user_id = ?',
        (json.dumps(payment_history), remaining_balance, debt_id, user_id)
    )
    conn.commit()

    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    updated_debt = dict(cursor.fetchone())
    updated_debt['payment_history'] = json.loads(updated_debt['payment_history']) if updated_debt['payment_history'] else []
    updated_debt['interest_rate_history'] = json.loads(updated_debt['interest_rate_history']) if updated_debt['interest_rate_history'] else []
    conn.close()
    return updated_debt

def add_interest_rate_change(user_id, debt_id, rate_change_data):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return None

    debt = dict(debt)
    interest_rate_history = json.loads(debt['interest_rate_history']) if debt['interest_rate_history'] else []
    interest_rate_history.append(rate_change_data)
    interest_rate_history.sort(key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'))

    cursor.execute(
        'UPDATE debts SET interest_rate_history = ? WHERE id = ? AND user_id = ?',
        (json.dumps(interest_rate_history), debt_id, user_id)
    )
    conn.commit()

    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    updated_debt = dict(cursor.fetchone())
    updated_debt['payment_history'] = json.loads(updated_debt['payment_history']) if updated_debt['payment_history'] else []
    updated_debt['interest_rate_history'] = json.loads(updated_debt['interest_rate_history']) if updated_debt['interest_rate_history'] else []
    conn.close()
    return updated_debt

def get_amortization_schedule(user_id, debt_id, extra_emi=0, emi_hike_percent=0, lumpsum_payment=None, annual_lumpsum=None):
    conn = get_db_connection(user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ? AND user_id = ?', (debt_id, user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return None

    debt = dict(debt)
    conn.close()

    principal = float(debt['amount'])
    annual_rate = float(debt['interest_rate']) / 100
    term_months = int(debt['term'])
    start_date = datetime.strptime(debt['date'], '%Y-%m-%d')
    debt_type = debt['debt_type']
    interest_rate_history = json.loads(debt['interest_rate_history']) if debt['interest_rate_history'] else []

    monthly_rate = annual_rate / 12
    emi = (principal * monthly_rate * (1 + monthly_rate) ** term_months) / ((1 + monthly_rate) ** term_months - 1)

    schedule = []
    remaining_balance = principal
    current_date = start_date
    current_emi = emi + extra_emi
    year_count = 0
    rate_changes = [(datetime.strptime(change['date'], '%Y-%m-%d'), float(change['rate']) / 100) for change in interest_rate_history]
    rate_changes.sort(key=lambda x: x[0])
    rate_index = 0

    lumpsum_date = datetime.strptime(lumpsum_payment['date'], '%Y-%m-%d') if lumpsum_payment else None
    annual_lumpsum_date = datetime.strptime(annual_lumpsum['date'], '%Y-%m-%d') if annual_lumpsum else None
    annual_lumpsum_amount = float(annual_lumpsum['amount']) if annual_lumpsum else 0

    for month in range(1, term_months + 1):
        if remaining_balance <= 0:
            break

        while rate_index < len(rate_changes) and current_date >= rate_changes[rate_index][0]:
            annual_rate = rate_changes[rate_index][1]
            monthly_rate = annual_rate / 12
            remaining_months = term_months - month + 1
            if remaining_months > 0:
                emi = (remaining_balance * monthly_rate * (1 + monthly_rate) ** remaining_months) / ((1 + monthly_rate) ** remaining_months - 1)
                current_emi = emi + extra_emi
            rate_index += 1

        if emi_hike_percent > 0 and month % 12 == 1 and month > 1:
            year_count += 1
            current_emi *= (1 + (emi_hike_percent / 100))

        interest_payment = remaining_balance * monthly_rate
        principal_payment = current_emi - interest_payment
        if principal_payment > remaining_balance:
            principal_payment = remaining_balance
            current_emi = principal_payment + interest_payment

        if lumpsum_payment and current_date.date() == lumpsum_date.date():
            lumpsum_amount = float(lumpsum_payment['amount'])
            remaining_balance -= lumpsum_amount
            schedule.append({
                'month': month,
                'date': current_date.strftime('%Y-%m-%d'),
                'payment': current_emi,
                'principal': principal_payment,
                'interest': interest_payment,
                'lumpsum': lumpsum_amount,
                'remaining_balance': max(remaining_balance, 0)
            })
            if remaining_balance <= 0:
                break
            continue

        if annual_lumpsum and current_date.day == annual_lumpsum_date.day and current_date.month == annual_lumpsum_date.month:
            remaining_balance -= annual_lumpsum_amount
            schedule.append({
                'month': month,
                'date': current_date.strftime('%Y-%m-%d'),
                'payment': current_emi,
                'principal': principal_payment,
                'interest': interest_payment,
                'lumpsum': annual_lumpsum_amount,
                'remaining_balance': max(remaining_balance, 0)
            })
            if remaining_balance <= 0:
                break
            continue

        remaining_balance -= principal_payment

        schedule.append({
            'month': month,
            'date': current_date.strftime('%Y-%m-%d'),
            'payment': current_emi,
            'principal': principal_payment,
            'interest': interest_payment,
            'lumpsum': 0,
            'remaining_balance': max(remaining_balance, 0)
        })

        current_date = current_date + timedelta(days=30)

    return schedule
