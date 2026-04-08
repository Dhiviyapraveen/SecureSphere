import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireDoctor } from '../middleware/roleMiddleware.js';
import { uploadRateLimiter } from '../middleware/securityMiddleware.js';
import { uploadSingleFile, handleUploadError } from '../middleware/uploadMiddleware.js';
import * as fileController from '../controllers/fileController.js';
import { listPatients } from '../controllers/userController.js';

const router = express.Router();

router.use(authMiddleware, requireDoctor);

router.get('/patients', listPatients);
router.post('/prescriptions/upload', uploadRateLimiter, uploadSingleFile, handleUploadError, fileController.uploadFile);
router.get('/files', fileController.getMyFiles);
router.get('/files/:id', fileController.getFileDetails);
router.get('/files/:id/download', fileController.downloadFile);
router.get('/files/:id/audit', fileController.getFileAuditLogs);
router.get('/activity', fileController.getRecentAuditActivity);

export default router;
