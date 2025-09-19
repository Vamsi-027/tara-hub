#!/usr/bin/env node

/**
 * Debug script to check cart functionality
 */

// This script should be run in the browser console on the fabric-store site

console.log('🔍 Debugging Cart Storage...\n');

// Check localStorage
const cartData = localStorage.getItem('fabric-cart');
console.log('📦 Cart Data in localStorage:');
console.log(cartData ? JSON.parse(cartData) : 'No cart data found');

// Check if cart-utils is working
console.log('\n🔧 Testing addToCart function...');

// Simulate adding an item
const testItem = {
  variantId: 'test-variant-123',
  productId: 'test-product-123',
  title: 'Test Fabric',
  variant: 'Swatch Sample',
  price: 500, // $5.00 in cents
  quantity: 1,
  thumbnail: 'https://example.com/image.jpg',
  type: 'swatch'
};

// Manual add to cart (same logic as cart-utils.ts)
const addTestItem = () => {
  const existingCart = localStorage.getItem('fabric-cart');
  const cart = existingCart ? JSON.parse(existingCart) : [];

  const stableId = `${testItem.type || 'fabric'}-${testItem.productId}-${testItem.variantId}`;

  const newItem = {
    ...testItem,
    id: stableId
  };

  cart.push(newItem);
  localStorage.setItem('fabric-cart', JSON.stringify(cart));

  console.log('✅ Test item added to cart');
  console.log('📦 Updated cart:', cart);

  // Dispatch event
  window.dispatchEvent(new CustomEvent('cart-updated', {
    detail: { cart, action: 'add', item: newItem }
  }));
};

// Instructions for browser console
console.log(`
📝 To test in browser console:

1. Check current cart:
   localStorage.getItem('fabric-cart')

2. Clear cart:
   localStorage.removeItem('fabric-cart')

3. Add test item:
   ${addTestItem.toString()}
   addTestItem();

4. Check cart page updates:
   window.location.href = '/cart'
`);