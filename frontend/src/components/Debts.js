import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import AddEditDebt from './AddEditDebt';

Modal.setAppElement('#root');

function Debts() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [debts, setDebts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/debts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDebts(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching debts';
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
      await axios.delete(`http://localhost:5000/api/debts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDebts(debts.filter((debt) => debt.id !== id));
      toast.success('Debt deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting debt';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDebts();
  }, [token, fetchDebts]);

  const openModal = (debt = null) => {
    setSelectedDebt(debt);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDebt(null);
    fetchDebts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Debts</h1>
        <button onClick={() => openModal()} className="btn-primary">
          Add Debt
        </button>
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {debts.length === 0 && !loading && !error && (
        <p className="text-muted">No debts found. Add a debt to get started!</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts.map((debt) => (
          <div key={debt.id} className="card">
            <h2 className="text-xl font-semibold text-text mb-2">{debt.creditor}</h2>
            <p className="text-muted">Amount: ${debt.amount}</p>
            <p className="text-muted">Interest Rate: {debt.interest_rate}%</p>
            <p className="text-muted">Term: {debt.term} months</p>
            <p className="text-muted">Date: {debt.date}</p>
            <p className="text-muted">Category: {debt.category || 'Other'}</p>
            <p className="text-muted">Remaining Balance: ${debt.remaining_balance}</p>
            <p className="text-muted">Debt Type: {debt.debt_type}</p>
            <div className="mt-4 flex space-x-2">
              <button onClick={() => openModal(debt)} className="btn-primary">
                Edit
              </button>
              <button onClick={() => handleDelete(debt.id)} className="btn-danger">
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
        <AddEditDebt debt={selectedDebt} onClose={closeModal} />
      </Modal>
    </div>
  );
}

export default Debts;
