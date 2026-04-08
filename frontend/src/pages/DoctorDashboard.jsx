import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { doctorAPI } from '../services/apiService.js';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [patients, setPatients] = useState([]);
  const [files, setFiles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        const [patientsResponse, filesResponse, activityResponse] = await Promise.all([
          doctorAPI.getPatients(token),
          doctorAPI.getAccessibleFiles(1, 20, token),
          doctorAPI.getActivity(token)
        ]);
        setPatients(patientsResponse.data);
        setFiles(filesResponse.data);
        setActivity(activityResponse.data);
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Failed to load doctor dashboard.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.role !== 'doctor') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_25%),linear-gradient(180deg,_#051c18,_#0f172a_55%,_#111827)] px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Doctor Workspace</p>
            <h1 className="text-4xl font-bold text-white">Patient records and secure prescriptions</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Access shared patient records, upload prescriptions, and monitor file activity during telemedicine sessions.</p>
          </div>
          <button onClick={() => navigate('/upload')} className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
            Upload Prescription
          </button>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-500 bg-red-500/10 p-4 text-red-100">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-10 text-slate-300">Loading doctor workspace...</div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr_1fr]">
            <section className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-semibold text-white">Patients</h2>
              <div className="mt-5 space-y-3">
                {patients.length === 0 ? (
                  <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">No patient accounts found yet.</div>
                ) : (
                  patients.map((patient) => (
                    <div key={patient._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <p className="text-white">{patient.username}</p>
                      <p className="text-sm text-slate-400">{patient.email}</p>
                      <p className="mt-1 text-xs text-emerald-300">Patient ID: {patient._id}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-semibold text-white">Accessible records</h2>
              <div className="mt-5 space-y-4">
                {files.length === 0 ? (
                  <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">No records shared with you.</div>
                ) : (
                  files.map((file) => (
                    <button key={file._id} onClick={() => navigate(`/share/${file._id}`)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left hover:border-emerald-400">
                      <p className="text-white">{file.originalName}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Patient: {file.patient?.username || file.patient?.email || 'Not linked'} · {file.recordType || file.category}
                      </p>
                      <p className="mt-1 text-xs text-emerald-300">{file.disease || 'General consultation'}</p>
                    </button>
                  ))
                )}
              </div>
            </section>

            <aside className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-semibold text-white">Recent activity</h2>
              <div className="mt-5 space-y-4">
                {activity.length === 0 ? (
                  <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">No activity yet.</div>
                ) : (
                  activity.map((entry) => (
                    <div key={entry._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">{entry.action}</p>
                      <p className="mt-2 text-white">{entry.fileId?.originalName || 'Medical file'}</p>
                      <p className="mt-1 text-sm text-slate-400">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
