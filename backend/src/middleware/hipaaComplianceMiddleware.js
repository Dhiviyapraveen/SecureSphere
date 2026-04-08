import { ComplianceLog } from '../models/HealthcareModels.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * HIPAA Compliance Logging Service
 * Maintains complete audit trail as required by HIPAA/Privacy Rule
 * 
 * HIPAA Requirements:
 * - Track who accessed what, when, where, and why
 * - Log all modifications to PHI (Protected Health Information)
 * - Retain logs for minimum 6 years
 * - Include access from external systems
 * - Document security incidents
 */

export class HIPAAComplianceLogger {
  constructor() {
    this.logBuffer = [];
    this.bufferSize = 100; // Batch insert after 100 logs
    this.flushInterval = 5 * 60 * 1000; // Flush every 5 minutes
    
    // Start periodic flush
    setInterval(() => this.flushBuffer(), this.flushInterval);
  }

  /**
   * Log data access (PRIMARY requirement)
   */
  async logDataAccess(userId, patientId, action, details = {}) {
    try {
      const eventId = `ACCESS-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'DATA_ACCESS',
        severity: 'INFO',
        actor: {
          userId,
          role: details.userRole,
          email: details.email
        },
        subject: {
          patientId,
          patientMRN: details.patientMRN,
          recordId: details.recordId,
          fileId: details.fileId
        },
        action: {
          type: action, // 'view', 'download', 'print', 'share'
          description: `User ${userId} performed ${action} on patient record`
        },
        result: 'SUCCESS',
        reasonForAccess: details.reasonForAccess || 'Patient Care',
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        location: details.location,
        suspiciousIndicators: [],
        encryptionUsed: details.encryptionUsed || true,
        dataClassification: details.confidentiality || 'CONFIDENTIAL'
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging data access:', error);
      throw error;
    }
  }

  /**
   * Log data modification
   */
  async logDataModification(userId, patientId, action, details = {}) {
    try {
      const eventId = `MODIFY-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'DATA_MODIFICATION',
        severity: 'WARNING',
        actor: {
          userId,
          role: details.userRole,
          email: details.email
        },
        subject: {
          patientId,
          recordId: details.recordId
        },
        action: {
          type: action, // 'create', 'update', 'edit'
          description: `Record modified: ${details.changes || 'See detailed log'}`
        },
        result: 'SUCCESS',
        reasonForAccess: details.reasonForAccess || 'Medical Update',
        ipAddress: details.ipAddress,
        dataClassification: 'HIGHLY_CONFIDENTIAL',
        detailedLog: {
          changedFields: details.changedFields || [],
          oldValues: details.oldValues,
          newValues: details.newValues
        }
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging data modification:', error);
      throw error;
    }
  }

  /**
   * Log data deletion or archival (IMPORTANT for compliance)
   */
  async logDataDeletion(userId, patientId, action, details = {}) {
    try {
      const eventId = `DELETE-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'DATA_DELETION',
        severity: 'ALERT',
        actor: {
          userId,
          role: details.userRole,
          email: details.email
        },
        subject: {
          patientId,
          recordId: details.recordId
        },
        action: {
          type: 'delete',
          description: `Record deleted/archived: ${details.reason || 'Per retention policy'}`
        },
        result: 'SUCCESS',
        reasonForAccess: details.reason,
        ipAddress: details.ipAddress,
        dataClassification: 'HIGHLY_CONFIDENTIAL',
        detailedLog: {
          recordsAffected: details.recordsAffected || 1,
          deletionMethod: details.deletionMethod || 'Secure Deletion',
          backupRetained: details.backupRetained || false
        }
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging data deletion:', error);
      throw error;
    }
  }

  /**
   * Log data export (HIGH RISK - requires approval)
   */
  async logDataExport(userId, patientId, action, details = {}) {
    try {
      const eventId = `EXPORT-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'DATA_EXPORT',
        severity: 'CRITICAL',
        actor: {
          userId,
          role: details.userRole,
          email: details.email
        },
        subject: {
          patientId,
          recordId: details.recordId
        },
        action: {
          type: 'export',
          description: `Large data export: ${details.method || 'Unknown'}`
        },
        result: 'SUCCESS',
        reasonForAccess: details.reasonForAccess || 'Patient Request',
        ipAddress: details.ipAddress,
        dataClassification: 'HIGHLY_CONFIDENTIAL',
        suspiciousIndicators: [
          'bulk_export',
          'large_data_transfer'
        ],
        detailedLog: {
          recordsExported: details.recordsExported || 'Unknown',
          dataSize: details.dataSize,
          exportFormat: details.exportFormat,
          destination: details.destination || 'Unknown',
          encryptionMethod: details.encryptionMethod || 'AES-256-GCM'
        }
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging data export:', error);
      throw error;
    }
  }

