import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { toast } from 'react-toastify';

function Layout() {
  const { user, token, setToken, setUser } = useFinance();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!token || !user) {
    navigate('/login');
    return null;
  }

  const renderNavLinks = () => {
    if (user.role === 'user') {
      return (
        <>
          <NavLink
            to="/user-dashboard"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/debts"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Debts
          </NavLink>
          <NavLink
            to="/income"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Income
          </NavLink>
          <NavLink
            to="/investments"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Investments
          </NavLink>
          <NavLink
            to="/insurance"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Insurance
          </NavLink>
          <NavLink
            to="/expenses"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Expenses
          </NavLink>
          <NavLink
            to="/goals"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Goals
          </NavLink>
          <NavLink
            to="/budget"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Budget
          </NavLink>
          <NavLink
            to="/chatbot"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Chatbot
          </NavLink>
          <NavLink
            to="/recommendations"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Recommendations
          </NavLink>
          <NavLink
            to="/advisories"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Advisories
          </NavLink>
        </>
      );
    } else if (user.role === 'CFA') {
      return (
        <>
          <NavLink
            to="/cfa-dashboard"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Dashboard
          </NavLink>
        </>
      );
    } else if (user.role === 'admin') {
      return (
        <>
          <NavLink
            to="/admin-dashboard"
            className={({ isActive }) =>
              `block px-4 py-2 text-muted hover:bg-primary hover:text-white ${
                isActive ? 'bg-primary text-white' : ''
              }`
            }
          >
            Dashboard
          </NavLink>
        </>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-primary">Finance Platform</h1>
        </div>
        <nav className="mt-4">
          {renderNavLinks()}
        </nav>
      </aside>
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-text">Welcome, {user.username}</h1>
          <button
            onClick={handleLogout}
            className="btn-danger"
          >
            Logout
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
