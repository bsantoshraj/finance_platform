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
    earlyPaymentDate: '', // Initialize date for one-time payment
  });
  const [whatIfSchedules, setWhatIfSchedules] = useState({
    extraEMI: [],
    lumpSum: [],
    emiIncrease: [],
    earlyPayment: [],
    combined: [],
  });
  const [scenarioMode, setScenarioMode] = useState('And'); // 'And' or 'Or'
  const [selectedScenario, setSelectedScenario] = useState(''); // Track which scenario to display in the table in "Or" mode


//part 2 - fetch and delete function
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


//part 3 - amortization functions

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
      return response.data.map(entry => ({
        ...entry,
        annual_lump_sum: 0, // Initialize annual lump sum column
        one_time_lump_sum: 0, // Initialize one-time lump sum column
        percentage_paid: 0, // Initialize percentage paid column
        applied_scenarios: [], // Initialize applied scenarios column
      }));
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
    setWhatIfSchedules({
      extraEMI: [],
      lumpSum: [],
      emiIncrease: [],
      earlyPayment: [],
      combined: [],
    });
    setWhatIfScenario({
      extraEMI: 0,
      lumpSum: 0,
      emiIncrease: 0,
      earlyPayment: 0,
      earlyPaymentDate: '', // Initialize date for one-time payment
    });
    setSelectedScenario(''); // Reset selected scenario
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
    setWhatIfSchedules({
      extraEMI: [],
      lumpSum: [],
      emiIncrease: [],
      earlyPayment: [],
      combined: [],
    });
    setSelectedScenario(''); // Reset selected scenario
  };

  const handleWhatIfScenario = async () => {
    const debtId = amortizationDebtId;

    // Get the original debt details to calculate the monthly payment
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const principal = debt.amount;
    const monthlyRate = debt.interest_rate / 100 / 12;
    const originalTerm = debt.term;
    const monthlyPayment = monthlyRate === 0
      ? principal / originalTerm
      : principal * (monthlyRate * (1 + monthlyRate) ** originalTerm) / ((1 + monthlyRate) ** originalTerm - 1);

    const extraEMI = parseInt(whatIfScenario.extraEMI) || 0;
    const lumpSum = parseFloat(whatIfScenario.lumpSum) || 0;
    const earlyPayment = parseFloat(whatIfScenario.earlyPayment) || 0;
    const earlyPaymentDate = whatIfScenario.earlyPaymentDate || '';
    const emiIncrease = parseFloat(whatIfScenario.emiIncrease) || 0;

    // Calculate schedules for each scenario independently for "Or" mode
    const newSchedules = {
      extraEMI: [],
      lumpSum: [],
      emiIncrease: [],
      earlyPayment: [],
      combined: [],
    };

    // Extra EMI scenario
    if (extraEMI > 0) {
      const extraPayment = extraEMI * monthlyPayment;
      let schedule = await fetchAmortizationSchedule(debtId, extraPayment);
      schedule = schedule.map(entry => ({
        ...entry,
        percentage_paid: principal > 0 ? ((principal - entry.remaining_principal) / principal * 100).toFixed(2) : 0,
        applied_scenarios: ['Extra EMI'],
      }));
      newSchedules.extraEMI = schedule;
      if (!selectedScenario) setSelectedScenario('extraEMI'); // Default to Extra EMI if no scenario is selected
    }

    // Lump Sum scenario
    if (lumpSum > 0) {
      let schedule = await fetchAmortizationSchedule(debtId, lumpSum);
      for (let i = 0; i < schedule.length; i++) {
        if (i % 12 === 0 && i !== 0) { // Apply lump sum at the start of each year after the first month
          schedule[i].annual_lump_sum = lumpSum;
          schedule[i].payment += lumpSum;
          schedule[i].principal_payment += lumpSum;
          let remainingPrincipal = schedule[i].remaining_principal - lumpSum;
          if (remainingPrincipal < 0) remainingPrincipal = 0;
          schedule[i].remaining_principal = remainingPrincipal;

          // Recalculate the remaining schedule
          for (let j = i + 1; j < schedule.length; j++) {
            if (remainingPrincipal <= 0) {
              schedule = schedule.slice(0, j);
              break;
            }
            const interestPayment = remainingPrincipal * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingPrincipal -= principalPayment;
            schedule[j].interest_payment = interestPayment;
            schedule[j].principal_payment = principalPayment;
            schedule[j].payment = monthlyPayment;
            schedule[j].remaining_principal = Math.max(remainingPrincipal, 0);
            schedule[j].total_interest_paid = schedule[j - 1].total_interest_paid + interestPayment;
            if (j % 12 === 0) {
              schedule[j].annual_lump_sum = lumpSum;
            }
          }
        }
      }
      schedule = schedule.map(entry => ({
        ...entry,
        percentage_paid: principal > 0 ? ((principal - entry.remaining_principal) / principal * 100).toFixed(2) : 0,
        applied_scenarios: ['Lump Sum'],
      }));
      newSchedules.lumpSum = schedule;
      if (!selectedScenario) setSelectedScenario('lumpSum'); // Default to Lump Sum if no scenario is selected
    }

    // Early Payment scenario
    if (earlyPayment > 0 && earlyPaymentDate) {
      let schedule = await fetchAmortizationSchedule(debtId);
      let applied = false;
      for (let i = 0; i < schedule.length; i++) {
        if (!applied && schedule[i].date >= earlyPaymentDate) {
          schedule[i].one_time_lump_sum = earlyPayment;
          schedule[i].payment += earlyPayment;
          schedule[i].principal_payment += earlyPayment;
          let remainingPrincipal = schedule[i].remaining_principal - earlyPayment;
          if (remainingPrincipal < 0) remainingPrincipal = 0;
          schedule[i].remaining_principal = remainingPrincipal;
          applied = true;

          for (let j = i + 1; j < schedule.length; j++) {
            if (remainingPrincipal <= 0) {
              schedule = schedule.slice(0, j);
              break;
            }
            const interestPayment = remainingPrincipal * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingPrincipal -= principalPayment;
            schedule[j].interest_payment = interestPayment;
            schedule[j].principal_payment = principalPayment;
            schedule[j].payment = monthlyPayment;
            schedule[j].remaining_principal = Math.max(remainingPrincipal, 0);
            schedule[j].total_interest_paid = schedule[j - 1].total_interest_paid + interestPayment;
          }
        }
      }
      schedule = schedule.map(entry => ({
        ...entry,
        percentage_paid: principal > 0 ? ((principal - entry.remaining_principal) / principal * 100).toFixed(2) : 0,
        applied_scenarios: entry.one_time_lump_sum > 0 ? ['Early Payment'] : [],
      }));
      newSchedules.earlyPayment = schedule;
      if (!selectedScenario) setSelectedScenario('earlyPayment'); // Default to Early Payment if no scenario is selected
    }

    // EMI Increase scenario
    if (emiIncrease > 0) {
      let schedule = await fetchAmortizationSchedule(debtId);
      let remainingPrincipal = schedule[0].remaining_principal;
      let totalInterestPaid = 0;
      let currentMonthlyPayment = monthlyPayment;

      for (let i = 0; i < schedule.length; i++) {
        if (i > 0 && i % 12 === 0) {
          currentMonthlyPayment *= 1 + (emiIncrease / 100);
        }

        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = currentMonthlyPayment - interestPayment;
        remainingPrincipal -= principalPayment;
        totalInterestPaid += interestPayment;

        if (remainingPrincipal < 0) {
          schedule[i].principal_payment += remainingPrincipal;
          schedule[i].payment = schedule[i].principal_payment + interestPayment;
          remainingPrincipal = 0;
        } else {
          schedule[i].principal_payment = principalPayment;
          schedule[i].payment = currentMonthlyPayment;
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
        percentage_paid: principal > 0 ? ((principal - entry.remaining_principal) / principal * 100).toFixed(2) : 0,
        applied_scenarios: ['EMI Increase'],
      }));
      newSchedules.emiIncrease = schedule;
      if (!selectedScenario) setSelectedScenario('emiIncrease'); // Default to EMI Increase if no scenario is selected
    }

    // Combined scenario for "And" mode
    let extraPayment = (extraEMI * monthlyPayment) + lumpSum;
    let schedule = await fetchAmortizationSchedule(debtId, extraPayment);
    let appliedScenarios = [];
    if (extraEMI > 0) appliedScenarios.push('Extra EMI');
    if (lumpSum > 0) appliedScenarios.push('Lump Sum');

    // Apply lump sum payments every year
    for (let i = 0; i < schedule.length; i++) {
        if (i % 12 === 0 && i !== 0) {
            schedule[i].annual_lump_sum = lumpSum;
        }
    }

    // Apply early payment
    if (earlyPayment > 0 && earlyPaymentDate) {
        let applied = false;
        for (let i = 0; i < schedule.length; i++) {
            if (!applied && schedule[i].date >= earlyPaymentDate) {
                schedule[i].one_time_lump_sum = earlyPayment;
                schedule[i].payment += earlyPayment;
                schedule[i].principal_payment += earlyPayment;
                let remainingPrincipal = schedule[i].remaining_principal - earlyPayment;
                if (remainingPrincipal < 0) remainingPrincipal = 0;
                schedule[i].remaining_principal = remainingPrincipal;
                applied = true;

                for (let j = i + 1; j < schedule.length; j++) {
                    if (remainingPrincipal <= 0) {
                        schedule = schedule.slice(0, j);
                        break;
                    }
                    const interestPayment = remainingPrincipal * monthlyRate;
                    const principalPayment = monthlyPayment - interestPayment + (j % 12 === 0 && j !== 0 ? lumpSum : 0);
                    remainingPrincipal -= principalPayment;
                    schedule[j].interest_payment = interestPayment;
                    schedule[j].principal_payment = principalPayment;
                    schedule[j].payment = monthlyPayment + (j % 12 === 0 && j !== 0 ? lumpSum : 0);
                    schedule[j].remaining_principal = Math.max(remainingPrincipal, 0);
                    schedule[j].total_interest_paid = schedule[j - 1].total_interest_paid + interestPayment;
                    if (j % 12 === 0) {
                        schedule[j].annual_lump_sum = lumpSum;
                    }
                }
            }
        }
        appliedScenarios.push('Early Payment');
    }

    // Apply EMI increase
    if (emiIncrease > 0) {
        let remainingPrincipal = schedule[0].remaining_principal;
        let totalInterestPaid = 0;
        let currentMonthlyPayment = monthlyPayment;

        for (let i = 0; i < schedule.length; i++) {
            if (i > 0 && i % 12 === 0) {
                currentMonthlyPayment *= 1 + (emiIncrease / 100);
            }

            const interestPayment = remainingPrincipal * monthlyRate;
            const principalPayment = currentMonthlyPayment - interestPayment + (i % 12 === 0 && i !== 0 ? lumpSum : 0);
            remainingPrincipal -= principalPayment;
            totalInterestPaid += interestPayment;

            if (remainingPrincipal < 0) {
                schedule[i].principal_payment += remainingPrincipal;
                schedule[i].payment = schedule[i].principal_payment + interestPayment;
                remainingPrincipal = 0;
            } else {
                schedule[i].principal_payment = principalPayment;
                schedule[i].payment = currentMonthlyPayment + (i % 12 === 0 && i !== 0 ? lumpSum : 0);
            }

            schedule[i].interest_payment = interestPayment;
            schedule[i].remaining_principal = Math.max(remainingPrincipal, 0);
            schedule[i].total_interest_paid = totalInterestPaid;

            if (remainingPrincipal <= 0) {
                schedule = schedule.slice(0, i + 1);
                break;
            }
        }
        appliedScenarios.push('EMI Increase');
    }

    schedule = schedule.map(entry => ({
        ...entry,
        percentage_paid: principal > 0 ? ((principal - entry.remaining_principal) / principal * 100).toFixed(2) : 0,
        applied_scenarios: [...appliedScenarios],
    }));
    newSchedules.combined = schedule;
    setWhatIfSchedules(newSchedules);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWhatIfScenario((prev) => ({ ...prev, [name]: value }));
  };

  const toggleScenarioMode = () => {
    setScenarioMode((prev) => (prev === 'And' ? 'Or' : 'And'));
    setWhatIfSchedules({
      extraEMI: [],
      lumpSum: [],
      emiIncrease: [],
      earlyPayment: [],
      combined: [],
    });
    setSelectedScenario(''); // Reset selected scenario when mode changes
  };

