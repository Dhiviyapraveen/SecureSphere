import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

/**
 * Login Page - User login form
 */

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!formData.email || !formData.password) {
      setValidationError('Email and password are required');
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4 text-4xl">
            🔒
          </div>
          <h1 className="text-3xl font-bold text-white">SecureSphere</h1>
          <p className="text-slate-400 mt-2">Telemedicine Secure File Sharing</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Clinician and Patient Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {validationError && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-200 text-sm">
              {validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-white font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-semibold mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold rounded transition"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
