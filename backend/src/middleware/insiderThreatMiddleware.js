import { ComplianceLog, InsiderThreatLog, Patient } from '../models/HealthcareModels.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Insider Threat Detection Service for Healthcare
 * Detects suspicious behavior patterns indicating potential insider threats
 * HIPAA compliant with extensive logging
 */

export class InsiderThreatDetectionService {
  constructor() {
    this.userAccessPatterns = new Map(); // Track user access patterns
    this.suspiciousBehaviors = new Map(); // IP -> behaviors
    this.bulkAccessThreshold = 50; // Access > 50 records in 1 hour = suspicious
    this.bulkDownloadThreshold = 500 * 1024 * 1024; // 500MB in 1 hour
    this.rapidAccessThreshold = 20; // 20 records in 5 minutes
    this.abnormalHoursThreshold = 3; // 3+ accesses between 2-5 AM
    this.maxGeolocationDistance = 1000; // km - warn if user in different country
    this.riskScoreThreshold = 60; // Alert if score > 60
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour

    // Start cleanup job
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Record user access to patient data
   */
  async recordAccess(userId, patientId, action, metadata = {}) {
    try {
      const key = `${userId}`;
      
      if (!this.userAccessPatterns.has(key)) {
        this.userAccessPatterns.set(key, {
          accesses: [],
          lastLocation: null,
          lastAccessTime: null,
          totalBytesDownloaded: 0,
          department: metadata.department
        });
      }

      const pattern = this.userAccessPatterns.get(key);
      const now = Date.now();

      // Record access
      pattern.accesses.push({
        patientId,
        action,
        timestamp: now,
        location: metadata.location,
        ipAddress: metadata.ipAddress
      });

      // Track bytes downloaded
      if (action === 'download' && metadata.fileSize) {
        pattern.totalBytesDownloaded += metadata.fileSize;
      }

      pattern.lastAccessTime = now;
      pattern.lastLocation = metadata.location;

      // Check for suspicious patterns
      const threats = await this.analyzeThreatPatterns(userId, pattern);

      if (threats.length > 0) {
        await this.logInsiderThreats(userId, threats, patientId, metadata);
      }

      return {
        accessRecorded: true,
        threatsDetected: threats.length > 0,
        threats
      };
    } catch (error) {
      console.error('Error recording access:', error);
      throw error;
    }
  }

  /**
   * Analyze access patterns for suspicious behavior
   */
  async analyzeThreatPatterns(userId, pattern) {
    const threats = [];
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // 1. Excessive Access - More than threshold in 1 hour
    const recentAccesses = pattern.accesses.filter(a => a.timestamp > oneHourAgo);
    if (recentAccesses.length > this.bulkAccessThreshold) {
      threats.push({
        type: 'EXCESSIVE_ACCESS',
        riskScore: Math.min(100, 30 + (recentAccesses.length - this.bulkAccessThreshold) * 2),
        indicator: `${recentAccesses.length} accesses in last hour (threshold: ${this.bulkAccessThreshold})`,
        severity: 'HIGH'
      });
    }

    // 2. Rapid Access Pattern - Quick successive accesses
    const rapidAccesses = pattern.accesses.filter(a => a.timestamp > fiveMinutesAgo);
    if (rapidAccesses.length > this.rapidAccessThreshold) {
      threats.push({
        type: 'ABNORMAL_ACCESS_PATTERN',
        riskScore: Math.min(100, 40 + (rapidAccesses.length - this.rapidAccessThreshold) * 3),
        indicator: `${rapidAccesses.length} accesses in 5 minutes (threshold: ${this.rapidAccessThreshold})`,
        severity: 'HIGH'
      });
    }

    // 3. Bulk Download Detection
    const hourlyDownload = pattern.totalBytesDownloaded;
    if (hourlyDownload > this.bulkDownloadThreshold) {
      threats.push({
        type: 'BULK_EXTRACTION',
        riskScore: Math.min(100, 50 + (hourlyDownload / this.bulkDownloadThreshold) * 20),
        indicator: `${(hourlyDownload / (1024 * 1024)).toFixed(2)}MB downloaded (threshold: 500MB/hour)`,
        severity: 'CRITICAL'
      });
    }

    // 4. Abnormal Hours Access
    const abnormalHoursAccesses = recentAccesses.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 2 && hour <= 5; // 2-5 AM
    });
    if (abnormalHoursAccesses.length >= this.abnormalHoursThreshold) {
      threats.push({
        type: 'ABNORMAL_HOURS',
        riskScore: 35,
        indicator: `${abnormalHoursAccesses.length} accesses during abnormal hours (2-5 AM)`,
        severity: 'MEDIUM'
      });
    }

