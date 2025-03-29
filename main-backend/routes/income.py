# main-backend/routes/income.py
from flask import Blueprint, request, jsonify
from storage.resources import init_db
from storage.income import get_all_income, add_income, update_income, delete_income
from middleware import token_required

bp = Blueprint('income', __name__)

@bp.route('', methods=['GET'], endpoint='get_income', strict_slashes=False)
@token_required
def get_income_route():
    init_db(request.user_id)
    income = get_all_income(request.user_id)
    return jsonify(income), 200

@bp.route('', methods=['POST'], endpoint='add_income', strict_slashes=False)
@token_required
def add_income_route():
    data = request.get_json()
    required_fields = ['name', 'amount', 'term', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    init_db(request.user_id)
    income = add_income(request.user_id, data)
    return jsonify(income), 201

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_income', strict_slashes=False)
@token_required
def update_income_route(id):
    data = request.get_json()
    required_fields = ['name', 'amount', 'term', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    init_db(request.user_id)
    income = update_income(request.user_id, id, data)
    if income:
        return jsonify(income), 200
    return jsonify({'error': 'Income not found'}), 404

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_income', strict_slashes=False)
@token_required
def delete_income_route(id):
    init_db(request.user_id)
    if delete_income(request.user_id, id):
        return jsonify({'message': 'Income deleted'}), 200
    return jsonify({'error': 'Income not found'}), 404
