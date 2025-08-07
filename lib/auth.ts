import { NextAuthOptions } from "next-auth"
import Google from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      const adminEmails = ['admin@example.com', 'anotheradmin@example.com']; // Define your admin emails here
      if (session.user && session.user.email && adminEmails.includes(session.user.email)) {
        (session.user as any).role = 'admin'; // Add role to session user
      } else if (session.user) {
        (session.user as any).role = 'user'; // Optional: set role to 'user' for non-admins
      }
      return session;
    },
    async jwt({ token, user }) {
      // You might want to add role to the token as well if needed
      if (user) {
        const adminEmails = ['admin@example.com', 'anotheradmin@example.com']; // Define your admin emails here
        if (adminEmails.includes(user.email)) {
          (token as any).role = 'admin';
        } else {
          (token as any).role = 'user';
        }
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
