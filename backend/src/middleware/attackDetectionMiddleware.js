/**
 * Attack Detection Middleware
 * Detects and logs suspicious patterns:
 * - Multiple failed authentication attempts
 * - Rapid sequential requests
 * - Unusual file upload patterns
 * - Suspicious data access patterns
 */

/**
 * Attack Detection Service
 * Tracks and identifies suspicious patterns
 */
export class AttackDetectionService {
  constructor() {
    this.failedAttempts = new Map(); // IP -> [{ timestamp, endpoint }]
    this.requestPatterns = new Map(); // IP -> [{ timestamp, method, path }]
    this.uploadPatterns = new Map(); // IP -> [{ timestamp, size, count }]
    this.suspiciousIPs = new Map(); // IP -> { riskScore, lastSeen, incidents }
    
    // Configuration
    this.FAILED_AUTH_THRESHOLD = 5; // Failed attempts before flag
    this.FAILED_AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes
    this.RAPID_REQUEST_THRESHOLD = 100; // Requests in time window
    this.RAPID_REQUEST_WINDOW = 60 * 1000; // 1 minute
    this.UPLOAD_THRESHOLD = 5; // Uploads in time window
    this.UPLOAD_WINDOW = 60 * 60 * 1000; // 1 hour
    this.ANOMALY_DECAY = 60 * 60 * 1000; // 1 hour to decay risk score
    
    // Cleanup old data periodically
    setInterval(() => this.cleanup(), 30 * 60 * 1000); // Every 30 minutes
  }

  /**
   * Record failed authentication attempt
   */
  recordFailedAuth(ip, endpoint) {
    if (!this.failedAttempts.has(ip)) {
      this.failedAttempts.set(ip, []);
    }
    
    const attempts = this.failedAttempts.get(ip);
    const now = Date.now();
    
    // Remove old attempts outside the window
    const filtered = attempts.filter(a => now - a.timestamp < this.FAILED_AUTH_WINDOW);
    filtered.push({ timestamp: now, endpoint });
    this.failedAttempts.set(ip, filtered);

    // Check if threshold exceeded
    if (filtered.length >= this.FAILED_AUTH_THRESHOLD) {
      this.recordIncident(ip, 'BRUTE_FORCE_ATTEMPT', {
        failedAttempts: filtered.length,
        endpoint,
        riskScore: 8
      });
      return true; // Detected brute force
    }

    return false;
  }

  /**
   * Record successful authentication (clears failed attempts)
   */
  recordSuccessfulAuth(ip) {
    this.failedAttempts.delete(ip);
  }

  /**
   * Record suspicious request pattern
   */
  recordRequest(ip, method, path) {
    if (!this.requestPatterns.has(ip)) {
      this.requestPatterns.set(ip, []);
    }
    
    const patterns = this.requestPatterns.get(ip);
    const now = Date.now();
    
    // Remove old requests outside the window
    const filtered = patterns.filter(p => now - p.timestamp < this.RAPID_REQUEST_WINDOW);
    filtered.push({ timestamp: now, method, path });
    this.requestPatterns.set(ip, filtered);

    // Check for rapid requests (potential DDoS)
    if (filtered.length >= this.RAPID_REQUEST_THRESHOLD) {
      this.recordIncident(ip, 'RAPID_REQUEST_PATTERN', {
        requestCount: filtered.length,
        timeWindow: this.RAPID_REQUEST_WINDOW,
        riskScore: 7
      });
      return true; // Detected rapid requests
    }

    return false;
  }

