# main-backend/routes/debts.py
from flask import Blueprint, request, jsonify
from storage.resources import initialize_db
from storage.debts import get_all_debts, get_debt_by_id, add_debt, update_debt, delete_debt, add_payment, add_interest_rate_change, get_amortization_schedule
from middleware import token_required

bp = Blueprint('debts', __name__)

@bp.route('', methods=['GET'], endpoint='get_debts', strict_slashes=False)
@token_required
def get_debts_route():
    initialize_db(request.user_id)
    debts = get_all_debts(request.user_id)
    return jsonify(debts), 200

@bp.route('', methods=['POST'], endpoint='add_debt', strict_slashes=False)
@token_required
def add_debt_route():
    data = request.get_json()
    required_fields = ['amount', 'creditor', 'interest_rate', 'term', 'date', 'debt_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    initialize_db(request.user_id)
    try:
        debt = add_debt(request.user_id, data)
        return jsonify(debt), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_debt', strict_slashes=False)
@token_required
def update_debt_route(id):
    data = request.get_json()
    required_fields = ['amount', 'creditor', 'interest_rate', 'term', 'date', 'debt_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    initialize_db(request.user_id)
    try:
        debt = update_debt(request.user_id, id, data)
        if debt:
            return jsonify(debt), 200
        return jsonify({'error': 'Debt not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_debt', strict_slashes=False)
@token_required
def delete_debt_route(id):
    initialize_db(request.user_id)
    if delete_debt(request.user_id, id):
        return jsonify({'message': 'Debt deleted'}), 200
    return jsonify({'error': 'Debt not found'}), 404

@bp.route('/<int:id>/payment', methods=['POST'], endpoint='add_payment', strict_slashes=False)
@token_required
def add_payment_route(id):
    data = request.get_json()
    required_fields = ['amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    initialize_db(request.user_id)
    try:
        debt = add_payment(request.user_id, id, data)
        if debt:
            return jsonify(debt), 200
        return jsonify({'error': 'Debt not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>/interest-rate-change', methods=['POST'], endpoint='add_interest_rate_change', strict_slashes=False)
@token_required
def add_interest_rate_change_route(id):
    data = request.get_json()
    required_fields = ['interest_rate', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    initialize_db(request.user_id)
    try:
        debt = add_interest_rate_change(request.user_id, id, data)
        if debt:
            return jsonify(debt), 200
        return jsonify({'error': 'Debt not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@bp.route('/<int:id>/amortization', methods=['GET'], endpoint='get_amortization_schedule', strict_slashes=False)
@token_required
def get_amortization_schedule_route(id):
    initialize_db(request.user_id)
    # Get query parameters for what-if scenarios
    extra_payment = request.args.get('extra_payment', type=float)
    interest_rate = request.args.get('interest_rate', type=float)
    term = request.args.get('term', type=int)
    ignore_history = request.args.get('ignore_history', default='false').lower() == 'true'

    try:
        schedule = get_amortization_schedule(
            request.user_id,
            id,
            extra_payment=extra_payment,
            interest_rate=interest_rate,
            term=term,
            ignore_history=ignore_history
        )
        if schedule is not None:
            return jsonify(schedule), 200
        return jsonify({'error': 'Debt not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400





