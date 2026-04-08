import { authorizeRoles } from './authMiddleware.js';

export const requirePatient = authorizeRoles('patient');
export const requireDoctor = authorizeRoles('doctor');
export const requireAdmin = authorizeRoles('admin');
export const requireDoctorOrAdmin = authorizeRoles('doctor', 'admin');
export const requirePatientOrDoctor = authorizeRoles('patient', 'doctor');

export default {
  requirePatient,
  requireDoctor,
  requireAdmin,
  requireDoctorOrAdmin,
  requirePatientOrDoctor
};
