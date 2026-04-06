import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { fileAPI, userAPI } from '../services/apiService';

const ShareFile = () => {
  const { token, user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchFileDetails();
    }
  }, [token, id]);

  const fetchFileDetails = async () => {
    try {
      setLoading(true);
      const response = await fileAPI.getFileDetails(id, token);
      setFile(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load file details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a name or email to search');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setResults([]);
      const response = await userAPI.searchUsers(searchQuery.trim(), token);
      const filtered = response.data.filter((candidate) =>
        candidate._id !== user._id && !selectedUsers.some((s) => s._id === candidate._id)
      );
      setResults(filtered);
      if (filtered.length === 0) {
        setError('No matching users found. Try a different email or username.');
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addRecipient = (recipient) => {
    if (recipient._id === user.id) {
      return;
    }
    setSelectedUsers((prev) => [...prev, recipient]);
    setResults((prev) => prev.filter((item) => item._id !== recipient._id));
    setError(null);
  };

  const removeRecipient = (recipientId) => {
    setSelectedUsers((prev) => prev.filter((item) => item._id !== recipientId));
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      setError('Select at least one recipient to share with.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const shareWith = selectedUsers.map((recipient) => recipient._id);
      const response = await fileAPI.shareFile(id, shareWith, role, token);
      setMessage(response.message || 'File has been shared successfully');
      setSelectedUsers([]);
      setResults([]);
      setSearchQuery('');
    } catch (err) {
      setError(err.message || 'Sharing failed');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplay = (userItem) => {
    return userItem.name || userItem.username || userItem.email;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white">Secure File Sharing</h1>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            Upload, encrypt, and share secure metadata. Recipients can decrypt and access files directly after signing in.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-3xl bg-slate-800 border border-slate-700 p-8 shadow-xl">
          <div className="mb-8 grid gap-4 md:grid-cols-5">
            {[
              { label: 'Upload', active: true },
              { label: 'Encrypt', active: true },
              { label: 'Store', active: true },
              { label: 'Share metadata', active: true },
              { label: 'Access', active: false }
            ].map((step, index) => (
              <div key={step.label} className="rounded-3xl bg-slate-900 p-4 text-center shadow-inner">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${step.active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  {index + 1}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-200">{step.label}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500 bg-red-500/10 p-4 text-red-100">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-xl border border-emerald-500 bg-emerald-500/10 p-4 text-emerald-100">
              {message}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-slate-400">Loading file info...</div>
            </div>
          ) : (
            <>
              {file ? (
                <div>
                  <div className="mb-10 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl bg-slate-950/80 p-6 border border-slate-700">
                      <h2 className="text-2xl font-semibold text-white mb-4">File Details</h2>
                      <p className="text-slate-400">Name: <span className="text-white">{file.originalName}</span></p>
                      <p className="text-slate-400">Type: <span className="text-white">{file.mimeType}</span></p>
                      <p className="text-slate-400">Owner: <span className="text-white">{file.owner?.username || file.owner?.email}</span></p>
                      <p className="text-slate-400">Uploaded: <span className="text-white">{new Date(file.createdAt).toLocaleString()}</span></p>
                      <p className="text-slate-400">Encrypted: <span className="text-white">{file.isEncrypted ? 'Yes' : 'No'}</span></p>
                      <p className="text-slate-400">Role on this file: <span className="text-emerald-300">{file.userRole}</span></p>
                    </div>

                    <div className="rounded-3xl bg-slate-950/80 p-6 border border-slate-700">
                      <h2 className="text-2xl font-semibold text-white mb-4">Metadata</h2>
                      <p className="text-slate-400">When you share, SecureSphere stores access metadata securely.</p>
                      <p className="text-slate-400 mt-4">Recipients can decrypt and download after they sign in and receive permission.</p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-950/80 p-6 border border-slate-700">
                    <h2 className="text-2xl font-semibold text-white mb-4">Find collaborators</h2>
                    <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by email or username"
                        className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-600 transition"
                        disabled={searching}
                      >
                        {searching ? 'Searching…' : 'Search users'}
                      </button>
                    </form>

                    {results.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Search results</h3>
                        <div className="grid gap-3">
                          {results.map((candidate) => (
                            <div key={candidate._id} className="flex items-center justify-between rounded-2xl bg-slate-900 p-4 border border-slate-700">
                              <div>
                                <p className="text-white font-medium">{getUserDisplay(candidate)}</p>
                                <p className="text-slate-500 text-sm">{candidate.email}</p>
                              </div>
                              <button
                                type="button"
                                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                                onClick={() => addRecipient(candidate)}
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedUsers.length > 0 && (
                      <div className="mt-8 rounded-2xl bg-slate-900 p-5 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-3">Recipients</h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedUsers.map((recipient) => (
                            <div key={recipient._id} className="rounded-2xl bg-slate-800 px-4 py-3 text-slate-200 shadow-sm flex items-center gap-3">
                              <div>
                                <p className="font-medium text-white">{getUserDisplay(recipient)}</p>
                                <p className="text-xs text-slate-500">{recipient.email}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRecipient(recipient._id)}
                                className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-400 transition"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Permission role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="owner">Owner</option>
                        </select>
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={handleShare}
                          className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400 transition"
                          disabled={loading || selectedUsers.length === 0}
                        >
                          {loading ? 'Sharing…' : 'Share file now'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="rounded-2xl bg-slate-700 px-5 py-3 text-white hover:bg-slate-600 transition"
                    >
                      Back to dashboard
                    </button>
                    <button
                      onClick={() => navigate('/upload')}
                      className="rounded-2xl bg-blue-500 px-5 py-3 text-white hover:bg-blue-600 transition"
                    >
                      Upload another file
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">File not found or you don't have access.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareFile;
