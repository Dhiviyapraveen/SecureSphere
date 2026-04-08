import AccessLog from '../models/AccessLog.js';

export const getRequestIp = (req) =>
  req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || null;

export const createAuditEntry = async ({
  req,
  userId,
  actorRole = null,
  fileId = null,
  targetUserId = null,
  patientId = null,
  action,
  status = 'success',
  details = null
}) => {
  return AccessLog.create({
    userId,
    actorRole,
    fileId,
    targetUserId,
    patientId,
    action,
    status,
    details,
    ipAddress: getRequestIp(req),
    userAgent: req.get('user-agent') || null,
    route: req.originalUrl,
    method: req.method
  });
};

export default {
  createAuditEntry,
  getRequestIp
};