  /**
   * Record file upload
   */
  recordUpload(ip, fileSize) {
    if (!this.uploadPatterns.has(ip)) {
      this.uploadPatterns.set(ip, []);
    }
    
    const uploads = this.uploadPatterns.get(ip);
    const now = Date.now();
    
    // Remove old uploads outside the window
    const filtered = uploads.filter(u => now - u.timestamp < this.UPLOAD_WINDOW);
    filtered.push({ timestamp: now, size: fileSize, count: filtered.length + 1 });
    this.uploadPatterns.set(ip, filtered);

    // Check for excessive uploads
    if (filtered.length >= this.UPLOAD_THRESHOLD) {
      const totalSize = filtered.reduce((sum, u) => sum + u.size, 0);
      
      // Check if uploads exceed 1GB in 1 hour
      if (totalSize > 1024 * 1024 * 1024) {
        this.recordIncident(ip, 'EXCESSIVE_UPLOAD', {
          uploadCount: filtered.length,
          totalSize: totalSize / (1024 * 1024), // MB
          riskScore: 6
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Record suspicious incident
   */
  recordIncident(ip, incidentType, details) {
    if (!this.suspiciousIPs.has(ip)) {
      this.suspiciousIPs.set(ip, {
        riskScore: 0,
        lastSeen: Date.now(),
        incidents: []
      });
    }

    const record = this.suspiciousIPs.get(ip);
    record.lastSeen = Date.now();
    record.riskScore += details.riskScore || 5;
    record.incidents.push({
      type: incidentType,
      timestamp: Date.now(),
      details
    });

    // Log incident
    console.warn(`🚨 SECURITY ALERT: ${incidentType}`);
    console.warn(`  IP: ${ip}`);
    console.warn(`  Risk Score: ${record.riskScore}`);
    console.warn(`  Details:`, JSON.stringify(details, null, 2));

    return record.riskScore;
  }

  /**
   * Get risk score for IP
   */
  getRiskScore(ip) {
    const record = this.suspiciousIPs.get(ip);
    if (!record) return 0;

    // Decay risk score over time
    const timeSinceLastSeen = Date.now() - record.lastSeen;
    const decayFactor = Math.exp(-timeSinceLastSeen / this.ANOMALY_DECAY);
    
    return record.riskScore * decayFactor;
  }

  /**
   * Check if IP is suspicious
   */
  isSuspicious(ip, threshold = 5) {
    return this.getRiskScore(ip) >= threshold;
  }

  /**
   * Get incidents for IP
   */
  getIncidents(ip) {
    const record = this.suspiciousIPs.get(ip);
    return record ? record.incidents : [];
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Cleanup failed attempts
    for (const [ip, attempts] of this.failedAttempts) {
      if (attempts.length === 0 || now - attempts[attempts.length - 1].timestamp > maxAge) {
        this.failedAttempts.delete(ip);
      }
    }

    // Cleanup request patterns
    for (const [ip, patterns] of this.requestPatterns) {
      if (patterns.length === 0 || now - patterns[patterns.length - 1].timestamp > maxAge) {
        this.requestPatterns.delete(ip);
      }
    }

    // Cleanup upload patterns
    for (const [ip, uploads] of this.uploadPatterns) {
      if (uploads.length === 0 || now - uploads[uploads.length - 1].timestamp > maxAge) {
        this.uploadPatterns.delete(ip);
      }
    }

    // Cleanup suspicious IPs with decayed scores
    for (const [ip, record] of this.suspiciousIPs) {
      if (now - record.lastSeen > maxAge) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }

  /**
   * Get all suspicious IPs
   */
  getSuspiciousIPs(threshold = 5) {
    const suspicious = [];
    for (const [ip, record] of this.suspiciousIPs) {
      const riskScore = this.getRiskScore(ip);
      if (riskScore >= threshold) {
        suspicious.push({
          ip,
          riskScore,
          incidentCount: record.incidents.length,
          lastSeen: record.lastSeen
        });
      }
    }
    return suspicious.sort((a, b) => b.riskScore - a.riskScore);
  }
}

// Global attack detection instance
export const attackDetection = new AttackDetectionService();

/**
 * Attack Detection Middleware
 * Integrates attack detection with Express
 */
export const attackDetectionMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Record request for pattern analysis
  attackDetection.recordRequest(ip, req.method, req.path);
  
  // Make attack detection available to route handlers
  req.attackDetection = {
    recordFailedAuth: () => attackDetection.recordFailedAuth(ip, req.path),
    recordSuccessfulAuth: () => attackDetection.recordSuccessfulAuth(ip),
    recordUpload: (size) => attackDetection.recordUpload(ip, size),
    getRiskScore: () => attackDetection.getRiskScore(ip),
    isSuspicious: (threshold) => attackDetection.isSuspicious(ip, threshold),
    getIncidents: () => attackDetection.getIncidents(ip)
  };

  next();
};

/**
 * Endpoint to retrieve security status
 * Protection: Admin only
 */
export const getSecurityStatus = (req, res) => {
  // In production, verify admin role
  try {
    const suspiciousIPs = attackDetection.getSuspiciousIPs();
    
    res.json({
      success: true,
      data: {
        suspiciousIPs,
        totalTrackedIPs: attackDetection.suspiciousIPs.size,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security status',
      error: error.message
    });
  }
};

export default {
  AttackDetectionService,
  attackDetection,
  attackDetectionMiddleware,
  getSecurityStatus
};
