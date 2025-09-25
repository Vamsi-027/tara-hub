import { NextRequest, NextResponse } from 'next/server'
import { Medusa } from '@medusajs/js-sdk'

const medusa = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL!,
  apiKey: process.env.MEDUSA_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { cart_id, payment_intent_id } = await request.json()

    const { order, error } = await medusa.carts.complete(cart_id, {
      idempotency_key: `complete-${cart_id}-${payment_intent_id}`,
      metadata: {
        payment_intent_id,
        completed_at: new Date().toISOString(),
      },
    } as any)

    if ((error as any)?.message) {
      throw new Error((error as any).message || 'Failed to complete order')
    }

    await sendOrderConfirmation(order)
    await trackConversion(order)

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Order completion error:', error)

    if (String(error.message || '').includes('already completed')) {
      const orders = await medusa.orders.list({ cart_id, limit: 1 } as any)
      if (orders.orders?.length > 0) {
        return NextResponse.json({ order: orders.orders[0] })
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendOrderConfirmation(order: any) {
  try {
    await fetch('/api/emails/order-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
  } catch (e) {
    console.warn('Order confirmation email failed (non-blocking):', e)
  }
}

async function trackConversion(order: any) {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'purchase', {
        transaction_id: order.id,
        value: order.total / 100,
        currency: order.currency_code,
        items: order.items.map((item: any) => ({
          id: item.variant_id,
          name: item.title,
          quantity: item.quantity,
          price: item.unit_price / 100,
        })),
      })
    }
  } catch (e) {
    console.warn('Conversion tracking failed (non-blocking):', e)
  }
}

