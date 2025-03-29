import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function Register() {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/register', formData);
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
