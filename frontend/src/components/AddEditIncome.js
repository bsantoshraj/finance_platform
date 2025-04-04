// frontend/src/components/AddEditIncome.js
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddEditIncome({ income, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    term: 'monthly',
    date: '',
  });
  const { token, setLoading, setError, loading, error } = useFinance();

  useEffect(() => {
    if (income) {
      setFormData({
        name: income.name,
        amount: income.amount,
        term: income.term,
        date: income.date,
      });
    }
  }, [income]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      // Prevent negative numbers in the input
      if (value < 0) {
        toast.error('Amount cannot be negative');
        return;
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Additional validation before submission
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      setError('Amount must be a non-negative number');
      toast.error('Amount must be a non-negative number');
      setLoading(false);
      return;
    }

    try {
      if (income) {
        await axios.put(`http://localhost:5000/api/income/${income.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Income updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/income', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Income added successfully!');
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error saving income';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-4">{income ? 'Edit Income' : 'Add Income'}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
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
            min="0" // HTML5 validation to prevent negative numbers
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="term">Term</label>
          <select
            name="term"
            id="term"
            value={formData.term}
            onChange={handleChange}
            className="input-field"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
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
        <div className="flex space-x-2">
          <button
            type="submit"
            className="btn-primary w-full disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : income ? 'Update Income' : 'Add Income'}
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

export default AddEditIncome;
