import { Patient, Doctor, MedicalRecord, Consent } from '../models/HealthcareModels.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Healthcare Controllers
 * Handles patient, doctor, and medical record management
 */

// ============================================================================
// PATIENT CONTROLLER
// ============================================================================

export const registerPatient = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      emergencyContact,
      medicalHistory
    } = req.body;

    // Generate Medical Record Number
    const mrn = `MRN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const patient = new Patient({
      userId,
      mrn,
      dateOfBirth,
      gender,
      bloodType,
      allergies: allergies || [],
      emergencyContact,
      medicalHistory: medicalHistory || {}
    });

    await patient.save();

    // Log to HIPAA compliance
    if (req.hipaaLogger) {
      await req.hipaaLogger.logDataModification(patient._id, 'create', {
        recordId: patient._id,
        changedFields: ['all'],
        reasonForAccess: 'New Patient Registration'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Patient profile created',
      data: {
        patientId: patient._id,
        mrn: patient.mrn
      }
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    next(error);
  }
};

export const getPatientProfile = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check authorization
    const isOwner = patient.userId.toString() === userId;
    const isAuthorizedDoctor = patient.authorizedDoctors?.some(
      ad => ad.doctorId.toString() === userId
    );

    if (!isOwner && !isAuthorizedDoctor) {
      // Log unauthorized access attempt
      if (req.hipaaLogger) {
        await req.hipaaLogger.logUnauthorizedAccessAttempt(
          userId,
          patientId,
          { userRole: req.user.role }
        );
      }

      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to patient record'
      });
    }

    // Log authorized access
    if (req.hipaaLogger) {
      await req.hipaaLogger.logDataAccess(userId, patientId, 'view', {
        recordId: patient._id,
        patientMRN: patient.mrn,
        reasonForAccess: 'Patient Care'
      });
    }

    res.json({
      success: true,
      data: {
        patientId: patient._id,
        mrn: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory
      }
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    next(error);
  }
};

export const updatePatientAuthorization = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { doctorId, permissions } = req.body;
    const userId = req.user.id;

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Only patient can authorize doctors
    if (patient.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only patient can authorizePhysicians'
      });
    }

    // Add or update doctor authorization
    const existingAuth = patient.authorizedDoctors.findIndex(
      ad => ad.doctorId.toString() === doctorId
    );

    if (existingAuth >= 0) {
      patient.authorizedDoctors[existingAuth].permissions = permissions || ['view'];
    } else {
      patient.authorizedDoctors.push({
        doctorId,
        grantedAt: new Date(),
        permissions: permissions || ['view']
      });
    }

    await patient.save();

    // Log authorization change
    if (req.hipaaLogger) {
      await req.hipaaLogger.logAuthorizationChange(
        userId,
        doctorId,
        'grant',
        {
          changedPermissions: permissions,
          reason: 'Patient authorized access'
        }
      );
    }

    res.json({
      success: true,
      message: 'Doctor authorization updated',
      data: {
        patientId: patient._id,
        authorizedDoctors: patient.authorizedDoctors
      }
    });
  } catch (error) {
    console.error('Error updating authorization:', error);
    next(error);
  }
};

export const revokePhysicianAccess = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.params;
    const userId = req.user.id;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Only patient can revoke
    if (patient.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    patient.authorizedDoctors = patient.authorizedDoctors.filter(
      ad => ad.doctorId.toString() !== doctorId
    );

    await patient.save();

    // Log revocation
    if (req.hipaaLogger) {
      await req.hipaaLogger.logAuthorizationChange(
        userId,
        doctorId,
        'revoke',
        { reason: 'Patient revoked access' }
      );
    }

    res.json({
      success: true,
      message: 'Physician access revoked'
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    next(error);
  }
};

// ============================================================================
// DOCTOR CONTROLLER
// ============================================================================

export const registerDoctor = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      licenseNumber,
      specialty,
      hospitalAffiliation,
      department
    } = req.body;

    const doctor = new Doctor({
      userId,
      licenseNumber,
      specialty,
      hospitalAffiliation,
      department,
      credentials: [licenseNumber]
    });

    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor profile created',
      data: {
        doctorId: doctor._id,
        licenseNumber: doctor.licenseNumber,
        specialty: doctor.specialty
      }
    });
  } catch (error) {
    console.error('Error registering doctor:', error);
    next(error);
  }
};

export const getDoctorPatients = async (req, res, next) => {
  try {
    const doctorId = req.user.id;

    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Get all authorized patients
    const patients = await Patient.find({
      'authorizedDoctors.doctorId': doctor._id
    }).select('mrn dateOfBirth gender bloodType allergies');

    res.json({
      success: true,
      data: {
        doctorId: doctor._id,
        specialty: doctor.specialty,
        patientsCount: patients.length,
        patients: patients.map(p => ({
          patientId: p._id,
          mrn: p.mrn,
          bloodType: p.bloodType,
          allergies: p.allergies
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    next(error);
  }
};

// ============================================================================
// MEDICAL RECORD CONTROLLER
// ============================================================================

export const createMedicalRecord = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const fileId = req.body.fileId;
    const {
      patientId,
      recordType,
      recordDate,
      clinicalSummary,
      diagnosis,
      prescription,
      vitals,
      labResults,
      confidentiality = 'CONFIDENTIAL'
    } = req.body;

    // Verify doctor
    const doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Verify patient authorization
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const authorized = patient.authorizedDoctors.some(
      ad => ad.doctorId.toString() === doctor._id.toString()
    );

    if (!authorized) {
      if (req.hipaaLogger) {
        await req.hipaaLogger.logUnauthorizedAccessAttempt(
          doctorId,
          patientId,
          { userRole: 'doctor' }
        );
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized for this patient'
      });
    }

    const record = new MedicalRecord({
      patientId,
      doctorId: doctor._id,
      fileId,
      recordType,
      recordDate,
      clinicalSummary,
      diagnosis: diagnosis || [],
      prescription: prescription || [],
      vitals: vitals || {},
      labResults: labResults || [],
      confidentiality
    });

    await record.save();

    // Log creation
    if (req.hipaaLogger) {
      await req.hipaaLogger.logDataModification(
        doctorId,
        'create',
        {
          recordId: record._id,
          patientId,
          changedFields: ['all'],
          reasonForAccess: `Created ${recordType}`,
          confidentiality
        }
      );
    }

    // Record insider threat detection
    if (req.insiderThreat) {
      await req.insiderThreat.recordAccess(patientId, 'create', {
        department: req.user.department,
        fileSize: req.body.fileSize || 0
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medical record created',
      data: {
        recordId: record._id,
        recordType: record.recordType
      }
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    next(error);
  }
};

export const getMedicalRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check authorization
    const isOwner = patient.userId.toString() === userId;
    const isAuthorized = patient.authorizedDoctors?.some(
      ad => ad.doctorId.toString() === userId
    );

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get records
    const records = await MedicalRecord.find({ patientId })
      .sort({ recordDate: -1 })
      .select('-accessLog'); // Remove access history from response

    // Log access
    if (req.hipaaLogger) {
      await req.hipaaLogger.logDataAccess(
        userId,
        patientId,
        'view',
        {
          recordId: records.map(r => r._id),
          patientMRN: patient.mrn,
          reasonForAccess: 'Patient Care'
        }
      );
    }

    res.json({
      success: true,
      data: {
        patientId,
        recordsCount: records.length,
        records: records.map(r => ({
          recordId: r._id,
          recordType: r.recordType,
          recordDate: r.recordDate,
          confidentiality: r.confidentiality,
          createdBy: r.doctorId
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    next(error);
  }
};

export const getMedicalRecordDetails = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Verify authorization
    const patient = await Patient.findById(record.patientId);
    const isOwner = patient.userId.toString() === userId;
    const isDoctor = record.doctorId.toString() === userId;

    if (!isOwner && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Log access
    if (req.hipaaLogger) {
      await req.hipaaLogger.logDataAccess(
        userId,
        record.patientId,
        'download',
        {
          recordId: record._id,
          confidentiality: record.confidentiality,
          userAgent: req.get('user-agent')
        }
      );
    }

    // Record insider threat detection
    if (req.insiderThreat) {
      await req.insiderThreat.recordAccess(record.patientId, 'download', {
        department: req.user.department
      });
    }

    res.json({
      success: true,
      data: {
        recordId: record._id,
        recordType: record.recordType,
        recordDate: record.recordDate,
        clinicalSummary: record.clinicalSummary,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        vitals: record.vitals,
        labResults: record.labResults,
        confidentiality: record.confidentiality
      }
    });
  } catch (error) {
    console.error('Error fetching record details:', error);
    next(error);
  }
};

// ============================================================================
// CONSENT CONTROLLER
// ============================================================================

export const grantConsent = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;
    const {
      consentType,
      authorizedRecipient,
      purposeOfUse,
      recordTypes
    } = req.body;

    // Only patient can grant consent
    const patient = await Patient.findById(patientId);
    if (!patient || patient.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only patient can grant consent'
      });
    }

    const consent = new Consent({
      consentId: `CONSENT-${uuidv4()}`,
      patientId,
      consentType,
      authorizedRecipient,
      purposeOfUse,
      recordTypes,
      effectiveDate: new Date(),
      signatureDate: new Date(),
      signatureMethod: 'ELECTRONIC',
      status: 'ACTIVE'
    });

    await consent.save();

    // Add to patient consent forms
    patient.consentForms.push(consent.consentId);
    await patient.save();

    // Log consent
    if (req.hipaaLogger) {
      await req.hipaaLogger.logAuthorizationChange(
        userId,
        patientId,
        'grant',
        {
          changedPermissions: recordTypes,
          reason: `Consent granted for ${consentType}`
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Consent granted',
      data: {
        consentId: consent.consentId,
        status: consent.status
      }
    });
  } catch (error) {
    console.error('Error granting consent:', error);
    next(error);
  }
};

export const revokeConsent = async (req, res, next) => {
  try {
    const { consentId } = req.params;
    const userId = req.user.id;

    const consent = await Consent.findOne({ consentId });
    if (!consent) {
      return res.status(404).json({
        success: false,
        message: 'Consent not found'
      });
    }

    // Verify ownership
    const patient = await Patient.findById(consent.patientId);
    if (patient.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    consent.status = 'REVOKED';
    consent.revokedAt = new Date();
    await consent.save();

    // Log revocation
    if (req.hipaaLogger) {
      await req.hipaaLogger.logAuthorizationChange(
        userId,
        consent.authorizedRecipient,
        'revoke',
        {
          reason: `Revoked ${consent.consentType} consent`
        }
      );
    }

    res.json({
      success: true,
      message: 'Consent revoked'
    });
  } catch (error) {
    console.error('Error revoking consent:', error);
    next(error);
  }
};

export default {
  registerPatient,
  getPatientProfile,
  updatePatientAuthorization,
  revokePhysicianAccess,
  registerDoctor,
  getDoctorPatients,
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordDetails,
  grantConsent,
  revokeConsent
};
