// frontend/src/components/Expenses.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import AddEditExpense from './AddEditExpense';

Modal.setAppElement('#root');

function Expenses() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching expenses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, setError]);

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(expenses.filter((item) => item.id !== id));
      toast.success('Expense deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchExpenses();
  }, [token, fetchExpenses]);

  const openModal = (expense = null) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
    fetchExpenses();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Expenses</h1>
        <button onClick={() => openModal()} className="btn-primary">
          Add Expense
        </button>
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {expenses.length === 0 && !loading && !error && (
        <p className="text-muted">No expenses found. Add an expense to get started!</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expenses.map((item) => (
          <div key={item.id} className="card">
            <h2 className="text-xl font-semibold text-text mb-2">{item.category}</h2>
            <p className="text-muted">Amount: ${item.amount}</p>
            <p className="text-muted">Date: {item.date}</p>
            <div className="mt-4 flex space-x-2">
              <button onClick={() => openModal(item)} className="btn-primary">
                Edit
              </button>
              <button onClick={() => handleDelete(item.id)} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="card max-w-md mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <AddEditExpense expense={selectedExpense} onClose={closeModal} />
      </Modal>
    </div>
  );
}

export default Expenses;
