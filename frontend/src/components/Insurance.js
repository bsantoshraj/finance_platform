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
      {insurances
