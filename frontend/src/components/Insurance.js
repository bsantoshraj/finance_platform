// frontend/src/components/Insurance.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import AddEditInsurance from './AddEditInsurance';

Modal.setAppElement('#root');

function Insurance() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [insurances, setInsurances] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/insurance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsurances(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching insurance';
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
      await axios.delete(`http://localhost:5000/api/insurance/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsurances(insurances.filter((item) => item.id !== id));
      toast.success('Insurance deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting insurance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInsurances();
  }, [token, fetchInsurances]);

  const openModal = (insurance = null) => {
    setSelectedInsurance(insurance);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInsurance(null);
    fetchInsurances();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Insurance</h1>
        <button onClick={() => openModal()} className="btn-primary">
          Add Insurance
        </button>
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {insurances.length === 0 && !loading && !error && (
        <p className="text-muted">No insurance found. Add an insurance policy to get started!</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insurances.map((item) => (
          <div key={item.id} className="card">
            <h2 className="text-xl font-semibold text-text mb-2">{item.name}</h2>
            <p className="text-muted">Type: {item.insurance_type}</p>
            <p className="text-muted">Premium: ${item.premium}</p>
            <p className="text-muted">Coverage: ${item.coverage}</p>
            <p className="text-muted">Premium Term: {item.premium_term}</p>
            <p className="text-muted">Start Date: {item.start_date}</p>
            <p className="text-muted">End Date: {item.end_date}</p>
            <p className="text-muted">Maturity Value: ${item.maturity_value}</p>
            <p className="text-muted">Status: {item.is_active ? 'Active' : 'Inactive'}</p>
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
        <AddEditInsurance insurance={selectedInsurance} onClose={closeModal} />
      </Modal>
    </div>
  );
}

export default Insurance;
