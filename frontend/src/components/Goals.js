// frontend/src/components/Goals.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import AddEditGoal from './AddEditGoal';

Modal.setAppElement('#root');

function Goals() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [goals, setGoals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/goals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching goals';
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
      await axios.delete(`http://localhost:5000/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(goals.filter((item) => item.id !== id));
      toast.success('Goal deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting goal';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchGoals();
  }, [token, fetchGoals]);

  const openModal = (goal = null) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGoal(null);
    fetchGoals();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Goals</h1>
        <button onClick={() => openModal()} className="btn-primary">
          Add Goal
        </button>
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {goals.length === 0 && !loading && !error && (
        <p className="text-muted">No goals found. Add a goal to get started!</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((item) => (
          <div key={item.id} className="card">
            <h2 className="text-xl font-semibold text-text mb-2">{item.name}</h2>
            <p className="text-muted">Target Amount: ${item.target_amount}</p>
            <p className="text-muted">Current Amount: ${item.current_amount}</p>
            <p className="text-muted">Target Date: {item.target_date}</p>
            <p className="text-muted">Allocations: {item.allocations.length}</p>
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
        <AddEditGoal goal={selectedGoal} onClose={closeModal} />
      </Modal>
    </div>
  );
}

export default Goals;
