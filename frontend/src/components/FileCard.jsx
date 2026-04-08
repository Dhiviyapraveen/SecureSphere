import React from 'react';

const categoryLabels = {
  report: 'Medical Report',
  prescription: 'Prescription',
  scan: 'Scan',
  'lab-result': 'Lab Result',
  other: 'Other'
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / 1024 ** unitIndex) * 100) / 100} ${units[unitIndex]}`;
};

const FileCard = ({ file, onDownload, onOpen, onDelete }) => (
  <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="mb-2 inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          {categoryLabels[file.category] || 'Medical File'}
        </p>
        <h3 className="text-xl font-semibold text-white">{file.originalName}</h3>
        <p className="mt-1 text-sm text-slate-400">{formatFileSize(file.size)} · {file.mimeType}</p>
      </div>
      <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm text-emerald-300">{file.userRole}</div>
    </div>

    <div className="space-y-2 text-sm text-slate-300">
      <p>Owner: {file.owner?.username || file.owner?.email || 'Unknown'}</p>
      <p>Patient: {file.patient?.username || file.patient?.email || 'Not linked'}</p>
      <p>Downloads: {file.downloadCount}</p>
      <p>Crypto: AES-256-GCM · SHA-256 integrity</p>
      {file.description ? <p className="text-slate-400">{file.description}</p> : null}
    </div>

    {file.tags?.length ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {file.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300">
            #{tag}
          </span>
        ))}
      </div>
    ) : null}

    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => onDownload(file._id)}
        className="rounded-2xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Download
      </button>
      <button
        type="button"
        onClick={() => onOpen(file._id)}
        className="rounded-2xl bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-600"
      >
        View Access History
      </button>
      {(file.userRole === 'owner' || file.userRole === 'admin') ? (
        <button
          type="button"
          onClick={() => onDelete(file._id)}
          className="rounded-2xl bg-rose-500 px-4 py-2 font-semibold text-white transition hover:bg-rose-400"
        >
          Delete
        </button>
      ) : null}
    </div>
  </div>
);

export default FileCard;
