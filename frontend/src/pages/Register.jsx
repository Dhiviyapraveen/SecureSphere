import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

/**
 * Register Page - User registration form
 */

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'patient',
    firstName: '',
    lastName: '',
    department: '',
    patientId: '',
    password: '',
    confirmPassword: ''
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
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
      setValidationError('All fields are required');
      return;
    }

    if (formData.username.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    const result = await register(formData);

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
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

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
            {/* Username */}
            <div>
              <label className="block text-white font-semibold mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Asha"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Raman"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>

            {formData.role === 'doctor' ? (
              <div>
                <label className="block text-white font-semibold mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Cardiology"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            ) : (
              <div>
                <label className="block text-white font-semibold mb-2">Patient Identifier</label>
                <input
                  type="text"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  placeholder="MRN-10294"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            )}

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

            {/* Confirm Password */}
            <div>
              <label className="block text-white font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold rounded transition"
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
