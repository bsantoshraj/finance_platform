# main-backend/app.py
from flask import Flask, request
from flask_cors import CORS
from routes.budgets import bp as budgets_bp
from routes.debts import bp as debts_bp
from routes.investments import bp as investments_bp
from routes.goals import bp as goals_bp
from routes.expenses import bp as expenses_bp
from routes.income import bp as income_bp
from routes.insurance import bp as insurance_bp

app = Flask(__name__)

# Configure CORS using Flask-CORS
CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"]
    }
})

# Debug: Log requests and responses
@app.before_request
def before_request():
    print(f"Request received: {request.method} {request.path}")
    print(f"Origin: {request.headers.get('Origin')}")
    print(f"Headers: {request.headers}")

# Manually add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
    print(f"Response headers: {response.headers}")
    return response

# Register blueprints
app.register_blueprint(budgets_bp, url_prefix='/api/budgets')
app.register_blueprint(debts_bp, url_prefix='/api/debts')
app.register_blueprint(investments_bp, url_prefix='/api/investments')
app.register_blueprint(goals_bp, url_prefix='/api/goals')
app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
app.register_blueprint(income_bp, url_prefix='/api/income')
app.register_blueprint(insurance_bp, url_prefix='/api/insurance')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
