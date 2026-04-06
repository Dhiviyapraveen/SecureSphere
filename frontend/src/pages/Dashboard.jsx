import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import FileCard from '../components/FileCard';
import { fileAPI } from '../services/apiService';

/**
 * Dashboard Page - Display user's uploaded files
 */

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Fetch files on mount
  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [token]);

  const fetchFiles = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await fileAPI.getMyFiles(page, 10, token);
      setFiles(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch files');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const file = files.find(f => f._id === fileId);
      const response = await fileAPI.downloadFile(fileId, token);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };

  const handleShare = (fileId) => {
    navigate(`/share/${fileId}`);
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await fileAPI.deleteFile(fileId, token);
      setFiles(files.filter(f => f._id !== fileId));
      alert('File deleted successfully');
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (!user || !token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">Welcome back, {user.username}!</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-400">Loading files...</p>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Files Yet</h2>
            <p className="text-slate-400 mb-6">Start by uploading a file to SecureSphere</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition"
            >
              Upload First File
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  onDownload={handleDownload}
                  onShare={handleShare}
                  onDelete={handleDelete}
                  userRole={file.userRole || 'owner'}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-12">
                <button
                  disabled={pagination.currentPage === 1}
                  onClick={() => fetchFiles(pagination.currentPage - 1)}
                  className="px-4 py-2 bg-blue-500 disabled:bg-slate-600 text-white rounded hover:bg-blue-600 transition"
                >
                  Previous
                </button>
                <span className="text-white py-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => fetchFiles(pagination.currentPage + 1)}
                  className="px-4 py-2 bg-blue-500 disabled:bg-slate-600 text-white rounded hover:bg-blue-600 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
