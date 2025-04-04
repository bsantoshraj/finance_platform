// frontend/src/components/Income.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import AddEditIncome from './AddEditIncome';

Modal.setAppElement('#root');

function Income() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [incomes, setIncomes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/income', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching incomes';
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
      await axios.delete(`http://localhost:5000/api/income/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomes(incomes.filter((income) => income.id !== id));
      toast.success('Income deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting income';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchIncomes();
  }, [token, fetchIncomes]);

  const openModal = (income = null) => {
    setSelectedIncome(income);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIncome(null);
    fetchIncomes();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Income</h1>
        <button onClick={() => openModal()} className="btn-primary">
          Add Income
        </button>
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {incomes.length === 0 && !loading && !error && (
        <p className="text-muted">No incomes found. Add an income to get started!</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incomes.map((income) => (
          <div key={income.id} className="card">
            <h2 className="text-xl font-semibold text-text mb-2">{income.name}</h2>
            <p className="text-muted">Amount: ${income.amount}</p>
            <p className="text-muted">Term: {income.term}</p>
            <p className="text-muted">Date: {income.date}</p>
            <div className="mt-4 flex space-x-2">
              <button onClick={() => openModal(income)} className="btn-primary">
                Edit
              </button>
              <button onClick={() => handleDelete(income.id)} className="btn-danger">
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
        <AddEditIncome income={selectedIncome} onClose={closeModal} />
      </Modal>
    </div>
  );
}

export default Income;
