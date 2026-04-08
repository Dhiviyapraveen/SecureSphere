import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import AdvancedUploadForm from '../components/AdvancedUploadForm.jsx';

const Upload = () => {
  const { user, token } = useContext(AuthContext);

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(180deg,_#06131f,_#0f172a_55%,_#111827)] px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Telemedicine Upload</p>
          <h1 className="text-4xl font-bold text-white">Secure medical files for live care delivery</h1>
          <p className="mt-3 text-slate-300">
            Upload large scans, prescriptions, and consultation reports with chunked transfer, streaming encryption, and audit-ready access tracking.
          </p>
        </div>

        <AdvancedUploadForm user={user} />
      </div>
    </div>
  );
};

export default Upload;
