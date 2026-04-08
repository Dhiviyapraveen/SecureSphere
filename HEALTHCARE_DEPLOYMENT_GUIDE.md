# SecureSphere Telemedicine System - Healthcare Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [HIPAA Compliance Checklist](#hipaa-compliance-checklist)
3. [Security Architecture](#security-architecture)
4. [Insider Threat Detection](#insider-threat-detection)
5. [Database Configuration](#database-configuration)
6. [Performance Optimization](#performance-optimization)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Auditing](#monitoring--auditing)
9. [Data Retention & Purge Policies](#data-retention--purge-policies)
10. [Incident Response](#incident-response)

---

## Overview

SecureSphere Telemedicine is a HIPAA-compliant platform for secure sharing of medical records between patients and healthcare providers. The system implements:

- **Multi-layered Security**: Encryption, authentication, authorization, attack detection
- **HIPAA Compliance Logging**: Comprehensive audit trails for all PHI access
- **Insider Threat Detection**: Real-time analysis of suspicious access patterns
- **Streaming Encryption**: Large medical files (up to 100MB) with encrypted streaming
- **Role-Based Access Control**: Patient-physician relationship enforcement

---

## HIPAA Compliance Checklist

### Administrative Safeguards

- [ ] **Security Officer**: Designate responsible party for security implementation
- [ ] **Risk Analysis**: Conduct annual risk assessments (documented in compliance logs)
- [ ] **Security Documentation**: Maintain all configurations in version control
- [ ] **Employee Training**: HIPAA training for all staff (track in compliance logs)
- [ ] **Access Management**: Implement role-based access control (RBAC) - IMPLEMENTED
- [ ] **Termination Procedures**: Revoke access immediately upon termination

### Physical Safeguards

- [ ] **Data Center Security**: Use AWS/Azure data centers with SOC 2 compliance
- [ ] **Device Encryption**: Encrypt all physical storage devices
- [ ] **Access Logs**: Monitor physical access to servers (documented)
- [ ] **Workstation Security**: VPN required for remote access

### Technical Safeguards

- [ ] **Encryption**: AES-256-GCM for data at rest and in transit - IMPLEMENTED
- [ ] **Access Controls**: Authentication (JWT) and authorization checks - IMPLEMENTED
- [ ] **Audit Controls**: Comprehensive logging of all PHI access - IMPLEMENTED
- [ ] **Integrity Controls**: Data signatures and checksum validation
- [ ] **Transmission Security**: HTTPS/TLS 1.3 enforcement - IMPLEMENTED

### Configuration for Compliance

**Environment Variables Required:**

```bash
# Security Configuration
ENCRYPTION_KEY=<256-bit AES key in base64>
JWT_SECRET=<strong random secret>
ENVIRONMENT=production
NODE_ENV=production

# HIPAA Configuration
HIPAA_LOG_RETENTION_YEARS=6
HIPAA_ALERT_THRESHOLD=70
HIPAA_LOG_FLUSH_INTERVAL=300000  # 5 minutes

# Database Configuration
MONGODB_URI=<production connection string>
DB_REPLICA_SET=<replica set name for backup>

# CORS Configuration (Restrict in Production)
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true

# Rate Limiting (3-tier protection)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_STRICT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_STRICT_MAX=10

# Insider Threat Detection
THREAT_DETECTION_ENABLED=true
THREAT_RISK_THRESHOLD=60
THREAT_AUTO_SUSPEND_THRESHOLD=80
```

---

## Security Architecture

### Authentication Flow

```
[Patient/Doctor] 
    ↓
[Register/Login] → {JWT Token (7-day expiry)} 
    ↓
[All Requests] + JWT token in "Authorization: Bearer <token>"
    ↓
[authMiddleware] → Validates token signature and expiry
    ↓
[Request Processing] + req.user populated
```

### Authorization Flow

```
[Request for Patient Data]
    ↓
[Authorization Check]
    ├─ Is requester the patient? → ALLOW
    ├─ Is requester authorized doctor? → Check permissions
    │   ├─ Permission: "view" → Allow read
    │   ├─ Permission: "edit" → Allow write
    │   ├─ Permission: "download" → Allow export
    │   └─ Permission: "share" → Allow redistribution
    │
    └─ Is requester admin? → ALLOW
    
    ↓ DENIED → Log UNAUTHORIZED_ACCESS_ATTEMPT
              → Trigger insider threat detection
              → Return 403 Forbidden
```

### Encryption Strategy

**Data At Rest:**
```
Medical Records
    ↓
[AES-256-GCM Encryption] with unique IV per record
    ↓
Encrypted Blob + Encryption Metadata
    ↓
[MongoDB Storage]
```

**Data In Transit:**
```
[HTTPS/TLS 1.3]
    ├─ Certificate pinning (optional for mobile apps)
    ├─ HSTS headers (1 year with preload)
    └─ Perfect Forward Secrecy enabled
```

**Key Management:**
- Master encryption key stored in environment variable (AWS Secrets Manager in production)
- PBKDF2 key derivation for patient-specific encryption
- Key rotation policy: Every 90 days
- Compromised key response: Immediate re-encryption queue

---

## Insider Threat Detection

### Real-Time Threat Detection Patterns

The system monitors and scores 10+ threat patterns:

#### 1. **Excessive Access Pattern**
```
Risk Trigger: >50 medical records accessed in 1 hour
Risk Score: 30-50 points depending on severity
Response: Log warning, escalate if risk > 60
```

#### 2. **Bulk Extraction**
```
Risk Trigger: >500MB data downloaded in 1 hour
Risk Score: 50-70 points
Response: Block download, log critical incident
```

#### 3. **Abnormal Hours Access**
```
Risk Trigger: 3+ accesses between 2-5 AM (abnormal hours)
Risk Score: 35 points per occurrence
Response: Flag for manual review, potential account restriction
```

#### 4. **Geographic Anomaly**
```
Risk Trigger: Impossible travel (>500 mph between requests)
Risk Score: 45-80 points depending on distance
Response: Freeze account, require MFA re-authentication
```

#### 5. **Unauthorized Access Attempt**
```
Risk Trigger: Doctor accesses records outside their specialty
Risk Score: 80-100 points (critical)
Response: Block immediately, escalate to security team
```

#### 6. **Rapid Pattern Access**
```
Risk Trigger: >20 records in 5 minutes
Risk Score: 40-60 points
Response: Throttle requests, log suspicious activity
```

#### 7. **Privilege Escalation**
```
Risk Trigger: Doctor attempts to modify own permissions
Risk Score: 90+ points (critical)
Response: Immediate account suspension, audit trail review
```

#### 8. **Credential Misuse**
```
Risk Trigger: Multiple login failures followed by success from new IP
Risk Score: 70+ points
Response: Password reset required, MFA enforcement
```

#### 9. **Data Exfiltration**
```
Risk Trigger: Export to personal email or external storage
Risk Score: 80+ points (critical)
Response: Block action, disable account
```

#### 10. **Abnormal Analysis Pattern**
```
Risk Trigger: Rare medical conditions, unusual record combinations
Risk Score: 30-50 points
Response: Manual review by compliance officer
```

### Risk Scoring Algorithm

```javascript
Base Risk Score Calculation:
├─ Per Threat Pattern: 0-100 points
├─ Aggregation: Sum of active threats
├─ Decay Function: 24-hour exponential decay
│   └─ Score reduced by 50% per day of inactivity
└─ Final Risk= min(aggregated_risk × decay_factor, 100)

Risk Levels:
├─ 0-20: GREEN (Normal)
├─ 21-40: YELLOW (Elevated)
├─ 41-60: ORANGE (High)
├─ 61-80: RED (Very High)
└─ 81-100: CRITICAL (Immediate Action)
```

### Automatic Recommendations

```
Risk > 40:   → Manual review required
Risk > 60:   → Restrict account (read-only mode)
Risk > 80:   → Suspend account immediately
Risk > 90:   → Escalate to law enforcement
```

### Insider Threat Query Examples

```javascript
// Find all high-risk users in past 7 days
GET /api/healthcare/insider-threat/high-risk?days=7

// Get threat details for specific user
GET /api/healthcare/insider-threat/user/:userId

// Generate threat report
GET /api/healthcare/insider-threat/report?startDate=2024-01-01&endDate=2024-01-31
```

---

## Database Configuration

### MongoDB Collections & Indexes

**Collection: patients**
```javascript
db.patients.createIndex({ mrn: 1 }, { unique: true })
db.patients.createIndex({ userId: 1 })
db.patients.createIndex({ authorizedDoctors._id: 1 })
db.patients.createIndex({ createdAt: 1 })
```

**Collection: doctors**
```javascript
db.doctors.createIndex({ licenseNumber: 1 }, { unique: true })
db.doctors.createIndex({ userId: 1 })
db.doctors.createIndex({ patients._id: 1 })
db.doctors.createIndex({ createdAt: 1 })
```

**Collection: medicalRecords**
```javascript
db.medicalRecords.createIndex({ patientId: 1, recordDate: -1 })
db.medicalRecords.createIndex({ doctorId: 1 })
db.medicalRecords.createIndex({ createdAt: 1 })
db.medicalRecords.createIndex({ "accessLog.userId": 1 })
```

**Collection: complianceLogs** (CRITICAL)
```javascript
db.complianceLogs.createIndex({ timestamp: -1 })
db.complianceLogs.createIndex({ eventType: 1, timestamp: -1 })
db.complianceLogs.createIndex({ userId: 1, timestamp: -1 })
db.complianceLogs.createIndex({ patientId: 1, timestamp: -1 })
db.complianceLogs.createIndex({ severity: 1, timestamp: -1 })

// Retention Policy: Keep for 6 years
db.complianceLogs.createIndex({ timestamp: 1 }, { 
  expireAfterSeconds: 189216000  // 6 years
})
```

**Collection: insiderThreatLogs**
```javascript
db.insiderThreatLogs.createIndex({ timestamp: -1 })
db.insiderThreatLogs.createIndex({ userId: 1, timestamp: -1 })
db.insiderThreatLogs.createIndex({ threatType: 1 })
db.insiderThreatLogs.createIndex({ riskScore: -1 })
db.insiderThreatLogs.createIndex({ status: 1 })
```

**Collection: consents**
```javascript
db.consents.createIndex({ patientId: 1, status: 1 })
db.consents.createIndex({ authorizedRecipient: 1 })
db.consents.createIndex({ expirationDate: 1 })
```

### Backup & Recovery

**Automated Backups:**
```bash
# Daily incremental backup to AWS S3
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/secureSphere" \
          --archive="backup-$(date +%Y%m%d).archive" \
          --gzip

# Upload to S3 with encryption
aws s3 cp backup-*.archive s3://secureSphere-backups/ \
        --sse=AES256 \
        --storage-class=GLACIER
```

**Point-in-Time Recovery:**
```bash
# Restore from specific timestamp
mongorestore --uri="mongodb+srv://..." \
             --archive="backup-20240115.archive" \
             --gzip \
             --oplogReplay
```

### Retention Enforcement

```javascript
// Compliance logs: 6 years retention (mandatory HIPAA)
// Patient records: 7 years (HIPAA minimum) + 1 year after patient death
// Consent records: Until explicitly revoked or expired + 3 years
// Access logs: 2 years (faster query performance)
// Insider threat logs: 1 year (investigation window)

// Monthly purge job:
db.accessLogs.deleteMany({ 
  createdAt: { $lt: Date.now() - (2 * 365 * 24 * 60 * 60 * 1000) }
})
```

---

## Performance Optimization

### Chunked Upload Strategy

**For Medical Files (up to 100MB):**

1. **Client-Side Chunking:**
   ```
   File Size: 100MB
   Chunk Size: 5MB
   Total Chunks: 20
   Chunk Upload Time: ~2 seconds each
   Total Upload Time: ~40 seconds + retry logic
   ```

2. **Resumable Uploads:**
   ```
   POST /api/files/chunked/init → Returns uploadId
   POST /api/files/chunked/upload → Upload individual chunks
   GET /api/files/chunked/progress/:uploadId → Get status
   POST /api/files/chunked/finalize → Assemble and encrypt
   ```

3. **Retry Logic:**
   ```javascript
   Initial Delay: 1 second
   Max Retries: 3
   Exponential Backoff: delay *= 2
   Circuit Breaker: Stop after 5 consecutive failures
   ```

### Streaming Encryption

**Memory-Efficient Processing:**

```
File Stream (100MB)
    ↓
[64KB Chunks] ← Read into memory
    ↓
[AES-256-GCM Encryption] ← Encrypt chunk
    ↓
[Write to Storage] ← Stream to database/disk
    ↓
[Cleanup Chunk] ← Free memory
    ↓
[Next 64KB Chunk]
```

**Memory Usage Estimate:**
```
- Fixed: 20MB (Node.js overhead)
- Streaming: 64KB per chunk
- IV/Metadata: 32 bytes per chunk
- Total: ~20MB (constant, not 100MB)
```

### Query Optimization

```javascript
// ❌ SLOW: Full collection scan
db.medicalRecords.find({ patientId: "..." })

// ✅ FAST: Indexed query
db.medicalRecords.find({ patientId: "..." }).sort({ recordDate: -1 })

// ❌ SLOW: Complex regex on unindexed field
db.complianceLogs.find({ description: /malware/ })

// ✅ FAST: Compound index query
db.complianceLogs.find({ 
  severity: "CRITICAL", 
  timestamp: { $gte: startDate }
}).sort({ timestamp: -1 })
```

### Rate Limiting Configuration

```javascript
// 3-Tier Rate Limiting:

// Tier 1: Per-user per-15-min (100 requests)
// Tier 2: Strict mode (10 requests per minute during peak)
// Tier 3: Global protection (1000 requests per second)

// Health Check: 3/second (excludes from rate limit)
// Login Attempts: 5/15min (prevents brute force)
```

---

## Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Environment Configuration
[ ] Set NODE_ENV=production
[ ] Set all required HIPAA_* variables
[ ] Set encryption key from AWS Secrets Manager
[ ] Disable debug logging (security risk)
[ ] Enable HTTPS/TLS 1.3
[ ] Restrict CORS_ORIGIN to actual domain

# 2. Database Configuration
[ ] Enable MongoDB authentication
[ ] Set up replica set for failover
[ ] Enable encryption at rest
[ ] Configure automated backups
[ ] Test point-in-time recovery
[ ] Verify all indexes are created
[ ] Set TTL for compliance logs

# 3. Security Configuration
[ ] Install SSL certificate (Let's Encrypt or AWS ACM)
[ ] Enable HSTS headers
[ ] Configure WAF (AWS WAF, CloudFlare)
[ ] Set up DDoS protection
[ ] Enable VPN for admin access
[ ] Configure fail2ban for brute force protection

# 4. Monitoring & Logging
[ ] Set up CloudWatch/DataDog monitoring
[ ] Configure alert thresholds
[ ] Set up centralized logging (ELK, CloudWatch)
[ ] Enable access logging
[ ] Test alert notification channels

# 5. Compliance Verification
[ ] Run security audit
[ ] Verify HIPAA compliance checklist
[ ] Test encryption key rotation
[ ] Validate audit log completeness
[ ] Review role-based access control

# 6. Load Testing
[ ] Simulate 1000 concurrent users
[ ] Test streaming upload with 100MB files
[ ] Verify insider threat detection under load
[ ] Check database connection pooling
```

### AWS Deployment Architecture

```
                    ┌─────────────────────────────────────┐
                    │   CloudFront (CDN)                  │
                    │   - SSL/TLS Termination             │
                    │   - DDoS Protection                 │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────┴──────────────────┐
                    │     AWS Application Load        │
                    │     Balancer (ALB)              │
                    │     - HTTPS listener            │
                    │     - Health checks             │
                    └──────────────┬──────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
    ┌───▼───┐               ┌─────▼─────┐            ┌───────▼───┐
    │  EC2  │               │   EC2     │            │   EC2     │
    │Server │               │ Server    │            │ Server    │
    │ Pod-1 │               │ Pod-2     │            │ Pod-3     │
    └───────┘               └───────────┘            └───────────┘
        │                          │                      │
        └──────────────────────────┼──────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                │   AWS RDS MongoDB Cluster           │
                │   - Multi-AZ failover               │
                │   - Encryption at rest              │
                │   - Automated backups to S3         │
                └─────────────────────────────────────┘
```

### Kubernetes Deployment (Alternative)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secureSphere-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secureSphere-api
  template:
    metadata:
      labels:
        app: secureSphere-api
    spec:
      containers:
      - name: secureSphere-api
        image: secureSphere:v1.0.0
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: HIPAA_LOG_RETENTION_YEARS
          value: "6"
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: secureSphere-secrets
              key: encryption-key
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Monitoring & Auditing

### Key Metrics to Monitor

```javascript
// Application Metrics
- Response Time: p50, p95, p99 latencies
- Error Rate: % of 4xx/5xx responses
- Throughput: Requests per second
- Active Users: Concurrent connections

// Security Metrics
- Failed Authentication Attempts: Detect brute force
- Unauthorized Access Attempts: Early warning of attack
- Insider Threat Incidents: Risk score distribution
- Encryption Errors: Key rotation issues

// Database Metrics
- Query Latency: Index effectiveness
- Connection Pool Usage: Capacity planning
- Replication Lag: Data consistency
- Backup Success Rate: Recovery readiness

// HIPAA Compliance Metrics
- Compliance Log Volume: Audit trail completeness
- Access Denial Rate: Authorization effectiveness
- User Session Timeout: Security enforcement
- Encryption Key Rotation Interval: Key management
```

### Alerting Thresholds

```javascript
// CRITICAL (Page On-Call)
- Insider Threat Risk Score > 80
- Database Connection Pool > 90%
- Encryption Key Rotation Failure
- Compliance Log Flush Failure
- Authentication Service Down

// HIGH (Email/Slack)
- Unauthorized Access Attempts > 10/min
- Response Time p99 > 5 seconds
- Error Rate > 1%
- Database Replication Lag > 10 seconds

// MEDIUM (Dashboard only)
- User Session Timeout Disabled
- Rate Limit Triggered > 5x/hour
- Insider Threat Risk Score > 60
```

### Audit Log Schema

```javascript
{
  _id: ObjectId,
  timestamp: ISO8601,
  eventId: UUID,
  eventType: "DATA_ACCESS|MODIFICATION|DELETION|EXPORT|...",
  severity: "INFO|WARNING|ALERT|CRITICAL",
  
  actor: {
    userId: UUID,
    role: "PATIENT|DOCTOR|ADMIN",
    email: String,
    ipAddress: String,
    userAgent: String,
    location: { latitude, longitude }
  },
  
  subject: {
    type: "PATIENT|MEDICAL_RECORD|FILE|CONSENT",
    patientId: UUID,
    mrn: String,
    recordId: UUID
  },
  
  action: {
    type: String,
    description: String,
    resourceId: UUID,
    oldValue: Mixed,  // For modifications
    newValue: Mixed   // For modifications
  },
  
  result: {
    outcome: "SUCCESS|FAILURE|PARTIAL|BLOCKED",
    reason: String,  // Why action was taken/blocked
    statusCode: Number
  },
  
  security: {
    encrypted: Boolean,
    encryptionMethod: "AES-256-GCM",
    integrityChecked: Boolean,
    suspiciousIndicators: [String]
  }
}
```

---

## Data Retention & Purge Policies

### Retention Schedule

```javascript
// HIPAA Mandatory Retention
Compliance Logs:        6 years  (HIPAA requirement)
Patient Records:        7 years  (HIPAA minimum) + 1 year after death
Medical Records:        7 years  (Clinical standard)
Consent Forms:          Duration + 3 years after expiration

// Operational Retention
Access Logs:            2 years  (Compliance queries)
Insider Threat Logs:    1 year   (Investigation window)
Failed Auth Logs:       90 days  (Security review)
Session Logs:           30 days  (Performance analysis)
```

### Automated Purge Process

```javascript
// Runs daily at 2 AM UTC (off-peak)
async function purgeExpiredData() {
  const now = Date.now();
  
  // 1. Archive to cold storage (Glacier)
  const sixYearsAgo = now - (6 * 365 * 24 * 60 * 60 * 1000);
  const archivedLogs = await ComplianceLog.find({
    timestamp: { $lt: sixYearsAgo }
  });
  
  await S3.putObject({
    Bucket: 'secureSphere-archive',
    Key: `compliance-logs/${date}.archive.gz`,
    Body: gzip(JSON.stringify(archivedLogs)),
    ServerSideEncryption: 'AES256'
  });
  
  // 2. Delete from primary database
  await ComplianceLog.deleteMany({
    timestamp: { $lt: sixYearsAgo }
  });
  
  // 3. Log purge action
  await auditLog({
    eventType: 'DATA_DELETION',
    action: 'Automated Purge',
    recordsDeleted: archivedLogs.length,
    reason: 'Retention Policy Enforcement'
  });
}
```

### Legal Hold

```javascript
// When investigating incident, prevent purge:
await ComplianceLog.updateMany(
  { patientId: suspectPatientId },
  { legalHold: true, holdReason: "Investigation #INV-2024-001" }
);

// Modify purge to skip legal holds:
if (!record.legalHold) {
  await record.deleteOne();
}
```

---

## Incident Response

### Breach Notification Protocol

**Upon Detection of Breach:**

```
1. IMMEDIATE (0 minutes)
   └─ Disable affected user account
   └─ Block data access for 30 minutes (incident investigation)
   └─ Create incident ticket (automated)
   
2. URGENT (5 minutes)
   └─ Page on-call security team
   └─ Notify HIPAA Privacy Officer
   └─ Begin forensic data collection
   
3. SHORT-TERM (1 hour)
   └─ Determine scope (# patients affected)
   └─ Contain incident (firewall rules)
   └─ Document all actions taken
   
4. MEDIUM-TERM (24 hours)
   └─ Complete forensic analysis
   └─ Draft breach notification
   └─ Contact affected individuals
   
5. LONG-TERM (30 days)
   └─ Report to HHS (if >500 affected)
   └─ Root cause analysis
   └─ Implement preventive measures
   └─ Post-incident security review
```

### Example: Unauthorized Access Detected

```
Scenario: High-risk insider threat detected (Risk Score: 85)

Timeline:
├─ T+0s: insiderThreatMiddleware flags suspicious access pattern
│        - User accessed 60 patient records in 15 minutes
│        - Upload of 800MB to external storage
│        - Access outside normal hours (3:45 AM)
│        - Geographic anomaly detected (impossible travel)
│
├─ T+1s: System Actions
│        - Account marked for immediate review
│        - All pending requests from user killed
│        - ComplianceLog entries created with CRITICAL severity
│        - InsiderThreatLog entry created (status: PENDING)
│        - Alert sent to security team
│
├─ T+5s: Manual Intervention
│        - Security officer reviews threat details
│        - Confirms unauthorized access
│        - Disables user account
│        - Initiates forensic data collection
│
├─ T+1h: Investigation Phase
│        - Query all ComplianceLogs for user over past 7 days
│        - Identify pattern of escalating suspicious activity
│        - Check if data was exfiltrated
│        - Document findings in InsiderThreatLog
│
└─ T+24h: Post-Incident
           - Determine if patient data was compromised
           - Notify affected patients (regulatory requirement)
           - File breach report with HHS if necessary
           - Update security policies
```

### Forensic Data Collection

```javascript
// Automated forensic collection on threat detection
async function collectForensics(userId, incidentId) {
  const forensicsWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
  const startTime = Date.now() - forensicsWindow;
  
  const forensics = {
    userId,
    incidentId,
    collectedAt: new Date(),
    data: {
      // All actions by user
      userActions: await ComplianceLog.find({
        'actor.userId': userId,
        timestamp: { $gte: startTime }
      }).sort({ timestamp: 1 }),
      
      // All threat incidents for user
      threatHistory: await InsiderThreatLog.find({
        userId,
        timestamp: { $gte: startTime }
      }).sort({ timestamp: -1 }),
      
      // Failed auth attempts
      failedAuths: await ComplianceLog.find({
        'actor.userId': userId,
        eventType: 'AUTHENTICATION',
        result: 'FAILURE',
        timestamp: { $gte: startTime }
      }),
      
      // Access denied incidents
      deniedAccess: await ComplianceLog.find({
        'actor.userId': userId,
        result: 'BLOCKED',
        timestamp: { $gte: startTime }
      })
    }
  };
  
  // Archive to cold storage
  await S3.putObject({
    Bucket: 'secureSphere-forensics',
    Key: `incident-${incidentId}/forensics.json.gz`,
    Body: gzip(JSON.stringify(forensics)),
    ServerSideEncryption: 'AES256'
  });
  
  return forensics;
}
```

---

## Quick Deployment Commands

### Docker Deployment

```bash
# Build image
docker build -t secureSphere:v1.0.0 .

# Run with HIPAA configuration
docker run -d \
  --name secureSphere-api \
  -p 443:3000 \
  -e NODE_ENV=production \
  -e HIPAA_LOG_RETENTION_YEARS=6 \
  -e ENCRYPTION_KEY=$(aws secretsmanager get-secret-value --secret-id secureSphere-encryption-key --query SecretString --output text) \
  --restart always \
  secureSphere:v1.0.0
```

### Environment Variables (Production)

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/secureSphere?retryWrites=true&w=majority
DB_REPLICA_SET=rs0

# Security
ENCRYPTION_KEY=<from AWS Secrets Manager>
JWT_SECRET=<from AWS Secrets Manager>
JWT_EXPIRY=7d

# HIPAA Compliance
HIPAA_LOG_RETENTION_YEARS=6
HIPAA_ALERT_THRESHOLD=70
HIPAA_LOG_FLUSH_INTERVAL=300000

# Security Headers
ENFORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# CORS (restrict in production)
CORS_ORIGIN=https://secureSphere.yourdomain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Threat Detection
THREAT_DETECTION_ENABLED=true
THREAT_RISK_THRESHOLD=60
THREAT_AUTO_SUSPEND_THRESHOLD=80

# Logging
LOG_LEVEL=warn
LOG_FORMAT=json
```

---

## Support & Resources

- **HIPAA Compliance**: https://www.hhs.gov/hipaa/for-professionals/index.html
- **MongoDB Security**: https://docs.mongodb.com/manual/security/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Incident Response Planning**: https://www.cisa.gov/incident-response
- **Data Breach Notification Laws**: https://www.foley.com/en/insights/publications/2023/10/state-data-breach-notification-laws-2023

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready
