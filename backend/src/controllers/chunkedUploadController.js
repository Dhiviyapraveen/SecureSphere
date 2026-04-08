import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import File from '../models/File.js';
import User from '../models/User.js';
import { streamingEncrypt } from '../services/streamingEncryptionService.js';
import { createAuditEntry } from '../services/auditLogService.js';
import { ROLES, createAccessEntry } from '../services/accessControlService.js';
import config from '../config/env.js';
import { encryptTextForStorage } from '../services/encryptionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');
const chunksDir = path.join(__dirname, '../../chunks');
const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE = config.MAX_MEDICAL_FILE_SIZE_MB * 1024 * 1024;

if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir, { recursive: true });
}

const getSessionStore = () => {
  if (!global.uploadSessions) {
    global.uploadSessions = new Map();
  }

  return global.uploadSessions;
};

const deleteIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const appendChunkToStream = async (chunkPath, writeStream) =>
  new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(chunkPath);
    readStream.on('error', reject);
    readStream.on('end', resolve);
    readStream.pipe(writeStream, { end: false });
  });

const computeFileHash = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });

const resolvePatientId = async (requestedPatientId, currentUser) => {
  if (currentUser.role === 'patient') {
    return currentUser.id;
  }

  if (!requestedPatientId) {
    return null;
  }

  const patient = await User.findById(requestedPatientId).select('_id role');
  if (!patient || patient.role !== 'patient') {
    const error = new Error('Patient identifier must belong to an existing patient account.');
    error.statusCode = 400;
    throw error;
  }

  return patient._id;
};

