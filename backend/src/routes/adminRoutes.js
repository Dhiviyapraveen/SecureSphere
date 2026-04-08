import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import * as fileController from '../controllers/fileController.js';
import { deleteUser, getSystemActivity, listUsers } from '../controllers/userController.js';
import { getSecurityStatus } from '../middleware/attackDetectionMiddleware.js';

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.get('/files', fileController.getAllFiles);
router.get('/activity', getSystemActivity);
router.get('/security-status', getSecurityStatus);

export default router;
