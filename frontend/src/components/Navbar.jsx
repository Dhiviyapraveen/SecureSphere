import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

/**
 * Navbar Component - Main navigation bar
 */

const Navbar = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) {
    return (
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              🔒
            </div>
            SecureSphere
          </Link>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-4 py-2 rounded hover:bg-slate-800 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            🔒
          </div>
          SecureSphere
        </Link>

        <div className="flex gap-6">
          <Link
            to="/dashboard"
            className="hover:text-blue-400 transition"
          >
            Dashboard
          </Link>
          {user?.role !== 'admin' ? (
            <Link
              to="/upload"
              className="hover:text-blue-400 transition"
            >
              Upload
            </Link>
          ) : null}
          <Link
            to="/shared"
            className="hover:text-blue-400 transition"
          >
            Shared
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">{user?.username || user?.email} · {user?.role}</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
