import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { fileAPI, userAPI } from '../services/apiService.js';

const buildCiphertextPreview = (file, contentDemo) => {
  if (contentDemo?.encryptedData) {
    return contentDemo.encryptedData;
  }

  if (file?.encryptedData) {
    return file.encryptedData;
  }

  if (file?.clientEncryptedText) {
    return file.clientEncryptedText;
  }

  return '';
};

const shortenCiphertext = (value, head = 40, tail = 24) => {
  if (!value || value.length <= head + tail + 3) {
    return value || '';
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

const ShareFile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [contentDemo, setContentDemo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(true);
  const [replayDemo, setReplayDemo] = useState(null);
  const [runningReplayDemo, setRunningReplayDemo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const loadPage = async () => {
      try {
        setLoading(true);
        const [fileResponse, logsResponse, contentResponse] = await Promise.all([
          fileAPI.getFileDetails(id, token),
          fileAPI.getAuditLogs(id, token),
          fileAPI.getFileContent(id, token).catch(() => null)
        ]);
        setFile(fileResponse.data);
        setLogs(logsResponse.data);
        setContentDemo(contentResponse?.data || null);
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Unable to load medical file details.');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [id, token]);

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  const canShare = file && ['owner', 'doctor', 'admin'].includes(file.userRole);
  const encryptedText = buildCiphertextPreview(file, contentDemo);
  const encryptionIv = contentDemo?.iv || file?.encryptionIv || 'Not available';
  const encryptedTextAvailable = Boolean(encryptedText);
  const plaintextPreview = contentDemo?.decryptedData || '';

  const searchUsers = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await userAPI.searchUsers(searchQuery.trim(), token);
      setResults(response.data.filter((candidate) => !selectedUsers.some((selected) => selected._id === candidate._id)));
      setError('');
    } catch (searchError) {
      setError(searchError.message || 'User search failed.');
    }
  };

  const handleShare = async () => {
    if (!selectedUsers.length) {
      setError('Select at least one recipient.');
      return;
    }

    try {
      const response = await fileAPI.shareFile(
        id,
        selectedUsers.map((recipient) => recipient._id),
        role,
        token
      );
      setMessage(response.message);
      setSelectedUsers([]);
      setResults([]);
      const logsResponse = await fileAPI.getAuditLogs(id, token);
      setLogs(logsResponse.data);
      setError('');
    } catch (shareError) {
      setError(shareError.message || 'Sharing failed.');
    }
  };

  const handleReplaySimulation = async () => {
    try {
      setRunningReplayDemo(true);
      const result = await fileAPI.runReplayDemo(id, token);
      setReplayDemo(result);
      setError('');
    } catch (simulationError) {
      setError(simulationError.message || 'Replay attack simulation failed.');
    } finally {
      setRunningReplayDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,_#071423,_#0f172a_55%,_#111827)] px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Record Visibility</p>
            <h1 className="text-4xl font-bold text-white">Medical file access and audit history</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Review who accessed a file, when it was shared, and extend access to the right clinician or patient account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-2xl bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-600"
          >
            Back to dashboard
          </button>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-500 bg-red-500/10 p-4 text-red-100">{error}</div> : null}
        {message ? <div className="mb-6 rounded-2xl border border-emerald-500 bg-emerald-500/10 p-4 text-emerald-100">{message}</div> : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-12 text-center text-slate-300">Loading secure file details...</div>
        ) : !file ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-12 text-center text-slate-300">File not found.</div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-8">
              <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="text-2xl font-semibold text-white">{file.originalName}</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-300">
                  <div>Category: {file.category}</div>
                  <div>Role on file: {file.userRole}</div>
                  <div>Owner: {file.owner?.username || file.owner?.email}</div>
                  <div>Patient: {file.patient?.username || file.patient?.email || 'Not linked'}</div>
                  <div>MIME type: {file.mimeType}</div>
                  <div>Uploaded: {new Date(file.createdAt).toLocaleString()}</div>
                  <div>Record type: {file.recordType || file.category}</div>
                  <div>Disease/Symptoms: {file.disease || 'Not specified'}</div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-amber-500/40 bg-slate-800 p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-white">Secure vs Insecure Storage Comparison</h2>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-300">Learning Demo</span>
                  </div>
                  <p className="mb-5 text-sm text-slate-400">
                    This compares how the same medical content would look if stored insecurely as plaintext versus how SecureSphere stores it as AES ciphertext.
                  </p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-rose-500/40 bg-slate-950 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">Insecure Plaintext Storage</p>
                      <p className="mt-2 text-sm text-slate-400">Anyone with database access could immediately read patient data.</p>
                      <textarea
                        readOnly
                        rows="8"
                        value={plaintextPreview || 'Plaintext preview is not available for this file.'}
                        className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-rose-100 outline-none"
                      />
                    </div>

                    <div className="rounded-2xl border border-emerald-500/40 bg-slate-950 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Secure Ciphertext Storage</p>
                      <p className="mt-2 text-sm text-slate-400">Database exposure reveals encrypted output plus IV, not readable medical information.</p>
                      <textarea
                        readOnly
                        rows="8"
                        value={encryptedText || 'Ciphertext preview is not available for this file.'}
                        className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-xs text-emerald-200 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-500/40 bg-slate-800 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-white">Encrypted Data</h2>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">AES-256</span>
                  </div>
                  <p className="mb-3 text-sm text-slate-400">Ciphertext stored for this medical file. This is the encrypted value, not readable patient text.</p>
                  <div className="mb-4 rounded-2xl bg-slate-950 px-4 py-3 text-xs text-cyan-200">
                    IV: {encryptionIv}
                  </div>
                  <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-300">
                    Ciphertext length: {encryptedTextAvailable ? `${encryptedText.length} characters` : 'Not available'}
                  </div>
                  <textarea
                    readOnly
                    rows="14"
                    value={encryptedText || 'Encrypted ciphertext is not available for this file yet.'}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xs text-emerald-200 outline-none"
                  />
                </div>

                <div className="rounded-3xl border border-emerald-500/40 bg-slate-800 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-white">Decrypted Data</h2>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-300">Authorized View</span>
                  </div>
                  <p className="mb-3 text-sm text-slate-400">This plain text is produced only after backend decryption for an authorized user.</p>
                  <textarea
                    readOnly
                    rows="14"
                    value={contentDemo?.decryptedData || 'Decrypted content is not available for this file.'}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-violet-500/40 bg-slate-800 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Replay Attack Simulator</h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-400">
                      This sends the same protected POST request twice with an identical nonce and timestamp. The first request should succeed, and the second should fail because replay protection detects the reused nonce.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReplaySimulation}
                    disabled={runningReplayDemo}
                    className="rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runningReplayDemo ? 'Running simulation...' : 'Run Replay Simulation'}
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Nonce</p>
                    <p className="mt-2 break-all font-mono text-xs text-slate-200">
                      {replayDemo?.nonce || 'Generate by running the simulation'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Timestamp</p>
                    <p className="mt-2 font-mono text-xs text-slate-200">
                      {replayDemo?.timestamp || 'Captured when the protected request is sent'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Expected Outcome</p>
                    <p className="mt-2 text-sm text-slate-200">1st request accepted, 2nd request blocked as replay</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Attempt 1</p>
                    <p className="mt-3 text-sm text-slate-300">
                      {replayDemo?.firstResult?.message || 'Protected request has not been sent yet.'}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Signed request sample: `nonce={shortenCiphertext(replayDemo?.nonce, 18, 10) || 'pending'}` with a fresh timestamp.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-rose-500/30 bg-slate-900 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">Attempt 2</p>
                    <p className="mt-3 text-sm text-slate-300">
                      {replayDemo?.secondError?.message || replayDemo?.secondResult?.message || 'The same request will be reused here to trigger replay detection.'}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      The backend should reject this because the nonce has already been seen within the replay-protection window.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="text-2xl font-semibold text-white">Audit History</h2>
                <div className="mt-5 space-y-4">
                  {logs.length === 0 ? (
                    <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">No audit events recorded yet.</div>
                  ) : (
                    logs.map((entry) => (
                      <div key={entry._id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">{entry.action}</p>
                          <p className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="mt-2 text-white">{entry.details || 'Healthcare access event recorded.'}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Actor: {entry.userId?.username || entry.userId?.email || 'Unknown'} {entry.actorRole ? `· ${entry.actorRole}` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <aside className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-semibold text-white">Share With Care Team</h2>
              <p className="mt-2 text-sm text-slate-400">Assign access to a doctor, patient, or admin account. RBAC and JWT protection apply to every access request.</p>

              {canShare ? (
                <>
                  <form onSubmit={searchUsers} className="mt-6 flex gap-3">
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by username or email"
                      className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    />
                    <button type="submit" className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
                      Search
                    </button>
                  </form>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Recipient access role</label>
                    <select
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="doctor">Doctor</option>
                      <option value="patient">Patient</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="mt-6 space-y-3">
                    {results.map((candidate) => (
                      <div key={candidate._id} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 p-4">
                        <div>
                          <p className="text-white">{candidate.name || candidate.username || candidate.email}</p>
                          <p className="text-sm text-slate-400">{candidate.email} · {candidate.role}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUsers((current) => [...current, candidate])}
                          className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedUsers.length ? (
                    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Recipients</p>
                      <div className="space-y-3">
                        {selectedUsers.map((candidate) => (
                          <div key={candidate._id} className="flex items-center justify-between">
                            <div>
                              <p className="text-white">{candidate.name || candidate.username || candidate.email}</p>
                              <p className="text-sm text-slate-400">{candidate.role}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedUsers((current) => current.filter((entry) => entry._id !== candidate._id))}
                              className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={!selectedUsers.length}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Share secure access
                  </button>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
                  You can review encrypted and decrypted content for this file, but your current role does not allow sharing changes.
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareFile;
