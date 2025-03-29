// frontend/src/components/AddEditInvestment.js
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddEditInvestment({ investment, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Mutual Funds',
    date: '',
    details: {
      nav: '',
      units: '',
      current_nav: '',
      purchase_date: '',
      purchase_price: '',
      quantity: '',
      current_price: '',
      current_value: '',
      location: '',
      weight: '',
      current_market_value: '',
    },
  });
  const { token, setLoading, setError, loading, error } = useFinance();

  useEffect(() => {
    if (investment) {
      setFormData({
        name: investment.name,
        type: investment.type,
        date: investment.date,
        details: {
          nav: investment.details.nav || '',
          units: investment.details.units || '',
          current_nav: investment.details.current_nav || '',
          purchase_date: investment.details.purchase_date || '',
          purchase_price: investment.details.purchase_price || '',
          quantity: investment.details.quantity || '',
          current_price: investment.details.current_price || '',
          current_value: investment.details.current_value || '',
          location: investment.details.location || '',
          weight: investment.details.weight || '',
          current_market_value: investment.details.current_market_value || '',
        },
      });
    }
  }, [investment]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDetailsChange = (e) => {
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const details = {};
    if (formData.type === "Mutual Funds") {
      details.nav = formData.details.nav;
      details.units = formData.details.units;
      details.current_nav = formData.details.current_nav;
      details.purchase_date = formData.details.purchase_date;
    } else if (formData.type === "Stocks") {
      details.purchase_price = formData.details.purchase_price;
      details.quantity = formData.details.quantity;
      details.current_price = formData.details.current_price;
      details.purchase_date = formData.details.purchase_date;
    } else if (formData.type === "Real Estate") {
      details.purchase_price = formData.details.purchase_price;
      details.current_value = formData.details.current_value;
      details.purchase_date = formData.details.purchase_date;
      details.location = formData.details.location;
    } else if (formData.type === "Gold") {
      details.purchase_price = formData.details.purchase_price;
      details.weight = formData.details.weight;
      details.current_market_value = formData.details.current_market_value;
      details.purchase_date = formData.details.purchase_date;
    }

    const data = {
      name: formData.name,
      type: formData.type,
      date: formData.date,
      details,
    };

    try {
      if (investment) {
        await axios.put(`http://localhost:5000/api/investments/${investment.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Investment updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/investments', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Investment added successfully!');
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error saving investment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-4">{investment ? 'Edit Investment' : 'Add Investment'}</h2>
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
          <label className="block text-muted mb-2" htmlFor="type">Type</label>
          <select
            name="type"
            id="type"
            value={formData.type}
            onChange={handleChange}
            className="input-field"
          >
            <option value="Mutual Funds">Mutual Funds</option>
            <option value="Stocks">Stocks</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Gold">Gold</option>
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

        {formData.type === "Mutual Funds" && (
          <>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="nav">NAV at Purchase ($)</label>
              <input
                type="number"
                name="nav"
                id="nav"
                value={formData.details.nav}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="units">Units</label>
              <input
                type="number"
                name="units"
                id="units"
                value={formData.details.units}
                onChange={handleDetailsChange}
                className="input-field"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="current_nav">Current NAV ($)</label>
              <input
                type="number"
                name="current_nav"
                id="current_nav"
                value={formData.details.current_nav}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="purchase_date">Purchase Date</label>
              <input
                type="date"
                name="purchase_date"
                id="purchase_date"
                value={formData.details.purchase_date}
                onChange={handleDetailsChange}
                className="input-field"
                required
              />
            </div>
          </>
        )}

        {formData.type === "Stocks" && (
          <>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="purchase_price">Purchase Price ($)</label>
              <input
                type="number"
                name="purchase_price"
                id="purchase_price"
                value={formData.details.purchase_price}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="quantity">Quantity</label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                value={formData.details.quantity}
                onChange={handleDetailsChange}
                className="input-field"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="current_price">Current Price ($)</label>
              <input
                type="number"
                name="current_price"
                id="current_price"
                value={formData.details.current_price}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="purchase_date">Purchase Date</label>
              <input
                type="date"
                name="purchase_date"
                id="purchase_date"
                value={formData.details.purchase_date}
                onChange={handleDetailsChange}
                className="input-field"
                required
              />
            </div>
          </>
        )}

        {formData.type === "Real Estate" && (
          <>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="purchase_price">Purchase Price ($)</label>
              <input
                type="number"
                name="purchase_price"
                id="purchase_price"
                value={formData.details.purchase_price}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="current_value">Current Value ($)</label>
              <input
                type="number"
                name="current_value"
                id="current_value"
                value={formData.details.current_value}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="purchase_date">Purchase Date</label>
              <input
                type="date"
                name="purchase_date"
                id="purchase_date"
                value={formData.details.purchase_date}
                onChange={handleDetailsChange}
                className="input-field"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="location">Location</label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.details.location}
                onChange={handleDetailsChange}
                className="input-field"
                required
              />
            </div>
          </>
        )}

        {formData.type === "Gold" && (
          <>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="purchase_price">Purchase Price ($)</label>
              <input
                type="number"
                name="purchase_price"
                id="purchase_price"
                value={formData.details.purchase_price}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="weight">Weight (grams)</label>
              <input
                type="number"
                name="weight"
                id="weight"
                value={formData.details.weight}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="current_market_value">Current Market Value ($)</label>
              <input
                type="number"
                name="current_market_value"
                id="current_market_value"
                value={formData.details.current_market_value}
                onChange={handleDetailsChange}
                className="input-field"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-muted mb-2" htmlFor="purchase_date">Purchase Date</label>
              <input
                type="date"
                name="purchase_date"
                id="purchase_date"
                value={formData.details.purchase_date}
                onChange={handleDetailsChange}
                className="input-field"
                required
              />
            </div>
          </>
        )}

        <div className="flex space-x-2">
          <button
            type="submit"
            className="btn-primary w-full disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : investment ? 'Update Investment' : 'Add Investment'}
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

export default AddEditInvestment;
