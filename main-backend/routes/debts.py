# main-backend/routes/debts.py
from flask import Blueprint, request, jsonify
from storage.resources import init_db
from storage.debts import get_all_debts, add_debt, update_debt, delete_debt, add_payment, add_interest_rate_change, get_amortization_schedule
from middleware import token_required

bp = Blueprint('debts', __name__)

@bp.route('', methods=['GET'], endpoint='get_debts', strict_slashes=False)
@token_required
def get_debts_route():
    init_db(request.user_id)
    debts = get_all_debts(request.user_id)
    return jsonify(debts), 200

@bp.route('', methods=['POST'], endpoint='add_debt', strict_slashes=False)
@token_required
def add_debt_route():
    data = request.get_json()
    required_fields = ['amount', 'creditor', 'interest_rate', 'term', 'date', 'debt_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['creditor'], str) or not data['creditor'].strip():
        return jsonify({'error': 'Creditor must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    if data['debt_type'] not in ['fixed', 'variable']:
        return jsonify({'error': 'Debt type must be "fixed" or "variable"'}), 400
    init_db(request.user_id)
    debt = add_debt(request.user_id, data)
    return jsonify(debt), 201

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_debt',strict_slashes=False)
@token_required
def update_debt_route(id):
    data = request.get_json()
    required_fields = ['amount', 'creditor', 'interest_rate', 'term', 'date', 'debt_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['creditor'], str) or not data['creditor'].strip():
        return jsonify({'error': 'Creditor must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    if data['debt_type'] not in ['fixed', 'variable']:
        return jsonify({'error': 'Debt type must be "fixed" or "variable"'}), 400
    init_db(request.user_id)
    debt = update_debt(request.user_id, id, data)
    if debt:
        return jsonify(debt), 200
    return jsonify({'error': 'Debt not found'}), 404

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_debt', strict_slashes=False)
@token_required
def delete_debt_route(id):
    init_db(request.user_id)
    if delete_debt(request.user_id, id):
        return jsonify({'message': 'Debt deleted'}), 200
    return jsonify({'error': 'Debt not found'}), 404

@bp.route('/<int:id>/payment', methods=['POST'], endpoint='add_payment',strict_slashes=False)
@token_required
def add_payment_route(id):
    data = request.get_json()
    required_fields = ['amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (amount, date)'}), 400
    if not isinstance(data['amount'], (int, float)) or data['amount'] <= 0:
        return jsonify({'error': 'Amount must be a positive number'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    init_db(request.user_id)
    debt = add_payment(request.user_id, id, data)
    if debt:
        return jsonify(debt), 200
    return jsonify({'error': 'Debt not found'}), 404

@bp.route('/<int:id>/interest-rate', methods=['POST'], endpoint='add_interest_rate_change',strict_slashes=False)
@token_required
def add_interest_rate_change_route(id):
    data = request.get_json()
    required_fields = ['rate', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (rate, date)'}), 400
    if not isinstance(data['rate'], (int, float)) or data['rate'] <= 0:
        return jsonify({'error': 'Interest rate must be a positive number'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400

    conn = get_db_connection(request.user_id)
    cursor = conn.cursor()
    cursor.execute('SELECT debt_type FROM debts WHERE id = ? AND user_id = ?', (id, request.user_id))
    debt = cursor.fetchone()
    if not debt:
        conn.close()
        return jsonify({'error': 'Debt not found'}), 404
    if debt['debt_type'] != 'variable':
        conn.close()
        return jsonify({'error': 'Interest rate changes are only allowed for variable-rate debts'}), 400
    conn.close()

    init_db(request.user_id)
    debt = add_interest_rate_change(request.user_id, id, data)
    if debt:
        return jsonify(debt), 200
    return jsonify({'error': 'Debt not found'}), 404

@bp.route('/<int:id>/amortization', methods=['GET'], endpoint='get_amortization',strict_slashes=False)
@token_required
def get_amortization_route(id):
    params = request.args
    extra_emi = float(params.get('extra_emi', 0))
    emi_hike_percent = float(params.get('emi_hike_percent', 0))
    lumpsum_payment = {
        'amount': float(params['lumpsum_amount']),
        'date': params['lumpsum_date']
    } if params.get('lumpsum_amount') and params.get('lumpsum_date') else None
    annual_lumpsum = {
        'amount': float(params['annual_lumpsum_amount']),
        'date': params['annual_lumpsum_date']
    } if params.get('annual_lumpsum_amount') and params.get('annual_lumpsum_date') else None

    init_db(request.user_id)
    schedule = get_amortization_schedule(
        request.user_id,
        id,
        extra_emi=extra_emi,
        emi_hike_percent=emi_hike_percent,
        lumpsum_payment=lumpsum_payment,
        annual_lumpsum=annual_lumpsum
    )
    if schedule is None:
        return jsonify({'error': 'Debt not found'}), 404
    return jsonify(schedule), 200
