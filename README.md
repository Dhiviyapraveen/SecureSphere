# SecureSphere - Privacy-Preserving Telemedicine Platform

A full-stack web application providing HIPAA-compliant secure file sharing with end-to-end encryption, secure authentication, role-based access control, and healthcare-specific features for telemedicine.

## 🔐 Features

### Core Security
- **AES-256-GCM Encryption**: Military-grade encryption for all uploaded files
- **SHA-256 Hashing**: File integrity verification
- **JWT Authentication**: Secure token-based authentication
- **Bcrypt Password Hashing**: Secure password storage
- **PBKDF2 Key Derivation**: Strong key derivation from passwords
- **Streaming Encryption**: Memory-efficient encryption for large files (up to 100MB)
- **Attack Detection**: Real-time detection of brute force, rapid requests, and suspicious patterns

### File Management
- **Secure Upload**: Files encrypted before storage with chunked uploads (5MB chunks)
- **File Sharing**: Share files with specific users with role-based access
- **Access Control**: Owner and Viewer roles with fine-grained permissions
- **File Metadata**: Track file history, downloads, and access logs
- **Download Tracking**: Monitor file access activity
- **Resumable Uploads**: Resume interrupted uploads without re-uploading

### Healthcare Features ⚕️
- **HIPAA Compliance Logging**: Comprehensive audit trails for all Protected Health Information (PHI) access
- **Patient Management**: Create patient profiles with Medical Record Numbers (MRN)
- **Doctor Management**: Register physician profiles with license numbers and specialties
- **Telemedicine Dashboards**: Dedicated patient and doctor interfaces
- **Medical Records**: Store and manage diagnosis, prescriptions, vitals, imaging, and lab results
- **Consent Management**: Grant/revoke authorization for doctors to access specific record types
- **Insider Threat Detection**: Real-time analysis of 10+ threat patterns with risk scoring
- **Access Authorization**: Patient-controlled doctor access with granular permissions (view/edit/download/share)
- **6-Year Compliance Logging**: Mandatory HIPAA retention of all audit events

### User Management
- **User Registration**: Secure registration with validation
- **User Authentication**: JWT-based authentication with 7-day expiry
- **Profile Management**: User profile customization
- **Access Revocation**: Revoke file and medical record access from users
- **Role-Based Access Control**: PATIENT and DOCTOR role separation

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **React Router** - Routing
- **Tailwind CSS** - Styling (dark theme)
- **CryptoJS** - Client-side encryption utilities
- **Vite** - Build tool and dev server

### Backend
- **Node.js + Express.js** - Server framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **Helmet.js** - Security headers
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation

## ⚕️ Healthcare Features

### HIPAA Compliance
SecureSphere is designed with HIPAA compliance as a core requirement:

- **Comprehensive Audit Logging**: All access to Protected Health Information (PHI) is logged
  - Event Types: DATA_ACCESS, MODIFICATION, DELETION, EXPORT, AUTHENTICATION, AUTHORIZATION_CHANGE, SECURITY_INCIDENT, INSIDER_THREAT_DETECTED
  - 6-Year Retention: Automatic compliance log archival per HIPAA requirements
  - Searchable Logs: Query by event type, severity, user, patient, date range

- **Encryption at Rest & In Transit**: All medical data encrypted with AES-256-GCM
- **Access Control**: Patient-controlled authorization of physicians
- **Consent Management**: Grant/revoke specific consent types (Treatment, Payment, Operations, Marketing, Research, Psychotherapy)
- **Insider Threat Detection**: Real-time risk scoring and alerting for suspicious access patterns

### Patient Portal
Patients can:
- View and manage their medical profile  
- Authorize doctors with specific permissions (view, edit, download, share)
- Revoke doctor access immediately
- Upload and manage medical records
- Grant and revoke data access consents
- Review audit logs of who accessed their records and when

### Physician Dashboard
Doctors can:
- View assigned patients and medical histories
- Create and manage medical records (diagnosis, prescriptions, vitals, lab results, imaging)
- Document clinical findings with encrypted storage
- Access only records from patients who've authorized them
- View which records they're authorized to access

