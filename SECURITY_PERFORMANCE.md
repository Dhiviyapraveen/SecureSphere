# SecureSphere Enhanced - Security & Performance Improvements

## Overview

This document details the comprehensive security and performance enhancements made to SecureSphere, a privacy-preserving data sharing system. The upgrades address modern threat scenarios and handle large-scale file transfers efficiently while maintaining end-to-end encryption.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Security Threat Model & Protections](#security-threat-model--protections)
3. [Performance Optimizations](#performance-optimizations)
4. [Installation & Setup](#installation--setup)
5. [API Documentation](#api-documentation)
6. [Code Examples](#code-examples)
7. [Deployment Guidelines](#deployment-guidelines)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Architecture Overview

### Enhanced System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Advanced Upload Component                            │   │
│  │ - Chunked upload (5MB per chunk)                    │   │
│  │ - Progress tracking with speed/ETA                  │   │
│  │ - Automatic retry with exponential backoff          │   │
│  │ - Security headers (nonce, timestamp)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Chunked Upload Service                               │   │
│  │ - File splitting & chunk management                 │   │
│  │ - Retry logic with exponential backoff              │   │
│  │ - Progress callbacks                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
        ┌──────────────────────────────────┐
        │   Nginx/Load Balancer (TLS 1.3)  │
        └──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Security Middleware Stack (Applied to all requests) │   │
│  │ ✓ Helmet.js - Security headers                      │   │
│  │ ✓ Rate Limiter - Request throttling                 │   │
│  │ ✓ Nonce Validator - Replay attack prevention        │   │
│  │ ✓ Data Sanitizer - NoSQL injection prevention       │   │
│  │ ✓ Attack Detection - Suspicious pattern analysis    │   │
│  │ ✓ Audit Logger - Security event logging             │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Chunked Upload Routes                                │   │
│  │ POST   /chunked/init          - Initiate upload      │   │
│  │ POST   /chunked/upload/:id/:n - Upload chunk        │   │
│  │ POST   /chunked/finalize/:id  - Finalize upload     │   │
│  │ GET    /chunked/progress/:id  - Get progress        │   │
│  │ DELETE /chunked/cancel/:id    - Cancel upload       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Streaming Encryption Service                         │   │
│  │ - Stream-based encryption (64KB chunks)             │   │
│  │ - AES-256-GCM authenticated encryption              │   │
│  │ - Hash computation during streaming                 │   │
│  │ - No full file buffering in memory                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ File System Storage                                  │   │
│  │ - /uploads      - Encrypted files                   │   │
│  │ - /chunks       - Temporary chunk storage           │   │
│  │ (Auto-cleanup after 24 hours)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────┐
        │      MongoDB (Encrypted)         │
        │ - File metadata & access logs    │
        │ - User credentials (bcrypt)      │
        │ - Access control entries         │
        └──────────────────────────────────┘
```

### Data Flow for Large File Upload

```
1. FILE SELECTION → Frontend validates file size
                  → User provides metadata
                  
2. UPLOAD INIT   → Backend creates upload session
                  → Allocates upload ID
                  → Calculates total chunks
                  → Stores metadata in memory
                  
3. CHUNK UPLOAD  → Frontend splits file into 5MB chunks
   (Repeated)    → Security headers added (nonce, timestamp)
                  → Retry logic with exponential backoff
                  → Backend validates chunk
                  → Chunk stored temporarily
                  → Progress callback sent
                  
4. FINALIZATION  → All chunks verified received
                  → Chunks assembled in order
                  → File encrypted with AES-256-GCM
                  → Hash computed for integrity
                  → Metadata saved to DB
                  → Temporary chunks cleaned up
                  
5. SUCCESS       → Frontend receives file ID
                  → User redirected to dashboard
```

---

## Security Threat Model & Protections

### 1. Man-in-the-Middle (MITM) Attacks

**Threat**: Attacker intercepts communication and reads/modifies data

**Protections**:
- ✓ **HTTPS/TLS 1.3**: Encrypted transport layer
- ✓ **HSTS Headers**: Force HTTPS connection
- ✓ **Certificate Pinning**: (Optional) Pin server certificates
- ✓ **End-to-End Encryption**: Data encrypted even over TLS

```javascript
// Backend: HSTS Header Configuration (via Helmet.js)
const securityHeaders = () => {
  return helmet({
    hsts: { 
      maxAge: 31536000,        // 1 year
      includeSubDomains: true,
      preload: true            // Include in browser HSTS preload list
    }
  });
};

// Frontend: Use HTTPS URLs exclusively
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.securesphere.com';
// Never http://
```

---

### 2. Replay Attacks

**Threat**: Attacker captures valid request and replays it later

**Protections**:
- ✓ **Nonce Validation**: One-time use identifiers
- ✓ **Timestamp Validation**: Time-based request verification (5-minute window)
- ✓ **Request Signing**: (Optional) Sign requests with HMAC

```javascript
// Backend: Nonce & Timestamp Validation
import { createNonceValidator } from './middleware/securityMiddleware.js';

const nonceValidator = createNonceValidator();

app.use('/api/files/chunked', nonceValidator);

// Frontend: Add security headers to requests
function getSecurityHeaders() {
  return {
    'X-Nonce': uuidv4(),                   // Unique ID per request
    'X-Timestamp': Date.now().toString()   // Current timestamp
  };
}

// Example request:
axios.post('/api/files/chunked/init', 
  { fileName, fileSize, mimeType },
  { headers: getSecurityHeaders() }
);
```

**How it works**:
1. Client generates UUID (nonce) and timestamp
2. Backend validates timestamp is within 5 minutes
3. Backend checks nonce hasn't been used before
4. Nonce stored for 5 minutes
5. Old nonces automatically cleaned up

---

### 3. Brute Force & Unauthorized Access

**Threat**: Attacker attempts multiple authentication guesses

**Protections**:
- ✓ **Rate Limiting**: Generic rate limiter (100 req/15 min per IP)
- ✓ **Auth Rate Limiting**: Strict auth limiter (5 attempts/15 min)
- ✓ **Progressive Delays**: Responses get slower with repeated failures
- ✓ **IP Tracking & Blocking**: (Optional) Block IPs after threshold

```javascript
// Backend: Authentication Rate Limiter Configuration
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts max
  message: 'Too many authentication attempts. Locked for 15 minutes.',
  skipSuccessfulRequests: false,
  /* Successively slower: 0ms, 500ms, 1000ms, 1500ms, 2000ms delay */
});

// Apply to auth routes
router.post('/login', authRateLimiter, loginController);
router.post('/register', authRateLimiter, registerController);

// Attack Detection Integration
export const recordFailedAuth = (ip, endpoint) => {
  const detected = attackDetection.recordFailedAuth(ip, endpoint);
  if (detected) {
    console.warn(`🚨 BRUTE FORCE DETECTED: IP ${ip}`);
    // Could trigger additional logging or alerts
  }
  return detected;
};
```

---

### 4. Data Tampering & Integrity

**Threat**: Attacker modifies files in transit or at rest

**Protections**:
- ✓ **GCM Authentication Tags**: AES-256-GCM provides authenticated encryption
- ✓ **SHA-256 File Hashing**: Compute file hash on upload
- ✓ **Hash Verification**: Verify hash on download
- ✓ **HTTPS Integrity**: Transport layer protection

```javascript
// Backend: Streaming encryption with integrity
import { streamingEncrypt, createHashStream } from './services/streamingEncryptionService.js';

// During upload finalization:
const readStream = createReadStream(tempFilePath);
const { stream: hashStream, getHash } = createHashStream('sha256');

// Compute hash while encrypting
await new Promise((resolve, reject) => {
  pipeline(readStream, hashStream, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

const fileHash = getHash(); // SHA-256 hash

// Store hash in database for later verification
const file = new File({
  hash: fileHash,  // Store hash
  isEncrypted: true,
  // ... other fields
});
await file.save();

// On download, verify hash matches stored value
```

---

### 5. NoSQL Injection

**Threat**: Attacker injects malicious code in database queries

**Protections**:
- ✓ **Data Sanitization**: Remove/escape special characters
- ✓ **Mongoose Schema Validation**: Type validation
- ✓ **Parameterized Queries**: Never concatenate user input
- ✓ **Input Validation**: Express-validator for request validation

```javascript
// Backend: Data Sanitization Middleware
import mongoSanitize from 'express-mongo-sanitize';

app.use(mongoSanitize({
  replaceWith: '_',  // Replace special chars with '_'
}));

// Example: Malicious input sanitization
// Input:  { $ne: null }
// Output: { _ne: null }

// Frontend: Request validation
import { body, validationResult } from 'express-validator';

router.post('/chunked/init',
  [
    body('fileName').notEmpty().trim().escape(),
    body('fileSize').isInt({ min: 1, max: 100 * 1024 * 1024 }),
    body('mimeType').notEmpty().trim(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
);
```

---

### 6. Suspicious Activity Detection

**Threat**: Attacker performs reconnaissance or brute force scanning

**Protections**:
- ✓ **Request Pattern Analysis**: Detect rapid requests
- ✓ **Upload Pattern Analysis**: Detect excessive uploads
- ✓ **Failed Attempt Tracking**: Track authentication failures
- ✓ **Risk Scoring**: Assign risk scores to IPs
- ✓ **Audit Logging**: Log all activities

```javascript
// Backend: Attack Detection Service
import { attackDetection } from './middleware/attackDetectionMiddleware.js';

// Track failed authentication
export const handleFailedLogin = (req) => {
  const ip = req.ip;
  const isAttack = attackDetection.recordFailedAuth(ip, req.path);
  
  if (isAttack) {
    console.warn(`⚠️ POTENTIAL BRUTE FORCE: IP ${ip}`);
    // Could trigger alert or block
  }
};

// Track successful authentication (clears failed count)
export const handleSuccessfulLogin = (req) => {
  attackDetection.recordSuccessfulAuth(req.ip);
};

// Track uploads
export const handleFileUpload = (req, fileSize) => {
  const ip = req.ip;
  const isAnomaly = attackDetection.recordUpload(ip, fileSize);
  
  if (isAnomaly) {
    console.warn(`⚠️ EXCESSIVE UPLOADS DETECTED: IP ${ip}`);
  }
};

// Get security status
export const getSuspiciousIPs = () => {
  return attackDetection.getSuspiciousIPs(threshold = 5);
  // Returns list of IPs with risk scores > 5
};
```

---

### 7. Cross-Site Request Forgery (CSRF)

**Threat**: Attacker tricks user into making unwanted requests

**Protections**:
- ✓ **SameSite Cookies**: (If using cookies)
- ✓ **CORS Configuration**: Restrict origin
- ✓ **Token Validation**: (Optional) CSRF tokens

```javascript
// Backend: CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,  // e.g., https://securesphere.com
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Nonce', 'X-Timestamp']
}));
```

---

## Performance Optimizations

### 1. Chunked Upload Implementation

**Challenge**: Users cannot upload files larger than server's available RAM

**Solution**: Split files into 5MB chunks

```javascript
// Frontend: Split file into chunks
function splitFileIntoChunks(file, chunkSize = 5 * 1024 * 1024) {
  const chunks = [];
  let offset = 0;
  
  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    chunks.push(file.slice(offset, end));
    offset = end;
  }
  
  return chunks; // Returns array of Blob objects
}

// Example: 100MB file → 20 chunks of 5MB each
const file = new File(['...'], 'large-file.zip', { size: 100 * 1024 * 1024 });
const chunks = splitFileIntoChunks(file);
console.log(chunks.length); // 20
```

**Benefits**:
- ✓ Constant memory usage (5MB per chunk)
- ✓ Supports files up to 100MB
- ✓ Faster upload speeds for large files
- ✓ Can resume interrupted uploads

---

### 2. Streaming Encryption

**Challenge**: Encrypting 100MB file loads entire file into memory

**Solution**: Encrypt data in 64KB streaming chunks

```javascript
// Backend: Streaming Encryption
import { createEncryptionStream } from './services/streamingEncryptionService.js';

export const encryptLargeFile = async (inputPath, outputPath) => {
  const readStream = fs.createReadStream(inputPath, {
    highWaterMark: 64 * 1024  // 64KB buffer
  });
  
  const writeStream = fs.createWriteStream(outputPath);
  const { stream: encryptionStream } = createEncryptionStream();
  
  // Memory usage: ~64KB at any time
  await new Promise((resolve, reject) => {
    pipeline(readStream, encryptionStream, writeStream, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Process: Read 64KB → Encrypt 64KB → Write 64KB → Repeat
```

**Memory Efficiency**:
- Traditional: 100MB file × 1 = 100MB RAM
- Streaming: 64KB buffer + cipher state = ~1MB RAM
- **Saves 99% memory!**

---

### 3. Progress Tracking & Speed Estimation

**Feature**: Show upload speed and time remaining

```javascript
// Frontend: Calculate metrics
function updateUploadMetrics(uploadedBytes, lastBytes, lastTime) {
  const now = Date.now();
  const timeDelta = (now - lastTime) / 1000;  // seconds
  const bytesDelta = uploadedBytes - lastBytes;
  
  // Speed = bytes per second
  const speed = bytesDelta / timeDelta;
  
  // Time remaining
  const remainingBytes = totalBytes - uploadedBytes;
  const timeRemaining = remainingBytes / speed;
  
  return {
    speed,           // bytes/sec
    timeRemaining,   // seconds
    progress: (uploadedBytes / totalBytes) * 100
  };
}

// Display to user
// Upload Speed: 2.5 MB/s
// Time Remaining: 2m 30s
// Progress: 75.5%
```

---

### 4. Retry Logic with Exponential Backoff

**Challenge**: Network failures interrupt uploads

**Solution**: Automatically retry failed chunks with increasing delays

```javascript
// Frontend: Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt);  // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError;
}

// Usage:
await retryWithBackoff(
  () => uploadChunk(uploadId, chunkNumber, chunkData),
  3  // max retries
);

// Retry pattern:
// Attempt 1: Fails immediately
// Wait 1s
// Attempt 2: Fails
// Wait 2s
// Attempt 3: Fails
// Wait 4s
// Attempt 4: Fails → Throw error
```

---

### 5. Rate Limiting to Prevent Server Overload

**Challenge**: Malicious users upload multiple large files simultaneously

**Solution**: Rate limit uploads per user/IP

```javascript
// Backend: File upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,                    // 10 uploads per hour
  message: 'Too many uploads. Try again later.',
});

app.post('/api/files/upload', uploadRateLimiter, uploadController);

// Prevents:
// ✓ Single user uploading 100 files in 1 hour
// ✓ DDoS through resource exhaustion
// ✓ Server disk space attacks
```

---

### 6. Database Query Optimization

**Challenge**: Database queries for large datasets are slow

**Solution**: Implement pagination and indexing

```javascript
// Backend: Pagination
export const getMyFiles = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  
  const files = await File.find({ owner: req.user.id })
    .skip(skip)
    .limit(pageSize)
    .sort({ createdAt: -1 });
  
  const total = await File.countDocuments({ owner: req.user.id });
  
  res.json({
    success: true,
    data: files,
    pagination: {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  });
};

// Example database indexes (add to model):
// File.collection.createIndex({ owner: 1, createdAt: -1 });
// File.collection.createIndex({ hash: 1 });
```

---

## Installation & Setup

### Backend Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create environment file
cp .env.example .env

# 3. Configure .env
MONGODB_URI=mongodb://localhost:27017/securesphere
JWT_SECRET=your_ultra_secure_jwt_secret_key_should_be_long_random_string
JWT_EXPIRATION=7d
ENCRYPTION_KEY=your_encryption_key_minimum_32_characters_long
NODE_ENV=production

# 4. Ensure MongoDB is running
# For macOS: brew services start mongodb-community

# 5. Create necessary directories
mkdir -p uploads chunks

# 6. Start backend
npm run dev  # Development with hot reload
```

### Frontend Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Create environment file
cat > .env.production << EOF
VITE_API_URL=https://api.securesphere.com
VITE_APP_NAME=SecureSphere
EOF

# 3. Build for production
npm run build

# 4. Start development server
npm run dev

# Output: http://localhost:3000
```

---

## API Documentation

### Chunked Upload Endpoints

#### 1. Initiate Upload

```http
POST /api/files/chunked/init HTTP/1.1
Host: api.securesphere.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Nonce: 550e8400-e29b-41d4-a716-446655440000
X-Timestamp: 1704067200000
Content-Type: application/json

{
  "fileName": "large-document.pdf",
  "fileSize": 52428800,
  "mimeType": "application/pdf",
  "description": "Q4 Financial Report",
  "tags": "finance,report,2024"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Chunked upload initiated",
  "data": {
    "uploadId": "user-1704067200000-a1b2c3d4e5f6",
    "chunkSize": 5242880,
    "totalChunks": 10
  }
}
```

---

#### 2. Upload Chunk

```http
POST /api/files/chunked/upload/user-1704067200000-a1b2c3d4e5f6/0 HTTP/1.1
Host: api.securesphere.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Nonce: 550e8400-e29b-41d4-a716-446655440001
X-Timestamp: 1704067201000
Content-Type: application/octet-stream

[Binary chunk data - 5MB]
```

**Response**:
```json
{
  "success": true,
  "message": "Chunk uploaded successfully",
  "data": {
    "chunkNumber": 0,
    "uploadedBytes": 5242880,
    "totalBytes": 52428800,
    "progress": "10.00"
  }
}
```

---

#### 3. Get Upload Progress

```http
GET /api/files/chunked/progress/user-1704067200000-a1b2c3d4e5f6 HTTP/1.1
Host: api.securesphere.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Nonce: 550e8400-e29b-41d4-a716-446655440002
X-Timestamp: 1704067202000
```

**Response**:
```json
{
  "success": true,
  "data": {
    "uploadId": "user-1704067200000-a1b2c3d4e5f6",
    "fileName": "large-document.pdf",
    "uploadedBytes": 26214400,
    "totalBytes": 52428800,
    "uploadedChunks": 5,
    "totalChunks": 10,
    "progress": "50.00",
    "status": "in_progress"
  }
}
```

---

#### 4. Finalize Upload

```http
POST /api/files/chunked/finalize/user-1704067200000-a1b2c3d4e5f6 HTTP/1.1
Host: api.securesphere.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Nonce: 550e8400-e29b-41d4-a716-446655440003
X-Timestamp: 1704067203000
Content-Type: application/json

{}
```

**Response**:
```json
{
  "success": true,
  "message": "Chunked upload completed successfully",
  "data": {
    "fileId": "507f1f77bcf86cd799439011",
    "fileName": "large-document.pdf",
    "size": 52428800,
    "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Code Examples

### Example 1: Frontend Upload with Progress

```jsx
import { uploadFileInChunks, formatBytes, formatSpeed } from '../services/chunkedUploadService.js';

export const UploadExample = () => {
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  
  const handleUpload = async () => {
    try {
      await uploadFileInChunks(
        file,
        'My document',
        'important,2024',
        (progressData) => {
          console.log(`
            Progress: ${progressData.progress}%
            Speed: ${formatSpeed(progressData.speed)}
            Time Remaining: ${formatTimeRemaining(progressData.timeRemaining)}
            Chunk: ${progressData.currentChunk}/${progressData.totalChunks}
          `);
          
          setProgress(progressData.progress);
        }
      );
      
      console.log('Upload completed!');
    } catch (error) {
      console.error('Upload failed:', error.message);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <progress value={progress} max="100" />
      <p>{progress.toFixed(1)}%</p>
    </div>
  );
};
```

---

### Example 2: Backend Streaming Encryption

```javascript
import { streamingEncrypt, createHashStream } from '../services/streamingEncryptionService.js';
import fs from 'fs';

// Encrypt large file without loading into memory
export const encryptLargeFile = async (inputPath, outputPath) => {
  const readStream = fs.createReadStream(inputPath);
  const writeStream = fs.createWriteStream(outputPath);
  
  try {
    const { salt, iv } = await streamingEncrypt(readStream, writeStream);
    console.log('File encrypted successfully');
    console.log('Salt:', salt.toString('hex'));
    console.log('IV:', iv.toString('hex'));
  } catch (error) {
    console.error('Encryption failed:', error);
  }
};

// Compute file hash during streaming
export const computeFileHash = async (filePath) => {
  const readStream = fs.createReadStream(filePath);
  const { stream: hashStream, getHash } = createHashStream('sha256');
  const nullStream = fs.createWriteStream('/dev/null');
  
  return new Promise((resolve, reject) => {
    pipeline(readStream, hashStream, nullStream, (err) => {
      if (err) reject(err);
      else resolve(getHash());
    });
  });
};
```

---

### Example 3: Attack Detection Usage

```javascript
import { attackDetection } from '../middleware/attackDetectionMiddleware.js';

// Track failed authentication
export const handleFailedAuth = (req) => {
  const ip = req.ip;
  const isAttack = attackDetection.recordFailedAuth(ip, req.path);
  
  if (isAttack) {
    // Take action: log, alert, block IP
    console.warn(`Brute force attempt from ${ip}`);
  }
};

// Clear failed attempts on success
export const handleSuccessfulAuth = (req) => {
  attackDetection.recordSuccessfulAuth(req.ip);
};

// Get current attacks
export const getSecurityMetrics = () => {
  const suspiciousIPs = attackDetection.getSuspiciousIPs();
  return {
    totalTrackedIPs: attackDetection.suspiciousIPs.size,
    suspiciousIPs,
    timestamp: new Date().toISOString()
  };
};
```

---

## Deployment Guidelines

### Production Deployment Checklist

```bash
# Security
☑ Set strong JWT_SECRET (64+ random characters)
☑ Set strong ENCRYPTION_KEY (32+ characters)
☑ Enable HTTPS/TLS 1.3 on load balancer
☑ Configure CORS for frontend domain only
☑ Set NODE_ENV=production
☑ Enable rate limiting on all routes

# Performance
☑ Enable gzip compression in Nginx
☑ Configure MongoDB indexes
☑ Set up database backups
☑ Enable file cleanup cron job (24-hour cleanup)
☑ Configure CDN for frontend assets

# Monitoring
☑ Set up logging (Winston, Pino)
☑ Enable error tracking (Sentry)
☑ Monitor disk usage (uploads/, chunks/)
☑ Monitor API response times
☑ Track attack detection alerts
☑ Monitor rate limiter triggers

# Database
☑ Enable MongoDB authentication
☑ Use TLS for DB connections
☑ Enable audit logging
☑ Set up automated backups
☑ Create necessary indexes

# Infrastructure
☑ Use load balancer for scaling
☑ Deploy behind reverse proxy (Nginx)
☑ Enable DDoS protection
☑ Configure firewall rules
☑ Set up SSL certificate auto-renewal
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src

# Create necessary directories
RUN mkdir -p uploads chunks

# Environment
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 5000

CMD ["node", "src/server.js"]
```

---

## Monitoring & Maintenance

### Key Metrics to Monitor

```javascript
// 1. Upload Success Rate
uploadSuccessRate = (successfulUploads / totalUploads) * 100;
// Target: > 99%

// 2. Average Upload Size
averageUploadSize = totalUploadBytes / totalUploads;
// Monitor for unusual patterns

// 3. Attack Detection Rate
attacksDetected = suspiciousIPs.length;
// Should be low in normal operation

// 4. Rate Limit Triggers
rateLimitTriggered = numBlockedRequests;
// Monitor for legitimate users being blocked

// 5. Encryption/Decryption Time
encryptionTime = (endTime - startTime) / fileSize;
// Should be < 1ms per MB

// 6. Database Response Time
dbResponseTime = queryEndTime - queryStartTime;
// Target: < 50ms for 95th percentile

// 7. Chunk Upload Success Rate
chunkSuccessRate = (successfulChunks / totalChunks) * 100;
// Target: > 99.5%
```

### Daily Maintenance Tasks

```bash
#!/bin/bash

# cleanup_expired_uploads.sh

# Remove upload sessions older than 24 hours
find /app/uploads -name "temp-*" -mtime +1 -delete

# Remove orphaned chunks
find /app/chunks -name "*-[0-9]*" -mtime +1 -delete

# Check disk usage
df -h /app/uploads /app/chunks

# Backup database
mongodump --uri "mongodb://localhost:27017/securesphere" \
  --out /backups/securesphere-$(date +%Y%m%d-%H%M%S)

# Log rotation (ensure /var/log/securesphere has retention policy)
logrotate /etc/logrotate.d/securesphere
```

### Security Audit Log Analysis

```bash
#!/bin/bash

# analyze_security.sh

# Failed authentication attempts (last 24h)
grep "Failed auth" logs/security.log | tail -n 1000 | wc -l

# Suspicious IPs
echo "Top 10 suspicious IPs:"
grep "SECURITY ALERT" logs/security.log | \
  grep -oP "IP: \K[0-9.]+|IP: \K[a-f0-9:.]+" | \
  sort | uniq -c | sort -rn | head -10

# Rate limit triggers
grep "rate limit" logs/security.log | wc -l

# Nonce violations (possible replay attempts)
grep "Nonce already used" logs/security.log | wc -l
```

---

## Troubleshooting

### Upload Fails with "File too large"
- ✓ Check max upload size in backend config (100MB)
- ✓ Check request body size limit in Express
- ✓ Verify browser file size

### Slow Upload Speeds
- ✓ Check network connectivity
- ✓ Monitor server CPU/disk I/O
- ✓ Verify disk space available
- ✓ Check encryption performance

### Attack Detection False Positives
- ✓ Whitelist internal IPs
- ✓ Adjust rate limiter thresholds
- ✓ Review attack detection risk scoring

---

## References

- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [AES-256-GCM Specification](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [Express Rate Limiter](https://github.com/nfriedly/express-rate-limit)

---

**Document Version**: 2.0  
**Last Updated**: 2024-01-01  
**Maintained By**: SecureSphere Development Team
