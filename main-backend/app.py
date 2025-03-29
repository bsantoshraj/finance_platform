# main-backend/app.py
from flask import Flask
from flask_cors import CORS
from routes.debts import bp as debts_bp
from routes.income import bp as income_bp
from routes.investments import bp as investments_bp
from routes.insurance import bp as insurance_bp
from routes.expenses import bp as expenses_bp
from routes.goals import bp as goals_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(debts_bp, url_prefix='/api/debts')
app.register_blueprint(income_bp, url_prefix='/api/income')
app.register_blueprint(investments_bp, url_prefix='/api/investments')
app.register_blueprint(insurance_bp, url_prefix='/api/insurance')
app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
app.register_blueprint(goals_bp, url_prefix='/api/goals')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

