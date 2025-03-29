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
            request.status = data['status']
        except requests.RequestException:
            return jsonify({'error': 'Unable to validate token'}), 500

        return f(*args, **kwargs)
    return decorated

def cfa_required(f):
    """
    Decorator to ensure the user is a CFA and has been approved.
    """
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.role != 'CFA':
            return jsonify({'error': 'Access restricted to CFAs'}), 403
        if request.status != 'approved':
            return jsonify({'error': 'CFA must be approved to provide services'}), 403
        return f(*args, **kwargs)
    return decorated

def user_or_cfa_required(f):
    """
    Decorator to ensure the user is either the owner of the data or an approved CFA.
    """
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user_id = kwargs.get('user_id')
        if request.role != 'CFA' and request.user_id != user_id:
            return jsonify({'error': 'Access restricted to the user or CFAs'}), 403
        if request.role == 'CFA' and request.status != 'approved':
            return jsonify({'error': 'CFA must be approved to access user data'}), 403
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """
    Decorator to ensure the user is an admin.
    """
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.role != 'admin':
            return jsonify({'error': 'Access restricted to admins'}), 403
        return f(*args, **kwargs)
    return decorated
