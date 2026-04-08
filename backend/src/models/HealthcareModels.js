import mongoose from 'mongoose';

/**
 * Healthcare Models for Telemedicine
 * HIPAA compliant patient, doctor, medical records, and compliance logging
 */

// ============================================================================
// PATIENT MODEL
// ============================================================================
const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  mrn: { // Medical Record Number
    type: String,
    unique: true,
    sparse: true,
    required: true,
    index: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'Other'],
    required: true
  },
  bloodType: {
    type: String,
    enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    required: true
  },
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalHistory: {
    conditions: [String],
    medications: [String],
    surgeries: [String],
    lastPhysicalDate: Date
  },
  insuranceProvider: String,
  insurancePolicyNumber: {
    type: String,
    select: false // Sensitive - require explicit selection
  },
  authorizedDoctors: [{
    doctorId: mongoose.Schema.Types.ObjectId,
    grantedAt: Date,
    permissions: {
      type: [String],
      enum: ['view', 'edit', 'download', 'share'],
      default: ['view']
    }
  }],
  consentForms: [{
    type: String,
    signedAt: Date,
    expiresAt: Date
  }],
  dataAccessLog: [{
    accessedBy: mongoose.Schema.Types.ObjectId,
    accessedAt: Date,
    action: String,
    ipAddress: String,
    reason: String // Why they accessed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'patients'
});

// Index for faster queries
patientSchema.index({ mrn: 1 });
patientSchema.index({ userId: 1 });

// ============================================================================
// DOCTOR MODEL
// ============================================================================
const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  specialty: {
    type: String,
    enum: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'General', 'Other'],
    required: true
  },
  hospitalAffiliation: String,
  npi: { // National Provider Identifier
    type: String,
    unique: true,
    sparse: true,
    select: false
  },
  department: String,
  patients: [{
    patientId: mongoose.Schema.Types.ObjectId,
    addedAt: Date
  }],
  credentials: [{
    type: String,
    verifiedAt: Date
  }],
  accessLog: [{
    patientId: mongoose.Schema.Types.ObjectId,
    accessedAt: Date,
    action: String,
    ipAddress: String,
    fileId: mongoose.Schema.Types.ObjectId
  }],
  suspiciousActivityLog: [{
    timestamp: Date,
    activity: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    details: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'doctors'
});

doctorSchema.index({ licenseNumber: 1 });
doctorSchema.index({ userId: 1 });

// ============================================================================
// MEDICAL RECORD MODEL
// ============================================================================
const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  recordType: {
    type: String,
    enum: ['Lab Result', 'Imaging', 'Prescription', 'Diagnosis', 'Treatment Plan', 'Progress Note', 'Other'],
    required: true
  },
  recordDate: {
    type: Date,
    required: true
  },
  clinicalSummary: String,
  diagnosis: [String],
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  vitals: {
    temperature: Number,
    bloodPressure: String,
    heartRate: Number,
    respiratoryRate: Number
  },
  labResults: [{
    testName: String,
    value: String,
    normalRange: String,
    abnormal: Boolean
  }],
  imagingFindings: String,
  assessmentAndPlan: String,
  followUpRequired: Boolean,
  followUpDate: Date,
  confidentiality: {
    type: String,
    enum: ['PUBLIC', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL'],
    default: 'CONFIDENTIAL'
  },
  accessLog: [{
    accessedBy: mongoose.Schema.Types.ObjectId,
    accessedAt: Date,
    accessType: {
      type: String,
      enum: ['view', 'download', 'print', 'share'],
      required: true
    },
    ipAddress: String,
    userAgent: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'medicalRecords'
});

medicalRecordSchema.index({ patientId: 1, recordDate: -1 });
medicalRecordSchema.index({ doctorId: 1 });

// ============================================================================
// COMPLIANCE LOG MODEL (HIPAA)
// ============================================================================
const complianceLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  eventType: {
    type: String,
    enum: [
      'DATA_ACCESS',
      'DATA_MODIFICATION',
      'DATA_DELETION',
      'DATA_EXPORT',
      'AUTHENTICATION',
      'AUTHORIZATION_CHANGE',
      'SECURITY_INCIDENT',
      'AUDIT_LOG_ACCESS',
      'INSIDER_THREAT_DETECTED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'BULK_EXPORT',
      'ABNORMAL_ACCESS_PATTERN'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'ALERT', 'CRITICAL'],
    default: 'INFO',
    index: true
  },
  actor: {
    userId: mongoose.Schema.Types.ObjectId,
    role: String, // 'doctor', 'patient', 'admin', 'system'
    email: String
  },
  subject: {
    patientId: mongoose.Schema.Types.ObjectId,
    patientMRN: String,
    recordId: mongoose.Schema.Types.ObjectId,
    fileId: mongoose.Schema.Types.ObjectId
  },
  action: {
    type: String,
    description: String
  },
  result: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PARTIAL', 'BLOCKED'],
    default: 'SUCCESS'
  },
  reasonForAccess: String,
  ipAddress: String,
  userAgent: String,
  location: {
    city: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  suspiciousIndicators: [String], // e.g., ['unusual_time', 'bulk_access', 'unusual_location']
  encryptionUsed: Boolean,
  dataClassification: {
    type: String,
    enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL']
  },
  detailedLog: mongoose.Schema.Types.Mixed, // Flexible storage for detailed event info
  remediationActions: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'complianceLogs'
});

