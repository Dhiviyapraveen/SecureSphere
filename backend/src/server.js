import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/database.js';
import config from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Connection
 */
connectDB();

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/users', userRoutes);

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
