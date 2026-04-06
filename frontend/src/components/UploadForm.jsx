import React, { useState } from 'react';

/**
 * UploadForm Component - File upload form with drag-and-drop
 */

const UploadForm = ({ onUpload, isLoading }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('tags', tags);

    await onUpload(formData);

    // Reset form
    setFile(null);
    setDescription('');
    setTags('');
    setPreview(null);
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Upload File</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
            dragActive
              ? 'border-blue-500 bg-blue-500 bg-opacity-10'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          {preview ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-32 rounded"
              />
              <p className="text-white font-semibold">{file.name}</p>
              <p className="text-slate-400 text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-white font-semibold">
                  Drag and drop your file here
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  or click to select a file
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  Max file size: 100 MB
                </p>
              </label>
            </>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter file description..."
            className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows="3"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Tags (Optional)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Separate tags with commas (e.g., work, important, 2024)"
            className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || isLoading}
          className={`w-full py-3 px-4 rounded font-semibold text-white transition ${
            !file || isLoading
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? '⏳ Uploading...' : '📤 Upload File'}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
