import crypto from 'crypto';
import config from '../config/env.js';

const DEMO_ALGORITHM = 'aes-256-cbc';
const DEMO_IV_LENGTH = 16;

const getDemoKey = (secret = config.ENCRYPTION_KEY || 'securesphere-demo-key') =>
  crypto.createHash('sha256').update(secret).digest();

/**
 * Encryption Service - AES-256-GCM encryption
 * Provides secure file encryption and decryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const SALT_LENGTH = 64; // 512-bit salt

/**
 * Derives an encryption key from the master key and a salt
 */
function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts data using AES-256-GCM
 * Returns: salt + iv + authTag + ciphertext (all in hex)
 */
export const encryptData = (data, password = config.ENCRYPTION_KEY) => {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine: salt + iv + authTag + ciphertext
    const combined = salt.toString('hex') + 
                     iv.toString('hex') + 
                     authTag.toString('hex') + 
                     encrypted;
    
    return combined;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypts data using AES-256-GCM
 * Expects: salt + iv + authTag + ciphertext (all in hex)
 */
export const decryptData = (encryptedData, password = config.ENCRYPTION_KEY) => {
  try {
    const saltHex = encryptedData.substring(0, SALT_LENGTH * 2);
    const ivHex = encryptedData.substring(SALT_LENGTH * 2, SALT_LENGTH * 2 + IV_LENGTH * 2);
    const authTagHex = encryptedData.substring(SALT_LENGTH * 2 + IV_LENGTH * 2, SALT_LENGTH * 2 + IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);
    const ciphertext = encryptedData.substring(SALT_LENGTH * 2 + IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Encrypts a file buffer and returns encrypted buffer
 */
export const encryptFile = (fileBuffer, password = config.ENCRYPTION_KEY) => {
  try {
    if (typeof fileBuffer === 'string') {
      fileBuffer = Buffer.from(fileBuffer, 'binary');
    }
    
    if (!Buffer.isBuffer(fileBuffer) && !(fileBuffer instanceof Uint8Array)) {
      throw new TypeError('encryptFile expects a Buffer or Uint8Array');
    }
    
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encryptedChunk = cipher.update(fileBuffer);
    const finalChunk = cipher.final();
    const encrypted = Buffer.concat([encryptedChunk, finalChunk]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine: salt + iv + authTag + encrypted
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    
    return combined;
  } catch (error) {
    throw new Error(`File encryption failed: ${error.message}`);
  }
};

/**
 * Decrypts a file buffer
 */
export const decryptFile = (encryptedBuffer, password = config.ENCRYPTION_KEY) => {
  try {
    let offset = 0;
    
    const salt = encryptedBuffer.subarray(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;
    
    const iv = encryptedBuffer.subarray(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;
    
    const authTag = encryptedBuffer.subarray(offset, offset + AUTH_TAG_LENGTH);
    offset += AUTH_TAG_LENGTH;
    
    const ciphertext = encryptedBuffer.subarray(offset);
    
    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  } catch (error) {
    throw new Error(`File decryption failed: ${error.message}`);
  }
};

export const encryptTextForStorage = (plainText, secret = config.ENCRYPTION_KEY) => {
  try {
    const iv = crypto.randomBytes(DEMO_IV_LENGTH);
    const cipher = crypto.createCipheriv(DEMO_ALGORITHM, getDemoKey(secret), iv);
    let encryptedData = cipher.update(plainText, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    return {
      encryptedData,
      iv: iv.toString('hex')
    };
  } catch (error) {
    throw new Error(`Text encryption failed: ${error.message}`);
  }
};

export const decryptTextFromStorage = (encryptedData, ivHex, secret = config.ENCRYPTION_KEY) => {
  try {
    const decipher = crypto.createDecipheriv(
      DEMO_ALGORITHM,
      getDemoKey(secret),
      Buffer.from(ivHex, 'hex')
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error(`Text decryption failed: ${error.message}`);
  }
};

export default {
  encryptData,
  decryptData,
  encryptFile,
  decryptFile,
  encryptTextForStorage,
  decryptTextFromStorage
};
