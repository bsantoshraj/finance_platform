// frontend/src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function AdminDashboard() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [pendingCFAs, setPendingCFAs] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cfaRes, usersRes] = await Promise.all([
          axios.get('http://localhost:5001/cfa/pending', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setPendingCFAs(cfaRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Error fetching data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, setLoading, setError]);

  const handleApprove = async (cfaId) => {
    try {
      await axios.post(`http://localhost:5001/cfa/${cfaId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('CFA approved successfully!');
      setPendingCFAs(pendingCFAs.filter(cfa => cfa.id !== cfaId));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error approving CFA';
      toast.error(errorMessage);
    }
  };

  const handleReject = async (cfaId) => {
    try {
      await axios.post(`http://localhost:5001/cfa/${cfaId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('CFA rejected successfully!');
      setPendingCFAs(pendingCFAs.filter(cfa => cfa.id !== cfaId));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error rejecting CFA';
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text mb-6">Admin Dashboard</h1>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Pending CFA Approvals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {pendingCFAs.map((cfa) => (
              <div key={cfa.id} className="card">
                <h3 className="text-lg font-semibold text-text mb-2">CFA ID: {cfa.id}</h3>
                <p className="text-muted">Username: {cfa.username}</p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleApprove(cfa.id)}
                    className="btn-primary"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(cfa.id)}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-text mb-4">Platform Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((userData) => (
              <div key={userData.user_id} className="card">
                <h3 className="text-lg font-semibold text-text mb-2">User ID: {userData.user_id}</h3>
                <p className="text-muted">Income: ${userData.income.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}</p>
                <p className="text-muted">Expenses: ${userData.expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}</p>
                <p className="text-muted">Debts: ${userData.debts.reduce((sum, item) => sum + parseFloat(item.remaining_balance || item.amount), 0).toFixed(2)}</p>
                <p className="text-muted">Advisories: {userData.advisories.length}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