  /**
   * Log authentication events
   */
  async logAuthenticationEvent(userId, action, details = {}) {
    try {
      const eventId = `AUTH-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'AUTHENTICATION',
        severity: action === 'login_success' ? 'INFO' : 'WARNING',
        actor: {
          userId,
          email: details.email
        },
        action: {
          type: action,
          description: `Authentication ${action}`
        },
        result: details.result || 'SUCCESS',
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        location: details.location,
        suspiciousIndicators: details.suspiciousIndicators || []
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging authentication:', error);
      throw error;
    }
  }

  /**
   * Log authorization changes (permission updates)
   */
  async logAuthorizationChange(userId, targetUserId, action, details = {}) {
    try {
      const eventId = `AUTHZ-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'AUTHORIZATION_CHANGE',
        severity: 'ALERT',
        actor: {
          userId,
          role: details.actorRole
        },
        subject: {
          patientId: targetUserId
        },
        action: {
          type: action, // 'grant', 'revoke', 'modify'
          description: `Permission ${action}: ${details.permission || 'Unspecified'}`
        },
        result: 'SUCCESS',
        detailedLog: {
          changedPermissions: details.changedPermissions,
          effectiveDate: details.effectiveDate,
          reason: details.reason
        }
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging authorization change:', error);
      throw error;
    }
  }

