/**
 * Authentication Module Public API
 * 
 * Consolidates all authentication functionality:
 * - Magic link authentication via Resend
 * - JWT token management
 * - Session handling
 * - Admin whitelist enforcement
 */

// Services
export { AuthService } from './services/auth.service';
export { MagicLinkService } from './services/magic-link.service';
export { SessionService } from './services/session.service';

// Middleware
export { withAuth } from './middleware/with-auth';
export { requireAdmin } from './middleware/require-admin';

// Hooks
export { useAuth } from './hooks/use-auth';
export { useSession } from './hooks/use-session';

// Utils
export { verifyToken, generateToken } from './utils/token.utils';
export { isAdminEmail } from './utils/admin.utils';

// Types
export type {
  User,
  Session,
  AuthConfig,
  MagicLinkPayload,
  JWTPayload
} from './types';