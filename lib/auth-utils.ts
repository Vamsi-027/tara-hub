import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, loginAttempts } from '@/lib/auth-schema';
import { legacyVerificationTokens, legacyUsers } from '@/lib/legacy-auth-schema';
import { eq, and, gt, lt, desc } from 'drizzle-orm';

export async function createVerificationToken(
  email: string, 
  type: 'magic_link' | 'password_reset' | 'email_verification',
  expiryMinutes: number = 15
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  try {
    // Start with legacy schema (current database state)
    console.log('Creating verification token using legacy schema');
    await db.insert(legacyVerificationTokens).values({
      identifier: email,
      token,
      expires,
    });
    
    return token;
  } catch (error) {
    console.error('Failed to create verification token:', error);
    throw new Error('Failed to create verification token');
  }
}

export async function verifyAndConsumeToken(
  token: string, 
  email: string, 
  type: string
): Promise<boolean> {
  try {
    console.log('Verifying token using legacy schema');
    const verificationToken = await db
      .select()
      .from(legacyVerificationTokens)
      .where(
        and(
          eq(legacyVerificationTokens.token, token),
          eq(legacyVerificationTokens.identifier, email),
          gt(legacyVerificationTokens.expires, new Date())
        )
      )
      .limit(1);
    
    if (verificationToken.length === 0) {
      return false;
    }
    
    // Use legacy token consumption method - delete the token
    console.log('Consuming token using legacy method (delete)');
    await db
      .delete(legacyVerificationTokens)
      .where(
        and(
          eq(legacyVerificationTokens.token, token),
          eq(legacyVerificationTokens.identifier, email)
        )
      );
    
    return true;
    
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

export async function createUserSession(
  email: string, 
  userAgent: string, 
  ipAddress?: string
) {
  try {
    // Get or create user using legacy schema
    let user = await db.select().from(legacyUsers).where(eq(legacyUsers.email, email)).limit(1);
    
    if (user.length === 0) {
      // Create new user with admin role (since we're checking admin emails before this)
      const newUser = await db.insert(legacyUsers).values({
        email,
        role: 'admin',
        emailVerified: new Date(),
        name: email.split('@')[0], // Default name from email
      }).returning();
      
      user = newUser;
    } else {
      // Update user - only update fields that exist in legacy schema
      await db
        .update(legacyUsers)
        .set({ 
          emailVerified: new Date(), // Ensure email is verified on login
          updatedAt: new Date()
        })
        .where(eq(legacyUsers.id, user[0].id));
    }
    
    // Skip login attempt logging for now - table doesn't exist in current database
    // This would be enabled after proper database migration
    // console.log('Login attempt logging skipped - database migration pending');
    
    return user[0];
    
  } catch (error) {
    console.error('Failed to create user session:', error);
    throw new Error('Failed to create user session');
  }
}

export async function logFailedLoginAttempt(
  email: string, 
  userAgent: string, 
  ipAddress?: string
) {
  // Skip login attempt logging for now - table doesn't exist in current database
  // This would be enabled after proper database migration
  console.log('Failed login attempt logging skipped - database migration pending');
  return;
}

export async function checkRateLimit(
  email: string, 
  windowMinutes: number = 15, 
  maxAttempts: number = 5
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const recentAttempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.success, false),
          gt(loginAttempts.attemptedAt, windowStart)
        )
      );
    
    return recentAttempts.length >= maxAttempts;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // If login_attempts table doesn't exist yet, skip rate limiting
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.log('Login attempts table not found, skipping rate limiting');
      return false;
    }
    return false; // On other errors, allow the attempt
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function cleanupExpiredTokens() {
  try {
    await db
      .delete(legacyVerificationTokens)
      .where(lt(legacyVerificationTokens.expires, new Date()));
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    return null;
  }
}

export async function updateUserLastLogin(userId: string) {
  try {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Failed to update user last login:', error);
  }
}

export async function getRecentLoginAttempts(email: string, limit: number = 10) {
  try {
    return await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.email, email))
      .orderBy(desc(loginAttempts.attemptedAt))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get recent login attempts:', error);
    return [];
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}