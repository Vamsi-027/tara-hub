import { test, expect } from '@playwright/test'

const APP_URL = process.env.APP_URL || 'http://localhost:3006'
const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

async function ensureCartHasItem(page) {
  // Visit checkout to initialize local cart and set localStorage medusa_cart_id
  await page.goto(`${APP_URL}/checkout`)
  const cartId = await page.evaluate(() => localStorage.getItem('medusa_cart_id'))
  if (!cartId) throw new Error('Cart not initialized')

  // Fetch a product variant from Medusa
  const products = await page.request.get(`${MEDUSA_URL}/store/products?limit=1`, {
    headers: PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {},
  })
  const productsJson = await products.json()
  const variantId = productsJson.products?.[0]?.variants?.[0]?.id
  if (!variantId) throw new Error('No product variant found to add to cart')

  // Add a line item to the existing cart
  const addRes = await page.request.post(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
    headers: {
      'content-type': 'application/json',
      ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
    },
    data: { variant_id: variantId, quantity: 1 },
  })
  expect(addRes.ok()).toBeTruthy()
}

async function fillStripePaymentElement(page, { number, exp, cvc, zip }) {
  const frameLocator = page.frameLocator('iframe[title="Secure payment input frame"], iframe[title*="payment"]')
  await frameLocator.locator('input[name="number"], input[placeholder*="1234"], input[data-elements-stable-field-name="cardNumber"]').first().fill(number)
  await frameLocator.locator('input[name="expiry"], input[placeholder*="MM / YY"], input[data-elements-stable-field-name="cardExpiry"]').first().fill(exp)
  await frameLocator.locator('input[name="cvc"], input[placeholder*="CVC"], input[data-elements-stable-field-name="cardCvc"]').first().fill(cvc)
  const zipInput = frameLocator.locator('input[name="postal"], input[placeholder*="ZIP"], input[data-elements-stable-field-name="postalCode"]').first()
  if (await zipInput.count()) await zipInput.fill(zip)
}

test.describe('Checkout V2 - Happy Path', () => {
  test('completes checkout end-to-end', async ({ page }) => {
    await ensureCartHasItem(page)

    // Email
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button:has-text("Continue")')

    // Shipping address
    await page.fill('input[placeholder="First name"]', 'Test')
    await page.fill('input[placeholder="Last name"]', 'User')
    await page.fill('input[placeholder="Address line 1"]', '123 Main St')
    await page.fill('input[placeholder="City"]', 'New York')
    await page.fill('input[placeholder="Postal code"]', '10001')
    await page.click('button:has-text("Continue")')

    // Billing (same as shipping default)
    await page.click('button:has-text("Continue")')

    // Shipping method: choose first option
    await page.locator('input[name="shipping"]').first().check()
    await page.click('button:has-text("Continue")')

    // Payment via Stripe test card
    await fillStripePaymentElement(page, {
      number: '4242 4242 4242 4242',
      exp: '12 / 30',
      cvc: '123',
      zip: '10001',
    })
    await page.click('button:has-text("Pay now")')

    // Confirmation: redirected to /orders/:id
    await expect(page).toHaveURL(/\/orders\//)
    await expect(page.getByText('Order Summary', { exact: false })).toBeVisible()
  })
})
