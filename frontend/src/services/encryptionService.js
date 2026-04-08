/**
 * Encryption Service - Client-side encryption utilities
 * Uses CryptoJS for AES encryption
 */

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'securesphere-client-key'; // In production, derive from user's password

/**
 * Encrypt data using AES
 */
export const encryptClientData = (data, key = ENCRYPTION_KEY) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  } catch (error) {
    console.error('Client encryption failed:', error);
    return null;
  }
};

export const encryptTextContent = (plainText, passphrase) => {
  try {
    if (!plainText || !passphrase) {
      return null;
    }

    return CryptoJS.AES.encrypt(plainText, passphrase).toString();
  } catch (error) {
    console.error('Text encryption failed:', error);
    return null;
  }
};

export const decryptTextContent = (cipherText, passphrase) => {
  try {
    if (!cipherText || !passphrase) {
      return null;
    }

    const bytes = CryptoJS.AES.decrypt(cipherText, passphrase);
    const plainText = bytes.toString(CryptoJS.enc.Utf8);
    return plainText || null;
  } catch (error) {
    console.error('Text decryption failed:', error);
    return null;
  }
};

/**
 * Decrypt data using AES
 */
export const decryptClientData = (encryptedData, key = ENCRYPTION_KEY) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Client decryption failed:', error);
    return null;
  }
};

/**
 * Generate SHA-256 hash
 */
export const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};

export default {
  encryptClientData,
  decryptClientData,
  encryptTextContent,
  decryptTextContent,
  hashData
};
