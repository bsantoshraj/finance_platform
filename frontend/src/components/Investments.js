// frontend/src/components/Investments.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import AddEditInvestment from './AddEditInvestment';

Modal.setAppElement('#root');

function Investments() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [investments, setInvestments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/investments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvestments(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching investments';
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
      await axios.delete(`http://localhost:5000/api/investments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvestments(investments.filter((investment) => investment.id !== id));
      toast.success('Investment deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting investment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInvestments();
  }, [token, fetchInvestments]);

  const openModal = (investment = null) => {
    setSelectedInvestment(investment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvestment(null);
    fetchInvestments();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Investments</h1>
        <button onClick={() => openModal()} className="btn-primary">
          Add Investment
        </button>
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {investments.length === 0 && !loading && !error && (
        <p className="text-muted">No investments found. Add an investment to get started!</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments.map((investment) => (
          <div key={investment.id} className="card">
            <h2 className="text-xl font-semibold text-text mb-2">{investment.name}</h2>
            <p className="text-muted">Type: {investment.type}</p>
            <p className="text-muted">Date: {investment.date}</p>
            {investment.type === "Mutual Funds" && (
              <>
                <p className="text-muted">NAV at Purchase: ${investment.details.nav}</p>
                <p className="text-muted">Units: {investment.details.units}</p>
                <p className="text-muted">Current NAV: ${investment.details.current_nav}</p>
                <p className="text-muted">Purchase Date: {investment.details.purchase_date}</p>
              </>
            )}
            {investment.type === "Stocks" && (
              <>
                <p className="text-muted">Purchase Price: ${investment.details.purchase_price}</p>
                <p className="text-muted">Quantity: {investment.details.quantity}</p>
                <p className="text-muted">Current Price: ${investment.details.current_price}</p>
                <p className="text-muted">Purchase Date: {investment.details.purchase_date}</p>
              </>
            )}
            {investment.type === "Real Estate" && (
              <>
                <p className="text-muted">Purchase Price: ${investment.details.purchase_price}</p>
                <p className="text-muted">Current Value: ${investment.details.current_value}</p>
                <p className="text-muted">Purchase Date: {investment.details.purchase_date}</p>
                <p className="text-muted">Location: {investment.details.location}</p>
              </>
            )}
            {investment.type === "Gold" && (
              <>
                <p className="text-muted">Purchase Price: ${investment.details.purchase_price}</p>
                <p className="text-muted">Weight: {investment.details.weight} grams</p>
                <p className="text-muted">Current Market Value: ${investment.details.current_market_value}</p>
                <p className="text-muted">Purchase Date: {investment.details.purchase_date}</p>
              </>
            )}
            <div className="mt-4 flex space-x-2">
              <button onClick={() => openModal(investment)} className="btn-primary">
                Edit
              </button>
              <button onClick={() => handleDelete(investment.id)} className="btn-danger">
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
        <AddEditInvestment investment={selectedInvestment} onClose={closeModal} />
      </Modal>
    </div>
  );
}

export default Investments;
