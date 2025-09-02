import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// In production, this should be stored in a database
const otpStore = new Map<string, { otp: string; expires: number; verified?: boolean }>()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone Number', type: 'tel' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          return null
        }

        const storedOtp = otpStore.get(credentials.phone)
        
        if (!storedOtp || storedOtp.expires < Date.now()) {
          return null
        }

        if (storedOtp.otp !== credentials.otp) {
          return null
        }

        // Mark as verified and return user
        storedOtp.verified = true
        
        return {
          id: credentials.phone,
          phone: credentials.phone,
          name: `User ${credentials.phone}`,
          email: `${credentials.phone}@phone.auth`
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after sign in
      return baseUrl + '/'
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.phone = (user as any).phone
        token.provider = account?.provider
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          phone: token.phone as string,
          provider: token.provider as string
        }
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Export OTP store for use in other API routes
export { otpStore }