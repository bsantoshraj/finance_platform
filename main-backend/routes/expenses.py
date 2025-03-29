# main-backend/routes/expenses.py
from flask import Blueprint, request, jsonify
from storage.resources import init_db
from storage.expenses import get_all_expenses, add_expense, update_expense, delete_expense
from middleware import token_required

bp = Blueprint('expenses', __name__)

@bp.route('', methods=['GET'], endpoint='get_expenses',strict_slashes=False)
@token_required
def get_expenses_route():
    init_db(request.user_id)
    expenses = get_all_expenses(request.user_id)
    return jsonify(expenses), 200

@bp.route('', methods=['POST'], endpoint='add_expense',strict_slashes=False)
@token_required
def add_expense_route():
    data = request.get_json()
    required_fields = ['amount', 'category', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['category'], str) or not data['category'].strip():
        return jsonify({'error': 'Category must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    init_db(request.user_id)
    expense = add_expense(request.user_id, data)
    return jsonify(expense), 201

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_expense', strict_slashes=False)
@token_required
def update_expense_route(id):
    data = request.get_json()
    required_fields = ['amount', 'category', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['category'], str) or not data['category'].strip():
        return jsonify({'error': 'Category must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    init_db(request.user_id)
    expense = update_expense(request.user_id, id, data)
    if expense:
        return jsonify(expense), 200
    return jsonify({'error': 'Expense not found'}), 404

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_expense', strict_slashes=False)
@token_required
def delete_expense_route(id):
    init_db(request.user_id)
    if delete_expense(request.user_id, id):
        return jsonify({'message': 'Expense deleted'}), 200
    return jsonify({'error': 'Expense not found'}), 404
