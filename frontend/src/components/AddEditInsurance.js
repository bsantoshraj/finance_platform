// frontend/src/components/AddEditInsurance.js
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddEditInsurance({ insurance, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    insurance_type: 'Medical',
    premium: '',
    coverage: '',
    premium_term: 'monthly',
    start_date: '',
    end_date: '',
    is_active: true,
    maturity_value: '',
  });
  const { token, setLoading, setError, loading, error } = useFinance();

  useEffect(() => {
    if (insurance) {
      setFormData({
        name: insurance.name,
        insurance_type: insurance.insurance_type,
        premium: insurance.premium,
        coverage: insurance.coverage,
        premium_term: insurance.premium_term,
        start_date: insurance.start_date,
        end_date: insurance.end_date,
        is_active: !!insurance.is_active,
        maturity_value: insurance.maturity_value || '',
      });
    }
  }, [insurance]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (insurance) {
        await axios.put(`http://localhost:5000/api/insurance/${insurance.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Insurance updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/insurance', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Insurance added successfully!');
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error saving insurance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-4">{insurance ? 'Edit Insurance' : 'Add Insurance'}</h2>
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
          <label className="block text-muted mb-2" htmlFor="insurance_type">Type</label>
          <select
            name="insurance_type"
            id="insurance_type"
            value={formData.insurance_type}
            onChange={handleChange}
            className="input-field"
          >
            <option value="Medical">Medical</option>
            <option value="Term">Term</option>
            <option value="Asset">Asset</option>
            <option value="Special">Special</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="premium">Premium ($)</label>
          <input
            type="number"
            name="premium"
            id="premium"
            value={formData.premium}
            onChange={handleChange}
            className="input-field"
            step="0.01"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="coverage">Coverage ($)</label>
          <input
            type="number"
            name="coverage"
            id="coverage"
            value={formData.coverage}
            onChange={handleChange}
            className="input-field"
            step="0.01"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="premium_term">Premium Term</label>
          <select
            name="premium_term"
            id="premium_term"
            value={formData.premium_term}
            onChange={handleChange}
            className="input-field"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="start_date">Start Date</label>
          <input
            type="date"
            name="start_date"
            id="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="end_date">End Date</label>
          <input
            type="date"
            name="end_date"
            id="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="maturity_value">Maturity Value ($)</label>
          <input
            type="number"
            name="maturity_value"
            id="maturity_value"
            value={formData.maturity_value}
            onChange={handleChange}
            className="input-field"
            step="0.01"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-muted mb-2" htmlFor="is_active">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="mr-2"
            />
            Active
          </label>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="btn-primary w-full disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : insurance ? 'Update Insurance' : 'Add Insurance'}
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

export default AddEditInsurance;