//part 4 - rendering

  // Get the debt for the current amortization schedule
  const debt = debts.find((d) => d.id === amortizationDebtId) || { amount: 0, interest_rate: 0, interest_rate_history: '[]' };

  // Get the most recent interest rate with error handling
  let interestRateHistory = [];
  try {
    interestRateHistory = debt.interest_rate_history ? JSON.parse(debt.interest_rate_history) : [];
  } catch (e) {
    console.error('Failed to parse interest_rate_history:', e);
    interestRateHistory = [];
  }
  const mostRecentInterestRate = interestRateHistory.length > 0
    ? interestRateHistory[interestRateHistory.length - 1].interest_rate
    : debt.interest_rate;

  // Calculate savings and tenure reduction for "And" mode
  const originalOutflow = amortizationSchedule.length > 0
    ? amortizationSchedule[amortizationSchedule.length - 1].total_interest_paid + debt.amount
    : 0;
  const combinedOutflow = whatIfSchedules.combined.length > 0
    ? whatIfSchedules.combined[whatIfSchedules.combined.length - 1].total_interest_paid + debt.amount
    : originalOutflow;
  const savings = originalOutflow - combinedOutflow;
  const originalTenure = amortizationSchedule.length;
  const reducedTenure = whatIfSchedules.combined.length > 0 ? whatIfSchedules.combined.length : originalTenure;
  const tenureDifference = originalTenure - reducedTenure;

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
      ...(scenarioMode === 'Or'
        ? [
            ...(whatIfSchedules.extraEMI.length > 0
              ? [{
                  label: 'Extra EMI Scenario',
                  data: whatIfSchedules.extraEMI.map((entry) => entry.remaining_principal),
                  borderColor: 'rgba(255, 99, 132, 1)',
                  fill: false,
                }]
              : []),
            ...(whatIfSchedules.lumpSum.length > 0
              ? [{
                  label: 'Lump Sum Scenario',
                  data: whatIfSchedules.lumpSum.map((entry) => entry.remaining_principal),
                  borderColor: 'rgba(54, 162, 235, 1)',
                  fill: false,
                }]
              : []),
            ...(whatIfSchedules.emiIncrease.length > 0
              ? [{
                  label: 'EMI Increase Scenario',
                  data: whatIfSchedules.emiIncrease.map((entry) => entry.remaining_principal),
                  borderColor: 'rgba(255, 206, 86, 1)',
                  fill: false,
                }]
              : []),
            ...(whatIfSchedules.earlyPayment.length > 0
              ? [{
                  label: 'Early Payment Scenario',
                  data: whatIfSchedules.earlyPayment.map((entry) => entry.remaining_principal),
                  borderColor: 'rgba(153, 102, 255, 1)',
                  fill: false,
                }]
              : []),
          ]
        : whatIfSchedules.combined.length > 0
          ? [{
              label: 'Remaining Principal (Combined)',
              data: whatIfSchedules.combined.map((entry) => entry.remaining_principal),
              borderColor: 'rgba(255, 99, 132, 1)',
              fill: false,
            }]
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

  // Determine which scenarios are available in "Or" mode
  const availableScenarios = [];
  if (whatIfSchedules.extraEMI.length > 0) availableScenarios.push('extraEMI');
  if (whatIfSchedules.lumpSum.length > 0) availableScenarios.push('lumpSum');
  if (whatIfSchedules.emiIncrease.length > 0) availableScenarios.push('emiIncrease');
  if (whatIfSchedules.earlyPayment.length > 0) availableScenarios.push('earlyPayment');

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
          Amortization Schedule for Debt ID: {amortizationDebtId} (Interest Rate: {mostRecentInterestRate}%)
        </h2>
        {/* Savings and Tenure Reduction (And Mode) */}
        {scenarioMode === 'And' && whatIfSchedules.combined.length > 0 && (
          <div className="mb-4">
            <p className="text-muted">
              Original Tenure: {originalTenure} months, Reduced Tenure: {reducedTenure} months, Difference: {tenureDifference} months
            </p>
            <p className="text-muted">
              Total Savings in Outflow: ${savings.toLocaleString()}
            </p>
          </div>
        )}
        {/* Toggle Switch for And/Or */}
        <div className="mb-4 flex items-center">
          <span className="mr-2 text-muted">Combine Scenarios:</span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={scenarioMode === 'And'}
              onChange={toggleScenarioMode}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-2 text-muted">{scenarioMode}</span>
          </label>
        </div>
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
              <label className="block text-muted mb-1 mt-2">Date of One-Time Payment:</label>
              <input
                type="date"
                name="earlyPaymentDate"
                value={whatIfScenario.earlyPaymentDate}
                onChange={handleInputChange}
                className="input-field w-full"
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
        {/* Scenario Selection in "Or" Mode */}
        {scenarioMode === 'Or' && availableScenarios.length > 0 && (
          <div className="mb-4">
            <label className="block text-muted mb-1">Select Scenario to Display in Table:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Select a scenario</option>
              {availableScenarios.includes('extraEMI') && <option value="extraEMI">Extra EMI</option>}
              {availableScenarios.includes('lumpSum') && <option value="lumpSum">Lump Sum</option>}
              {availableScenarios.includes('emiIncrease') && <option value="emiIncrease">EMI Increase</option>}
              {availableScenarios.includes('earlyPayment') && <option value="earlyPayment">Early Payment</option>}
            </select>
          </div>
        )}
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
                <th className="py-2 px-4 border">Annual Lump Sum</th>
                <th className="py-2 px-4 border">One-Time Lump Sum</th>
                <th className="py-2 px-4 border">Percentage Paid</th>
                <th className="py-2 px-4 border">Applied Scenarios</th>
                <th className="py-2 px-4 border">Remaining Principal</th>
                <th className="py-2 px-4 border">Total Interest Paid</th>
              </tr>
            </thead>
            <tbody>
              {(scenarioMode === 'And' && whatIfSchedules.combined.length > 0
                ? whatIfSchedules.combined
                : scenarioMode === 'Or' && selectedScenario === 'extraEMI' && whatIfSchedules.extraEMI.length > 0
                  ? whatIfSchedules.extraEMI
                  : scenarioMode === 'Or' && selectedScenario === 'lumpSum' && whatIfSchedules.lumpSum.length > 0
                    ? whatIfSchedules.lumpSum
                    : scenarioMode === 'Or' && selectedScenario === 'emiIncrease' && whatIfSchedules.emiIncrease.length > 0
                      ? whatIfSchedules.emiIncrease
                      : scenarioMode === 'Or' && selectedScenario === 'earlyPayment' && whatIfSchedules.earlyPayment.length > 0
                        ? whatIfSchedules.earlyPayment
                        : amortizationSchedule
              ).map((entry, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border">{entry.month}</td>
                  <td className="py-2 px-4 border">{entry.date}</td>
                  <td className="py-2 px-4 border">${entry.payment.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.principal_payment.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.interest_payment.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.annual_lump_sum.toLocaleString()}</td>
                  <td className="py-2 px-4 border">${entry.one_time_lump_sum.toLocaleString()}</td>
                  <td className="py-2 px-4 border">{entry.percentage_paid}%</td>
                  <td className="py-2 px-4 border">{entry.applied_scenarios.join(', ') || 'None'}</td>
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
