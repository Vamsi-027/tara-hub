import { NextRequest, NextResponse } from 'next/server'
import { Medusa } from '@medusajs/js-sdk'

const medusa = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL!,
  apiKey: process.env.MEDUSA_API_KEY!, // Admin API key for server-side
})

export async function POST(request: NextRequest) {
  try {
    const { cart_id } = await request.json()

    const { payment_collection } = await medusa.paymentCollections.create({
      cart_id,
      metadata: { source: 'fabric-store-checkout' },
    })

    return NextResponse.json({ payment_collection })
  } catch (error: any) {
    console.error('Payment collection error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

