// In production, this should be stored in a database
export const otpStore = new Map<string, { otp: string; expires: number; verified?: boolean }>()