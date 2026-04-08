import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFileInChunks, formatBytes, formatSpeed } from '../services/chunkedUploadService.js';
import CryptoStatusPanel from './CryptoStatusPanel.jsx';
import { encryptTextContent } from '../services/encryptionService.js';

const categories = [
  { value: 'report', label: 'Medical Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'scan', label: 'Scan or Imaging' },
  { value: 'lab-result', label: 'Lab Result' },
  { value: 'other', label: 'Other Record' }
];

const formatTimeRemaining = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Calculating';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const AdvancedUploadForm = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const lastSampleRef = useRef({ bytes: 0, at: Date.now() });

  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [patientId, setPatientId] = useState(user?.role === 'patient' ? user.id || user._id : '');
  const [category, setCategory] = useState('report');
  const [disease, setDisease] = useState('');
  const [encryptForReceiver, setEncryptForReceiver] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseHint, setPassphraseHint] = useState('');
  const [cipherPreview, setCipherPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cryptoPhase, setCryptoPhase] = useState('idle');
  const [progress, setProgress] = useState({
    uploadedBytes: 0,
    totalBytes: 0,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    speed: 0,
    remainingSeconds: 0
  });

  const handleFileSelect = (file) => {
    setError('');
    setSuccess('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Medical files must be 100MB or smaller.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Select a medical file before uploading.');
      return;
    }

    if (user?.role === 'doctor' && !patientId.trim()) {
      setError('Doctors must enter the target patient account id before uploading.');
      return;
    }

    if (encryptForReceiver && selectedFile.type !== 'text/plain') {
      setError('Ciphertext preview is currently supported for text files only.');
      return;
    }

    if (encryptForReceiver && !passphrase.trim()) {
      setError('Enter a passphrase so the receiver can decrypt the cipher text.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setCryptoPhase('preparing');
    lastSampleRef.current = { bytes: 0, at: Date.now() };

    try {
      let clientEncryptedText = null;

      if (encryptForReceiver && selectedFile.type === 'text/plain') {
        setCryptoPhase('preparing');
        const plainText = await selectedFile.text();
        clientEncryptedText = encryptTextContent(plainText, passphrase.trim());

        if (!clientEncryptedText) {
          throw new Error('Failed to generate receiver-side cipher text.');
        }

        setCipherPreview(clientEncryptedText);
      } else {
        setCipherPreview('');
      }

      await uploadFileInChunks(
        selectedFile,
          {
            description,
            tags,
            patientId,
            category,
            recordType: category,
            disease,
            clientEncryptedText,
            clientEncryptionEnabled: encryptForReceiver,
            clientEncryptionHint: passphraseHint
          },
        (update) => {
          if (update.status === 'completed') {
            setCryptoPhase('stored');
          } else if (update.currentChunk === update.totalChunks) {
            setCryptoPhase('encrypting');
          } else {
            setCryptoPhase('uploading');
          }

          const now = Date.now();
          const elapsedSeconds = (now - lastSampleRef.current.at) / 1000 || 1;
          const bytesDelta = update.uploadedBytes - lastSampleRef.current.bytes;
          const speed = bytesDelta / elapsedSeconds;
          const remainingSeconds = speed > 0 ? (update.totalBytes - update.uploadedBytes) / speed : 0;

          setProgress({
            uploadedBytes: update.uploadedBytes,
            totalBytes: update.totalBytes,
            progress: update.progress,
            currentChunk: update.currentChunk,
            totalChunks: update.totalChunks,
            speed,
            remainingSeconds
          });

          lastSampleRef.current = { bytes: update.uploadedBytes, at: now };

          if (update.status === 'completed') {
            setSuccess('Medical file uploaded and encrypted successfully. Redirecting to dashboard.');
            setTimeout(() => navigate('/dashboard'), 1500);
          }
        }
      );
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed.');
      setCryptoPhase('idle');
    } finally {
      setUploading(false);
    }
  };

  const cryptoSteps = [
    {
      label: 'Split file into 5MB chunks',
      state: cryptoPhase === 'idle' ? 'pending' : 'complete',
      detail: selectedFile ? `${selectedFile.name} prepared for resilient upload` : 'Select a medical file to begin'
    },
    {
      label: 'Encrypt plaintext into sender-side cipher text',
      state: !encryptForReceiver ? 'pending' : cipherPreview ? 'complete' : cryptoPhase === 'preparing' ? 'active' : 'pending',
      detail: encryptForReceiver ? 'Receiver will see the AES cipher text in the UI and decrypt it locally with the shared passphrase' : 'Enable this for text files when you want to demonstrate sender/receiver cryptography'
    },
    {
      label: 'Transmit chunks over authenticated HTTPS',
      state: cryptoPhase === 'uploading' ? 'active' : ['encrypting', 'stored'].includes(cryptoPhase) ? 'complete' : 'pending',
      detail: progress.totalChunks ? `${progress.currentChunk}/${progress.totalChunks} chunks delivered` : 'Replay-protected API request flow'
    },
    {
      label: 'Stream AES-256-GCM encryption on the backend',
      state: cryptoPhase === 'encrypting' ? 'active' : cryptoPhase === 'stored' ? 'complete' : 'pending',
      detail: 'The server encrypts the file stream without loading the entire medical record into memory'
    },
    {
      label: 'Compute SHA-256 integrity hash and store audit trail',
      state: cryptoPhase === 'stored' ? 'complete' : 'pending',
      detail: success ? 'Encrypted record stored with integrity metadata and access logging' : 'Integrity verification occurs during finalization'
    }
  ];

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
      {error ? <div className="mb-6 rounded-2xl border border-red-500 bg-red-500/10 p-4 text-red-100">{error}</div> : null}
      {success ? <div className="mb-6 rounded-2xl border border-emerald-500 bg-emerald-500/10 p-4 text-emerald-100">{success}</div> : null}

      <form onSubmit={handleUpload} className="space-y-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFileSelect(event.dataTransfer.files?.[0]);
          }}
          className={`w-full rounded-3xl border-2 border-dashed p-10 text-left transition ${
            isDragging ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-600 bg-slate-900/70 hover:border-slate-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(event) => handleFileSelect(event.target.files?.[0])}
          />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">Drop a prescription, scan, or report here</p>
            <p className="text-sm text-slate-400">Chunked upload, AES-256-GCM at rest, replay-protected API calls, 100MB max</p>
            <p className="text-xs text-slate-500">For the visual encryption/decryption demo, upload a text-based file so the decrypted content can be shown clearly in the UI.</p>
            {selectedFile ? (
              <p className="text-cyan-300">
                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            ) : null}
          </div>
        </button>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Record Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Patient Identifier</label>
          <input
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            placeholder={user?.role === 'patient' ? 'Auto-linked to your account' : 'Enter the patient Mongo user id'}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
          {user?.role === 'doctor' ? (
            <p className="mt-2 text-xs text-slate-400">Use the patient account `_id`, not the doctor id. The backend now rejects non-patient ids.</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Condition or Disease</label>
          <input
            value={disease}
            onChange={(event) => setDisease(event.target.value)}
            placeholder="Diabetes, Hypertension, Post-op review"
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
        </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Clinical Notes</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows="4"
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            placeholder="Describe the encounter, document type, or telemedicine context."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Tags</label>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            placeholder="telemedicine, follow-up, MRI"
          />
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-white">Show cipher text to the receiver</p>
              <p className="mt-1 text-sm text-slate-400">For text files, encrypt the plaintext in the browser so the receiver sees cipher text first and decrypts it locally.</p>
            </div>
            <label className="inline-flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={encryptForReceiver}
                onChange={(event) => setEncryptForReceiver(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500"
              />
              Enable
            </label>
          </div>

          {encryptForReceiver ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder="Shared passphrase for decryption"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
              <input
                value={passphraseHint}
                onChange={(event) => setPassphraseHint(event.target.value)}
                placeholder="Optional hint for the receiver"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </div>
          ) : null}

          {cipherPreview ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-cyan-300">Cipher text preview</p>
              <textarea
                value={cipherPreview}
                readOnly
                rows="6"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xs text-emerald-200 outline-none"
              />
            </div>
          ) : null}
        </div>

        {uploading || progress.progress > 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-slate-300">Upload progress</span>
              <span className="font-semibold text-cyan-300">{progress.progress.toFixed(1)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400" style={{ width: `${progress.progress}%` }} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-4">
              <div>Chunks: {progress.currentChunk}/{progress.totalChunks}</div>
              <div>Transferred: {formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)}</div>
              <div>Speed: {formatSpeed(progress.speed)}</div>
              <div>Remaining: {formatTimeRemaining(progress.remainingSeconds)}</div>
            </div>
          </div>
        ) : null}

        <CryptoStatusPanel
          title="Visible Encryption Workflow"
          steps={cryptoSteps}
          footer="This UI exposes the cryptographic pipeline so patients, doctors, and evaluators can see when chunking, encryption, and integrity protection occur."
        />

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? 'Uploading and encrypting medical file...' : 'Start Secure Upload'}
        </button>
      </form>
    </div>
  );
};

export default AdvancedUploadForm;
