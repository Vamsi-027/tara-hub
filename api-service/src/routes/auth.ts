import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import crypto from 'crypto';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY!);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Validation schemas
const SignInSchema = z.object({
  email: z.string().email()
});

const VerifyTokenSchema = z.object({
  token: z.string(),
  email: z.string().email()
});

// Admin whitelist (migrate from your current setup)
const ADMIN_EMAILS = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com',
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai'
];

// POST /auth/signin - Send magic link
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email } = SignInSchema.parse(req.body);
    
    logger.info(`Magic link requested for: ${email}`);
    
    // Check if email is in admin whitelist
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({ 
        error: 'Unauthorized: Admin access required' 
      });
    }
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store token in database
    await pool.query(
      `INSERT INTO verification_tokens (identifier, token, expires) 
       VALUES ($1, $2, $3)`,
      [email, token, expires]
    );
    
    // Send magic link email
    const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicLink = `${origin}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tara Hub <admin@deepcrm.ai>',
      to: email,
      subject: 'Sign in to Tara Hub Admin',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #1f2937; text-align: center;">Welcome to Tara Hub</h1>
          <p style="color: #374151; font-size: 16px;">
            Click the button below to sign in to your admin account:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Sign In to Admin Dashboard
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This link expires in 15 minutes and can only be used once.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      `
    });
    
    logger.info(`Magic link sent to: ${email}`);
    
    res.json({ 
      success: true,
      message: 'Magic link sent! Check your email to sign in.' 
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }
    
    logger.error('Magic link error:', error);
    res.status(500).json({ 
      error: 'Failed to send magic link' 
    });
  }
});

// GET /auth/verify - Verify magic link token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token, email } = VerifyTokenSchema.parse(req.query);
    
    logger.info(`Verifying token for: ${email}`);
    
    // Verify token from database
    const result = await pool.query(
      `SELECT * FROM verification_tokens 
       WHERE token = $1 AND identifier = $2 AND expires > NOW()
       LIMIT 1`,
      [token, email]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Invalid or expired token for: ${email}`);
      return res.redirect('/auth/error?error=InvalidToken');
    }
    
    // Delete used token
    await pool.query(
      `DELETE FROM verification_tokens 
       WHERE token = $1 AND identifier = $2`,
      [token, email]
    );
    
    // Get or create user
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    
    let user = userResult.rows[0];
    
    if (!user) {
      // Create new admin user
      const insertResult = await pool.query(
        `INSERT INTO users (email, role, email_verified, name) 
         VALUES ($1, 'admin', NOW(), $2) 
         RETURNING *`,
        [email, email.split('@')[0]]
      );
      user = insertResult.rows[0];
    }
    
    // Create JWT
    const authToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '30d' }
    );
    
    logger.info(`User authenticated: ${email}`);
    
    // Set cookie and redirect
    res.cookie('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    
    res.redirect('/admin');
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.redirect('/auth/error?error=InvalidRequest');
    }
    
    logger.error('Token verification error:', error);
    res.redirect('/auth/error?error=ServerError');
  }
});

// POST /auth/signout - Sign out
router.post('/signout', (req: Request, res: Response) => {
  res.clearCookie('auth-token', { path: '/' });
  res.json({ success: true, message: 'Signed out successfully' });
});

// GET /auth/session - Get current session
router.get('/session', async (req: Request, res: Response) => {
  try {
    const token = req.cookies['auth-token'];
    
    if (!token) {
      return res.json({ user: null });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    res.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      }
    });
    
  } catch (error) {
    res.json({ user: null });
  }
});

// POST /auth/refresh - Refresh JWT token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies['auth-token'];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    // Generate new token
    const newToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '30d' }
    );
    
    res.cookie('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    res.json({ 
      success: true,
      message: 'Token refreshed'
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;