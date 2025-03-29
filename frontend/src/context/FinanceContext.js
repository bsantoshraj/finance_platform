// frontend/src/context/FinanceContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const FinanceContext = createContext();

const FinanceProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  return (
    <FinanceContext.Provider value={{ token, setToken, user, setUser, loading, setLoading, error, setError }}>
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook to use the FinanceContext
const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export { FinanceContext, FinanceProvider, useFinance };
