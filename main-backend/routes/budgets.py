# main-backend/routes/budgets.py
from flask import Blueprint, request, jsonify
from storage.resources import init_db
from storage.budgets import get_budget, add_budget, update_budget, delete_budget, get_budget_history, get_budget_variance
from middleware import token_required

bp = Blueprint('budgets', __name__)

@bp.route('', methods=['GET'], endpoint='get_budget', strict_slashes=False)
@token_required
def get_budget_route():
    init_db(request.user_id)
    budget = get_budget(request.user_id)
    if budget:
        return jsonify(budget), 200
    return jsonify({'error': 'Budget not found'}), 404

@bp.route('', methods=['POST'], endpoint='add_budget', strict_slashes=False)
@token_required
def add_budget_route():
    data = request.get_json()
    required_fields = ['categories']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    init_db(request.user_id)
    try:
        budget = add_budget(request.user_id, data)
        return jsonify(budget), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_budget', strict_slashes=False)
@token_required
def update_budget_route(id):
    data = request.get_json()
    required_fields = ['categories']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    init_db(request.user_id)
    try:
        budget = update_budget(request.user_id, id, data)
        if budget:
            return jsonify(budget), 200
        return jsonify({'error': 'Budget not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_budget', strict_slashes=False)
@token_required
def delete_budget_route(id):
    init_db(request.user_id)
    if delete_budget(request.user_id, id):
        return jsonify({'message': 'Budget deleted'}), 200
    return jsonify({'error': 'Budget not found'}), 404

@bp.route('/<int:id>/history', methods=['GET'], endpoint='get_budget_history', strict_slashes=False)
@token_required
def get_budget_history_route(id):
    init_db(request.user_id)
    history = get_budget_history(request.user_id, id)
    return jsonify(history), 200

@bp.route('/variance/<month>', methods=['GET'], endpoint='get_budget_variance', strict_slashes=False)
@token_required
def get_budget_variance_route(month):
    init_db(request.user_id)
    variance = get_budget_variance(request.user_id, month)
    if variance:
        return jsonify(variance), 200
    return jsonify({'error': 'Budget not found'}), 404