  /**
   * Log security incidents
   */
  async logSecurityIncident(userId, incidentType, details = {}) {
    try {
      const eventId = `INCIDENT-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'SECURITY_INCIDENT',
        severity: 'CRITICAL',
        actor: details.reportedBy ? {
          userId: details.reportedBy
        } : null,
        action: {
          type: incidentType,
          description: details.description
        },
        result: 'SUCCESS',
        suspiciousIndicators: [incidentType],
        detailedLog: {
          incidentType,
          affectedSystems: details.affectedSystems,
          affectedRecords: details.affectedRecords,
          reportedAt: new Date(),
          detectionMethod: details.detectionMethod,
          immediateActions: details.immediateActions,
          longTermRemediation: details.longTermRemediation
        }
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging security incident:', error);
      throw error;
    }
  }

  /**
   * Log unauthorized access attempts
   */
  async logUnauthorizedAccessAttempt(userId, patientId, details = {}) {
    try {
      const eventId = `UNAUTH-${uuidv4()}`;
      const log = {
        eventId,
        timestamp: new Date(),
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'CRITICAL',
        actor: {
          userId,
          role: details.userRole
        },
        subject: {
          patientId
        },
        action: {
          type: 'unauthorized_access',
          description: `Unauthorized access attempt by ${userId}`
        },
        result: 'BLOCKED',
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        suspiciousIndicators: ['unauthorized_access'],
        remediationActions: [
          'Access Blocked',
          'Incident Logged',
          'Security Team Notified'
        ]
      };

      await this.bufferLog(log);
      return eventId;
    } catch (error) {
      console.error('Error logging unauthorized access:', error);
      throw error;
    }
  }

  /**
   * Buffer log entry for batch processing
   */
  async bufferLog(log) {
    this.logBuffer.push(log);
    
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }
  }

  /**
   * Flush buffered logs to database
   */
  async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    try {
      await ComplianceLog.insertMany(this.logBuffer);
      console.log(`✓ Flushed ${this.logBuffer.length} compliance logs`);
      this.logBuffer = [];
    } catch (error) {
      console.error('Error flushing compliance logs:', error);
      // Retry on next flush
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate = new Date(),
        patientId = null,
        userId = null,
        eventType = null
      } = options;

      const query = {
        timestamp: { $gte: startDate, $lte: endDate }
      };

      if (patientId) query['subject.patientId'] = patientId;
      if (userId) query['actor.userId'] = userId;
      if (eventType) query.eventType = eventType;

      const logs = await ComplianceLog.find(query).sort({ timestamp: -1 });

      // Calculate statistics
      const stats = {
        totalEvents: logs.length,
        byType: {},
        bySeverity: {},
        byActor: {},
        suspiciousEvents: []
      };

      logs.forEach(log => {
        // Count by type
        stats.byType[log.eventType] = (stats.byType[log.eventType] || 0) + 1;
        
        // Count by severity
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
        
        // Count by actor
        if (log.actor?.userId) {
          stats.byActor[log.actor.userId] = (stats.byActor[log.actor.userId] || 0) + 1;
        }
        
        // Flag suspicious events
        if (log.suspiciousIndicators?.length > 0) {
          stats.suspiciousEvents.push({
            eventId: log.eventId,
            timestamp: log.timestamp,
            indicators: log.suspiciousIndicators,
            severity: log.severity
          });
        }
      });

      return {
        period: { startDate, endDate },
        statistics: stats,
        logs: logs.slice(0, 100) // Return last 100 logs
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Search compliance logs
   */
  async searchLogs(query = {}) {
    try {
      const mongoQuery = {};

      if (query.eventType) mongoQuery.eventType = query.eventType;
      if (query.severity) mongoQuery.severity = query.severity;
      if (query.userId) mongoQuery['actor.userId'] = query.userId;
      if (query.patientId) mongoQuery['subject.patientId'] = query.patientId;
      if (query.startDate || query.endDate) {
        mongoQuery.timestamp = {};
        if (query.startDate) mongoQuery.timestamp.$gte = new Date(query.startDate);
        if (query.endDate) mongoQuery.timestamp.$lte = new Date(query.endDate);
      }

      const results = await ComplianceLog.find(mongoQuery)
        .sort({ timestamp: -1 })
        .limit(query.limit || 100);

      return results;
    } catch (error) {
      console.error('Error searching compliance logs:', error);
      throw error;
    }
  }

  /**
   * Ensure logs are flushed before shutdown
   */
  async gracefulShutdown() {
    await this.flushBuffer();
  }
}

// Global instance
export const hipaaLogger = new HIPAAComplianceLogger();

/**
 * HIPAA Compliance Middleware
 */
export const hipaaComplianceMiddleware = async (req, res, next) => {
  if (req.user) {
    req.hipaaLogger = {
      logDataAccess: (patientId, action, details) =>
        hipaaLogger.logDataAccess(req.user.id, patientId, action, {
          ...details,
          userRole: req.user.role,
          email: req.user.email,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }),
      logDataModification: (patientId, action, details) =>
        hipaaLogger.logDataModification(req.user.id, patientId, action, {
          ...details,
          userRole: req.user.role,
          ipAddress: req.ip
        }),
      logDataDeletion: (patientId, action, details) =>
        hipaaLogger.logDataDeletion(req.user.id, patientId, action, {
          ...details,
          userRole: req.user.role,
          ipAddress: req.ip
        }),
      logDataExport: (patientId, action, details) =>
        hipaaLogger.logDataExport(req.user.id, patientId, action, {
          ...details,
          userRole: req.user.role,
          ipAddress: req.ip
        })
    };
  }
  next();
};

export default {
  HIPAAComplianceLogger,
  hipaaLogger,
  hipaaComplianceMiddleware
};
