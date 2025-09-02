import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { otpStore } from '../[...nextauth]/route'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const otp = generateOTP()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP
    otpStore.set(phone, { otp, expires })

    // Send OTP via Twilio
    if (client && twilioPhoneNumber) {
      try {
        await client.messages.create({
          body: `Your Tara Hub verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioPhoneNumber,
          to: phone
        })
      } catch (twilioError) {
        console.error('Twilio error:', twilioError)
        // In development, continue even if Twilio fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode - OTP:', otp)
        } else {
          throw twilioError
        }
      }
    } else {
      // Development mode without Twilio
      console.log('Twilio not configured. OTP for', phone, ':', otp)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // Only include OTP in development
      ...(process.env.NODE_ENV === 'development' && !client ? { otp } : {})
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}