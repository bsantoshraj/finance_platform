# main-backend/routes/advisories.py
from flask import Blueprint, request, jsonify
from storage.resources import init_db
from storage.advisories import get_advisories_for_user, get_advisories_by_cfa, add_advisory, delete_advisory
from middleware import token_required, cfa_required, user_or_cfa_required

bp = Blueprint('advisories', __name__)

@bp.route('/user/<int:user_id>', methods=['GET'], endpoint='get_advisories_for_user')
@user_or_cfa_required
def get_advisories_for_user_route(user_id):
    init_db(user_id)
    advisories = get_advisories_for_user(user_id)
    return jsonify(advisories), 200

@bp.route('/cfa/<int:cfa_id>', methods=['GET'], endpoint='get_advisories_by_cfa')
@cfa_required
def get_advisories_by_cfa_route(cfa_id):
    if request.user_id != cfa_id:
        return jsonify({'error': 'CFAs can only access their own advisories'}), 403
    init_db(0)  # CFAs have global access
    advisories = get_advisories_by_cfa(cfa_id)
    return jsonify(advisories), 200

@bp.route('/user/<int:user_id>', methods=['POST'], endpoint='add_advisory')
@cfa_required
def add_advisory_route(user_id):
    data = request.get_json()
    required_fields = ['advice_type', 'details']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    init_db(user_id)
    try:
        advisory = add_advisory(user_id, request.user_id, data)
        return jsonify(advisory), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:advisory_id>', methods=['DELETE'], endpoint='delete_advisory')
@token_required
def delete_advisory_route(advisory_id):
    # Only the user or the CFA who created the advisory can delete it
    init_db(request.user_id)
    advisory = next((adv for adv in get_advisories_for_user(request.user_id) if adv['id'] == advisory_id), None)
    if not advisory:
        return jsonify({'error': 'Advisory not found'}), 404
    if request.role != 'CFA' and request.user_id != advisory['user_id']:
        return jsonify({'error': 'Access restricted to the user or CFAs'}), 403
    if request.role == 'CFA' and request.user_id != advisory['cfa_id']:
        return jsonify({'error': 'CFAs can only delete their own advisories'}), 403

    if delete_advisory(request.user_id, advisory_id):
        return jsonify({'message': 'Advisory deleted'}), 200
    return jsonify({'error': 'Advisory not found'}), 404
