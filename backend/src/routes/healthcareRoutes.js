import express from 'express';
import * as healthcareController from '../controllers/healthcareController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { hipaaComplianceMiddleware } from '../middleware/hipaaComplianceMiddleware.js';
import { insiderThreatMiddleware } from '../middleware/insiderThreatMiddleware.js';
import { body, param } from 'express-validator';

const router = express.Router();

/**
 * Healthcare Routes
 * All routes protected with JWT, HIPAA compliance logging, and insider threat detection
 */

// Apply security middleware to all routes
router.use(authMiddleware);
router.use(hipaaComplianceMiddleware);
router.use(insiderThreatMiddleware);

// ============================================================================
// PATIENT ROUTES
// ============================================================================

/**
 * POST /api/healthcare/patient/register
 * Register patient profile
 */
router.post(
  '/patient/register',
  [
    body('dateOfBirth').isISO8601(),
    body('gender').isIn(['M', 'F', 'Other']),
    body('bloodType').isIn(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']),
    body('allergies').optional().isArray(),
    body('emergencyContact').optional().isObject(),
    body('medicalHistory').optional().isObject()
  ],
  healthcareController.registerPatient
);

/**
 * GET /api/healthcare/patient/:patientId
 * Get patient profile (protected - only patient or authorized doctor)
 */
router.get(
  '/patient/:patientId',
  [param('patientId').isMongoId()],
  healthcareController.getPatientProfile
);

/**
 * POST /api/healthcare/patient/:patientId/authorize-doctor
 * Authorize doctor to access patient records
 */
router.post(
  '/patient/:patientId/authorize-doctor',
  [
    param('patientId').isMongoId(),
    body('doctorId').isMongoId(),
    body('permissions').isArray().optional()
  ],
  healthcareController.updatePatientAuthorization
);

/**
 * DELETE /api/healthcare/patient/:patientId/revoke/:doctorId
 * Revoke doctor access to patient records
 */
router.delete(
  '/patient/:patientId/revoke/:doctorId',
  [
    param('patientId').isMongoId(),
    param('doctorId').isMongoId()
  ],
  healthcareController.revokePhysicianAccess
);

// ============================================================================
// DOCTOR ROUTES
// ============================================================================

/**
 * POST /api/healthcare/doctor/register
 * Register doctor profile
 */
router.post(
  '/doctor/register',
  [
    body('licenseNumber').notEmpty().isString(),
    body('specialty').isIn(['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'General', 'Other']),
    body('hospitalAffiliation').optional().isString(),
    body('department').optional().isString()
  ],
  healthcareController.registerDoctor
);

/**
 * GET /api/healthcare/doctor/patients
 * Get all patients assigned to doctor
 */
router.get(
  '/doctor/patients',
  healthcareController.getDoctorPatients
);

// ============================================================================
// MEDICAL RECORD ROUTES
// ============================================================================

/**
 * POST /api/healthcare/medical-record/create
 * Create medical record (after file upload)
 */
router.post(
  '/medical-record/create',
  [
    body('patientId').isMongoId(),
    body('fileId').isMongoId(),
    body('recordType').isIn(['Lab Result', 'Imaging', 'Prescription', 'Diagnosis', 'Treatment Plan', 'Progress Note', 'Other']),
    body('recordDate').isISO8601(),
    body('confidentiality').isIn(['PUBLIC', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL']).optional(),
    body('diagnosis').isArray().optional(),
    body('prescription').isArray().optional(),
    body('vitals').isObject().optional(),
    body('labResults').isArray().optional()
  ],
  healthcareController.createMedicalRecord
);

/**
 * GET /api/healthcare/medical-records/:patientId
 * Get all medical records for patient (with pagination)
 */
router.get(
  '/medical-records/:patientId',
  [param('patientId').isMongoId()],
  healthcareController.getMedicalRecords
);

/**
 * GET /api/healthcare/medical-record/:recordId
 * Get detailed medical record
 */
router.get(
  '/medical-record/:recordId',
  [param('recordId').isMongoId()],
  healthcareController.getMedicalRecordDetails
);

// ============================================================================
// CONSENT & AUTHORIZATION ROUTES
// ============================================================================

/**
 * POST /api/healthcare/patient/:patientId/consent/grant
 * Grant consent for data usage
 */
router.post(
  '/patient/:patientId/consent/grant',
  [
    param('patientId').isMongoId(),
    body('consentType').isIn(['Treatment', 'Payment', 'Operations', 'Marketing', 'Research', 'Psychotherapy']),
    body('authorizedRecipient').notEmpty().isString(),
    body('purposeOfUse').notEmpty().isString(),
    body('recordTypes').isArray()
  ],
  healthcareController.grantConsent
);

/**
 * DELETE /api/healthcare/consent/:consentId/revoke
 * Revoke consent
 */
router.delete(
  '/consent/:consentId/revoke',
  [param('consentId').notEmpty().isString()],
  healthcareController.revokeConsent
);

export default router;
