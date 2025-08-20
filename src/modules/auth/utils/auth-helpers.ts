import { getServerSession } from "next-auth/next";
import { authOptions } from "@/modules/auth";
import { redirect } from "next/navigation";

/**
 * Get the current session on the server
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  const session = await getCurrentSession();
  return (session?.user as any)?.role === 'admin';
}

/**
 * Require authentication - redirects to sign in if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/signin');
  }
  return session;
}

/**
 * Require admin role - redirects to unauthorized if not admin
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as any)?.role !== 'admin') {
    redirect('/unauthorized');
  }
  return session;
}

/**
 * Check if a user email is in the admin list
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmails = [
    'varaku@gmail.com',
    'batchu.kedareswaraabhinav@gmail.com',
    'vamsicheruku027@gmail.com',
    'admin@deepcrm.ai', // Add your email to admin list
  ];
  
  return adminEmails.includes(email.toLowerCase());
}