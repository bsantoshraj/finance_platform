// frontend/src/components/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function Register() {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', role: 'user' });
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
      validatePassword(value);
    }
    if (name === 'password' || name === 'confirmPassword') {
      if (formData.confirmPassword && value !== formData.confirmPassword && name === 'password') {
        setPasswordError('Passwords do not match');
      } else if (formData.password && value !== formData.password && name === 'confirmPassword') {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };

  const validatePassword = (password) => {
    // Password must be at least 8 characters, include uppercase, lowercase, number, and special character
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (strongRegex.test(password)) {
      setPasswordStrength('strong');
      setPasswordError('');
    } else if (mediumRegex.test(password)) {
      setPasswordStrength('medium');
      setPasswordError('Password should include a special character for stronger security');
    } else {
      setPasswordStrength('weak');
      setPasswordError('Password must be at least 8 characters long and include uppercase, lowercase, and a number');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Check if password meets minimum strength (at least medium)
    if (passwordStrength === 'weak') {
      toast.error('Password is too weak. Please use a stronger password.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/register', {
        username: formData.username,
        password: formData.password,
        role: formData.role,
      });
      toast.success('Registered successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error registering';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold text-text mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-muted mb-2" htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-muted mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />
            {formData.password && (
              <div className="mt-2">
                <p className="text-sm">
                  Password Strength:{' '}
                  <span
                    className={
                      passwordStrength === 'strong'
                        ? 'text-green-500'
                        : passwordStrength === 'medium'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }
                  >
                    {passwordStrength}
                  </span>
                </p>
                {passwordError && !passwordStrength.includes('match') && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-muted mb-2" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              required
            />
            {passwordError && passwordError.includes('match') && (
              <p className="text-red-500 text-sm mt-2">{passwordError}</p>
            )}
          </div>
          <div className="mb-6">
            <label className="block text-muted mb-2" htmlFor="role">Role</label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
            >
              <option value="user">User</option>
              <option value="CFA">CFA</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">Register</button>
        </form>
        <p className="mt-4 text-center text-muted">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
