import express from 'express';
import * as fileController from '../controllers/fileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadSingleFile, handleUploadError } from '../middleware/uploadMiddleware.js';
import { validateShareFile } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * File Management Routes
 * All routes are protected with JWT authentication
 */

// POST /api/files/upload - Upload a new file (protected)
router.post('/upload', authMiddleware, uploadSingleFile, handleUploadError, fileController.uploadFile);

// GET /api/files - Get all files accessible by user (protected)
router.get('/', authMiddleware, fileController.getMyFiles);

// GET /api/files/:id - Get file details (protected)
router.get('/:id', authMiddleware, fileController.getFileDetails);

// GET /api/files/:id/download - Download file (protected)
router.get('/:id/download', authMiddleware, fileController.downloadFile);

// POST /api/files/:id/share - Share file with users (protected)
router.post('/:id/share', authMiddleware, validateShareFile, fileController.shareFile);

// POST /api/files/:id/revoke - Revoke user access (protected)
router.post('/:id/revoke', authMiddleware, fileController.revokeAccess);

// DELETE /api/files/:id - Delete file (protected)
router.delete('/:id', authMiddleware, fileController.deleteFile);

export default router;
