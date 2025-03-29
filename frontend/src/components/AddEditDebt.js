// frontend/src/components/AddEditDebt.js
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddEditDebt({ debt, onClose }) {
  const [formData, setFormData] = useState({
    amount: '',
    creditor: '',
    interest_rate: '',
    term: '',
    date: '',
    category: 'Other',
    debt_type: 'fixed',
  });
  const { token, setLoading, setError, loading, error } = useFinance();

  useEffect(() => {
    if (debt) {
      setFormData({
        amount: debt.amount,
        creditor: debt.creditor,
        interest_rate: debt.interest_rate,
        term: debt.term,
        date: debt.date,
        category: debt.category || 'Other',
        debt_type: debt.debt_type,
      });
    }
  }, [debt]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (debt) {
        await axios.put(`http://localhost:5000/api/debts/${debt.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Debt updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/debts', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Debt added successfully!');
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error saving debt';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-4">{debt ? 'Edit Debt' : 'Add Debt'}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="amount">Amount ($)</label>
          <input
            type="number"
            name="amount"
            id="amount"
            value={formData.amount}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="creditor">Creditor</label>
          <input
            type="text"
            name="creditor"
            id="creditor"
            value={formData.creditor}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="interest_rate">Interest Rate (%)</label>
          <input
            type="number"
            name="interest_rate"
            id="interest_rate"
            value={formData.interest_rate}
            onChange={handleChange}
            className="input-field"
            step="0.01"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="term">Term (months)</label>
          <input
            type="number"
            name="term"
            id="term"
            value={formData.term}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="date">Date</label>
          <input
            type="date"
            name="date"
            id="date"
            value={formData.date}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="category">Category</label>
          <input
            type="text"
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="debt_type">Debt Type</label>
          <select
            name="debt_type"
            id="debt_type"
            value={formData.debt_type}
            onChange={handleChange}
            className="input-field"
          >
            <option value="fixed">Fixed Rate</option>
            <option value="variable">Variable Rate</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="btn-primary w-full disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : debt ? 'Update Debt' : 'Add Debt'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddEditDebt;
