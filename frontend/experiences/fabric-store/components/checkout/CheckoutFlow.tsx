import { useState } from 'react'
import { Medusa } from '@medusajs/js-sdk'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { useCart } from '@/contexts/CartContext'
import { CheckoutStep } from './CheckoutStep'
import { EmailForm } from './EmailForm'
import { AddressForm, AddressInput } from './AddressForm'
import { BillingForm } from './BillingForm'
import { ShippingMethodSelector } from './ShippingMethodSelector'
import { StripePaymentForm } from './StripePaymentForm'
import { OrderSummary } from './OrderSummary'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutSteps {
  email: boolean
  shipping: boolean
  billing: boolean
  shipping_method: boolean
  payment: boolean
}

export function CheckoutFlow() {
  const { cart, refreshCart } = useCart()
  const [currentStep, setCurrentStep] = useState<keyof CheckoutSteps>('email')
  const [completedSteps, setCompletedSteps] = useState<CheckoutSteps>({
    email: false,
    shipping: false,
    billing: false,
    shipping_method: false,
    payment: false,
  })

  const medusa = new Medusa({
    baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  })

  const handleEmailSubmit = async (email: string) => {
    if (!cart) return
    try {
      await medusa.carts.update(cart.id, { email })
      setCompletedSteps((prev) => ({ ...prev, email: true }))
      setCurrentStep('shipping')
      await refreshCart()
    } catch (error) {
      console.error('Failed to update email:', error)
    }
  }

  const handleShippingSubmit = async (address: AddressInput) => {
    if (!cart) return
    try {
      await medusa.carts.update(cart.id, {
        shipping_address: {
          first_name: address.firstName,
          last_name: address.lastName,
          address_1: address.line1,
          address_2: address.line2,
          city: address.city,
          province: address.state,
          postal_code: address.postalCode,
          country_code: address.countryCode || 'us',
          phone: address.phone,
        },
      })
      setCompletedSteps((prev) => ({ ...prev, shipping: true }))
      setCurrentStep('billing')
      await refreshCart()
    } catch (error) {
      console.error('Failed to update shipping:', error)
    }
  }

  const handleBillingSubmit = async (address: AddressInput, sameAsShipping: boolean) => {
    if (!cart) return
    try {
      if (sameAsShipping) {
        await medusa.carts.update(cart.id, { billing_address: cart.shipping_address })
      } else {
        await medusa.carts.update(cart.id, {
          billing_address: {
            first_name: address.firstName,
            last_name: address.lastName,
            address_1: address.line1,
            address_2: address.line2,
            city: address.city,
            province: address.state,
            postal_code: address.postalCode,
            country_code: address.countryCode || 'us',
            phone: address.phone,
          },
        })
      }
      setCompletedSteps((prev) => ({ ...prev, billing: true }))
      setCurrentStep('shipping_method')
      await refreshCart()
    } catch (error) {
      console.error('Failed to update billing:', error)
    }
  }

  const handleShippingMethodSubmit = async (optionId: string) => {
    if (!cart) return
    try {
      await medusa.carts.addShippingMethod(cart.id, { option_id: optionId })
      setCompletedSteps((prev) => ({ ...prev, shipping_method: true }))
      setCurrentStep('payment')
      await refreshCart()
    } catch (error) {
      console.error('Failed to set shipping method:', error)
    }
  }

  const handlePaymentComplete = async (_orderId: string) => {
    setCompletedSteps((prev) => ({ ...prev, payment: true }))
    // Navigation to confirmation page would happen in the page using this component
  }

  return (
    <div className="checkout-container max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutStep title="Email" isActive={currentStep === 'email'} isCompleted={completedSteps.email} onEdit={() => setCurrentStep('email')}>
            <EmailForm onSubmit={handleEmailSubmit} defaultValue={cart?.email} />
          </CheckoutStep>

          <CheckoutStep title="Shipping Address" isActive={currentStep === 'shipping'} isCompleted={completedSteps.shipping} onEdit={() => setCurrentStep('shipping')} disabled={!completedSteps.email}>
            <AddressForm onSubmit={handleShippingSubmit} defaultValue={cart?.shipping_address} />
          </CheckoutStep>

          <CheckoutStep title="Billing Address" isActive={currentStep === 'billing'} isCompleted={completedSteps.billing} onEdit={() => setCurrentStep('billing')} disabled={!completedSteps.shipping}>
            <BillingForm onSubmit={handleBillingSubmit} shippingAddress={cart?.shipping_address} />
          </CheckoutStep>

          <CheckoutStep title="Shipping Method" isActive={currentStep === 'shipping_method'} isCompleted={completedSteps.shipping_method} onEdit={() => setCurrentStep('shipping_method')} disabled={!completedSteps.billing}>
            <ShippingMethodSelector cartId={cart?.id} onSubmit={handleShippingMethodSubmit} />
          </CheckoutStep>

          <CheckoutStep title="Payment" isActive={currentStep === 'payment'} isCompleted={completedSteps.payment} disabled={!completedSteps.shipping_method}>
            {stripePromise && (
              <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
                <StripePaymentForm cart={cart} onPaymentComplete={handlePaymentComplete} />
              </Elements>
            )}
          </CheckoutStep>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}