### Insider Threat Detection
Real-time detection of suspicious user behavior:
- **Excessive Access**: >50 records accessed in 1 hour
- **Bulk Extraction**: >500MB downloaded in 1 hour  
- **Abnormal Hours**: Access between 2-5 AM (abnormal pattern)
- **Geographic Anomaly**: Impossible travel patterns detected
- **Unauthorized Access**: Accessing records outside specialty/authorization
- **Rapid Pattern**: >20 records accessed in 5 minutes
- **Risk Scoring**: Aggregate threat scoring with recommendations
- **Auto-Actions**: Account restrictions/suspension for high-risk patterns (>80 score)

### Data Models

**Patient**: Medical Record Number (MRN), demographics, authorized doctors, consent forms, access logs

**Doctor**: License number, specialty, NPI, hospital affiliation, patient list, access logs

**Medical Record**: Diagnosis, prescriptions, vitals, lab results, imaging findings, access logs

**Compliance Log**: HIPAA-required audit trail (6-year retention) with event type, severity, actor, subject, action, result

**Consent**: Type, authorized recipient, effective/expiration dates, record type coverage

**Insider Threat Log**: Threat type, risk score, indicators, affected patients, investigation status

## 📖 Documentation

- **[HEALTHCARE_DEPLOYMENT_GUIDE.md](HEALTHCARE_DEPLOYMENT_GUIDE.md)**: HIPAA compliance checklist, insider threat detection configuration, production deployment architecture, monitoring & auditing
- **[TELEMEDICINE_INTEGRATION_GUIDE.md](TELEMEDICINE_INTEGRATION_GUIDE.md)**: Frontend integration, API endpoints, user workflows, security best practices, testing guide, troubleshooting
- **[BACKEND_SETUP.md](BACKEND_SETUP.md)**: Backend installation and configuration
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)**: Frontend installation and configuration
- **[QUICKSTART.md](QUICKSTART.md)**: Quick setup for development

## 📁 Project Structure

```
SecureSphere/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (DB, ENV)
│   │   ├── controllers/     # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── fileController.js
│   │   │   ├── userController.js
│   │   │   ├── chunkedUploadController.js
│   │   │   └── healthcareController.js ⚕️
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── File.js
│   │   │   ├── AccessLog.js
│   │   │   └── HealthcareModels.js ⚕️
│   │   │       ├── Patient
│   │   │       ├── Doctor
│   │   │       ├── MedicalRecord
│   │   │       ├── ComplianceLog
│   │   │       ├── Consent
│   │   │       └── InsiderThreatLog
│   │   ├── middleware/      # Custom middleware
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── uploadMiddleware.js
│   │   │   ├── validationMiddleware.js
│   │   │   ├── securityMiddleware.js
│   │   │   ├── attackDetectionMiddleware.js
│   │   │   ├── hipaaComplianceMiddleware.js ⚕️
│   │   │   └── insiderThreatMiddleware.js ⚕️
│   │   ├── services/        # Business logic
│   │   │   ├── encryptionService.js
│   │   │   ├── hashingService.js
│   │   │   ├── accessControlService.js
│   │   │   ├── streamingEncryptionService.js
│   │   │   └── [Embedded in middleware: insider threat detection]
│   │   ├── routes/          # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── fileRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── chunkedUploadRoutes.js
│   │   │   └── healthcareRoutes.js ⚕️
│   │   └── server.js        # Server entry point
│   ├── uploads/             # Encrypted file storage
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── FileCard.jsx
│   │   │   └── UploadForm.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── SharedFiles.jsx
│   │   │   ├── PatientDashboard.jsx ⚕️
│   │   │   └── DoctorDashboard.jsx ⚕️
│   │   ├── context/         # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── services/        # API and utility services
│   │   │   ├── apiService.js
│   │   │   ├── encryptionService.js
│   │   │   └── chunkedUploadService.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .gitignore
│
├── HEALTHCARE_DEPLOYMENT_GUIDE.md ⚕️
├── TELEMEDICINE_INTEGRATION_GUIDE.md ⚕️
├── BACKEND_SETUP.md
├── FRONTEND_SETUP.md
├── QUICKSTART.md
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or using MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Update .env with your values**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/securesphere
   JWT_SECRET=your_secure_jwt_secret_key
   JWT_EXPIRATION=7d
   NODE_ENV=development
   ENCRYPTION_KEY=your_32_character_encryption_key
   ```

5. **Ensure MongoDB is running**
   ```bash
   # For macOS with Homebrew
   mongod
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **In a new terminal, navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📝 API Documentation

### Authentication Endpoints

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password",
  "confirmPassword": "secure_password"
}
```

