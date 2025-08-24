/**
 * Authentication Module Public API
 * 
 * Consolidates all authentication functionality:
 * - Magic link authentication via Resend
 * - JWT token management
 * - Session handling
 * - Admin whitelist enforcement
 */

// Schemas - Export directly for database operations
export { legacyUsers, legacyVerificationTokens } from './schemas/legacy-auth.schema';

// Utils - Token and auth utilities
export { 
  createVerificationToken,
  verifyAndConsumeToken,
  createUserSession,
  logFailedLoginAttempt,
  checkRateLimit,
  hashPassword,
  verifyPassword,
  cleanupExpiredTokens,
  getUserByEmail,
  updateUserLastLogin,
  getRecentLoginAttempts,
  generateSecureToken,
  isValidEmail,
  sanitizeEmail
} from './utils/token.utils';

// JWT Auth utilities for API routes
export { checkJWTAuth, PERMISSIONS } from './utils/jwt.utils';

// Types
export type {
  User,
  Session,
  AuthConfig,
  MagicLinkPayload,
  JWTPayload
} from './types';