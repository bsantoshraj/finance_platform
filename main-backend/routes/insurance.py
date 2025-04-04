# main-backend/routes/insurance.py
from flask import Blueprint, request, jsonify
from storage.resources import initialize_db
from storage.insurance import get_all_insurance, add_insurance, update_insurance, delete_insurance
from middleware import token_required

bp = Blueprint('insurance', __name__)

@bp.route('', methods=['GET'], endpoint='get_insurance', strict_slashes=False)
@token_required
def get_insurance_route():
    initialize_db(request.user_id)
    #initialize_db(request.user_id)
    insurance = get_all_insurance(request.user_id)
    return jsonify(insurance), 200

@bp.route('', methods=['POST'], endpoint='add_insurance', strict_slashes=False)
@token_required
def add_insurance_route():
    data = request.get_json()
    required_fields = ['name', 'insurance_type', 'premium', 'coverage', 'premium_term', 'start_date', 'end_date', 'is_active', 'maturity_value']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['start_date'], str) or not data['start_date'].strip():
        return jsonify({'error': 'Start date must be a non-empty string'}), 400
    if not isinstance(data['end_date'], str) or not data['end_date'].strip():
        return jsonify({'error': 'End date must be a non-empty string'}), 400
    if not isinstance(data['premium'], (int, float)) or data['premium'] <= 0:
        return jsonify({'error': 'Premium must be a positive number'}), 400
    if not isinstance(data['coverage'], (int, float)) or data['coverage'] <= 0:
        return jsonify({'error': 'Coverage must be a positive number'}), 400
    if not isinstance(data['maturity_value'], (int, float)) or data['maturity_value'] < 0:
        return jsonify({'error': 'Maturity value must be a non-negative number'}), 400

    initialize_db(request.user_id)
    try:
        insurance = add_insurance(request.user_id, data)
        return jsonify(insurance), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['PUT'], endpoint='update_insurance', strict_slashes=False)
@token_required
def update_insurance_route(id):
    data = request.get_json()
    required_fields = ['name', 'insurance_type', 'premium', 'coverage', 'premium_term', 'start_date', 'end_date', 'is_active', 'maturity_value']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({'error': 'Name must be a non-empty string'}), 400
    if not isinstance(data['start_date'], str) or not data['start_date'].strip():
        return jsonify({'error': 'Start date must be a non-empty string'}), 400
    if not isinstance(data['end_date'], str) or not data['end_date'].strip():
        return jsonify({'error': 'End date must be a non-empty string'}), 400
    if not isinstance(data['premium'], (int, float)) or data['premium'] <= 0:
        return jsonify({'error': 'Premium must be a positive number'}), 400
    if not isinstance(data['coverage'], (int, float)) or data['coverage'] <= 0:
        return jsonify({'error': 'Coverage must be a positive number'}), 400
    if not isinstance(data['maturity_value'], (int, float)) or data['maturity_value'] < 0:
        return jsonify({'error': 'Maturity value must be a non-negative number'}), 400

    initialize_db(request.user_id)
    try:
        insurance = update_insurance(request.user_id, id, data)
        if insurance:
            return jsonify(insurance), 200
        return jsonify({'error': 'Insurance not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'], endpoint='delete_insurance', strict_slashes=False)
@token_required
def delete_insurance_route(id):
    initialize_db(request.user_id)
    if delete_insurance(request.user_id, id):
        return jsonify({'message': 'Insurance deleted'}), 200
    return jsonify({'error': 'Insurance not found'}), 404
