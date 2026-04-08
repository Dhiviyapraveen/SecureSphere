import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { patientAPI } from '../services/apiService.js';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [files, setFiles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        const [filesResponse, activityResponse] = await Promise.all([
          patientAPI.getMyFiles(1, 20, token),
          patientAPI.getActivity(token)
        ]);
        setFiles(filesResponse.data.filter((file) => !file.patient || file.patient?._id === user.id || file.patient?._id === user._id));
        setActivity(activityResponse.data);
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Failed to load patient dashboard.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user]);

  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.role !== 'patient') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_#071120,_#172554_55%,_#0f172a)] px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Patient Portal</p>
            <h1 className="text-4xl font-bold text-white">Your protected medical records</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Upload reports, prescriptions, and scans, then review who has accessed them through the audit trail.</p>
          </div>
          <button onClick={() => navigate('/upload')} className="rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-slate-950 hover:bg-sky-400">
            Upload Record
          </button>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-500 bg-red-500/10 p-4 text-red-100">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-10 text-slate-300">Loading records...</div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-semibold text-white">My files</h2>
              <div className="mt-5 space-y-4">
                {files.length === 0 ? (
                  <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">No medical files uploaded yet.</div>
                ) : (
                  files.map((file) => (
                    <button
                      key={file._id}
                      onClick={() => navigate(`/share/${file._id}`)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left hover:border-sky-400"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white">{file.originalName}</p>
                          <p className="text-sm text-slate-400">{file.recordType || file.category} {file.disease ? `· ${file.disease}` : ''}</p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.2em] text-sky-300">{file.userRole}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <aside className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-semibold text-white">Access history</h2>
              <div className="mt-5 space-y-4">
                {activity.length === 0 ? (
                  <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">No recent activity.</div>
                ) : (
                  activity.map((entry) => (
                    <div key={entry._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">{entry.action}</p>
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

export default PatientDashboard;
