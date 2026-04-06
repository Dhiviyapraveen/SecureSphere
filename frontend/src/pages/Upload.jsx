import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import UploadForm from '../components/UploadForm';
import { fileAPI } from '../services/apiService';

/**
 * Upload Page - File upload interface
 */

const Upload = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!user || !token) {
    navigate('/login');
    return null;
  }

  const handleUpload = async (formData) => {
    try {
      setIsLoading(true);
      const response = await fileAPI.uploadFile(formData, token);

      if (response.success) {
        setMessage({
          type: 'success',
          text: `✓ "${response.data.fileName}" uploaded successfully!`
        });

        // Reset form
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Upload failed'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Upload failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white">Upload File</h1>
          <p className="text-slate-400 mt-2">
            Your files will be encrypted with AES-256 before storage
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-500 bg-opacity-20 border border-green-500 text-green-200'
                : 'bg-red-500 bg-opacity-20 border border-red-500 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <UploadForm onUpload={handleUpload} isLoading={isLoading} />

        {/* Security Info */}
        <div className="mt-12 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="text-white font-semibold mb-2">AES-256 Encryption</h3>
            <p className="text-slate-400 text-sm">
              Files are encrypted with military-grade encryption
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">✓</div>
            <h3 className="text-white font-semibold mb-2">SHA-256 Hashing</h3>
            <p className="text-slate-400 text-sm">
              File integrity is verified with SHA-256 hashes
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🔗</div>
            <h3 className="text-white font-semibold mb-2">Secure Sharing</h3>
            <p className="text-slate-400 text-sm">
              Share files securely with controlled access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
