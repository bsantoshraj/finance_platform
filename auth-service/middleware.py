# auth-service/middleware.py
import jwt
import os
from functools import wraps
from flask import request, jsonify

#JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
JWT_SECRET = os.getenv('JWT_SECRET', 'my_secret_key_123')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split()[1]
            except IndexError:
                return jsonify({'error': 'Bearer token malformed'}), 401

        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401

        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user_id = data['user_id']
            request.role = data['role']
            # Set status, default to 'approved' if missing
            request.status = data.get('status', 'approved')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except KeyError as e:
            return jsonify({'error': f'Missing required field in token: {str(e)}'}), 401

        return f(*args, **kwargs)
    return decorated
