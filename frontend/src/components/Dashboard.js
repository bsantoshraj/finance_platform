import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';

function Dashboard() {
  const { user } = useFinance();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'user') {
        navigate('/user-dashboard');
      } else if (user.role === 'CFA') {
        if (user.status !== 'approved') {
          navigate('/cfa-dashboard');
        } else {
          navigate('/cfa-dashboard');
        }
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
      }
    }
  }, [user, navigate]);

  return null;
}

export default Dashboard;
