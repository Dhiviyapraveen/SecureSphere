import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import mongoSanitize from 'express-mongo-sanitize';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/env.js';

const buildKey = (req) => req.user?.id || req.ip || req.connection?.remoteAddress || 'anonymous';

export const securityHeaders = () =>
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'no-referrer' }
  });

export const enforceHttps = (req, res, next) => {
  const protoHeader = req.headers['x-forwarded-proto'];
  const isSecure = req.secure || protoHeader === 'https' || config.NODE_ENV !== 'production';

  if (!config.ENFORCE_HTTPS && config.NODE_ENV !== 'production') {
    next();
    return;
  }

  if (!isSecure) {
    return res.status(403).json({
      success: false,
      message: 'HTTPS is required for telemedicine file operations.'
    });
  }

  next();
};

export const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 120) =>
  rateLimit({
    windowMs,
    max: maxRequests,
    message: 'Too many requests from this client, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health',
    keyGenerator: buildKey
  });

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Upload rate limit reached. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey
});

export const createSpeedLimiter = (windowMs = 15 * 60 * 1000, delayAfter = 60, delayMs = 250) =>
  slowDown({
    windowMs,
    delayAfter,
    delayMs: () => delayMs
  });

export const dataSanitization = mongoSanitize({
  replaceWith: '_'
});

export const csrfTokenMiddleware = (req, res, next) => {
  if (!req.session?.csrfToken) {
    req.session = req.session || {};
    req.session.csrfToken = uuidv4();
  }

  res.locals.csrfToken = req.session.csrfToken;
  next();
};

export const csrfValidation = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  if (!token || token !== req.session?.csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed. Request rejected.'
    });
  }

  next();
};

export const requestTimeout = (timeoutMs = 30000) => (req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout. Please try again.'
      });
    }
  }, timeoutMs);

  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  next();
};

export const createNonceValidator = () => {
  const usedNonces = new Map();
  const NONCE_EXPIRY_MS = 5 * 60 * 1000;
  const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

  setInterval(() => {
    const now = Date.now();
    for (const [nonce, createdAt] of usedNonces.entries()) {
      if (now - createdAt > NONCE_EXPIRY_MS) {
        usedNonces.delete(nonce);
      }
    }
  }, NONCE_EXPIRY_MS);

  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    const nonce = req.headers['x-nonce'];
    const timestampHeader = req.headers['x-timestamp'];

    if (!nonce || !timestampHeader) {
      return res.status(400).json({
        success: false,
        message: 'Missing nonce or timestamp header.'
      });
    }

    const requestTimestamp = Number(timestampHeader);
    if (!Number.isFinite(requestTimestamp) || Math.abs(Date.now() - requestTimestamp) > TIMESTAMP_TOLERANCE_MS) {
      return res.status(400).json({
        success: false,
        message: 'Request timestamp is too old or invalid.'
      });
    }

    if (usedNonces.has(nonce)) {
      return res.status(409).json({
        success: false,
        message: 'Replay attack detected. Nonce has already been used.'
      });
    }

    usedNonces.set(nonce, Date.now());
    next();
  };
};

export const requestValidation = (req, res, next) => {
  const suspiciousPatterns = [/union\s+select/i, /drop\s+table/i, /exec\s*\(/i, /<script/i, /<iframe/i];
  const bodyString = JSON.stringify(req.body || {}) + JSON.stringify(req.query || {});

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(bodyString)) {
      console.warn(`Suspicious payload detected from ${req.ip}: ${req.method} ${req.path}`);
      break;
    }
  }

  next();
};

export const auditLog = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ${req.ip}`
    );
  });

  next();
};

export default {
  securityHeaders,
  enforceHttps,
  createRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  createSpeedLimiter,
  dataSanitization,
  csrfTokenMiddleware,
  csrfValidation,
  requestTimeout,
  createNonceValidator,
  requestValidation,
  auditLog
};
