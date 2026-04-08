import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/database.js';
import config from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chunkedUploadRoutes from './routes/chunkedUploadRoutes.js';
import healthcareRoutes from './routes/healthcareRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  securityHeaders,
  enforceHttps,
  createRateLimiter,
  dataSanitization,
  auditLog,
  requestValidation,
  createNonceValidator,
  createSpeedLimiter,
  requestTimeout
} from './middleware/securityMiddleware.js';
import { attackDetectionMiddleware } from './middleware/attackDetectionMiddleware.js';
import { hipaaComplianceMiddleware, hipaaLogger } from './middleware/hipaaComplianceMiddleware.js';
import { insiderThreatMiddleware } from './middleware/insiderThreatMiddleware.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const replayProtection = createNonceValidator();

/**
 * Database Connection
 */
connectDB();
app.set('trust proxy', config.TRUST_PROXY);

/**
 * Security Middleware Stack
 */
app.use(securityHeaders());
app.use(enforceHttps);
app.use(createRateLimiter());
app.use(createSpeedLimiter());
app.use(requestTimeout(45000));
app.use(dataSanitization);
app.use(attackDetectionMiddleware);
app.use(auditLog);
app.use(requestValidation);
app.use(replayProtection);

/**
 * Middleware
 */
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '50mb' })); // Increased for metadata
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Health Check Route
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SecureSphere API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/files/chunked', chunkedUploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/healthcare', healthcareRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Healthcare Security: Ensure graceful shutdown of compliance logs
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, flushing compliance logs...');
  await hipaaLogger.gracefulShutdown();
  process.exit(0);
});

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Start Server
 */
const PORT = config.PORT;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║     SecureSphere Backend Server        ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
    console.log(`✓ Server running on http://localhost:${port}`);
    console.log(`✓ Environment: ${config.NODE_ENV}`);
    console.log(`✓ Database: ${config.MONGODB_URI}\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = Number(port) + 1;
      console.warn(`Port ${port} is already in use. Trying fallback port ${fallbackPort}...`);
      startServer(fallbackPort);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
};

startServer(PORT);

export default app;
