# SecureSphere – Telemedicine Secure File Sharing System

## Backend Folder Structure

```text
backend/src
├── config
│   ├── database.js
│   └── env.js
├── controllers
│   ├── authController.js
│   ├── chunkedUploadController.js
│   ├── fileController.js
│   ├── healthcareController.js
│   └── userController.js
├── middleware
│   ├── attackDetectionMiddleware.js
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── roleMiddleware.js
│   ├── securityMiddleware.js
│   ├── uploadMiddleware.js
│   └── validationMiddleware.js
├── models
│   ├── AccessLog.js
│   ├── File.js
│   ├── HealthcareModels.js
│   └── User.js
├── routes
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── chunkedUploadRoutes.js
│   ├── doctorRoutes.js
│   ├── fileRoutes.js
│   ├── healthcareRoutes.js
│   ├── patientRoutes.js
│   └── userRoutes.js
└── services
    ├── accessControlService.js
    ├── auditLogService.js
    ├── hashingService.js
    └── streamingEncryptionService.js
```

## Frontend Folder Structure

```text
frontend/src
├── components
│   ├── AdvancedUploadForm.jsx
│   ├── FileCard.jsx
│   └── Navbar.jsx
├── context
│   └── AuthContext.jsx
├── pages
│   ├── AdminDashboard.jsx
│   ├── Dashboard.jsx
│   ├── DoctorDashboard.jsx
│   ├── PatientDashboard.jsx
│   ├── ShareFile.jsx
│   └── Upload.jsx
└── services
    ├── apiService.js
    └── chunkedUploadService.js
```

## Role Modules

### Patient
- Register and login with JWT in `authRoutes.js` and `authController.js`
- Upload reports, prescriptions, and scans through `patientRoutes.js`
- Add symptoms or disease details using `disease` and `description` metadata
- View, download, and share files with doctors

### Doctor
- Login with JWT
- View patient files shared with them
- Download and decrypt records
- Upload prescriptions for patients through `doctorRoutes.js`
- See disease and record metadata on the dashboard

### Admin
- View all users and files through `adminRoutes.js`
- Delete users
- Monitor audit activity and suspicious IP behavior
- Enforce system-wide oversight with role middleware

## Security Controls

### RBAC Middleware

```js
export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action.'
    });
  }

  next();
};
```

### Role Guards

```js
export const requirePatient = authorizeRoles('patient');
export const requireDoctor = authorizeRoles('doctor');
export const requireAdmin = authorizeRoles('admin');
```

### Streaming AES-256 Encryption

```js
await streamingEncrypt(
  fs.createReadStream(tempFilePath),
  fs.createWriteStream(encryptedPath)
);
```

### Attack Prevention

```js
app.use(securityHeaders());
app.use(enforceHttps);
app.use(createRateLimiter());
app.use(createSpeedLimiter());
app.use(requestTimeout(45000));
app.use(dataSanitization);
app.use(requestValidation);
app.use(createNonceValidator());
```

### Chunk Upload Progress

```js
await uploadFileInChunks(file, metadata, (update) => {
  setProgress(update.progress);
});
```

## Attack Models and Defenses

### MITM
- HTTPS enforcement and Helmet secure headers
- AES-256-GCM encryption for files at rest

### Replay Attacks
- `X-Nonce` and `X-Timestamp` validation
- JWT expiration in tokens

### Unauthorized Access
- JWT authentication
- Role middleware for patient, doctor, and admin routes

### Data Tampering
- SHA-256 hashing before encrypted storage

### Insider Attacks
- Audit logs for uploads, downloads, shares, revocations, and audit views
- Suspicious activity monitoring with IP-based anomaly tracking

## Performance Design

- Medical files up to 100MB
- Chunked upload for reliability
- Streaming encryption and decryption to avoid memory overload
- Rate limiting to reduce abuse
- Indexed MongoDB queries for files, patients, and logs

## Real-World Telemedicine Flow

1. Patient logs in and uploads a scan with disease notes.
2. The backend hashes the file, streams AES-256 encryption, and stores metadata in MongoDB.
3. The patient shares the file with a specific doctor.
4. The doctor sees the record in the doctor dashboard and downloads it through an authorized RBAC path.
5. The admin dashboard tracks the upload, share, download, and any suspicious access attempts.
