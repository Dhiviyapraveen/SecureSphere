import dotenv from 'dotenv';
dotenv.config();

const parseTrustProxy = () => {
  const value = process.env.TRUST_PROXY;

  if (value === undefined || value === '') {
    return false;
  }

  if (value === 'loopback' || value === 'linklocal' || value === 'uniquelocal') {
    return value;
  }

  if (value === 'true') {
    return 1;
  }

  if (value === 'false') {
    return false;
  }

  const asNumber = Number(value);
  if (Number.isInteger(asNumber) && asNumber >= 0) {
    return asNumber;
  }

  return value;
};

export default {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/securesphere',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION_SECONDS: Number(process.env.JWT_EXPIRATION_SECONDS || 15 * 60),
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  UPLOADS_DIR: './uploads',
  MAX_MEDICAL_FILE_SIZE_MB: Number(process.env.MAX_MEDICAL_FILE_SIZE_MB || 100),
  ENFORCE_HTTPS: process.env.ENFORCE_HTTPS === 'true',
  TRUST_PROXY: parseTrustProxy()
};
