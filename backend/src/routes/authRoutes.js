import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/securityMiddleware.js';

const router = express.Router();

/**
 * Authentication Routes
 */

// POST /api/auth/register - Register new user
router.post('/register', authRateLimiter, validateRegister, authController.register);

// POST /api/auth/login - Login user
router.post('/login', authRateLimiter, validateLogin, authController.login);

// GET /api/auth/profile - Get user profile (protected)
router.get('/profile', authMiddleware, authController.getProfile);

// PUT /api/auth/profile - Update user profile (protected)
router.put('/profile', authMiddleware, authController.updateProfile);

// POST /api/auth/logout - Logout user (protected)
router.post('/logout', authMiddleware, authController.logout);

export default router;
