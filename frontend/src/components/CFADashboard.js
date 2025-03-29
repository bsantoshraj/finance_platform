import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function CFADashboard() {
  const { user, token, setLoading, setError, loading, error } = useFinance();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!token || user.status !== 'approved') return;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Error fetching users';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, user, setLoading, setError]);

  if (user.status !== 'approved') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-text mb-6">CFA Dashboard</h1>
        <p className="text-red-500">Your CFA status is {user.status}. Please wait for admin approval to provide services.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text mb-6">CFA Dashboard</h1>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((userData) => (
              <div key={userData.user_id} className="card">
                <h3 className="text-lg font-semibold text-text mb-2">User ID: {userData.user_id}</h3>
                <p className="text-muted">Income: ${userData.income.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}</p>
                <p className="text-muted">Expenses: ${userData.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}</p>
                <p className="text-muted">Debts: ${userData.debts.reduce((sum, item) => sum + parseFloat(item.remaining_balance || item.amount), 0).toFixed(2)}</p>
                <button
                  onClick={() => window.location.href = `/advisories?user_id=${userData.user_id}`}
                  className="btn-primary mt-4"
                >
                  Provide Advice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CFADashboard;
