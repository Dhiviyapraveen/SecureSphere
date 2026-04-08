import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext, { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import SharedFiles from './pages/SharedFiles';
import ShareFile from './pages/ShareFile';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Navbar from './components/Navbar';

// Styles
import './index.css';

/**
 * Protected Route Component
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { token, user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-900 px-4 text-slate-300">
        Validating secure session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * App Component - Main application structure
 */
function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <div className="min-h-screen bg-slate-900">
          <Navbar />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute roles={['patient', 'doctor']}>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/share/:id"
              element={
                <ProtectedRoute>
                  <ShareFile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shared"
              element={
                <ProtectedRoute>
                  <SharedFiles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute roles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
