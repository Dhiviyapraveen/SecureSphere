import crypto from 'crypto';

/**
 * Hashing Service - SHA-256 hashing and bcrypt
 * Provides secure hashing for passwords and file integrity verification
 */

import bcrypt from 'bcryptjs';

/**
 * Hash a string using bcrypt
 * @param {string} data - Data to hash
 * @param {number} rounds - Salt rounds (default: 10)
 * @returns {Promise<string>} - Hashed data
 */
export const hashPassword = async (password, rounds = 10) => {
  try {
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Compare plain password with hashed password
 * @param {string} password - Plain password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * Generate SHA-256 hash for file integrity verification
 * @param {Buffer|string} data - Data to hash
 * @returns {string} - Hex encoded hash
 */
export const hashFileSHA256 = (data) => {
  try {
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (error) {
    throw new Error(`SHA-256 hashing failed: ${error.message}`);
  }
};

/**
 * Verify file hash integrity
 * @param {Buffer|string} data - Data to verify
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} - True if hashes match
 */
export const verifyFileHash = (data, expectedHash) => {
  try {
    const computedHash = hashFileSHA256(data);
    return computedHash === expectedHash;
  } catch (error) {
    throw new Error(`File hash verification failed: ${error.message}`);
  }
};

/**
 * Generate SHA-256 hash for any input
 */
export const hashSHA256 = (data) => {
  try {
    if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
      data = JSON.stringify(data);
    }
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (error) {
    throw new Error(`SHA-256 hashing failed: ${error.message}`);
  }
};

export default {
  hashPassword,
  comparePassword,
  hashFileSHA256,
  verifyFileHash,
  hashSHA256
};