export const initiateChunkedUpload = async (req, res, next) => {
  try {
    const {
      fileName,
      fileSize,
      mimeType,
      description = '',
      tags = '',
      patientId = null,
      category = 'other',
      recordType = category,
      disease = '',
      clientEncryptedText = null,
      clientEncryptionEnabled = false,
      clientEncryptionHint = ''
    } = req.body;
    const resolvedPatientId = await resolvePatientId(patientId, req.user);

    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        success: false,
        message: 'fileName, fileSize, and mimeType are required.'
      });
    }

    if (Number(fileSize) > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Medical files must be ${config.MAX_MEDICAL_FILE_SIZE_MB}MB or smaller.`
      });
    }

    const uploadId = `${req.user.id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    getSessionStore().set(uploadId, {
      uploadId,
      userId: req.user.id,
      fileName,
      fileSize: Number(fileSize),
      mimeType,
      description,
      tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      patientId: resolvedPatientId,
      category,
      recordType,
      disease,
      clientEncryptedText,
      clientEncryptionEnabled: clientEncryptionEnabled === true || clientEncryptionEnabled === 'true',
      clientEncryptionHint,
      createdAt: Date.now(),
      uploadedChunks: new Set(),
      uploadedBytes: 0
    });

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      patientId: resolvedPatientId,
      action: 'upload_initiated',
      details: `Initiated chunk upload for "${fileName}".`
    });

    res.status(200).json({
      success: true,
      data: {
        uploadId,
        chunkSize: CHUNK_SIZE,
        totalChunks: Math.ceil(Number(fileSize) / CHUNK_SIZE)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadChunk = async (req, res, next) => {
  try {
    const { uploadId, chunkNumber } = req.params;
    const session = getSessionStore().get(uploadId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found or expired.'
      });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized upload session.'
      });
    }

    const chunkIndex = Number(chunkNumber);
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chunk number.'
      });
    }

    if (session.uploadedChunks.has(chunkIndex)) {
      return res.status(409).json({
        success: false,
        message: `Chunk ${chunkIndex} has already been uploaded.`
      });
    }

    const chunkData = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    if (!chunkData.length || chunkData.length > CHUNK_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Chunk payload is missing or exceeds the maximum chunk size.'
      });
    }

    const chunkPath = path.join(chunksDir, `${uploadId}-${chunkIndex}`);
    fs.writeFileSync(chunkPath, chunkData);

    session.uploadedChunks.add(chunkIndex);
    session.uploadedBytes += chunkData.length;
    req.attackDetection?.recordUpload(chunkData.length);

    res.status(200).json({
      success: true,
      data: {
        chunkNumber: chunkIndex,
        uploadedBytes: session.uploadedBytes,
        totalBytes: session.fileSize,
        progress: ((session.uploadedBytes / session.fileSize) * 100).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const finalizeChunkedUpload = async (req, res, next) => {
  try {
    const { uploadId } = req.params;
    const session = getSessionStore().get(uploadId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found or expired.'
      });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized upload session.'
      });
    }

    const totalChunks = Math.ceil(session.fileSize / CHUNK_SIZE);
    if (session.uploadedChunks.size !== totalChunks) {
      return res.status(400).json({
        success: false,
        message: `Upload is incomplete. Expected ${totalChunks} chunks and received ${session.uploadedChunks.size}.`
      });
    }

    const tempFilePath = path.join(uploadsDir, `tmp-${uploadId}`);
    const writeStream = fs.createWriteStream(tempFilePath);

    for (let index = 0; index < totalChunks; index += 1) {
      const chunkPath = path.join(chunksDir, `${uploadId}-${index}`);
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`Chunk ${index} is missing from temporary storage.`);
      }

      await appendChunkToStream(chunkPath, writeStream);
    }

    await new Promise((resolve, reject) => {
      writeStream.end(resolve);
      writeStream.on('error', reject);
    });

    const fileHash = await computeFileHash(tempFilePath);
    const plainText = fs.readFileSync(tempFilePath, 'utf8');
    const { encryptedData, iv } = encryptTextForStorage(plainText);

    const file = await File.create({
      name: `${uploadId}-${session.fileName}`,
      originalName: session.fileName,
      mimeType: session.mimeType,
      size: session.fileSize,
      hash: fileHash,
      owner: req.user.id,
      uploadedBy: req.user.id,
      patient: session.patientId,
      filePath: null,
      encryptedData,
      encryptionIv: iv,
      isEncrypted: true,
      description: session.description,
      tags: session.tags,
      category: session.category,
      recordType: session.recordType,
      disease: session.disease,
      clientEncryptedText: session.clientEncryptedText,
      clientEncryptionEnabled: session.clientEncryptionEnabled,
      clientEncryptionHint: session.clientEncryptionHint,
      access: [createAccessEntry(req.user.id, null, ROLES.OWNER)],
      uploadMethod: 'chunked'
    });

    deleteIfExists(tempFilePath);
    for (let index = 0; index < totalChunks; index += 1) {
      deleteIfExists(path.join(chunksDir, `${uploadId}-${index}`));
    }
    getSessionStore().delete(uploadId);

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      fileId: file._id,
      patientId: file.patient,
      action: 'chunked_upload_completed',
      details: `Completed chunked upload for "${file.originalName}".`
    });

    res.status(201).json({
      success: true,
      data: {
        fileId: file._id,
        fileName: file.originalName,
        size: file.size,
        category: file.category,
        recordType: file.recordType,
        disease: file.disease,
        uploadedAt: file.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUploadProgress = (req, res) => {
  const session = getSessionStore().get(req.params.uploadId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Upload session not found.'
    });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized upload session.'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      uploadId: session.uploadId,
      fileName: session.fileName,
      uploadedBytes: session.uploadedBytes,
      totalBytes: session.fileSize,
      uploadedChunks: session.uploadedChunks.size,
      totalChunks: Math.ceil(session.fileSize / CHUNK_SIZE),
      progress: ((session.uploadedBytes / session.fileSize) * 100).toFixed(2),
      status: 'in_progress'
    }
  });
};

export const cancelUpload = async (req, res, next) => {
  try {
    const session = getSessionStore().get(req.params.uploadId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found.'
      });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized upload session.'
      });
    }

    for (const chunkIndex of session.uploadedChunks) {
      deleteIfExists(path.join(chunksDir, `${session.uploadId}-${chunkIndex}`));
    }

    getSessionStore().delete(session.uploadId);

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      patientId: session.patientId,
      action: 'upload_cancelled',
      details: `Cancelled chunk upload for "${session.fileName}".`
    });

    res.status(200).json({
      success: true,
      message: 'Upload cancelled successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  initiateChunkedUpload,
  uploadChunk,
  finalizeChunkedUpload,
  getUploadProgress,
  cancelUpload
};
