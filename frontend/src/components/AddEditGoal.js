// frontend/src/components/AddEditGoal.js
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddEditGoal({ goal, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: '',
  });
  const { token, setLoading, setError, loading, error } = useFinance();

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        target_date: goal.target_date,
      });
      console.log('Initial formData (from goal):', {
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        target_date: goal.target_date,
      });
    } else {
      console.log('Initial formData (new goal):', formData);
    }
  }, [goal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`handleChange - Field: ${name}, Value: ${value}, Type: ${typeof value}`);

    if (name === 'target_amount') {
      if (value === '') {
        setFormData({ ...formData, [name]: value });
        console.log('target_amount set to empty string');
        return;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        toast.error('Target amount must be a positive number (greater than 0)');
        setFormData({ ...formData, [name]: '' });
        console.log('target_amount reset to empty string due to invalid value');
        return;
      }
    }
    setFormData({ ...formData, [name]: value });
    console.log('Updated formData:', { ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('handleSubmit - Form Data before validation:', formData);

    const form = e.target;
    if (!form.checkValidity()) {
      setError('Please fill out all required fields correctly');
      toast.error('Please fill out all required fields correctly');
      setLoading(false);
      console.log('Form validation failed (HTML5)');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      toast.error('Name is required');
      setLoading(false);
      console.log('Validation failed: Name is empty');
      return;
    }

    if (formData.target_amount === '' || formData.target_amount == null) {
      setError('Target amount is required');
      toast.error('Target amount is required');
      setLoading(false);
      console.log('Validation failed: Target amount is empty or null');
      return;
    }

    const targetAmount = parseFloat(formData.target_amount);
    if (isNaN(targetAmount)) {
      setError('Target amount must be a valid number');
      toast.error('Target amount must be a valid number');
      setLoading(false);
      console.log('Validation failed: Target amount is NaN:', formData.target_amount);
      return;
    }
    if (targetAmount <= 0) {
      setError('Target amount must be a positive number (greater than 0)');
      toast.error('Target amount must be a positive number (greater than 0)');
      setLoading(false);
      console.log('Validation failed: Target amount is non-positive:', targetAmount);
      return;
    }

    if (!formData.target_date) {
      setError('Target date is required');
      toast.error('Target date is required');
      setLoading(false);
      console.log('Validation failed: Target date is empty');
      return;
    }

    console.log('Form Data being sent to backend:', formData);

    try {
      if (goal) {
        await axios.put(`http://localhost:5000/api/goals/${goal.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Goal updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/goals', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Goal added successfully!');
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error saving goal';
      setError(errorMessage);
      toast.error(errorMessage);
      console.log('Error from backend:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-4">{goal ? 'Edit Goal' : 'Add Goal'}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} noValidate>
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
          <label className="block text-muted mb-2" htmlFor="target_amount">Target Amount ($)</label>
          <input
            type="number"
            name="target_amount"
            id="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            className="input-field"
            required
            min="0.01"
            step="0.01"
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="current_amount">Current Amount ($)</label>
          <input
            type="number"
            name="current_amount"
            id="current_amount"
            value={formData.current_amount}
            onChange={handleChange}
            className="input-field"
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="target_date">Target Date</label>
          <input
            type="date"
            name="target_date"
            id="target_date"
            value={formData.target_date}
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
            {loading ? 'Saving...' : goal ? 'Update Goal' : 'Add Goal'}
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

export default AddEditGoal;
