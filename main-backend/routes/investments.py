# main-backend/routes/investments.py
from flask import Blueprint, request, jsonify
from storage.resources import initialize_db
from storage.investments import get_all_investments, add_investment, update_investment, delete_investment
from middleware import token_required

bp = Blueprint('investments', __name__)

@bp.route('', methods=['GET'], endpoint='get_investments', strict_slashes=False)
@token_required
def get_investments_route():
    initialize_db(request.user_id)
    investments = get_all_investments(request.user_id)
    return jsonify(investments), 200

@bp.route('', methods=['POST'], endpoint='add_investment', strict_slashes=False)
@token_required
def add_investment_route():
    data = request.get_json()
    required_fields = ['name', 'type', 'date', 'details']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['type'], str) or not data['type'].strip():
        return jsonify({'error': 'Type must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    if not isinstance(data['details'], dict):
        return jsonify({'error': 'Details must be a dictionary'}), 400

    initialize_db(request.user_id)
    try:
        investment = add_investment(request.user_id, data)
        return jsonify(investment), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_investment', strict_slashes=False)
@token_required
def update_investment_route(id):
    data = request.get_json()
    required_fields = ['name', 'type', 'date', 'details']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['type'], str) or not data['type'].strip():
        return jsonify({'error': 'Type must be a non-empty string'}), 400
    if not isinstance(data['date'], str) or not data['date'].strip():
        return jsonify({'error': 'Date must be a non-empty string'}), 400
    if not isinstance(data['details'], dict):
        return jsonify({'error': 'Details must be a dictionary'}), 400

    initialize_db(request.user_id)
    try:
        investment = update_investment(request.user_id, id, data)
        if investment:
            return jsonify(investment), 200
        return jsonify({'error': 'Investment not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_investment', strict_slashes=False)
@token_required
def delete_investment_route(id):
    initialize_db(request.user_id)
    if delete_investment(request.user_id, id):
        return jsonify({'message': 'Investment deleted'}), 200
    return jsonify({'error': 'Investment not found'}), 404