    // 5. Geographic Anomaly
    if (pattern.lastLocation && pattern.accesses.length > 1) {
      const previousLocation = pattern.accesses[pattern.accesses.length - 2]?.location;
      if (previousLocation && this.isGeographicAnomaly(previousLocation, pattern.lastLocation)) {
        threats.push({
          type: 'GEO_ANOMALY',
          riskScore: 45,
          indicator: `Impossible travel: ${previousLocation} to ${pattern.lastLocation}`,
          severity: 'HIGH'
        });
      }
    }

    // 6. Unauthorized Data Access (accessing patients outside specialization)
    if (pattern.department) {
      const threatFound = await this.checkUnauthorizedAccess(userId, recentAccesses, pattern.department);
      if (threatFound) {
        threats.push(threatFound);
      }
    }

    return threats;
  }

  /**
   * Check if geographic change is impossible (e.g., different countries in < 2 hours)
   */
  isGeographicAnomaly(location1, location2) {
    if (!location1 || !location2) return false;
    
    // Calculate approximate distance between two coordinates
    if (location1.coordinates && location2.coordinates) {
      const distance = this.calculateDistance(
        location1.coordinates.latitude,
        location1.coordinates.longitude,
        location2.coordinates.latitude,
        location2.coordinates.longitude
      );
      
      // More than maxGeolocationDistance in 1 hour = anomaly
      return distance > this.maxGeolocationDistance;
    }
    
    return false;
  }

  /**
   * Haversine formula for distance calculation
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check for unauthorized access outside user's scope
   */
  async checkUnauthorizedAccess(userId, recentAccesses, userDepartment) {
    try {
      for (const access of recentAccesses) {
        // Check if user should have access to this patient
        const patient = await Patient.findById(access.patientId);
        
        if (!patient) continue;

        // Check if user is authorized
        const authorized = patient.authorizedDoctors?.some(
          ad => ad.doctorId.toString() === userId
        );

        if (!authorized) {
          return {
            type: 'UNAUTHORIZED_ACCESS',
            riskScore: 80,
            indicator: `Accessed patient ${patient.mrn} without authorization`,
            severity: 'CRITICAL'
          };
        }
      }
    } catch (error) {
      console.error('Error checking unauthorized access:', error);
    }

    return null;
  }

  /**
   * Log insider threats to compliance system
   */
  async logInsiderThreats(userId, threats, patientId, metadata) {
    try {
      for (const threat of threats) {
        const threatId = `THREAT-${uuidv4()}`;
        
        // Calculate aggregate risk score
        const totalRiskScore = threats.reduce((sum, t) => sum + t.riskScore, 0) / threats.length;

        // Create threat log
        const threatLog = new InsiderThreatLog({
          threatId,
          suspectedUser: {
            userId,
            name: metadata.userName,
            role: metadata.userRole,
            department: metadata.department
          },
          threatType: threat.type,
          riskScore: Math.min(100, totalRiskScore),
          indicators: threats.map(t => ({
            description: t.indicator,
            severity: t.severity
          })),
          affectedPatients: patientId ? [{
            patientId,
            recordsAccessed: 1,
            accessedAt: new Date()
          }] : [],
          status: totalRiskScore > this.riskScoreThreshold ? 'INVESTIGATING' : 'PENDING'
        });

        await threatLog.save();

        // Also log to compliance logs
        const complianceLog = new ComplianceLog({
          eventId: `COMPLIANCE-${uuidv4()}`,
          eventType: 'INSIDER_THREAT_DETECTED',
          severity: totalRiskScore > 75 ? 'CRITICAL' : 'ALERT',
          actor: {
            userId,
            role: metadata.userRole,
            email: metadata.email
          },
          subject: {
            patientId
          },
          action: {
            type: threat.type,
            description: threat.indicator
          },
          suspiciousIndicators: threats.map(t => t.type),
          ipAddress: metadata.ipAddress,
          location: metadata.location
        });

        await complianceLog.save();

        // If high risk, escalate
        if (totalRiskScore > this.riskScoreThreshold) {
          console.warn(`🚨 INSIDER THREAT ALERT: User ${userId} - Risk Score: ${totalRiskScore}`);
          // Could send email alert to security team here
        }
      }
    } catch (error) {
      console.error('Error logging insider threats:', error);
    }
  }

  /**
   * Get threat report for a user
   */
  async getUserThreatReport(userId) {
    try {
      const threats = await InsiderThreatLog.find({ 'suspectedUser.userId': userId })
        .sort({ timestamp: -1 })
        .limit(100);

      const riskAssessment = threats.length > 0
        ? threats.reduce((sum, t) => sum + t.riskScore, 0) / threats.length
        : 0;

      return {
        userId,
        totalThreatsDetected: threats.length,
        riskLevel: riskAssessment > 70 ? 'CRITICAL' : riskAssessment > 40 ? 'HIGH' : 'MEDIUM',
        riskScore: riskAssessment,
        threats: threats.slice(0, 10),
        recommendations: this.generateRecommendations(threats, riskAssessment)
      };
    } catch (error) {
      console.error('Error getting threat report:', error);
      throw error;
    }
  }

  /**
   * Generate security recommendations based on threats
   */
  generateRecommendations(threats, riskScore) {
    const recommendations = [];

    if (riskScore > 80) {
      recommendations.push('IMMEDIATE: Suspend user account and investigate');
      recommendations.push('IMMEDIATE: Audit all recent data access');
      recommendations.push('IMMEDIATE: Notify security team');
    } else if (riskScore > 60) {
      recommendations.push('Restrict user access temporarily');
      recommendations.push('Schedule security interview');
      recommendations.push('Increase audit log monitoring');
    }

    if (threats.some(t => t.threatType === 'BULK_EXTRACTION')) {
      recommendations.push('Review all data export requests from this user');
    }

    if (threats.some(t => t.threatType === 'GEO_ANOMALY')) {
      recommendations.push('Verify user location and device authentication');
    }

    if (threats.some(t => t.threatType === 'ABNORMAL_HOURS')) {
      recommendations.push('Enable MFA for after-hours access');
    }

    return recommendations;
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    for (const [key, pattern] of this.userAccessPatterns) {
      // Clean up old accesses (older than 7 days)
      pattern.accesses = pattern.accesses.filter(a => a.timestamp > oneWeekAgo);
      
      // Remove user if no recent accesses
      if (pattern.accesses.length === 0) {
        this.userAccessPatterns.delete(key);
      }
    }
  }

  /**
   * Get all active threats
   */
  async getActivethreats() {
    try {
      const threats = await InsiderThreatLog.find({ 
        status: { $in: ['PENDING', 'INVESTIGATING'] }
      }).sort({ riskScore: -1 });

      return threats;
    } catch (error) {
      console.error('Error getting active threats:', error);
      throw error;
    }
  }
}

// Global instance
export const insiderThreatDetection = new InsiderThreatDetectionService();

/**
 * Middleware to integrate insider threat detection
 */
export const insiderThreatMiddleware = async (req, res, next) => {
  try {
    if (req.user) {
      // Attach threat detection to request
      req.insiderThreat = {
        recordAccess: async (patientId, action, metadata) => {
          return insiderThreatDetection.recordAccess(
            req.user.id,
            patientId,
            action,
            {
              ...metadata,
              ipAddress: req.ip,
              userRole: req.user.role,
              email: req.user.email,
              userName: req.user.username
            }
          );
        },
        getThreatReport: () => insiderThreatDetection.getUserThreatReport(req.user.id)
      };
    }
    next();
  } catch (error) {
    console.error('Error in insider threat middleware:', error);
    next();
  }
};

export default {
  InsiderThreatDetectionService,
  insiderThreatDetection,
  insiderThreatMiddleware
};
