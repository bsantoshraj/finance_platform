# auth-service/routes/auth.py
from flask import Blueprint, request, jsonify
import jwt
import hashlib
from storage.users import add_user, get_user_by_username
from middleware import token_required, JWT_SECRET

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'], strict_slashes=False)
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if get_user_by_username(username):
        return jsonify({'error': 'Username already exists'}), 400

    user = add_user(username, password, role)
    if user:
        return jsonify({'message': 'User registered successfully', 'user_id': user['id']}), 201
    return jsonify({'error': 'Error registering user'}), 500

@bp.route('/login', methods=['POST'], strict_slashes=False)
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
        'role': user['role']
    }, JWT_SECRET, algorithm='HS256')

    return jsonify({'token': token, 'user_id': user['id'], 'role': user['role']}), 200

@bp.route('/validate-token', methods=['POST'], strict_slashes=False)
@token_required
def validate_token():
    return jsonify({'user_id': request.user_id, 'role': request.role}), 200
