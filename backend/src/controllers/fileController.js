import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import File from '../models/File.js';
import AccessLog from '../models/AccessLog.js';
import User from '../models/User.js';
import { streamingDecrypt, streamingEncrypt } from '../services/streamingEncryptionService.js';
import { createAuditEntry } from '../services/auditLogService.js';
import { canDeleteFile, canShareFile, canViewFile, ROLES, createAccessEntry } from '../services/accessControlService.js';
import { decryptTextFromStorage, encryptTextForStorage } from '../services/encryptionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

const getUserAccess = (file, userId) =>
  file.access.find((access) => access.userId.toString() === userId && access.isActive);

const assertAccess = (file, userId, checker, message) => {
  const access = getUserAccess(file, userId);
  if (!access || !checker(access, userId)) {
    const error = new Error(message);
    error.statusCode = 403;
    throw error;
  }

  return access;
};

const computeFileHash = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });

const computeTextHash = (plainText) => crypto.createHash('sha256').update(plainText, 'utf8').digest('hex');

const processUploadedFile = async (sourcePath, encryptedPath) => {
  const fileHash = await computeFileHash(sourcePath);
  await streamingEncrypt(fs.createReadStream(sourcePath), fs.createWriteStream(encryptedPath));
  return fileHash;
};

const readTextFile = (filePath) => fs.readFileSync(filePath, 'utf8');

