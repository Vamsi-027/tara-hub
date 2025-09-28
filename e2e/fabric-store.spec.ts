/**
 * Fabric Store E2E Tests
 *
 * Full user journey testing using Playwright with real test data
 * from our Jest API infrastructure.
 */

import { test, expect } from '@playwright/test';
import { PlaywrightTestDataSetup } from './setup/api-test-data';

test.describe('Fabric Store User Journey', () => {
  let testDataSetup: PlaywrightTestDataSetup;
  let testData: any;

  test.beforeAll(async () => {
    // Setup test data using our API infrastructure
    testDataSetup = new PlaywrightTestDataSetup();
    testData = await testDataSetup.setupEcommerceScenario();
    console.log('✅ Test data setup complete:', {
      materials: testData.materials.length,
      products: testData.products.length,
      prefix: testData.testPrefix,
    });
  });

  test.afterAll(async () => {
    // Cleanup test data
    if (testDataSetup) {
      await testDataSetup.cleanup();
      console.log('✅ Test data cleaned up');
    }
  });

  test('should load homepage and display products', async ({ page }) => {
    // Navigate to fabric store
    await page.goto('http://localhost:3006');

    // Wait for page to load
    await expect(page).toHaveTitle(/Fabric Store/i);

    // Check if products are loaded
    const productList = page.locator('[data-testid="product-list"]');
    await expect(productList).toBeVisible();

    // Verify our test products appear
    for (const product of testData.products) {
      const productCard = page.locator(`[data-testid="product-${product.id}"]`);
      await expect(productCard).toBeVisible();
      await expect(productCard).toContainText(product.title);
    }
  });

  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('http://localhost:3006');

    const firstProduct = testData.products[0];

    // Click on first product
    await page.click(`[data-testid="product-${firstProduct.id}"]`);

    // Should navigate to product detail page
    await expect(page).toHaveURL(new RegExp(`/products/${firstProduct.handle}`));

    // Verify product details
    await expect(page.locator('h1')).toContainText(firstProduct.title);

    // Check variants are displayed
    for (const variant of firstProduct.variants) {
      const variantOption = page.locator(`[data-testid="variant-${variant.id}"]`);
      await expect(variantOption).toBeVisible();
      await expect(variantOption).toContainText(variant.title);
    }
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('http://localhost:3006');

    const firstProduct = testData.products[0];
    const firstVariant = firstProduct.variants[0];

    // Navigate to product
    await page.click(`[data-testid="product-${firstProduct.id}"]`);

    // Select variant
    await page.click(`[data-testid="variant-${firstVariant.id}"]`);

    // Add to cart
    await page.click('[data-testid="add-to-cart"]');

    // Verify cart notification or update
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toContainText('1');
  });

  test('should complete checkout flow', async ({ page }) => {
    await page.goto('http://localhost:3006');

    const firstProduct = testData.products[0];
    const firstVariant = firstProduct.variants[0];

    // Add product to cart
    await page.click(`[data-testid="product-${firstProduct.id}"]`);
    await page.click(`[data-testid="variant-${firstVariant.id}"]`);
    await page.click('[data-testid="add-to-cart"]');

    // Go to cart
    await page.click('[data-testid="cart-link"]');

    // Verify cart contents
    await expect(page.locator(`[data-testid="cart-item-${firstVariant.id}"]`)).toBeVisible();

    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');

    // Fill customer information
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '+1234567890');
    await page.fill('[data-testid="shipping-address"]', '123 Test Street');
    await page.fill('[data-testid="shipping-city"]', 'Test City');
    await page.fill('[data-testid="shipping-zip"]', '12345');

    // Submit order (without payment for test)
    await page.click('[data-testid="place-order"]');

    // Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
  });

  test('should search for materials', async ({ page }) => {
    await page.goto('http://localhost:3006');

    // Use search functionality
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('cotton');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Verify search results
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();

    // Should show cotton-related products
    const cottonProducts = page.locator('[data-testid*="cotton"]');
    await expect(cottonProducts.first()).toBeVisible();
  });

  test('should filter products by material type', async ({ page }) => {
    await page.goto('http://localhost:3006');

    // Open filter sidebar
    await page.click('[data-testid="filter-toggle"]');

    // Select cotton filter
    await page.click('[data-testid="filter-cotton"]');

    // Apply filters
    await page.click('[data-testid="apply-filters"]');

    // Verify filtered results
    const filteredProducts = page.locator('[data-testid="product-list"] > div');
    const count = await filteredProducts.count();

    // Should show only cotton products
    for (let i = 0; i < count; i++) {
      const product = filteredProducts.nth(i);
      await expect(product).toContainText(/cotton/i);
    }
  });
});

test.describe('Admin Dashboard Integration', () => {
  let testDataSetup: PlaywrightTestDataSetup;

  test.beforeAll(async () => {
    testDataSetup = new PlaywrightTestDataSetup();
    await testDataSetup.setupEcommerceScenario();
  });

  test.afterAll(async () => {
    if (testDataSetup) {
      await testDataSetup.cleanup();
    }
  });

  test('should manage materials in admin', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin');

    // Login (if needed)
    // await page.fill('[data-testid="admin-email"]', 'admin@test.com');
    // await page.fill('[data-testid="admin-password"]', 'password');
    // await page.click('[data-testid="login-button"]');

    // Navigate to materials
    await page.click('[data-testid="materials-nav"]');

    // Verify materials list
    const materialsTable = page.locator('[data-testid="materials-table"]');
    await expect(materialsTable).toBeVisible();

    // Should show our test materials
    await expect(page.locator('text=Premium Cotton Canvas')).toBeVisible();
    await expect(page.locator('text=Luxury Silk Fabric')).toBeVisible();
  });

  test('should link materials to product variants', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/products');

    // Find our test product
    const testProduct = page.locator('text=Fabric Bundle Collection');
    await expect(testProduct).toBeVisible();

    // Click to edit
    await testProduct.click();

    // Navigate to variants tab
    await page.click('[data-testid="variants-tab"]');

    // Verify material links
    const cottonVariant = page.locator('text=Cotton Bundle');
    await expect(cottonVariant).toBeVisible();

    const silkVariant = page.locator('text=Silk Bundle');
    await expect(silkVariant).toBeVisible();
  });
});