# main-backend/middleware.py
from functools import wraps
import jwt
from flask import request, jsonify

def token_required(f):
    print(f"Applying token_required to function: {f}")  # Debug: Log the function
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, 'my_secret_key_123', algorithms=["HS256"])
            request.user_id = data['user_id']
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            return jsonify({'error': 'Token is invalid'}), 401

        return f(*args, **kwargs)
    return decorated

def user_or_cfa_required(f):
    print(f"Applying user_or_cfa_required to function: {f}")  # Debug: Log the function
    if f is None:
        raise ValueError("Function to decorate is None")
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, 'my_secret_key_123', algorithms=["HS256"])
            request.user_id = data['user_id']
            role = data.get('role', 'user')
            if role not in ['user', 'cfa']:
                return jsonify({'error': 'Unauthorized access'}), 403
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            return jsonify({'error': 'Token is invalid'}), 401

        return f(*args, **kwargs)
    return decorated
