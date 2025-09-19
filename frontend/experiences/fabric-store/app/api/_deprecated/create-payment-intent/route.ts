import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with secret key (only if available)
let stripe: Stripe | null = null
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, email, items, shipping } = body

    // Check if Stripe is available
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing not available' },
        { status: 503 }
      )
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      metadata: {
        email,
        item_count: items.length.toString(),
        order_type: 'fabric_samples',
        shipping_city: shipping?.city || 'N/A',
        shipping_state: shipping?.state || 'N/A'
      },
      receipt_email: email,
    })

    // Generate a simple order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Save order to database
    try {
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3006'}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          email,
          items,
          shipping,
          total: amount,
          paymentIntentId: paymentIntent.id,
          status: 'pending'
        })
      })
      
      if (!orderResponse.ok) {
        console.error('Failed to save order to database')
      } else {
        console.log(`✅ Order saved to database: ${orderId}`)
      }
    } catch (error) {
      console.error('Error saving order:', error)
    }
    
    // Log for debugging
    console.log(`Order created for ${email}: ${orderId}`)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: orderId
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}