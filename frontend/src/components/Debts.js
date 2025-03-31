import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import Modal from 'react-modal';
import AddEditDebt from './AddEditDebt';

// For graph rendering
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

Modal.setAppElement('#root');

function Debts() {
  const { token, setLoading, setError, loading, error } = useFinance();
  const [debts, setDebts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isAmortizationModalOpen, setIsAmortizationModalOpen] = useState(false);
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [amortizationDebtId, setAmortizationDebtId] = useState(null);
  const [whatIfScenario, setWhatIfScenario] = useState({
    extraEMI: 0,
    lumpSum: 0,
    emiIncrease: 0,
    earlyPayment: 0,
  });
  const [whatIfSchedule, setWhatIfSchedule] = useState([]);

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

  const fetchAmortizationSchedule = async (debtId, extraPayment = null, interestRate = null, term = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (extraPayment !== null) params.extra_payment = extraPayment;
      if (interestRate !== null) params.interest_rate = interestRate;
      if (term !== null) params.term = term;

      const response = await axios.get(`http://localhost:5000/api/debts/${debtId}/amortization`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error fetching amortization schedule';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleAmortizeClick = async (event, debtId) => {
    event.preventDefault(); // Prevent any default navigation behavior
    const schedule = await fetchAmortizationSchedule(debtId);
    setAmortizationSchedule(schedule);
    setAmortizationDebtId(debtId);
    setWhatIfSchedule([]); // Reset what-if schedule
    setWhatIfScenario({
      extraEMI: 0,
      lumpSum: 0,
      emiIncrease: 0,
      earlyPayment: 0,
    });
    setIsAmortizationModalOpen(true);
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

  const closeAmortizationModal = () => {
    setIsAmortizationModalOpen(false);
    setAmortizationSchedule([]);
    setAmortizationDebtId(null);
    setWhatIfSchedule([]);
  };

  const handleWhatIfScenario = async () => {
    const debtId = amortizationDebtId;
    let extraPayment = 0;
    let interestRate = null;
    let term = null;

    // Get the original debt details to calculate the monthly payment
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const principal = debt.amount;
    const monthlyRate = debt.interest_rate / 100 / 12;
    const originalTerm = debt.term;
    const monthlyPayment = monthlyRate === 0
      ? principal / originalTerm
      : principal * (monthlyRate * (1 + monthlyRate) ** originalTerm) / ((1 + monthlyRate) ** originalTerm - 1);

    // Apply all scenarios
    const extraEMI = parseInt(whatIfScenario.extraEMI) || 0;
    const lumpSum = parseFloat(whatIfScenario.lumpSum) || 0;
    const earlyPayment = parseFloat(whatIfScenario.earlyPayment) || 0;
    const emiIncrease = parseFloat(whatIfScenario.emiIncrease) || 0;

    // Calculate extra payment from extra EMI and lump sum
    extraPayment = (extraEMI * monthlyPayment) + lumpSum;

    // Fetch the base schedule with extra payment and early payment
    let schedule = await fetchAmortizationSchedule(debtId, extraPayment, interestRate, term);

    // Apply early payment (one-time payment at the start)
    if (earlyPayment > 0 && schedule.length > 0) {
      let remainingPrincipal = schedule[0].remaining_principal - earlyPayment;
      if (remainingPrincipal < 0) remainingPrincipal = 0;
      schedule[0].remaining_principal = remainingPrincipal;
      schedule[0].principal_payment += earlyPayment;
      schedule[0].payment += earlyPayment;

      // Recalculate the remaining schedule
      for (let i = 1; i < schedule.length; i++) {
        if (remainingPrincipal <= 0) {
          schedule = schedule.slice(0, i);
          break;
        }
        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment + extraPayment;
        remainingPrincipal -= principalPayment;
        schedule[i].interest_payment = interestPayment;
        schedule[i].principal_payment = principalPayment;
        schedule[i].payment = monthlyPayment + extraPayment;
        schedule[i].remaining_principal = Math.max(remainingPrincipal, 0);
        schedule[i].total_interest_paid = schedule[i - 1].total_interest_paid + interestPayment;
      }
    }

    // Apply EMI increase
    if (emiIncrease > 0) {
      let remainingPrincipal = schedule[0].remaining_principal;
      let totalInterestPaid = 0;
      let currentMonthlyPayment = monthlyPayment;

      for (let i = 0; i < schedule.length; i++) {
        // Increase EMI by the specified percentage every year (every 12 months)
        if (i > 0 && i % 12 === 0) {
          currentMonthlyPayment *= 1 + (emiIncrease / 100);
        }

        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = currentMonthlyPayment - interestPayment + extraPayment;
        remainingPrincipal -= principalPayment;
        totalInterestPaid += interestPayment;

        if (remainingPrincipal < 0) {
          schedule[i].principal_payment += remainingPrincipal;
          schedule[i].payment = schedule[i].principal_payment + interestPayment;
          remainingPrincipal = 0;
        } else {
          schedule[i].principal_payment = principalPayment;
          schedule[i].payment = currentMonthlyPayment + extraPayment;
        }

        schedule[i].interest_payment = interestPayment;
        schedule[i].remaining_principal = Math.max(remainingPrincipal, 0);
        schedule[i].total_interest_paid = totalInterestPaid;

        if (remainingPrincipal <= 0) {
          schedule = schedule.slice(0, i + 1);
          break;
        }
      }

      schedule = schedule.map(entry => ({
        ...entry,
        payment: Math.round(entry.payment * 100) / 100,
        principal_payment: Math.round(entry.principal_payment * 100) / 100,
        interest_payment: Math.round(entry.interest_payment * 100) / 100,
        remaining_principal: Math.round(entry.remaining_principal * 100) / 100,
        total_interest_paid: Math.round(entry.total_interest_paid * 100) / 100,
      }));
    }

    setWhatIfSchedule(schedule);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWhatIfScenario((prev) => ({ ...prev, [name]: value }));
  };

  // Prepare data for the graph
  const chartData = {
    labels: amortizationSchedule.map((entry) => entry.date),
    datasets: [
      {
        label: 'Remaining Principal (Original)',
        data: amortizationSchedule.map((entry) => entry.remaining_principal),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
      ...(whatIfSchedule.length > 0
        ? [
            {
              label: 'Remaining Principal (What-If)',
              data: whatIfSchedule.map((entry) => entry.remaining_principal),
              borderColor: 'rgba(255, 99, 132, 1)',
              fill: false,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Amortization Schedule Comparison',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Remaining Principal ($)',
        },
      },
    },
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
            <p className="text-muted">Amount: ${debt.amount.toLocaleString()}</p>
            <p className="text-muted">Interest Rate: {debt.interest_rate}%</p>
            <p className="text-muted">Term: {debt.term} months</p>
            <p className="text-muted">Date: {debt.date}</p>
            <p className="text-muted">Category: {debt.category || 'Other'}</p>
            <p className="text-muted">Remaining Balance: ${debt.remaining_balance.toLocaleString()}</p>
            <p className="text-muted">Debt Type: {debt.debt_type}</p>
            <p className="text-muted">Principal Paid: ${debt.principal_paid.toLocaleString()}</p>
            <p className="text-muted">Principal Pending: ${debt.principal_pending.toLocaleString()}</p>
            <p className="text-muted">Interest Paid: ${debt.interest_paid.toLocaleString()}</p>
            <p className="text-muted">Interest Pending: ${debt.interest_pending.toLocaleString()}</p>
            <p className="text-muted">Progress: ${debt.progress_percentage}%</p>
            {/* Custom Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${debt.progress_percentage}%` }}
              ></div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button onClick={() => openModal(debt)} className="btn-primary">
                Edit
              </button>
              <button onClick={() => handleDelete(debt.id)} className="btn-danger">
                Delete
              </button>
              <button onClick={(e) => handleAmortizeClick(e, debt.id)} className="btn-secondary">
                Amortize
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add/Edit Debt */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="card max-w-md mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <AddEditDebt debt={selectedDebt} onClose={closeModal} />
      </Modal>

      {/* Modal for Amortization Schedule */}
      <Modal
        isOpen={isAmortizationModalOpen}
        onRequestClose={closeAmortizationModal}
        className="bg-white rounded-lg max-w-4xl w-full mx-auto p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start mt-10"
      >
        <h2 className="text-2xl font-bold text-text mb-4">
          Amortization Schedule for Debt ID: {amortizationDebtId}
        </h2>
        {/* What-If Scenarios */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text mb-2">What-If Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-muted mb-1">Pay N Extra EMI Every Year:</label>
              <select
                name="extraEMI"
                value={whatIfScenario.extraEMI}
                onChange={handleInputChange}
                className="input-field w-full"
              >
                {[...Array(12).keys()].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-muted mb-1">Lump Sum Amount Every Year ($):</label>
              <input
                type="number"
                name="lumpSum"
                value={whatIfScenario.lumpSum}
                onChange={handleInputChange}
                className="input-field w-full"
                min="0"
              />
            </div>
            <div>
              <label className="block text-muted mb-1">Raise EMI by X% Every Year:</label>
              <input
                type="number"
                name="emiIncrease"
                value={whatIfScenario.emiIncrease}
                onChange={handleInputChange}
                className="input-field w-full"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-muted mb-1">One-Time Early Principal Payment ($):</label>
              <input
                type="number"
                name="earlyPayment"
                value={whatIfScenario.earlyPayment}
                onChange={handleInputChange}
                className="input-field w-full"
                min="0"
              />
            </div>
          </div>
          <button
            onClick={() => handleWhatIfScenario()}
            className="btn-primary mt-4"
          >
            Apply Scenarios
          </button>
        </div>
        {/* Graph */}
        <div className="mb-6">
          <Line data={chartData} options={chartOptions} />
        </div>
        {/* Amortization Schedule Table */}
        <div className="max-h-[400px] overflow-y-scroll custom-scrollbar">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Month</th>
                <th className="py-2 px-4 border">Date</th>
                <th className="py-2 px-4 border">Payment</th>
                <th className="py-2 px-4 border">Principal Payment</th>
                <th className="py-2 px-4 border">Interest Payment</th>
                <th className="py-2 px-4 border">Remaining Principal</th>
                <th className="py-2 px-4 border">Total Interest Paid</th>
              </tr>
            </thead>
            <tbody>
              {(whatIfSchedule.length > 0 ? whatIfSchedule : amortizationSchedule).map((entry, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border">{entry.month}</td>
                  <td className="py-2 px-4 border">{entry.date}</td>
                  <td className="py-2 px-4 border">${entry.payment.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.principal_payment.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.interest_payment.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.remaining_principal.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.total_interest_paid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={closeAmortizationModal} className="btn-secondary mt-4">
          Close
        </button>
      </Modal>
    </div>
  );
}

export default Debts;
