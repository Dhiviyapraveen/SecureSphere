import express from 'express';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';
import { getSystemActivity, listPatients, listUsers, searchUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/search', authMiddleware, searchUsers);
router.get('/patients', authMiddleware, authorizeRoles('doctor', 'admin'), listPatients);
router.get('/activity', authMiddleware, authorizeRoles('admin'), getSystemActivity);
router.get('/', authMiddleware, authorizeRoles('admin'), listUsers);

export default router;
