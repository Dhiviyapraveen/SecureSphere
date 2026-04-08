import { buildSecurityHeaders } from './apiService.js';

const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const getToken = () => localStorage.getItem('token');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
};

const splitFileIntoChunks = (file) => {
  const chunks = [];
  let offset = 0;

  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    chunks.push(file.slice(offset, end));
    offset = end;
  }

  return chunks;
};

const retryWithBackoff = async (fn, maxRetries = MAX_RETRIES) => {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt < maxRetries) {
        await wait(RETRY_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError;
};

export const initiateChunkedUpload = async (file, metadata = {}) => {
  const token = getToken();
  const payload = await request('/api/files/chunked/init', {
    method: 'POST',
    headers: {
      ...buildSecurityHeaders(),
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      ...metadata
    })
  });

  return payload.data;
};

export const uploadChunk = async (uploadId, chunkNumber, chunkData) => {
  const token = getToken();

  return retryWithBackoff(async () => {
    const payload = await request(`/api/files/chunked/upload/${uploadId}/${chunkNumber}`, {
      method: 'POST',
      headers: {
        ...buildSecurityHeaders(),
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${token}`
      },
      body: chunkData
    });

    return payload.data;
  });
};

export const finalizeChunkedUpload = async (uploadId) => {
  const token = getToken();
  const payload = await request(`/api/files/chunked/finalize/${uploadId}`, {
    method: 'POST',
    headers: {
      ...buildSecurityHeaders(),
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  return payload.data;
};

export const cancelChunkedUpload = async (uploadId) => {
  const token = getToken();
  const payload = await request(`/api/files/chunked/cancel/${uploadId}`, {
    method: 'DELETE',
    headers: {
      ...buildSecurityHeaders(),
      Authorization: `Bearer ${token}`
    }
  });

  return payload.data;
};

export const uploadFileInChunks = async (file, metadata = {}, onProgress = null) => {
  const uploadSession = await initiateChunkedUpload(file, metadata);
  const chunks = splitFileIntoChunks(file);

  try {
    for (let index = 0; index < chunks.length; index += 1) {
      const result = await uploadChunk(uploadSession.uploadId, index, chunks[index]);

      if (onProgress) {
        onProgress({
          uploadedBytes: result.uploadedBytes,
          totalBytes: result.totalBytes,
          progress: Number(result.progress),
          currentChunk: index + 1,
          totalChunks: uploadSession.totalChunks
        });
      }
    }

    const uploadedFile = await finalizeChunkedUpload(uploadSession.uploadId);

    if (onProgress) {
      onProgress({
        uploadedBytes: file.size,
        totalBytes: file.size,
        progress: 100,
        currentChunk: uploadSession.totalChunks,
        totalChunks: uploadSession.totalChunks,
        status: 'completed',
        fileId: uploadedFile.fileId
      });
    }

    return uploadedFile;
  } catch (error) {
    await cancelChunkedUpload(uploadSession.uploadId).catch(() => {});
    throw error;
  }
};

export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** index).toFixed(decimals))} ${sizes[index]}`;
};

export const formatSpeed = (bytesPerSecond) => `${formatBytes(bytesPerSecond)}/s`;

export default {
  CHUNK_SIZE,
  initiateChunkedUpload,
  uploadChunk,
  finalizeChunkedUpload,
  cancelChunkedUpload,
  uploadFileInChunks,
  formatBytes,
  formatSpeed
};
