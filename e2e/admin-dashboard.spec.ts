/**
 * Admin Dashboard E2E Tests
 *
 * Testing admin workflows with real backend integration
 */

import { test, expect } from '@playwright/test';
import { PlaywrightTestDataSetup } from './setup/api-test-data';

test.describe('Admin Dashboard Materials Management', () => {
  let testDataSetup: PlaywrightTestDataSetup;
  let testData: any;

  test.beforeAll(async () => {
    testDataSetup = new PlaywrightTestDataSetup();
    testData = await testDataSetup.setupEcommerceScenario();
  });

  test.afterAll(async () => {
    if (testDataSetup) {
      await testDataSetup.cleanup();
    }
  });

  test('should load admin dashboard homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check if admin dashboard loads
    await expect(page).toHaveTitle(/Tara Hub/i);

    // Verify main navigation
    const navigation = page.locator('[data-testid="main-nav"]');
    await expect(navigation).toBeVisible();
  });

  test('should display materials list', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/materials');

    // Wait for materials to load
    const materialsContainer = page.locator('[data-testid="materials-container"]');
    await expect(materialsContainer).toBeVisible();

    // Should display our test materials
    await expect(page.locator('text=Premium Cotton Canvas')).toBeVisible();
    await expect(page.locator('text=Luxury Silk Fabric')).toBeVisible();
  });

  test('should search materials', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/materials');

    // Use search functionality
    const searchInput = page.locator('[data-testid="materials-search"]');
    await searchInput.fill('cotton');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should show cotton materials
    await expect(page.locator('text=Premium Cotton Canvas')).toBeVisible();

    // Should not show silk materials
    await expect(page.locator('text=Luxury Silk Fabric')).not.toBeVisible();
  });

  test('should view material details', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/materials');

    // Click on a material
    await page.click('text=Premium Cotton Canvas');

    // Should navigate to material detail page
    await expect(page.locator('h1')).toContainText('Premium Cotton Canvas');

    // Verify material properties
    await expect(page.locator('text=Type: cotton')).toBeVisible();
    await expect(page.locator('text=Code: PCC-001')).toBeVisible();
  });
});

test.describe('Product-Material Relationship Management', () => {
  let testDataSetup: PlaywrightTestDataSetup;
  let testData: any;

  test.beforeAll(async () => {
    testDataSetup = new PlaywrightTestDataSetup();
    testData = await testDataSetup.setupEcommerceScenario();
  });

  test.afterAll(async () => {
    if (testDataSetup) {
      await testDataSetup.cleanup();
    }
  });

  test('should display products with material links', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/products');

    // Find our test product
    const productCard = page.locator(`[data-testid="product-${testData.products[0].id}"]`);
    await expect(productCard).toBeVisible();
    await expect(productCard).toContainText('Fabric Bundle Collection');
  });

  test('should edit product variant material assignment', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/products');

    // Navigate to product detail
    await page.click('text=Fabric Bundle Collection');

    // Go to variants section
    const variantsSection = page.locator('[data-testid="variants-section"]');
    await expect(variantsSection).toBeVisible();

    // Find cotton variant
    const cottonVariant = page.locator('text=Cotton Bundle');
    await expect(cottonVariant).toBeVisible();

    // Edit material assignment
    await page.click(`[data-testid="edit-variant-${testData.products[0].variants[0].id}"]`);

    // Material selector should be visible
    const materialSelector = page.locator('[data-testid="material-selector"]');
    await expect(materialSelector).toBeVisible();

    // Current material should be selected
    await expect(page.locator('text=Premium Cotton Canvas')).toBeVisible();
  });

  test('should change variant material assignment', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/products');

    // Navigate to product and variant
    await page.click('text=Fabric Bundle Collection');
    await page.click(`[data-testid="edit-variant-${testData.products[0].variants[0].id}"]`);

    // Change material assignment
    const materialSelector = page.locator('[data-testid="material-selector"]');
    await materialSelector.selectOption('Luxury Silk Fabric');

    // Save changes
    await page.click('[data-testid="save-variant"]');

    // Verify change was saved
    await expect(page.locator('text=Material updated successfully')).toBeVisible();

    // Verify in the UI
    const variantRow = page.locator(`[data-testid="variant-row-${testData.products[0].variants[0].id}"]`);
    await expect(variantRow).toContainText('Luxury Silk Fabric');
  });
});

test.describe('Medusa Admin Integration', () => {
  test('should access Medusa admin panel', async ({ page }) => {
    await page.goto('http://localhost:9000/app');

    // Should load Medusa admin
    await expect(page).toHaveTitle(/Medusa/i);

    // Check for login or dashboard
    const isLoginPage = await page.locator('[data-testid="medusa-login"]').isVisible();

    if (isLoginPage) {
      // Fill login if needed
      await page.fill('[data-testid="email"]', process.env.MEDUSA_ADMIN_EMAIL || 'admin@test.com');
      await page.fill('[data-testid="password"]', process.env.MEDUSA_ADMIN_PASSWORD || 'password');
      await page.click('[data-testid="login-button"]');
    }

    // Should see dashboard
    const dashboard = page.locator('[data-testid="medusa-dashboard"]');
    await expect(dashboard).toBeVisible();
  });

  test('should manage products in Medusa admin', async ({ page }) => {
    await page.goto('http://localhost:9000/app');

    // Navigate to products
    await page.click('text=Products');

    // Products list should be visible
    const productsList = page.locator('[data-testid="products-list"]');
    await expect(productsList).toBeVisible();

    // Should be able to create new product
    const createButton = page.locator('[data-testid="create-product"]');
    await expect(createButton).toBeVisible();
  });
});