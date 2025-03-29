import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function UserDashboard() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalDebt: 0,
    totalInvestments: 0,
    totalPremiums: 0,
    totalSavings: 0,
    totalAllocations: 0,
  });

  useEffect(() => {
    if (!token) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const month = new Date().toISOString().slice(0, 7); // Current month (YYYY-MM)
        const [incomeRes, expensesRes, debtsRes, investmentsRes, insuranceRes, varianceRes] = await Promise.all([
          axios.get('http://localhost:5000/api/income', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/expenses', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/debts', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/investments', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/insurance', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:5000/api/budgets/variance/${month}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const totalIncome = incomeRes.data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expensesRes.data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalDebt = debtsRes.data.reduce((sum, item) => sum + parseFloat(item.remaining_balance || item.amount), 0);

        const totalInvestments = investmentsRes.data.reduce((sum, investment) => {
          if (investment.type === "Mutual Funds") {
            return sum + (parseFloat(investment.details.current_nav) * parseFloat(investment.details.units));
          } else if (investment.type === "Stocks") {
            return sum + (parseFloat(investment.details.current_price) * parseFloat(investment.details.quantity));
          } else if (investment.type === "Real Estate") {
            return sum + parseFloat(investment.details.current_value);
          } else if (investment.type === "Gold") {
            return sum + parseFloat(investment.details.current_market_value);
          }
          return sum;
        }, 0);

        const totalPremiums = insuranceRes.data
          .filter(item => item.is_active)
          .reduce((sum, item) => sum + parseFloat(item.premium), 0);

        setSummary({
          totalIncome,
          totalExpenses,
          totalDebt,
          totalInvestments,
          totalPremiums,
          totalSavings: varianceRes.data.total_savings,
          totalAllocations: varianceRes.data.total_allocations,
        });
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Error fetching financial summary';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [token, setLoading, setError]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text mb-6">User Dashboard</h1>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-2">Total Income</h2>
            <p className="text-2xl text-green-500">${summary.totalIncome.toFixed(2)}</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-2">Total Expenses</h2>
            <p className="text-2xl text-red-500">${summary.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-2">Total Debt</h2>
            <p className="text-2xl text-yellow-500">${summary.totalDebt.toFixed(2)}</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-2">Total Investments</h2>
            <p className="text-2xl text-blue-500">${summary.totalInvestments.toFixed(2)}</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-2">Total Premiums</h2>
            <p className="text-2xl text-purple-500">${summary.totalPremiums.toFixed(2)}</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-2">Total Savings</h2>
            <p className="text-2xl text-green-500">${summary.totalSavings.toFixed(2)}</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-text mb-2">Goal Allocations</h2>
            <p className="text-2xl text-blue-500">${summary.totalAllocations.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
