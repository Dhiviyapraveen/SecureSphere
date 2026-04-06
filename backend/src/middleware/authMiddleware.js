import jwt from 'jwt-simple';
import config from '../config/env.js';

/**
 * JWT Middleware - Verifies JWT tokens in Authorization header
 */

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.'
      });
    }
    
    const decoded = jwt.decode(token, config.JWT_SECRET);
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Access denied.',
      error: error.message
    });
  }
};

/**
 * Optional Token Middleware - Checks token if provided, but doesn't require it
 */
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.decode(token, config.JWT_SECRET);
      // Check token expiration
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        req.user = null;
      } else {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Generate JWT Token
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    username: user.username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  
  return jwt.encode(payload, config.JWT_SECRET);
};

export default {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken
};
