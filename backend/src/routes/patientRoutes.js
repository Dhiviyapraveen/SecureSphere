import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePatient } from '../middleware/roleMiddleware.js';
import { uploadRateLimiter } from '../middleware/securityMiddleware.js';
import { uploadSingleFile, handleUploadError } from '../middleware/uploadMiddleware.js';
import { validateShareFile } from '../middleware/validationMiddleware.js';
import * as fileController from '../controllers/fileController.js';

const router = express.Router();

router.use(authMiddleware, requirePatient);

router.post('/files/upload', uploadRateLimiter, uploadSingleFile, handleUploadError, fileController.uploadFile);
router.get('/files', fileController.getMyFiles);
router.get('/files/:id', fileController.getFileDetails);
router.get('/files/:id/download', fileController.downloadFile);
router.get('/files/:id/audit', fileController.getFileAuditLogs);
router.post('/files/:id/share', validateShareFile, fileController.shareFile);
router.get('/activity', fileController.getRecentAuditActivity);

export default router;
