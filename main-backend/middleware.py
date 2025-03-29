# main-backend/middleware.py
import jwt
import os
import requests
from functools import wraps
from flask import request, jsonify

JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')

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
            response = requests.post('http://localhost:5001/validate-token', headers={'Authorization': f'Bearer {token}'})
            if response.status_code != 200:
                return jsonify({'error': 'Invalid or expired token'}), 401
            data = response.json()
            request.user_id = data['user_id']
            request.role = data['role']
        except requests.RequestException:
            return jsonify({'error': 'Unable to validate token'}), 500

        return f(*args, **kwargs)
    return decorated
