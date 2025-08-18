import { NextRequest, NextResponse } from 'next/server';
import { legacyVerificationTokens, legacyUsers } from '@/lib/legacy-auth-schema';
import { db } from '@/lib/db';
import { eq, and, gt } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(request: NextRequest) {
  console.log('🔍 VERIFY: Starting verification process...');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    console.log('📧 Email:', email, '🔑 Token:', token?.substring(0, 8) + '...');
    
    if (!token || !email) {
      console.log('❌ Missing token or email');
      return NextResponse.redirect(new URL('/auth/error?error=InvalidToken', request.url));
    }

    // Check if user exists and has admin role
    console.log('👤 Checking user permissions...');
    const existingUser = await db.select().from(legacyUsers).where(eq(legacyUsers.email, email)).limit(1);
    
    if (existingUser.length === 0) {
      console.log('❌ User not found:', email);
      return NextResponse.redirect(new URL('/auth/error?error=UserNotFound', request.url));
    }
    
    if (existingUser[0].role !== 'admin' && existingUser[0].role !== 'platform_admin' && existingUser[0].role !== 'tenant_admin') {
      console.log('❌ User does not have admin role:', email, 'Role:', existingUser[0].role);
      return NextResponse.redirect(new URL('/auth/error?error=Unauthorized', request.url));
    }
    
    console.log('✅ User permissions verified:', existingUser[0].role);
    
    // Verify token
    console.log('🔍 Checking token in database...');
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
      console.log('❌ Token not found or expired');
      return NextResponse.redirect(new URL('/auth/error?error=ExpiredToken', request.url));
    }
    
    console.log('✅ Token verified, deleting...');
    
    // Delete token (consume it)
    await db
      .delete(legacyVerificationTokens)
      .where(
        and(
          eq(legacyVerificationTokens.token, token),
          eq(legacyVerificationTokens.identifier, email)
        )
      );
    
    console.log('✅ Token consumed');
    
    // Use the existing user (already verified above)
    console.log('✅ Using verified user:', existingUser[0].id);
    const user = existingUser;
    
    // Create JWT token
    console.log('🔑 Creating JWT...');
    const authToken = jwt.sign(
      {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        role: user[0].role,
      },
      NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('✅ JWT created');
    
    // Set cookie and redirect with intermediate page
    console.log('🍪 Setting cookie and redirecting to intermediate page...');
    
    // Create a response that sets the cookie first
    const response = NextResponse.redirect(new URL('/auth/success', request.url));
    
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    
    console.log('🚀 Redirect response created to /auth/success');
    return response;
    
  } catch (error) {
    console.error('💥 Auth error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=ServerError', request.url));
  }
}