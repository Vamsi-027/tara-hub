// Custom auth implementation to replace NextAuth and fix Jest worker issues
export { getServerSession } from '@/modules/auth'
export type { User, Session } from '@/modules/auth'

export const adminEmails = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com',
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai',
  'rkvankayalapati@gemini-us.com',
]