**Login User**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Get Profile**
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Update Profile**
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "theme": "dark"
}
```

### File Endpoints

**Upload File**
```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
description: "File description"
tags: "tag1,tag2"
```

**Get All Files**
```http
GET /api/files?page=1&limit=10
Authorization: Bearer <token>
```

**Get File Details**
```http
GET /api/files/:fileId
Authorization: Bearer <token>
```

**Download File**
```http
GET /api/files/:fileId/download
Authorization: Bearer <token>
```

**Share File**
```http
POST /api/files/:fileId/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "shareWith": ["userId1", "userId2"],
  "role": "viewer"
}
```

**Revoke Access**
```http
POST /api/files/:fileId/revoke
Authorization: Bearer <token>
Content-Type: application/json

{
  "revokeFrom": "userId"
}
```

**Delete File**
```http
DELETE /api/files/:fileId
Authorization: Bearer <token>
```

## 🔒 Security Features

### Backend Security
- **Input Validation**: All inputs are validated
- **Authentication Middleware**: JWT tokens verified on protected routes
- **Authorization Checks**: Role-based access control (RBAC)
- **Password Hashing**: bcrypt with 10 salt rounds
- **File Encryption**: AES-256-GCM with PBKDF2 key derivation
- **CORS**: Configured for frontend domain
- **Error Handling**: Secure error messages

### Frontend Security
- **Protected Routes**: Redirect unauthenticated users to login
- **Token Storage**: JWT stored in localStorage
- **Client-side Validation**: Input validation before submission
- **Import encryption utilities for additional client-side encryption

## 📚 Database Schema

### User
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed),
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  preferences: {
    theme: 'light' | 'dark',
    twoFactorEnabled: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### File
```javascript
{
  name: String,
  originalName: String,
  mimeType: String,
  size: Number,
  hash: String (SHA-256),
  owner: ObjectId (User),
  filePath: String,
  isEncrypted: Boolean,
  description: String,
  tags: [String],
  access: [{
    userId: ObjectId,
    role: 'owner' | 'viewer',
    grantedAt: Date,
    revokedAt: Date,
    isActive: Boolean
  }],
  downloadCount: Number,
  lastAccessedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### AccessLog
```javascript
{
  userId: ObjectId,
  fileId: ObjectId,
  action: 'upload' | 'download' | 'share' | 'delete' | 'decrypt',
  ipAddress: String,
  userAgent: String,
  status: 'success' | 'failed' | 'error',
  details: String,
  timestamp: Date
}
```

## 🧪 Testing the Application

### Test User Registration
1. Go to `http://localhost:3000/register`
2. Enter username, email, and password
3. Click "Register"

### Test File Upload
1. Login to your account
2. Navigate to "Upload" page
3. Select or drag-drop a file
4. Add description and tags (optional)
5. Click "Upload File"

### Test File Sharing
1. From Dashboard, click "Share" on a file
2. Select users to share with
3. Choose role (viewer)
4. Shared users see file in "Shared Files"

### Test File Download
1. Go to Dashboard or Shared Files
2. Click "Download" on a file
3. File is decrypted and downloaded

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securesphere
JWT_SECRET=your_very_secure_jwt_secret_key_change_this
JWT_EXPIRATION=7d
NODE_ENV=development
ENCRYPTION_KEY=your_32_character_encryption_key_minimum
```

### Frontend (vite.config.js)
- Proxy configured to http://localhost:5000/api

## 📦 Build & Deployment

### Backend Build
```bash
cd backend
npm install
npm start
```

### Frontend Build
```bash
cd frontend
npm install
npm run build
npm run preview
```

Build output in `frontend/dist/`

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env
- Verify MongoDB is accessible on port 27017

### File Upload Fails
- Check file size (max 100MB)
- Verify file type is supported
- Check upload directory exists: `backend/uploads/`

### CORS Errors
- Ensure backend runs on port 5000
- Frontend proxy configured in vite.config.js

### Authentication Fails
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET matches between login and API calls
- Verify token format: `Authorization: Bearer <token>`

## 📄 License

MIT License - Feel free to use this project

## 👨‍💻 Author

SecureSphere - Privacy-Preserving Data Sharing System

---

**Note**: This is a demo application. For production:
- Use HTTPS/SSL
- Store sensitive keys in secure vaults
- Add rate limiting
- Implement backup strategies
- Add comprehensive logging
- Set up monitoring and alerts
- Use production database (MongoDB Atlas, etc.)
- Deploy using services like AWS, Heroku, or DigitalOcean
