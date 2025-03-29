# main-backend/routes/goals.py
from flask import Blueprint, request, jsonify
from storage.resources import initialize_db
from storage.goals import get_all_goals, add_goal, update_goal, delete_goal, add_allocation, get_monthly_allocations, get_allocation_history
from middleware import token_required

bp = Blueprint('goals', __name__)

@bp.route('', methods=['GET'], endpoint='get_goals', strict_slashes=False)
@token_required
def get_goals_route():
    initialize_db(request.user_id)
    goals = get_all_goals(request.user_id)
    return jsonify(goals), 200

@bp.route('', methods=['POST'], endpoint='add_goal', strict_slashes=False)
@token_required
def add_goal_route():
    data = request.get_json()
    required_fields = ['name', 'target_amount', 'current_amount', 'target_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['target_date'], str) or not data['target_date'].strip():
        return jsonify({'error': 'Target date must be a non-empty string'}), 400
    if not isinstance(data['target_amount'], (int, float)) or data['target_amount'] <= 0:
        return jsonify({'error': 'Target amount must be a positive number'}), 400
    if not isinstance(data['current_amount'], (int, float)) or data['current_amount'] < 0:
        return jsonify({'error': 'Current amount must be a non-negative number'}), 400
    initialize_db(request.user_id)
    goal = add_goal(request.user_id, data)
    return jsonify(goal), 201

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_goal', strict_slashes=False)
@token_required
def update_goal_route(id):
    data = request.get_json()
    required_fields = ['name', 'target_amount', 'current_amount', 'target_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['target_date'], str) or not data['target_date'].strip():
        return jsonify({'error': 'Target date must be a non-empty string'}), 400
    if not isinstance(data['target_amount'], (int, float)) or data['target_amount'] <= 0:
        return jsonify({'error': 'Target amount must be a positive number'}), 400
    if not isinstance(data['current_amount'], (int, float)) or data['current_amount'] < 0:
        return jsonify({'error': 'Current amount must be a non-negative number'}), 400
    initialize_db(request.user_id)
    goal = update_goal(request.user_id, id, data)
    if goal:
        return jsonify(goal), 200
    return jsonify({'error': 'Goal not found'}), 404

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_goal', strict_slashes=False)
@token_required
def delete_goal_route(id):
    initialize_db(request.user_id)
    if delete_goal(request.user_id, id):
        return jsonify({'message': 'Goal deleted'}), 200
    return jsonify({'error': 'Goal not found'}), 404

@bp.route('/<int:id>/allocate', methods=['POST'], endpoint='add_allocation', strict_slashes=False)
@token_required
def add_allocation_route(id):
    data = request.get_json()
    required_fields = ['amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (amount, date)'}), 400
    if not isinstance(data['amount'], (int, float)) or data['amount'] <= 0:
        return jsonify({'error': 'Amount must be a positive number'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    if 'income_id' in data and not isinstance(data['income_id'], int):
        return jsonify({'error': 'Income ID must be an integer'}), 400

    initialize_db(request.user_id)
    updated_goal, error = add_allocation(request.user_id, id, data)
    if updated_goal:
        return jsonify(updated_goal), 200
    return jsonify({'error': error or 'Goal not found'}), 404

@bp.route('/monthly-allocations', methods=['GET'], endpoint='get_monthly_allocations', strict_slashes=False)
@token_required
def get_monthly_allocations_route():
    params = request.args
    start_date = params.get('start_date')
    end_date = params.get('end_date')

    initialize_db(request.user_id)
    monthly_allocations = get_monthly_allocations(request.user_id, start_date, end_date)
    return jsonify(monthly_allocations), 200

@bp.route('/<int:id>/allocation-history', methods=['GET'], endpoint='get_allocation_history', strict_slashes=False)
@token_required
def get_allocation_history_route(id):
    params = request.args
    start_date = params.get('start_date')
    end_date = params.get('end_date')
    income_id = int(params.get('income_id')) if params.get('income_id') else None

    initialize_db(request.user_id)
    allocation_history = get_allocation_history(request.user_id, id, start_date, end_date, income_id)
    if allocation_history is not None:
        return jsonify(allocation_history), 200
    return jsonify({'error': 'Goal not found'}), 404
