import { NextAuthOptions } from "next-auth"
import Google from "next-auth/providers/google"
import Email from "next-auth/providers/email"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/lib/auth-schema"

const authOptionsBase: Omit<NextAuthOptions, 'adapter'> = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "Hearth & Home <noreply@yourdomain.com>",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async session({ session, user }) {
      const adminEmails = ['varaku@gmail.com']; // Admin email
      
      if (session.user) {
        session.user.id = user.id;
        if (session.user.email && adminEmails.includes(session.user.email)) {
          (session.user as any).role = 'admin';
        } else {
          (session.user as any).role = 'user';
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Only add adapter if database is configured
export const authOptions: NextAuthOptions = db 
  ? {
      ...authOptionsBase,
      adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
    }
  : authOptionsBase as NextAuthOptions;