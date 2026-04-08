# SecureSphere Telemedicine - Integration & Usage Guide

## Table of Contents
1. [Frontend Integration](#frontend-integration)
2. [API Endpoints Overview](#api-endpoints-overview)
3. [User Workflows](#user-workflows)
4. [Security Best Practices](#security-best-practices)
5. [Testing Guide](#testing-guide)
6. [Troubleshooting](#troubleshooting)

---

## Frontend Integration

### Routing Setup

Add the new telemedicine routes to your React Router configuration:

```jsx
// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Existing routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* New healthcare routes */}
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          
          {/* Other pages */}
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### User Type Detection

Enhance the AuthContext to detect user type and show appropriate dashboard:

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'PATIENT' or 'DOCTOR'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken();
    }
    setLoading(false);
  }, []);

  const verifyToken = async () => {
    try {
      const response = await apiService.get('/auth/verify');
      setUser(response.data.user);
      
      // Detect user type based on user record
      if (response.data.user.role === 'DOCTOR') {
        setUserType('DOCTOR');
      } else if (response.data.user.role === 'PATIENT') {
        setUserType('PATIENT');
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      
      if (response.data.user.role === 'DOCTOR') {
        setUserType('DOCTOR');
      } else {
        setUserType('PATIENT');
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.post('/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setUserType(userData.role);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, userType, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Navigation Component Update

Update Navbar to show role-based navigation:

```jsx
// src/components/Navbar.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { userType, logout } = useAuth();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (userType === 'DOCTOR') {
      navigate('/doctor-dashboard');
    } else if (userType === 'PATIENT') {
      navigate('/patient-dashboard');
    }
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
          🏥 SecureSphere Telemedicine
        </div>
        
        <div className="flex gap-4">
          {userType && (
            <>
              <button
                onClick={handleDashboardClick}
                className="px-4 py-2 bg-white rounded-lg text-indigo-600 font-medium hover:bg-indigo-50"
              >
                Dashboard
              </button>
              <span className="text-white text-sm">
                ({userType === 'DOCTOR' ? '👨‍⚕️ Doctor' : '🧑‍🤝‍🧑 Patient'})
              </span>
            </>
          )}
          
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

---

## API Endpoints Overview

### Healthcare Endpoints

#### Patient Management

**Register Patient**
```
POST /api/healthcare/patient/register
Headers: Authorization: Bearer <token>

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "dob": "1980-05-15",
  "gender": "M",
  "bloodType": "O+",
  "allergies": ["Penicillin", "Peanuts"],
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567890",
    "relationship": "Spouse"
  },
  "medicalHistory": ["Hypertension", "Type 2 Diabetes"]
}

Response:
{
  "success": true,
  "patient": {
    "_id": "...",
    "mrn": "MRN-20240115-001",
    "name": "John Doe",
    ...
  }
}
```

**Get Patient Profile**
```
GET /api/healthcare/patient/:patientId
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "patient": {
    "_id": "...",
    "mrn": "...",
    "name": "...",
    "authorizedDoctors": [
      {
        "_id": "...",
        "name": "Dr. Smith",
        "specialty": "Cardiology",
        "permissions": ["view", "edit", "download"],
        "authorizedDate": "2024-01-15T10:30:00Z"
      }
    ],
    "consentForms": [...],
    "medicalHistory": [...]
  }
}
```

**Authorize Doctor**
```
POST /api/healthcare/patient/:patientId/authorize-doctor
Headers: Authorization: Bearer <token>

Request Body:
{
  "doctorId": "doctor-uuid",
  "permissions": ["view", "download"]  // Can include: view, edit, download, share
}

Response:
{
  "success": true,
  "message": "Doctor authorized successfully",
  "authorization": {
    "doctorId": "...",
    "permissions": ["view", "download"],
    "authorizedDate": "2024-01-15T10:35:00Z"
  }
}
```

**Revoke Doctor Access**
```
DELETE /api/healthcare/patient/:patientId/revoke/:doctorId
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Doctor access revoked successfully"
}
```

---

#### Doctor Management

**Register Doctor**
```
POST /api/healthcare/doctor/register
Headers: Authorization: Bearer <token>

Request Body:
{
  "name": "Dr. Sarah Smith",
  "email": "sarah@hospital.com",
  "licenseNumber": "MD-12345",
  "specialty": "Cardiology",
  "hospitalAffiliation": "St. Mary's Hospital",
  "department": "Cardiology Department",
  "npi": "1234567890"
}

Response:
{
  "success": true,
  "doctor": {
    "_id": "...",
    "name": "Dr. Sarah Smith",
    "licenseNumber": "MD-12345",
    ...
  }
}
```

**Get Doctor's Patients**
```
GET /api/healthcare/doctor/patients
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 25,
  "patients": [
    {
      "_id": "...",
      "name": "John Doe",
      "mrn": "MRN-20240115-001",
      "bloodType": "O+",
      "allergies": ["Penicillin"],
      "authorizedDate": "2024-01-10T00:00:00Z"
    }
  ]
}
```

---

#### Medical Records

**Create Medical Record**
```
POST /api/healthcare/medical-record/create
Headers: Authorization: Bearer <token>

Request Body:
{
  "patientId": "patient-uuid",
  "fileId": "file-uuid",  // Upload file first, get fileId
  "recordType": "Lab Result",  // Or: Imaging, Prescription, Diagnosis, Treatment Plan, Progress Note
  "recordDate": "2024-01-15",
  "diagnosis": "Type 2 Diabetes Mellitus",
  "prescription": "Metformin 500mg twice daily",
  "vitals": {
    "temperature": 36.5,
    "systolic": 120,
    "diastolic": 80,
    "heartRate": 72,
    "respiratoryRate": 16
  },
  "labResults": "Fasting glucose: 150 mg/dL",
  "confidentialityLevel": "High"  // Or: Medium, Low
}

Response:
{
  "success": true,
  "record": {
    "_id": "...",
    "patientId": "...",
    "recordType": "Lab Result",
    "recordDate": "2024-01-15T00:00:00Z",
    ...
  }
}
```

**Get Patient's Medical Records**
```
GET /api/healthcare/medical-records/:patientId?page=1&limit=10
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "total": 42,
  "page": 1,
  "records": [
    {
      "_id": "...",
      "recordType": "Lab Result",
      "recordDate": "2024-01-15",
      "diagnosis": "Type 2 Diabetes Mellitus",
      "confidentialityLevel": "High",
      "accessLog": [
        {
          "userId": "...",
          "action": "view",
          "timestamp": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

**Get Medical Record Details**
```
GET /api/healthcare/medical-record/:recordId
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "record": {
    "_id": "...",
    "patientId": "...",
    "doctorId": "...",
    "recordType": "Lab Result",
    "recordDate": "2024-01-15",
    "diagnosis": "Type 2 Diabetes Mellitus",
    "prescription": "Metformin 500mg twice daily",
    "vitals": {...},
    "labResults": "Fasting glucose: 150 mg/dL",
    "imagingFindings": null,
    "confidentialityLevel": "High",
    "encryptionStatus": "encrypted",
    "accessLog": [...]
  }
}
```

---

#### Consent Management

**Grant Consent**
```
POST /api/healthcare/patient/:patientId/consent/grant
Headers: Authorization: Bearer <token>

Request Body:
{
  "type": "Treatment",  // Can be: Treatment, Payment, Operations, Marketing, Research, Psychotherapy
  "authorizedRecipient": "Dr. Sarah Smith",
  "purpose": "Treatment of diabetes",
  "recordTypes": ["Lab Result", "Prescription", "Diagnosis"],
  "expirationDate": "2025-01-15"
}

Response:
{
  "success": true,
  "consent": {
    "_id": "...",
    "type": "Treatment",
    "authorizedRecipient": "Dr. Sarah Smith",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:40:00Z",
    "expirationDate": "2025-01-15"
  }
}
```

**Revoke Consent**
```
DELETE /api/healthcare/consent/:consentId/revoke
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Consent revoked successfully",
  "consent": {
    "_id": "...",
    "status": "REVOKED",
    "revokedDate": "2024-01-15T10:45:00Z"
  }
}
```

---

## User Workflows

### Workflow 1: Patient Registration & Doctor Authorization

```
1. Patient Registration
   └─ POST /auth/register → Register patient account
   └─ POST /healthcare/patient/register → Create patient profile with MRN

2. Doctor Authorization Setup
   └─ Patient receives unique Doctor ID (e.g., via email/portal)
   └─ Patient calls: POST /healthcare/patient/:patientId/authorize-doctor
   │  ├─ doctorId: UUID provided by doctor
   │  └─ permissions: ["view", "download"]
   └─ Doctor immediately sees patient in their patient list

3. First Access
   └─ Doctor views: GET /healthcare/doctor/patients
   └─ Doctor selects patient and calls: GET /healthcare/medical-records/:patientId
   └─ System logs HIPAA audit: DATA_ACCESS event
   └─ System triggers: Insider threat detection
```

### Workflow 2: Patient Uploads Medical Records

```
1. Consent Grant (if needed)
   └─ Patient grants consent to doctor: POST /healthcare/patient/:patientId/consent/grant
   │  ├─ type: "Treatment"
   │  ├─ authorizedRecipient: "Dr. Smith"
   │  └─ recordTypes: ["Lab Result", "Imaging"]
   └─ Compliance Log: AUTHORIZATION_CHANGE event

2. File Upload via Existing Flow
   └─ Patient uploads encrypted file (uses existing chunked upload)
   └─ Receives fileId in response

3. Medical Record Creation
   └─ Patient (or doctor) creates record: POST /healthcare/medical-record/create
   │  ├─ patientId: Patient UUID
   │  ├─ fileId: From upload step
   │  ├─ recordType: "Lab Result"
   │  └─ diagnosis: "Type 2 Diabetes Mellitus"
   └─ System actions:
      ├─ Logs: HIPAA MODIFICATION event
      ├─ Checks: Patient consent for this record type
      ├─ Detects: Insider threat patterns on doctor
      └─ Encrypts: File with AES-256-GCM per record

4. Doctor Views Record
   └─ Doctor calls: GET /healthcare/medical-record/:recordId
   └─ System verifies:
      ├─ Doctor is authorized by patient
      ├─ Doctor has "view" permission
      └─ Consent covers this record type
   └─ Logs: DATA_ACCESS event with access details
```

### Workflow 3: Insider Threat Detection Scenario

```
Scenario: Doctor attempts unauthorized data extraction

Timeline:
├─ T+0s: Doctor accesses 60 records in succession
│         └─ insiderThreatMiddleware detects: excessive_access pattern
│
├─ T+5s: Risk score calculation
│         ├─ excessive_access: 30 points
│         ├─ rapid_pattern: 40 points
│         ├─ abnormal_hours: 35 points (3 AM access)
│         └─ Total Risk: 70 points (RED - High Risk)
│
├─ T+6s: System response
│         ├─ Logs: InsiderThreatLog entry (status: PENDING, risk: 70)
│         ├─ Logs: ComplianceLog INSIDER_THREAT_DETECTED event
│         ├─ Alert: Security team notified
│         └─ Action: Account marked for review
│
├─ T+1m: Security team investigation
│         └─ Reviews threat details and access patterns
│
└─ T+15m: Final action
           ├─ Threat confirmed as unauthorized
           ├─ Account suspended
           ├─ Compliance logs preserved for evidence
           └─ Affected patient notified
```

---

## Security Best Practices

### For Patients

```javascript
1. Authorization Management
   ✅ Regularly review authorized doctors (Dashboard → Authorized Doctors)
   ✅ Revoke access when doctor relationship ends
   ✅ Use minimal permissions (e.g., "view" only for specialists)
   ✅ Set consent expiration dates (not indefinite)

2. Consent Forms
   ✅ Grant specific consent types matching purpose
   ✅ Limit record types visible to each recipient
   ✅ Review consent forms monthly
   ✅ Revoke research/marketing consents if unused

3. Data Security
   ✅ Use strong password (12+ chars, mixed case, numbers, symbols)
   ✅ Enable 2FA if available
   ✅ Don't share login credentials
   ✅ Log out on shared devices
   ✅ Report suspicious access immediately
```

### For Doctors

```javascript
1. Access Discipline
   ✅ Only access records for patients you're treating
   ✅ Don't bulk download all records at once
   ✅ Download only needed information
   ✅ Access during normal business hours
   ✅ Document access reason in notes

2. Data Handling
   ✅ Encrypt personal devices before accessing records
   ✅ Use hospital VPN for remote access
   ✅ Never store patient data locally long-term
   ✅ Delete cache after viewing sensitive records
   ✅ Report lost/stolen devices immediately

3. Compliance
   ✅ Understand HIPAA minimum necessary rule
   ✅ Log access reasons in medical record
   ✅ Follow hospital data sharing policies
   ✅ Complete annual HIPAA training
   ✅ Report suspicious access by colleagues
```

### Administrators

```javascript
1. Monitoring
   ✅ Review insider threat logs daily
   ✅ Investigate accounts with risk score > 60
   ✅ Monitor failed authentication patterns
   ✅ Check unauthorized access attempts
   ✅ Audit encryption key usage

2. Maintenance
   ✅ Verify HIPAA compliance log retention (6 years)
   ✅ Test data recovery procedures monthly
   ✅ Rotate encryption keys every 90 days
   ✅ Update security patches within 7 days
   ✅ Archive compliance logs annually

3. Compliance
   ✅ Run quarterly HIPAA compliance audits
   ✅ Generate compliance reports for insurance
   ✅ Document all security incidents
   ✅ Maintain access control matrix
   ✅ Review and update security policies annually
```

---

## Testing Guide

### Unit Tests Example

```javascript
// tests/healthcare.test.js
import { describe, it, expect, beforeEach } from '@jest/globals';
import apiService from '../services/apiService';
import * as encryptionService from '../services/encryptionService';

describe('Healthcare Features', () => {
  let patientId, doctorId, recordId;

  beforeEach(async () => {
    // Setup test data
    const patient = await apiService.post('/healthcare/patient/register', {
      name: 'Test Patient',
      email: 'patient@test.com',
      dob: '1990-01-01',
      gender: 'M',
      bloodType: 'O+'
    });
    patientId = patient.data.patient._id;
  });

  describe('Patient Management', () => {
    it('should create a patient with valid MRN', async () => {
      const response = await apiService.get(`/healthcare/patient/${patientId}`);
      expect(response.data.patient.mrn).toMatch(/^MRN-/);
      expect(response.status).toBe(200);
    });

    it('should not allow unauthorized doctor to view patient', async () => {
      try {
        await apiService.get(`/healthcare/patient/${patientId}`);
        expect.fail('Should have thrown 403');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('Authorization', () => {
    it('should authorize doctor for patient', async () => {
      const response = await apiService.post(
        `/healthcare/patient/${patientId}/authorize-doctor`,
        {
          doctorId: 'test-doctor-id',
          permissions: ['view', 'download']
        }
      );
      expect(response.data.success).toBe(true);
    });

    it('should revoke doctor access', async () => {
      const response = await apiService.delete(
        `/healthcare/patient/${patientId}/revoke/test-doctor-id`
      );
      expect(response.data.success).toBe(true);
    });
  });

  describe('Medical Records', () => {
    it('should encrypt medical records', async () => {
      const response = await apiService.post('/healthcare/medical-record/create', {
        patientId,
        fileId: 'test-file-id',
        recordType: 'Lab Result',
        diagnosis: 'Test Diagnosis'
      });
      expect(response.data.record.encryptionStatus).toBe('encrypted');
    });

    it('should log access to medical records', async () => {
      await apiService.get(`/healthcare/medical-records/${patientId}`);
      // Verify access was logged in compliance logs
      const logs = await apiService.get('/healthcare/compliance-logs');
      const accessLog = logs.data.logs.find(l => l.eventType === 'DATA_ACCESS');
      expect(accessLog).toBeDefined();
    });
  });

  describe('Consent Management', () => {
    it('should grant consent with record type limitations', async () => {
      const response = await apiService.post(
        `/healthcare/patient/${patientId}/consent/grant`,
        {
          type: 'Treatment',
          authorizedRecipient: 'Dr. Test',
          recordTypes: ['Lab Result']
        }
      );
      expect(response.data.consent.recordTypes).toContain('Lab Result');
      expect(response.data.consent.status).toBe('ACTIVE');
    });

    it('should revoke consent', async () => {
      const consentRes = await apiService.post(
        `/healthcare/patient/${patientId}/consent/grant`,
        { type: 'Treatment', authorizedRecipient: 'Dr. Test' }
      );
      const consentId = consentRes.data.consent._id;

      const revokeRes = await apiService.delete(
        `/healthcare/consent/${consentId}/revoke`
      );
      expect(revokeRes.data.consent.status).toBe('REVOKED');
    });
  });

  describe('Insider Threat Detection', () => {
    it('should detect excessive access', async () => {
      // Simulate rapid access to multiple records
      for (let i = 0; i < 60; i++) {
        await apiService.get(`/healthcare/medical-records/${patientId}`);
      }

      const threatRes = await apiService.get(
        `/api/healthcare/insider-threat/high-risk`
      );
      expect(threatRes.data.threats.length).toBeGreaterThan(0);
    });
  });
});
```

### Integration Test Scenario

```bash
# Full workflow test
npm run test:integration

Expected output:
✓ Patient registration with MRN generation
✓ Doctor authorization with permission levels
✓ Medical record creation and encryption
✓ Consent grant/revoke mechanism
✓ Access logging to compliance database
✓ Insider threat detection on suspicious patterns
✓ Unauthorized access blocking
✓ Encryption key validation
✓ HIPAA compliance logging completeness
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Unauthorized Access - User not authorized for this patient"

**Cause**: Doctor hasn't been authorized by patient

**Solution**:
```
1. Patient: Go to Dashboard → Authorized Doctors
2. Patient: Click "+ Authorize New Doctor"
3. Patient: Enter doctor's ID and select permissions
4. Doctor: Refresh page to see patient in list
```

#### Issue 2: "Compliance log flush failed - Database connection timeout"

**Cause**: MongoDB connection pool exhausted

**Solution**:
```
1. Check MongoDB connection string in .env
2. Increase connection pool: DB_MAX_POOL_SIZE=50
3. Restart backend service
4. Verify logs: tail -f logs/compliance.log
```

#### Issue 3: "Insider threat risk score > 80 - Account suspended"

**Cause**: Access patterns triggered threat detection

**Solution**:
```
1. Contact administrator with incident details
2. Provide reason for access: "Treating patients from clinic A"
3. Admin verifies legitimate access
4. Admin removes threat status: 
   UPDATE insiderThreatLog 
   SET status = 'FALSE_POSITIVE' 
   WHERE userId = 'xxx'
5. Account re-enabled after verification
```

#### Issue 4: "File encryption failed - Invalid encryption key"

**Cause**: ENCRYPTION_KEY environment variable not set or corrupted

**Solution**:
```bash
1. Verify key is set: echo $ENCRYPTION_KEY
2. If missing, regenerate: 
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
3. Update .env with new key
4. Restart backend: npm restart
5. Old files may need re-encryption (see backup restore procedure)
```

#### Issue 5: "HIPAA compliance logs not being created"

**Cause**: Middleware not applied to routes

**Solution**:
```javascript
// Check server.js line with healthcareRoutes
app.use('/api/healthcare', healthcareRoutes);

// Verify middleware is applied in routes file
import { hipaaComplianceMiddleware } from '../middleware/hipaaComplianceMiddleware.js';
router.use(hipaaComplianceMiddleware);

// Ensure routes use middleware:
router.post('/medical-record/create', 
  authMiddleware, 
  hipaaComplianceMiddleware,  // This line required
  createMedicalRecord
);
```

### Performance Optimization Tips

```javascript
// 1. Enable database query optimization
db.complianceLogs.createIndex({ userId: 1, timestamp: -1 }, { background: true })

// 2. Implement pagination on large result sets
GET /healthcare/medical-records/:patientId?page=1&limit=10

// 3. Cache doctor-patient relationships (5 min TTL)
CACHE_TTL_DOCTOR_PATIENTS=300000

// 4. Batch HIPAA log flushes
HIPAA_LOG_FLUSH_BATCH_SIZE=100

// 5. Compress long-term logs
gzip complianceLogs-2023-01-*.json
```

### Debugging Commands

```bash
# View real-time compliance logs
tail -f logs/compliance.log | grep "CRITICAL\|ALERT\|INSIDER_THREAT"

# Check insider threat patterns
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/healthcare/insider-threat/user/:userId"

# Export compliance report
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/healthcare/compliance-report?startDate=2024-01-01&endDate=2024-01-31" \
  > compliance-report-jan-2024.json

# Verify encryption on records
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/healthcare/medical-record/:recordId" \
  | jq '.record.encryptionStatus'
```

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready
