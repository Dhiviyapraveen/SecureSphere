import mongoose from 'mongoose';

/**
 * File Schema - Stores metadata about uploaded files
 */
const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    hash: {
      type: String,
      required: true,
      index: true
    },
    encryptionMethod: {
      type: String,
      default: 'aes-256-gcm'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    filePath: {
      type: String,
      default: null
    },
    encryptedData: {
      type: String,
      default: null
    },
    encryptionIv: {
      type: String,
      default: null
    },
    isEncrypted: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ''
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    access: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          enum: ['owner', 'doctor', 'patient', 'admin'],
          default: 'patient'
        },
        grantedAt: {
          type: Date,
          default: Date.now
        },
        revokedAt: {
          type: Date,
          default: null
        },
        isActive: {
          type: Boolean,
          default: true
        }
      }
    ],
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    category: {
      type: String,
      enum: ['report', 'prescription', 'scan', 'lab-result', 'other'],
      default: 'other'
    },
    recordType: {
      type: String,
      enum: ['prescription', 'report', 'scan', 'lab-result', 'diagnosis', 'other'],
      default: 'report'
    },
    disease: {
      type: String,
      default: ''
    },
    clientEncryptedText: {
      type: String,
      default: null
    },
    clientEncryptionEnabled: {
      type: Boolean,
      default: false
    },
    clientEncryptionHint: {
      type: String,
      default: ''
    },
    uploadMethod: {
      type: String,
      enum: ['single', 'chunked'],
      default: 'single'
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for faster queries
fileSchema.index({ owner: 1, createdAt: -1 });
fileSchema.index({ patient: 1, createdAt: -1 });
fileSchema.index({ hash: 1 });
fileSchema.index({ 'access.userId': 1 });

export default mongoose.model('File', fileSchema);
