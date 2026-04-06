import React from 'react';

/**
 * FileCard Component - Displays file information in card format
 */

const FileCard = ({ file, onDownload, onShare, onDelete, userRole }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
      {/* File Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white truncate">
            {file.originalName}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {formatFileSize(file.size)}
          </p>
        </div>
        <div className="text-2xl">
          {file.mimeType.includes('image') && '🖼️'}
          {file.mimeType.includes('pdf') && '📄'}
          {file.mimeType.includes('video') && '🎥'}
          {file.mimeType.includes('audio') && '🎵'}
          {file.mimeType.includes('text') && '📝'}
          {!file.mimeType.includes('image') &&
            !file.mimeType.includes('pdf') &&
            !file.mimeType.includes('video') &&
            !file.mimeType.includes('audio') &&
            !file.mimeType.includes('text') && '📎'}
        </div>
      </div>

      {/* File Info */}
      <div className="mb-4 space-y-2 text-sm text-slate-300">
        {file.description && (
          <p>
            <span className="text-slate-400">Description:</span> {file.description}
          </p>
        )}
        <p>
          <span className="text-slate-400">Uploaded:</span> {formatDate(file.createdAt)}
        </p>
        <p>
          <span className="text-slate-400">Downloads:</span> {file.downloadCount}
        </p>
        {file.userRole && (
          <p>
            <span className="text-slate-400">Your Role:</span>{' '}
            <span className={file.userRole === 'owner' ? 'text-blue-400' : 'text-green-400'}>
              {file.userRole}
            </span>
          </p>
        )}
      </div>

      {/* Tags */}
      {file.tags && file.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {file.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onDownload(file._id)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          ⬇️ Download
        </button>

        {userRole === 'owner' && (
          <>
            <button
              onClick={() => onShare(file._id)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              🔗 Share
            </button>
            <button
              onClick={() => onDelete(file._id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileCard;
