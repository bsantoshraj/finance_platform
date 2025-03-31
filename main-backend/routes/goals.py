# main-backend/routes/goals.py
from flask import Blueprint, request, jsonify
from storage.resources import initialize_db
from storage.goals import get_all_goals, get_goal_by_id, add_goal, update_goal, delete_goal, add_allocation, get_monthly_allocations
from middleware import token_required, user_or_cfa_required

bp = Blueprint('goals', __name__)

@bp.route('', methods=['GET'], strict_slashes=False)
@token_required
def get_goals():
    initialize_db(request.user_id)
    goals = get_all_goals(request.user_id)
    return jsonify(goals), 200

@bp.route('/<int:id>', methods=['GET'],strict_slashes=False)
@token_required
def get_goal(id):
    initialize_db(request.user_id)
    goal = get_goal_by_id(request.user_id, id)
    if goal:
        return jsonify(goal), 200
    return jsonify({'error': 'Goal not found'}), 404

@bp.route('', methods=['POST'],strict_slashes=False)
@token_required
def add_goal_route():
    data = request.get_json()
    required_fields = ['name', 'target_amount', 'current_amount', 'target_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    initialize_db(request.user_id)
    try:
        goal = add_goal(request.user_id, data)
        return jsonify(goal), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['PUT'],strict_slashes=False)
@token_required
def update_goal(id):
    data = request.get_json()
    required_fields = ['name', 'target_amount', 'current_amount', 'target_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    initialize_db(request.user_id)
    try:
        goal = update_goal(request.user_id, id, data)
        if goal:
            return jsonify(goal), 200
        return jsonify({'error': 'Goal not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'],strict_slashes=False)
@token_required
def delete_goal(id):
    initialize_db(request.user_id)
    if delete_goal(request.user_id, id):
        return jsonify({'message': 'Goal deleted'}), 200
    return jsonify({'error': 'Goal not found'}), 404

@bp.route('/<int:id>/allocation', methods=['POST'],strict_slashes=False)
@token_required
def add_allocation(id):
    data = request.get_json()
    required_fields = ['amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    initialize_db(request.user_id)
    try:
        goal = add_allocation(request.user_id, id, data)
        if goal:
            return jsonify(goal), 200
        return jsonify({'error': 'Goal not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/allocations/<int:id>/<month>', methods=['GET'],strict_slashes=False)
@user_or_cfa_required
def get_allocations(id, month):
    initialize_db(request.user_id)
    allocations = get_monthly_allocations(request.user_id, id, month)
    return jsonify(allocations), 200
