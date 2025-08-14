import { NextAuthOptions } from "next-auth"
import Google from "next-auth/providers/google"
import Email from "next-auth/providers/email"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/lib/auth-schema"

const adminEmails = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com',
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai', // Added admin@deepcrm.ai
];

const authOptionsBase: Omit<NextAuthOptions, 'adapter'> = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
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
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in only for admin emails
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        // Allow OAuth account creation and linking
        if (account?.provider === "google") {
          return true;
        }
        return true;
      }
      // Reject non-admin users
      return "/unauthorized";
    },
    async session({ session, user, token }) {
      if (session.user) {
        // Handle both database and JWT sessions
        if (user) {
          // Database session
          session.user.id = user.id;
          if (session.user.email && adminEmails.includes(session.user.email.toLowerCase())) {
            (session.user as any).role = 'admin';
          }
        } else if (token) {
          // JWT session
          session.user.id = token.id as string;
          (session.user as any).role = token.role;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Set role in JWT token
        if (user.email && adminEmails.includes(user.email.toLowerCase())) {
          token.role = 'admin';
        } else {
          token.role = 'user';
        }
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt', // Always use JWT for better OAuth compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
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