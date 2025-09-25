import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'

interface StripePaymentFormProps {
  cart: any
  onPaymentComplete: (orderId: string) => void
}

export function StripePaymentForm({ cart, onPaymentComplete }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !cart) return
    setProcessing(true)
    setError(null)
    try {
      let paymentCollectionId = cart.payment_collection?.id
      if (!paymentCollectionId) {
        const res = await fetch('/api/checkout/payment-collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart_id: cart.id }),
        })
        const data = await res.json()
        paymentCollectionId = data.payment_collection.id
      }

      const sessionRes = await fetch('/api/checkout/payment-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_collection_id: paymentCollectionId, provider_id: 'pp_stripe_stripe' }),
      })
      const { client_secret } = await sessionRes.json()

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/complete`,
          payment_method_data: {
            billing_details: {
              name: `${cart.billing_address?.first_name} ${cart.billing_address?.last_name}`,
              email: cart.email,
              phone: cart.billing_address?.phone,
              address: {
                line1: cart.billing_address?.address_1,
                line2: cart.billing_address?.address_2,
                city: cart.billing_address?.city,
                state: cart.billing_address?.province,
                postal_code: cart.billing_address?.postal_code,
                country: cart.billing_address?.country_code?.toUpperCase(),
              },
            },
          },
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        return
      }

      const completeRes = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cart.id, payment_intent_id: paymentIntent?.id }),
      })
      const { order } = await completeRes.json()
      if (order?.id) onPaymentComplete(order.id)
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={processing || !stripe || !elements}>
        {processing ? 'Processing…' : 'Pay now'}
      </button>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <img src="/stripe-badge.svg" alt="Stripe" className="h-5" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
  )
}

