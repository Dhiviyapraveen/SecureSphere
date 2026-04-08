import mongoose from 'mongoose';

/**
 * AccessLog Schema - Audit trail for file access and operations
 */
const accessLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorRole: {
      type: String,
      enum: ['doctor', 'patient', 'admin', 'system'],
      default: null
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    action: {
      type: String,
      enum: [
        'upload',
        'upload_initiated',
        'chunk_uploaded',
        'chunked_upload_completed',
        'download',
        'share',
        'view',
        'delete',
        'decrypt',
        'audit_view',
        'access_revoked',
        'upload_cancelled',
        'login',
        'logout'
      ],
      required: true
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    route: {
      type: String,
      default: null
    },
    method: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'error'],
      default: 'success'
    },
    details: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

// Index for efficient queries
accessLogSchema.index({ userId: 1, timestamp: -1 });
accessLogSchema.index({ fileId: 1, timestamp: -1 });
accessLogSchema.index({ patientId: 1, timestamp: -1 });
accessLogSchema.index({ action: 1 });

export default mongoose.model('AccessLog', accessLogSchema);
