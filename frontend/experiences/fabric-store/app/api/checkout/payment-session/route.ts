import { NextRequest, NextResponse } from 'next/server'
import { Medusa } from '@medusajs/js-sdk'

const medusa = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL!,
  apiKey: process.env.MEDUSA_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { payment_collection_id, provider_id } = await request.json()

    const { payment_session } = await medusa.paymentSessions.initialize(
      payment_collection_id,
      {
        provider_id,
        context: {
          email: request.headers.get('x-customer-email') || undefined,
          customer_id: request.headers.get('x-customer-id') || undefined,
        },
      }
    )

    const client_secret = (payment_session as any).data?.client_secret
    if (!client_secret) {
      throw new Error('No client secret returned from payment provider')
    }

    return NextResponse.json({
      payment_session_id: payment_session.id,
      client_secret,
      provider_id: payment_session.provider_id,
    })
  } catch (error: any) {
    console.error('Payment session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

