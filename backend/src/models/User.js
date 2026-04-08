import mongoose from 'mongoose';
import { hashPassword } from '../services/hashingService.js';

/**
 * User Schema - Stores user authentication data and profile
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /.+\@.+\..+/
    },
    role: {
      type: String,
      enum: ['doctor', 'patient', 'admin'],
      default: 'patient',
      required: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    profile: {
      firstName: {
        type: String,
        trim: true
      },
      lastName: {
        type: String,
        trim: true
      },
      department: {
        type: String,
        trim: true
      },
      patientId: {
        type: String,
        trim: true
      },
      avatar: {
        type: String,
        default: null
      }
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'dark'
      },
      twoFactorEnabled: {
        type: Boolean,
        default: false
      }
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

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
