import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import FileCard from '../components/FileCard';
import { fileAPI } from '../services/apiService';

/**
 * SharedFiles Page - Display files shared with the user
 */

const SharedFiles = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch shared files on mount
  useEffect(() => {
    if (token) {
      fetchSharedFiles();
    }
  }, [token]);

  const fetchSharedFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fileAPI.getMyFiles(1, 100, token);
      // Filter files where user is not the owner
      const sharedFiles = response.data.filter(
        file => file.userRole !== 'owner'
      );
      setFiles(sharedFiles);
      setError(null);
    } catch (err) {
      setError('Failed to fetch shared files');
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

  if (!user || !token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white">Shared Files</h1>
          <p className="text-slate-400 mt-2">Files shared with you by other users</p>
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
              <p className="text-slate-400">Loading shared files...</p>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Shared Files</h2>
            <p className="text-slate-400 mb-6">It looks like no one has shared files with you yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                onDownload={handleDownload}
                onShare={() => {}}
                onDelete={() => {}}
                userRole={file.userRole}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedFiles;
