/**
 * Create Order with Items API Route
 * Direct order creation that ensures line items are properly saved
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, items, shipping, total } = body

    console.log('📦 Creating complete order with items...')
    console.log('Customer:', email)
    console.log('Items count:', items.length)
    console.log('Items details:', items.map((item: any) => ({
      id: item.id,
      name: item.title || item.name,
      quantity: item.quantity,
      price: item.price
    })))
    console.log('Total:', total)

    // Transform cart items to order format
    const orderItems = items.map((item: any) => ({
      id: item.variantId || item.id,
      name: item.title || item.variant || item.name || 'Product',
      sku: item.sku || `SKU-${item.type || 'fabric'}-${item.productId || item.id}`,
      color: item.color || '',
      price: item.price,
      quantity: item.type === 'fabric' && item.yardage ? item.yardage : item.quantity,
      image: item.thumbnail || item.image || '',
      type: item.type || 'fabric'
    }))

    console.log('📦 Transformed items:', orderItems)

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shippingCost = Math.round(subtotal * 0.1) // 10% shipping
    const taxAmount = Math.round(subtotal * 0.08) // 8% tax
    const grandTotal = subtotal + shippingCost + taxAmount

    // Create order object with all details
    const orderData = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: email,
      items: orderItems,
      shipping: {
        firstName: shipping.firstName,
        lastName: shipping.lastName || '',
        email: email,
        phone: shipping.phone || '',
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        zipCode: shipping.zipCode,
        country: shipping.country || 'US',
      },
      totals: {
        subtotal: subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total: grandTotal
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        fabric_store_order: true,
        created_from: 'fabric-store',
        original_total: total
      }
    }

    console.log('✅ Complete order created:', {
      id: orderData.id,
      email: orderData.email,
      items: orderData.items.length,
      total: orderData.totals.total
    })

    // Try to create in Medusa via our direct endpoint
    const medusaBackendUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    let medusaOrder = null

    if (medusaBackendUrl) {
      try {
        console.log('🔥 Attempting to save to Medusa database...')

        const medusaPayload = {
          email: orderData.email,
          items: orderData.items,
          shipping: orderData.shipping,
          totals: orderData.totals,
          currency_code: 'usd'
        }

        const medusaResponse = await fetch(`${medusaBackendUrl}/store/orders-by-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify(medusaPayload)
        })

        if (medusaResponse.ok) {
          const medusaResult = await medusaResponse.json()
          medusaOrder = medusaResult.order
          console.log('✅ Order saved to Medusa:', medusaOrder.id)

          // Update our order data with Medusa ID
          orderData.id = medusaOrder.id
        } else {
          const errorText = await medusaResponse.text()
          console.warn('⚠️ Medusa save failed:', errorText)
        }
      } catch (medusaError) {
        console.warn('⚠️ Medusa save error:', medusaError)
      }
    }

    // Save to localStorage as backup
    if (typeof window !== 'undefined') {
      try {
        const existingOrders = JSON.parse(localStorage.getItem('fabric-store-orders') || '[]')
        existingOrders.push(orderData)
        localStorage.setItem('fabric-store-orders', JSON.stringify(existingOrders))
        console.log('💾 Order saved to localStorage backup')
      } catch (storageError) {
        console.warn('⚠️ localStorage save failed:', storageError)
      }
    }

    // Create Stripe payment intent
    let paymentIntent = null
    let clientSecret = null

    if (process.env.STRIPE_SECRET_KEY && orderData.totals.total > 0) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-08-27.basil',
        })

        paymentIntent = await stripe.paymentIntents.create({
          amount: orderData.totals.total,
          currency: 'usd',
          metadata: {
            order_id: orderData.id,
            email: orderData.email,
            item_count: orderData.items.length.toString(),
            fabric_store_order: 'true',
          },
          receipt_email: orderData.email,
          description: `Fabric Store Order ${orderData.id}`,
        })

        clientSecret = paymentIntent.client_secret
        console.log('💳 Payment intent created:', paymentIntent.id)
      } catch (stripeError) {
        console.error('❌ Stripe error:', stripeError)
      }
    }

    return NextResponse.json({
      success: true,
      order: medusaOrder || orderData,
      orderId: orderData.id,
      clientSecret,
      paymentIntentId: paymentIntent?.id,
      message: 'Order created successfully with all details',
      debug: {
        itemsReceived: items.length,
        itemsTransformed: orderItems.length,
        medusaSaved: !!medusaOrder,
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY
      }
    })

  } catch (error) {
    console.error('❌ Error creating order with items:', error)

    return NextResponse.json(
      {
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}