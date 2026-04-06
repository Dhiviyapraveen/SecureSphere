import File from '../models/File.js';
import AccessLog from '../models/AccessLog.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encryptFile, decryptFile } from '../services/encryptionService.js';
import { hashFileSHA256 } from '../services/hashingService.js';
import {
  canViewFile,
  canDeleteFile,
  canShareFile,
  ROLES,
  createAccessEntry
} from '../services/accessControlService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

/**
 * File Controller - Handles file operations (upload, download, delete, share)
 */

/**
 * Upload file
 * POST /api/files/upload
 */
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }
    
    const { description = '', tags = '' } = req.body;
    const userId = req.user.id;
    
    // Read file content
    let fileContent = fs.readFileSync(req.file.path);
    
    // Compute file hash before encryption
    const fileHash = hashFileSHA256(fileContent);
    
    // Encrypt file
    const encryptedContent = encryptFile(fileContent);
    
    // Write encrypted file back
    fs.writeFileSync(req.file.path, encryptedContent);
    
    // Create file document in database
    const file = new File({
      name: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      hash: fileHash,
      owner: userId,
      filePath: req.file.path,
      isEncrypted: true,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      access: [createAccessEntry(userId, null, ROLES.OWNER)]
    });
    
    await file.save();
    
    // Log access
    const accessLog = new AccessLog({
      userId,
      fileId: file._id,
      action: 'upload',
      status: 'success',
      details: `File "${file.originalName}" uploaded`
    });
    await accessLog.save();
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: file._id,
        fileName: file.originalName,
        size: file.size,
        uploadedAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('Upload failed:', error);
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Get all files accessible by user
 * GET /api/files
 */
export const getMyFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    // Find all files where user has access
    const files = await File.find({
      'access.userId': userId,
      'access.isActive': true
    })
      .select('-filePath')
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count
    const total = await File.countDocuments({
      'access.userId': userId,
      'access.isActive': true
    });
    
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

/**
 * Get file details
 * GET /api/files/:id
 */
export const getFileDetails = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;
    
    const file = await File.findById(fileId).populate('owner', 'username email');
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check access
    const userAccess = file.access.find(
      a => a.userId.toString() === userId && a.isActive
    );
    
    if (!userAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const fileCopy = file.toObject();
    delete fileCopy.filePath;
    
    res.status(200).json({
      success: true,
      data: {
        ...fileCopy,
        userRole: userAccess.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download file (encrypted)
 * GET /api/files/:id/download
 */
export const downloadFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check access
    const userAccess = file.access.find(
      a => a.userId.toString() === userId && a.isActive
    );
    
    if (!userAccess || !canViewFile(userAccess, userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Read encrypted file
    const encryptedContent = fs.readFileSync(file.filePath);
    
    // Decrypt file
    const decryptedContent = decryptFile(encryptedContent);
    
    // Update download count and last accessed time
    file.downloadCount += 1;
    file.lastAccessedAt = new Date();
    await file.save();
    
    // Log access
    const accessLog = new AccessLog({
      userId,
      fileId,
      action: 'download',
      status: 'success'
    });
    await accessLog.save();
    
    // Send file
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`
    );
    res.send(decryptedContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Share file with other users
 * POST /api/files/:id/share
 */
export const shareFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;
    const { shareWith, role } = req.body;
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check if user is owner
    const userAccess = file.access.find(
      a => a.userId.toString() === userId && a.isActive
    );
    
    if (!userAccess || !canShareFile(userAccess, userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only file owner can share'
      });
    }
    
    // Verify all user IDs exist
    const users = await User.find({ _id: { $in: shareWith } });
    if (users.length !== shareWith.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more users not found'
      });
    }
    
    // Add access for each user
    const newAccess = shareWith.map(uid => ({
      userId: uid,
      role,
      grantedAt: new Date(),
      isActive: true
    }));
    
    // Remove existing access first to avoid duplicates
    file.access = file.access.filter(
      a => !shareWith.includes(a.userId.toString())
    );
    
    // Add new access entries
    file.access.push(...newAccess);
    await file.save();
    
    // Log access
    const accessLog = new AccessLog({
      userId,
      fileId,
      action: 'share',
      status: 'success',
      details: `Shared with ${shareWith.length} user(s)`
    });
    await accessLog.save();
    
    res.status(200).json({
      success: true,
      message: `File shared with ${shareWith.length} user(s)`,
      data: {
        fileId,
        sharedWith: shareWith,
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
export const deleteFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check if user is owner
    const userAccess = file.access.find(
      a => a.userId.toString() === userId && a.isActive
    );
    
    if (!userAccess || !canDeleteFile(userAccess, userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only file owner can delete'
      });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }
    
    // Delete from database
    await File.findByIdAndDelete(fileId);
    
    // Log access
    const accessLog = new AccessLog({
      userId,
      fileId,
      action: 'delete',
      status: 'success'
    });
    await accessLog.save();
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke file access from user
 * POST /api/files/:id/revoke
 */
export const revokeAccess = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;
    const { revokeFrom } = req.body;
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check if user is owner
    const userAccess = file.access.find(
      a => a.userId.toString() === userId && a.isActive
    );
    
    if (!userAccess || !canShareFile(userAccess, userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only file owner can revoke access'
      });
    }
    
    // Revoke access
    const accessToRevoke = file.access.find(
      a => a.userId.toString() === revokeFrom && a.isActive
    );
    
    if (!accessToRevoke) {
      return res.status(404).json({
        success: false,
        message: 'User does not have access to this file'
      });
    }
    
    accessToRevoke.isActive = false;
    accessToRevoke.revokedAt = new Date();
    await file.save();
    
    res.status(200).json({
      success: true,
      message: 'Access revoked successfully'
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
  revokeAccess
};
