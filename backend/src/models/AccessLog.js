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
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true
    },
    action: {
      type: String,
      enum: ['upload', 'download', 'share', 'view', 'delete', 'decrypt'],
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
accessLogSchema.index({ action: 1 });

export default mongoose.model('AccessLog', accessLogSchema);
