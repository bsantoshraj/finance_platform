import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import AddEditBudget from './AddEditBudget';

Modal.setAppElement('#root');

function Budget() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [budget, setBudget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudget(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching budget';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, setError]);

  useEffect(() => {
    if (token) fetchBudget();
  }, [token, fetchBudget]);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete('http://localhost:5000/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudget(null);
      toast.success('Budget deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting budget';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    console.log('Opening modal');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    fetchBudget();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Budget</h1>
        <div className="flex space-x-2">
          <button onClick={openModal} className="btn-primary">
            {budget ? 'Edit Budget' : 'Add Budget'}
          </button>
          {budget && (
            <button onClick={handleDelete} className="btn-danger">
              Delete Budget
            </button>
          )}
        </div>
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!budget && !loading && !error && (
        <p className="text-muted">No budget found. Add a budget to get started!</p>
      )}
      {budget && !loading && !error && (
        <div className="card">
          <h2 className="text-xl font-semibold text-text mb-2">Budget Details</h2>
          <p className="text-muted">Total Income: ${budget.total_income}</p>
          <p className="text-muted">Total Expenses: ${budget.total_expenses}</p>
          <h3 className="text-lg font-semibold text-text mt-4 mb-2">Categories</h3>
          {Object.entries(budget.categories).length === 0 ? (
            <p className="text-muted">No categories defined.</p>
          ) : (
            <ul className="list-disc list-inside">
              {Object.entries(budget.categories).map(([category, amount]) => (
                <li key={category} className="text-muted">
                  {category}: ${amount}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="card max-w-md mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        style={{ content: { backgroundColor: 'white', padding: '20px', borderRadius: '8px' } }}
      >
        <AddEditBudget budget={budget} onClose={closeModal} />
      </Modal>
    </div>
  );
}

export default Budget;
