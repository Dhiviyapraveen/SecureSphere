/**
 * Access Control Service - Role-Based Access Control (RBAC)
 * Manages file access permissions and sharing relationships
 */

export const ROLES = {
  OWNER: 'owner',
  VIEWER: 'viewer'
};

/**
 * Create access control entry
 */
export const createAccessEntry = (userId, fileId, role = ROLES.OWNER) => {
  return {
    userId,
    fileId,
    role,
    grantedAt: new Date(),
    revokedAt: null,
    isActive: true
  };
};

/**
 * Check if user has access to file
 */
export const hasAccess = (access, requestingUserId) => {
  if (!access) return false;
  return access.userId.toString() === requestingUserId.toString() && access.isActive;
};

/**
 * Check if user is file owner
 */
export const isFileOwner = (access, requestingUserId) => {
  return hasAccess(access, requestingUserId) && access.role === ROLES.OWNER;
};

/**
 * Check if user can view file
 */
export const canViewFile = (access, requestingUserId) => {
  return hasAccess(access, requestingUserId) && 
         (access.role === ROLES.OWNER || access.role === ROLES.VIEWER);
};

/**
 * Check if user can share file (only owner)
 */
export const canShareFile = (access, requestingUserId) => {
  return isFileOwner(access, requestingUserId);
};

/**
 * Check if user can delete file (only owner)
 */
export const canDeleteFile = (access, requestingUserId) => {
  return isFileOwner(access, requestingUserId);
};

/**
 * Check if user can download file
 */
export const canDownloadFile = (access, requestingUserId) => {
  return canViewFile(access, requestingUserId);
};

export default {
  ROLES,
  createAccessEntry,
  hasAccess,
  isFileOwner,
  canViewFile,
  canShareFile,
  canDeleteFile,
  canDownloadFile
};
