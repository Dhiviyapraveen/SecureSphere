import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Dashboard = () => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'patient') {
    return <Navigate to="/patient-dashboard" replace />;
  }

  if (user.role === 'doctor') {
    return <Navigate to="/doctor-dashboard" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Dashboard;
