import dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/securesphere',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  UPLOADS_DIR: './uploads'
};
