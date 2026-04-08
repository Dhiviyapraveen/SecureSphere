import express from 'express';
import * as chunkedUploadController from '../controllers/chunkedUploadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadRateLimiter } from '../middleware/securityMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

/**
 * Chunked File Upload Routes
 * All routes are protected with JWT authentication
 * Optimized for large file uploads (up to 100MB)
 */

/**
 * POST /api/files/chunked/init
 * Initiate a chunked upload session
 * Body: { fileName, fileSize, mimeType, description?, tags? }
 * Returns: { uploadId, chunkSize, totalChunks }
 */
router.post(
  '/init',
  authMiddleware,
  uploadRateLimiter,
  [
    body('fileName').notEmpty().trim().escape(),
    body('fileSize').isInt({ min: 1, max: 100 * 1024 * 1024 }),
    body('mimeType').notEmpty().trim(),
    body('description').optional().trim().escape(),
    body('tags').optional().trim(),
    body('patientId').optional().isString(),
    body('category').optional().isIn(['report', 'prescription', 'scan', 'lab-result', 'other']),
    body('recordType').optional().isIn(['prescription', 'report', 'scan', 'lab-result', 'diagnosis', 'other']),
    body('disease').optional().isString()
  ],
  chunkedUploadController.initiateChunkedUpload
);

/**
 * POST /api/files/chunked/upload/:uploadId/:chunkNumber
 * Upload a single chunk
 * Body: Binary chunk data
 * Params: uploadId, chunkNumber
 * Returns: { chunkNumber, uploadedBytes, progress }
 */
router.post(
  '/upload/:uploadId/:chunkNumber',
  authMiddleware,
  uploadRateLimiter,
  express.raw({ type: 'application/octet-stream', limit: '6mb' }),
  chunkedUploadController.uploadChunk
);

/**
 * POST /api/files/chunked/finalize/:uploadId
 * Finalize chunked upload - assembles and encrypts chunks
 * Params: uploadId
 * Returns: { fileId, fileName, size, hash }
 */
router.post(
  '/finalize/:uploadId',
  authMiddleware,
  chunkedUploadController.finalizeChunkedUpload
);

/**
 * GET /api/files/chunked/progress/:uploadId
 * Get upload progress
 * Params: uploadId
 * Returns: { uploadedBytes, totalBytes, uploadedChunks, totalChunks, progress }
 */
router.get(
  '/progress/:uploadId',
  authMiddleware,
  chunkedUploadController.getUploadProgress
);

/**
 * DELETE /api/files/chunked/cancel/:uploadId
 * Cancel an ongoing upload
 * Params: uploadId
 * Returns: success message
 */
router.delete(
  '/cancel/:uploadId',
  authMiddleware,
  chunkedUploadController.cancelUpload
);

export default router;
