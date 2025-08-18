import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ user: null })
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
    
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      }
    })
    
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}