import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { toast } from 'react-toastify';

Modal.setAppElement('#root');

function AmortizationModal({ debt, isOpen, onClose, token }) {
  const [schedule, setSchedule] = useState([]);
  const [extraPayment, setExtraPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(debt.interest_rate);
  const [term, setTerm] = useState(debt.term);
  const [ignoreHistory, setIgnoreHistory] = useState(false);

  const fetchAmortizationSchedule = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/debts/${debt.id}/amortization`,
        {
          params: {
            extra_payment: extraPayment,
            interest_rate: interestRate,
            term: term,
            ignore_history: ignoreHistory,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchedule(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching amortization schedule';
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAmortizationSchedule();
    }
  }, [isOpen, extraPayment, interestRate, term, ignoreHistory]);

  const handleRecalculate = () => {
    fetchAmortizationSchedule();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="card max-w-4xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Amortization Schedule for {debt.creditor}</h2>
        <div className="mb-4 flex space-x-4 flex-wrap">
          <div>
            <label className="block text-muted mb-2">Extra Payment ($)</label>
            <input
              type="number"
              value={extraPayment}
              onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
              className="input-field w-32"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-muted mb-2">Interest Rate (%)</label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || debt.interest_rate)}
              className="input-field w-32"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-muted mb-2">Term (months)</label>
            <input
              type="number"
              value={term}
              onChange={(e) => setTerm(parseInt(e.target.value) || debt.term)}
              className="input-field w-32"
              min="1"
            />
          </div>
          <div className="flex items-center">
            <label className="text-muted mr-2">Ignore History</label>
            <input
              type="checkbox"
              checked={ignoreHistory}
              onChange={(e) => setIgnoreHistory(e.target.checked)}
            />
          </div>
          <button onClick={handleRecalculate} className="btn-primary self-end">
            Recalculate
          </button>
        </div>
        {schedule.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Month</th>
                  <th className="border-b p-2">Date</th>
                  <th className="border-b p-2">Payment ($)</th>
                  <th className="border-b p-2">Principal ($)</th>
                  <th className="border-b p-2">Interest ($)</th>
                  <th className="border-b p-2">Remaining ($)</th>
                  <th className="border-b p-2">Total Interest ($)</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((entry) => (
                  <tr key={entry.month}>
                    <td className="border-b p-2">{entry.month}</td>
                    <td className="border-b p-2">{entry.date}</td>
                    <td className="border-b p-2">{entry.payment}</td>
                    <td className="border-b p-2">{entry.principal_payment}</td>
                    <td className="border-b p-2">{entry.interest_payment}</td>
                    <td className="border-b p-2">{entry.remaining_principal}</td>
                    <td className="border-b p-2">{entry.total_interest_paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">No amortization schedule available.</p>
        )}
        <div className="flex space-x-2 mt-4">
          <button onClick={onClose} className="btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AmortizationModal;
