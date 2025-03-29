// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UserDashboard from './components/UserDashboard';
import CFADashboard from './components/CFADashboard';
import AdminDashboard from './components/AdminDashboard';
import Debts from './components/Debts';
import Income from './components/Income';
import Investments from './components/Investments';
import Insurance from './components/Insurance';
import Expenses from './components/Expenses';
import Goals from './components/Goals';
import Budget from './components/Budget';

function App() {
  return (
    <FinanceProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="user-dashboard" element={<UserDashboard />} />
            <Route path="cfa-dashboard" element={<CFADashboard />} />
            <Route path="admin-dashboard" element={<AdminDashboard />} />
            <Route path="debts" element={<Debts />} />
            <Route path="income" element={<Income />} />
            <Route path="investments" element={<Investments />} />
            <Route path="insurance" element={<Insurance />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="goals" element={<Goals />} />
            <Route path="budget" element={<Budget />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </FinanceProvider>
  );
}

export default App;