const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

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

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No medical file provided.'
      });
    }

    const {
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
    const userId = req.user.id;
    const resolvedPatientId = await resolvePatientId(patientId, req.user);
    const plainText = readTextFile(req.file.path);
    const fileHash = await computeFileHash(req.file.path);
    const { encryptedData, iv } = encryptTextForStorage(plainText);
    cleanupFile(req.file.path);

    const file = await File.create({
      name: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      hash: fileHash,
      owner: userId,
      uploadedBy: userId,
      patient: resolvedPatientId,
      filePath: null,
      encryptedData,
      encryptionIv: iv,
      isEncrypted: true,
      description,
      category,
      recordType,
      disease,
      clientEncryptedText,
      clientEncryptionEnabled: clientEncryptionEnabled === true || clientEncryptionEnabled === 'true',
      clientEncryptionHint,
      tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      access: [createAccessEntry(userId, null, ROLES.OWNER)],
      uploadMethod: 'single'
    });

    req.attackDetection?.recordUpload(req.file.size);

    await createAuditEntry({
      req,
      userId,
      actorRole: req.user.role,
      fileId: file._id,
      patientId: file.patient,
      action: 'upload',
      details: `Uploaded encrypted medical file "${file.originalName}".`
    });

    res.status(201).json({
      success: true,
      message: 'Medical file uploaded successfully.',
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
    cleanupFile(req.file?.path);
    cleanupFile(req.file?.path ? `${req.file.path}.enc` : null);
    next(error);
  }
};

export const getMyFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const query = {
      'access.userId': userId,
      'access.isActive': true
    };

    const files = await File.find(query)
      .select('-filePath')
      .populate('owner', 'username email role profile.firstName profile.lastName')
      .populate('patient', 'username email role profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await File.countDocuments(query);

    const data = files.map((file) => ({
      ...file,
      userRole: getUserAccess(file, userId)?.role || req.user.role
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getFileDetails = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id)
      .select('-filePath')
      .populate('owner', 'username email role profile.firstName profile.lastName')
      .populate('patient', 'username email role profile.firstName profile.lastName');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    const access = assertAccess(file, req.user.id, canViewFile, 'Access denied.');

    res.status(200).json({
      success: true,
      data: {
        ...file.toObject(),
        userRole: access.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    assertAccess(file, req.user.id, canViewFile, 'Access denied.');

    if ((!file.filePath || !fs.existsSync(file.filePath)) && (!file.encryptedData || !file.encryptionIv)) {
      return res.status(404).json({
        success: false,
        message: 'Encrypted file content is missing from storage.'
      });
    }

    file.downloadCount += 1;
    file.lastAccessedAt = new Date();
    await file.save();

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      fileId: file._id,
      patientId: file.patient,
      action: 'download',
      details: `Downloaded "${file.originalName}".`
    });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.size);
    if (file.encryptedData && file.encryptionIv) {
      const decryptedText = decryptTextFromStorage(file.encryptedData, file.encryptionIv);
      res.send(decryptedText);
      return;
    }

    await streamingDecrypt(fs.createReadStream(file.filePath), res);
  } catch (error) {
    next(error);
  }
};

export const shareFile = async (req, res, next) => {
  try {
    const { shareWith, role } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    assertAccess(file, req.user.id, canShareFile, 'Only care-team owners, doctors, or admins can share this file.');

    const users = await User.find({ _id: { $in: shareWith } }, '_id role');
    if (users.length !== shareWith.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more recipients were not found.'
      });
    }

    file.access = file.access.filter((entry) => !shareWith.includes(entry.userId.toString()));
    file.access.push(
      ...users.map((user) => ({
        userId: user._id,
        role: role || user.role,
        grantedAt: new Date(),
        isActive: true
      }))
    );
    await file.save();

    await Promise.all(
      users.map((user) =>
        createAuditEntry({
          req,
          userId: req.user.id,
          actorRole: req.user.role,
          fileId: file._id,
          targetUserId: user._id,
          patientId: file.patient,
          action: 'share',
          details: `Granted ${role || user.role} access to "${file.originalName}".`
        })
      )
    );

    res.status(200).json({
      success: true,
      message: `Shared file with ${users.length} recipient(s).`,
      data: {
        fileId: file._id,
        sharedWith: users.map((user) => user._id),
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    assertAccess(file, req.user.id, canDeleteFile, 'Only owners or admins can delete files.');

    cleanupFile(file.filePath);
    await File.findByIdAndDelete(file._id);

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      fileId: file._id,
      patientId: file.patient,
      action: 'delete',
      details: `Deleted "${file.originalName}".`
    });

    res.status(200).json({
      success: true,
      message: 'Medical file deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const revokeAccess = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    assertAccess(file, req.user.id, canShareFile, 'Only owners, doctors, or admins can revoke access.');

    const accessToRevoke = file.access.find(
      (entry) => entry.userId.toString() === req.body.revokeFrom && entry.isActive
    );

    if (!accessToRevoke) {
      return res.status(404).json({
        success: false,
        message: 'The selected user does not currently have access.'
      });
    }

    accessToRevoke.isActive = false;
    accessToRevoke.revokedAt = new Date();
    await file.save();

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      fileId: file._id,
      targetUserId: accessToRevoke.userId,
      patientId: file.patient,
      action: 'access_revoked',
      details: `Revoked access to "${file.originalName}".`
    });

    res.status(200).json({
      success: true,
      message: 'Access revoked successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const getFileAuditLogs = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).select('_id patient access owner');
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    assertAccess(file, req.user.id, canViewFile, 'Access denied.');

    const logs = await AccessLog.find({ fileId: file._id })
      .populate('userId', 'username email role profile.firstName profile.lastName')
      .populate('targetUserId', 'username email role')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      fileId: file._id,
      patientId: file.patient,
      action: 'audit_view',
      details: 'Viewed file audit history.'
    });

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentAuditActivity = async (req, res, next) => {
  try {
    const accessibleFiles = await File.find(
      {
        'access.userId': req.user.id,
        'access.isActive': true
      },
      '_id'
    ).lean();

    const fileIds = accessibleFiles.map((file) => file._id);
    const logs = await AccessLog.find({ fileId: { $in: fileIds } })
      .populate('fileId', 'originalName category')
      .populate('userId', 'username email role')
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const getFileContentDemo = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).select('originalName encryptedData encryptionIv access patient owner mimeType');
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    assertAccess(file, req.user.id, canViewFile, 'Access denied.');

    if (!file.encryptedData || !file.encryptionIv) {
      return res.status(400).json({
        success: false,
        message: 'This file does not have MongoDB-stored encrypted text content for demo display.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        fileName: file.originalName,
        iv: file.encryptionIv,
        encryptedData: file.encryptedData,
        decryptedData: decryptTextFromStorage(file.encryptedData, file.encryptionIv)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const runReplayProtectionDemo = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).select('originalName access patient');
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found.'
      });
    }

    assertAccess(file, req.user.id, canViewFile, 'Access denied.');

    await createAuditEntry({
      req,
      userId: req.user.id,
      actorRole: req.user.role,
      fileId: file._id,
      patientId: file.patient,
      action: 'security_demo',
      details: 'Executed replay protection simulation.'
    });

    res.status(200).json({
      success: true,
      message: 'Protected request accepted. Reusing this nonce should be blocked as a replay attack.',
      data: {
        fileId: file._id,
        fileName: file.originalName,
        acceptedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFiles = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const files = await File.find({})
      .select('-filePath')
      .populate('owner', 'username email role')
      .populate('uploadedBy', 'username email role')
      .populate('patient', 'username email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await File.countDocuments({});

    res.status(200).json({
      success: true,
      data: files,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadFile,
  getMyFiles,
  getFileDetails,
  downloadFile,
  shareFile,
  deleteFile,
  revokeAccess,
  getFileAuditLogs,
  getRecentAuditActivity,
  getAllFiles,
  getFileContentDemo,
  runReplayProtectionDemo
};
