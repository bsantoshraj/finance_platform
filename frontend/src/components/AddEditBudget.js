import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddEditBudget({ budget, onClose }) {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const { token, setLoading, setError, loading, error } = useFinance();

  // Predefined categories (aligned with backend's original allowed_categories)
  const predefinedCategories = [
    'Debts',
    'Transports',
    'Saving',
    'Grocery',
    'Insurance',
    'Subscriptions',
    'Entertainment',
    'Utilities',
    'Other',
  ];

  useEffect(() => {
    if (budget && budget.categories) {
      setCategories(budget.categories);
    }
  }, [budget]);

  const handleAddCategory = () => {
    let category = selectedCategory;
    if (selectedCategory === 'Other') {
      if (!customCategory.trim()) {
        toast.error('Please enter a custom category name');
        return;
      }
      category = customCategory.trim();
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (newAmount === '') {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Amount must be a non-negative number');
      return;
    }

    if (categories[category] !== undefined) {
      toast.error('Category already exists. Please choose a different category.');
      return;
    }

    setCategories({ ...categories, [category]: amount });
    setSelectedCategory('');
    setCustomCategory('');
    setNewAmount('');
  };

  const handleRemoveCategory = (category) => {
    const updatedCategories = { ...categories };
    delete updatedCategories[category];
    setCategories(updatedCategories);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (Object.keys(categories).length === 0) {
      setError('At least one category is required');
      toast.error('At least one category is required');
      setLoading(false);
      return;
    }

    const data = {
      categories,
    };

    try {
      if (budget) {
        await axios.put('http://localhost:5000/api/budgets', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Budget updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/budgets', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Budget added successfully!');
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error saving budget';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-4">{budget ? 'Edit Budget' : 'Add Budget'}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text mb-2">Categories</h3>
          {Object.entries(categories).length === 0 ? (
            <p className="text-muted">No categories added.</p>
          ) : (
            <ul className="list-disc list-inside mb-4">
              {Object.entries(categories).map(([category, amount]) => (
                <li key={category} className="text-muted flex justify-between items-center">
                  <span>{category}: ${amount}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col space-y-2 mb-4">
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomCategory(''); // Clear custom category when not selecting "Other"
                  }
                }}
                className="input-field flex-1"
              >
                <option value="">Select a category</option>
                {predefinedCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="input-field w-24"
                min="0"
                step="0.01"
              />
            </div>
            {selectedCategory === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="input-field"
              />
            )}
            <button
              type="button"
              onClick={handleAddCategory}
              className="btn-primary"
            >
              Add Category
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="btn-primary w-full disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : budget ? 'Update Budget' : 'Add Budget'}
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

export default AddEditBudget;