complianceLogSchema.index({ eventId: 1 });
complianceLogSchema.index({ timestamp: -1 });
complianceLogSchema.index({ eventType: 1 });
complianceLogSchema.index({ 'actor.userId': 1 });
complianceLogSchema.index({ 'subject.patientId': 1 });
complianceLogSchema.index({ severity: 1 });

// ============================================================================
// CONSENT MODEL (HIPAA Authorization)
// ============================================================================
const consentSchema = new mongoose.Schema({
  consentId: {
    type: String,
    unique: true,
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  consentType: {
    type: String,
    enum: ['Treatment', 'Payment', 'Operations', 'Marketing', 'Research', 'Psychotherapy'],
    required: true
  },
  authorizedRecipient: {
    type: String,
    required: true
  },
  purposeOfUse: {
    type: String,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expirationDate: Date,
  recordTypes: [String], // Types of records covered: 'Lab Results', 'Imaging', etc.
  status: {
    type: String,
    enum: ['ACTIVE', 'REVOKED', 'EXPIRED', 'PENDING'],
    default: 'ACTIVE'
  },
  signatureDate: Date,
  signatureMethod: {
    type: String,
    enum: ['ELECTRONIC', 'WRITTEN']
  },
  revokedAt: Date,
  revokedReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'consents'
});

consentSchema.index({ patientId: 1 });
consentSchema.index({ status: 1 });

// ============================================================================
// INSIDER THREAT LOG MODEL
// ============================================================================
const insiderThreatLogSchema = new mongoose.Schema({
  threatId: {
    type: String,
    unique: true,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  suspectedUser: {
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    role: String, // 'doctor', 'admin', etc.
    department: String
  },
  threatType: {
    type: String,
    enum: [
      'EXCESSIVE_ACCESS',
      'UNAUTHORIZED_ACCESS',
      'BULK_EXTRACTION',
      'ABNORMAL_HOURS',
      'GEO_ANOMALY',
      'PRIVILEGE_ABUSE',
      'DATA_EXFILTRATION',
      'CREDENTIAL_MISUSE',
      'UNAUTHORIZED_SHARING',
      'SUSPICIOUS_DOWNLOAD'
    ],
    required: true,
    index: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  indicators: [{
    description: String,
    count: Number,
    timeline: String
  }],
  affectedPatients: [{
    patientId: mongoose.Schema.Types.ObjectId,
    recordsAccessed: Number,
    accessedAt: Date
  }],
  actionTaken: {
    type: String,
    enum: ['REPORTED', 'INVESTIGATED', 'ESCALATED', 'REMEDIATED', 'DISMISSED']
  },
  investigationNotes: String,
  status: {
    type: String,
    enum: ['PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'RESOLVED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'insiderThreats'
});

insiderThreatLogSchema.index({ threatId: 1 });
insiderThreatLogSchema.index({ 'suspectedUser.userId': 1 });
insiderThreatLogSchema.index({ threatType: 1 });

// ============================================================================
// EXPORT MODELS
// ============================================================================
export const Patient = mongoose.model('Patient', patientSchema);
export const Doctor = mongoose.model('Doctor', doctorSchema);
export const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export const ComplianceLog = mongoose.model('ComplianceLog', complianceLogSchema);
export const Consent = mongoose.model('Consent', consentSchema);
export const InsiderThreatLog = mongoose.model('InsiderThreatLog', insiderThreatLogSchema);

export default {
  Patient,
  Doctor,
  MedicalRecord,
  ComplianceLog,
  Consent,
  InsiderThreatLog
};
