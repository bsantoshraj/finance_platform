# auth-service/routes/auth.py
from flask import Blueprint, request, jsonify
import jwt
import hashlib
from storage.users import add_user, get_user_by_username, get_users_by_role, get_users_by_role_and_status, update_user_status
from middleware import token_required, JWT_SECRET

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')  # Default to 'user' if not specified

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if get_user_by_username(username):
        return jsonify({'error': 'Username already exists'}), 400

    try:
        user = add_user(username, password, role)
        if user:
            return jsonify({'message': 'User registered successfully', 'user_id': user['id'], 'role': user['role'], 'status': user['status']}), 201
        return jsonify({'error': 'Error registering user'}), 500
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = get_user_by_username(username)
    if not user or user['password'] != hashlib.sha256(password.encode()).hexdigest():
        return jsonify({'error': 'Invalid username or password'}), 401

    token = jwt.encode({
        'user_id': user['id'],
        'role': user['role'],
        'status': user['status']
    }, JWT_SECRET, algorithm='HS256')

    return jsonify({'token': token, 'user_id': user['id'], 'role': user['role'], 'status': user['status']}), 200

@bp.route('/validate-token', methods=['POST'])
@token_required
def validate_token():
    return jsonify({'user_id': request.user_id, 'role': request.role, 'status': request.status}), 200

@bp.route('/cfa/pending', methods=['GET'])
@token_required
def get_pending_cfas():
    if request.role != 'admin':
        return jsonify({'error': 'Access restricted to admins'}), 403
    pending_cfas = get_users_by_role_and_status('CFA', 'pending')
    return jsonify(pending_cfas), 200

@bp.route('/cfa/<int:cfa_id>/approve', methods=['POST'])
@token_required
def approve_cfa(cfa_id):
    if request.role != 'admin':
        return jsonify({'error': 'Access restricted to admins'}), 403
    try:
        user = update_user_status(cfa_id, 'approved')
        if user:
            return jsonify({'message': 'CFA approved successfully', 'user': user}), 200
        return jsonify({'error': 'CFA not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/cfa/<int:cfa_id>/reject', methods=['POST'])
@token_required
def reject_cfa(cfa_id):
    if request.role != 'admin':
        return jsonify({'error': 'Access restricted to admins'}), 403
    try:
        user = update_user_status(cfa_id, 'rejected')
        if user:
            return jsonify({'message': 'CFA rejected successfully', 'user': user}), 200
        return jsonify({'error': 'CFA not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
