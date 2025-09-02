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

    // Validate phone number format (improved validation)
    // Allow + prefix, country code, and 7-15 digits
    const phoneRegex = /^\+?[1-9]\d{7,15}$/
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '') // Remove spaces, dashes, parentheses
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { 
          error: 'Invalid phone number format. Please use format: +1234567890',
          received: phone,
          cleaned: cleanPhone
        },
        { status: 400 }
      )
    }

    const otp = generateOTP()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP (use cleaned phone number)
    otpStore.set(cleanPhone, { otp, expires })

    // Send OTP via Twilio
    if (client && twilioPhoneNumber) {
      console.log('Attempting to send OTP via Twilio...');
      console.log('From:', twilioPhoneNumber);
      console.log('To:', cleanPhone);
      console.log('OTP:', otp);
      
      try {
        const message = await client.messages.create({
          body: `Your verification code is ${otp}`,
          from: twilioPhoneNumber,
          to: cleanPhone
        })
        
        console.log('SMS sent successfully!');
        console.log('Message SID:', message.sid);
        console.log('Status:', message.status);
      } catch (twilioError: any) {
        console.error('Twilio error details:', {
          message: twilioError.message,
          code: twilioError.code,
          status: twilioError.status,
          phone: cleanPhone,
          twilioPhoneNumber: twilioPhoneNumber
        })
        
        // In development, continue even if Twilio fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode - OTP:', otp)
        } else {
          return NextResponse.json(
            { 
              error: 'Failed to send SMS', 
              details: twilioError.message,
              code: twilioError.code 
            },
            { status: 500 }
          )
        }
      }
    } else {
      // Development mode without Twilio
      console.log('Twilio not configured. OTP for', cleanPhone, ':', otp)
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