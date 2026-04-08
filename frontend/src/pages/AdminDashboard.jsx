import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { adminAPI } from '../services/apiService.js';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        const [usersResponse, activityResponse] = await Promise.all([
          adminAPI.getUsers(token),
          adminAPI.getActivity(token)
        ]);
        const [filesResponse, securityResponse] = await Promise.all([
          adminAPI.getFiles(1, 20, token),
          adminAPI.getSecurityStatus(token)
        ]);
        setUsers(usersResponse.data);
        setFiles(filesResponse.data);
        setActivity(activityResponse.data);
        setSecurityStatus(securityResponse.data);
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Failed to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.14),_transparent_25%),linear-gradient(180deg,_#1f1020,_#111827_55%,_#0f172a)] px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-pink-300">Admin Console</p>
          <h1 className="text-4xl font-bold text-white">Users, audits, and system monitoring</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Review role assignments, monitor access activity, and inspect the latest file operations across the telemedicine platform.</p>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-500 bg-red-500/10 p-4 text-red-100">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-10 text-slate-300">Loading admin data...</div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-semibold text-white">Users</h2>
              <div className="mt-5 space-y-3">
                {users.map((entry) => (
                  <div key={entry._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white">{entry.username}</p>
                        <p className="text-sm text-slate-400">{entry.email}</p>
                      </div>
                      <span className="rounded-full bg-pink-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-pink-300">{entry.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="text-2xl font-semibold text-white">System activity</h2>
                <div className="mt-5 space-y-4">
                  {activity.map((entry) => (
                    <div key={entry._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-300">{entry.action}</p>
                      <p className="mt-2 text-white">{entry.fileId?.originalName || entry.details || 'System event'}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {entry.userId?.username || entry.userId?.email || 'Unknown user'} · {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="text-2xl font-semibold text-white">All uploaded files</h2>
                <div className="mt-5 space-y-3">
                  {files.map((file) => (
                    <div key={file._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <p className="text-white">{file.originalName}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Patient: {file.patient?.username || file.patient?.email || 'Not linked'} · Uploaded by {file.uploadedBy?.username || file.uploadedBy?.email || 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="text-2xl font-semibold text-white">Suspicious activity monitor</h2>
                <div className="mt-5 space-y-3">
                  {(securityStatus?.suspiciousIPs || []).length === 0 ? (
                    <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">No suspicious IPs currently tracked.</div>
                  ) : (
                    securityStatus.suspiciousIPs.map((entry) => (
                      <div key={entry.ip} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                        <p className="text-white">{entry.ip}</p>
                        <p className="mt-1 text-sm text-slate-400">Risk score: {entry.riskScore.toFixed(2)} · incidents: {entry.incidentCount}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
