import jwt from 'jwt-simple';
import config from '../config/env.js';

const TOKEN_LIFETIME_SECONDS = config.JWT_EXPIRATION_SECONDS;

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

    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
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
      message: 'Invalid token. Access denied.'
    });
  }
};

export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.decode(token, config.JWT_SECRET);
    if (decoded.exp && decoded.exp >= Math.floor(Date.now() / 1000)) {
      req.user = decoded;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action.'
    });
  }

  next();
};

export const generateToken = (user) => {
  const issuedAt = Math.floor(Date.now() / 1000);

  return jwt.encode(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      iat: issuedAt,
      exp: issuedAt + TOKEN_LIFETIME_SECONDS
    },
    config.JWT_SECRET
  );
};

export default {
  authMiddleware,
  optionalAuthMiddleware,
  authorizeRoles,
  generateToken
};
