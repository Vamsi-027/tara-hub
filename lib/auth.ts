// Custom auth implementation to replace NextAuth and fix Jest worker issues
export { getServerSession } from '@/lib/custom-auth'
export type { User, Session } from '@/lib/custom-auth'

export const adminEmails = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com',
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai',
  'rkvankayalapati@gemini-us.com',
]