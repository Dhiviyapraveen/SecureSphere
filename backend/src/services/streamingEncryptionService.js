import crypto from 'crypto';
import { Transform, pipeline } from 'stream';
import { promisify } from 'util';
import config from '../config/env.js';

const streamPipeline = promisify(pipeline);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const HEADER_LENGTH = SALT_LENGTH + IV_LENGTH;
const CHUNK_SIZE = 64 * 1024;

function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

export const createEncryptionStream = (password = config.ENCRYPTION_KEY) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const header = Buffer.concat([salt, iv]);

  let headerSent = false;

  return new Transform({
    highWaterMark: CHUNK_SIZE,
    transform(chunk, encoding, callback) {
      try {
        const encrypted = cipher.update(chunk);

        if (!headerSent) {
          headerSent = true;
          callback(null, Buffer.concat([header, encrypted]));
          return;
        }

        callback(null, encrypted);
      } catch (error) {
        callback(error);
      }
    },
    flush(callback) {
      try {
        const finalChunk = cipher.final();
        const authTag = cipher.getAuthTag();
        callback(null, Buffer.concat([finalChunk, authTag]));
      } catch (error) {
        callback(error);
      }
    }
  });
};

export const createDecryptionStream = (password = config.ENCRYPTION_KEY) => {
  let buffered = Buffer.alloc(0);
  let decipher = null;

  return new Transform({
    highWaterMark: CHUNK_SIZE,
    transform(chunk, encoding, callback) {
      try {
        buffered = Buffer.concat([buffered, chunk]);

        if (!decipher && buffered.length >= HEADER_LENGTH) {
          const salt = buffered.subarray(0, SALT_LENGTH);
          const iv = buffered.subarray(SALT_LENGTH, HEADER_LENGTH);
          const key = deriveKey(password, salt);
          decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
          buffered = buffered.subarray(HEADER_LENGTH);
        }

        if (!decipher || buffered.length <= AUTH_TAG_LENGTH) {
          callback();
          return;
        }

        const safeLength = buffered.length - AUTH_TAG_LENGTH;
        const decryptableChunk = buffered.subarray(0, safeLength);
        buffered = buffered.subarray(safeLength);

        callback(null, decipher.update(decryptableChunk));
      } catch (error) {
        callback(error);
      }
    },
    flush(callback) {
      try {
        if (!decipher) {
          callback(new Error('Encrypted payload header missing or incomplete'));
          return;
        }

        if (buffered.length < AUTH_TAG_LENGTH) {
          callback(new Error('Encrypted payload auth tag missing'));
          return;
        }

        const authTag = buffered.subarray(buffered.length - AUTH_TAG_LENGTH);
        const finalChunk = buffered.subarray(0, buffered.length - AUTH_TAG_LENGTH);

        decipher.setAuthTag(authTag);
        const decrypted = finalChunk.length > 0 ? decipher.update(finalChunk) : Buffer.alloc(0);
        callback(null, Buffer.concat([decrypted, decipher.final()]));
      } catch (error) {
        callback(error);
      }
    }
  });
};

export const streamingEncrypt = async (inputStream, outputStream, password = config.ENCRYPTION_KEY) => {
  await streamPipeline(inputStream, createEncryptionStream(password), outputStream);
};

export const streamingDecrypt = async (inputStream, outputStream, password = config.ENCRYPTION_KEY) => {
  await streamPipeline(inputStream, createDecryptionStream(password), outputStream);
};

export const createHashStream = (algorithm = 'sha256') => {
  const hash = crypto.createHash(algorithm);

  const stream = new Transform({
    transform(chunk, encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    }
  });

  return {
    stream,
    getHash: () => hash.digest('hex')
  };
};

export default {
  createEncryptionStream,
  createDecryptionStream,
  streamingEncrypt,
  streamingDecrypt,
  createHashStream
};
