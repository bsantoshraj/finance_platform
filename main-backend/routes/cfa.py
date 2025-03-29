# main-backend/routes/cfa.py
from flask import Blueprint, jsonify
from storage.resources import init_db
from storage.income import get_all_income
from storage.expenses import get_all_expenses
from storage.debts import get_all_debts
from storage.investments import get_all_investments
from storage.insurance import get_all_insurance
from storage.goals import get_all_goals
from storage.budgets import get_budget, get_budget_variance
from middleware import cfa_required

bp = Blueprint('cfa', __name__)

@bp.route('/users/<int:user_id>/financials', methods=['GET'], endpoint='get_user_financials', strict_slashes=False)
@cfa_required
def get_user_financials(user_id):
    init_db(user_id)
    financials = {
        'income': get_all_income(user_id),
        'expenses': get_all_expenses(user_id),
        'debts': get_all_debts(user_id),
        'investments': get_all_investments(user_id),
        'insurance': get_all_insurance(user_id),
        'goals': get_all_goals(user_id),
        'budget': get_budget(user_id)
    }
    return jsonify(financials), 200

@bp.route('/users/<int:user_id>/variance/<month>', methods=['GET'], endpoint='get_user_variance', strict_slashes=False)
@cfa_required
def get_user_variance(user_id, month):
    init_db(user_id)
    variance = get_budget_variance(user_id, month)
    if variance:
        return jsonify(variance), 200
    return jsonify({'error': 'Budget not found'}), 404
