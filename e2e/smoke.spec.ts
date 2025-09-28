/**
 * Smoke Tests - Basic Health Checks
 *
 * Quick tests to verify all services are running correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Service Health', () => {
  test('main admin app should load', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Should load without errors
    await expect(page).toHaveTitle(/Tara Hub/i);

    // Check for main navigation or content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should not show error pages
    const errorText = page.locator('text=Error');
    await expect(errorText).not.toBeVisible();
  });

  test('fabric store should load', async ({ page }) => {
    await page.goto('http://localhost:3006');

    // Should load fabric store
    await expect(page).toHaveTitle(/Fabric Store/i);

    // Basic content should be visible
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent).toBeVisible();
  });

  test('store guide should load', async ({ page }) => {
    await page.goto('http://localhost:3007');

    // Should load store guide
    await expect(page).toHaveTitle(/Store Guide/i);

    // Basic content should be visible
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('medusa backend should be accessible', async ({ page }) => {
    // Test Medusa API health
    const response = await page.request.get('http://localhost:9000/health');
    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health).toHaveProperty('status');
  });

  test('medusa admin should load', async ({ page }) => {
    await page.goto('http://localhost:9000/app');

    // Should load Medusa admin interface
    await expect(page).toHaveTitle(/Medusa/i);

    // Should show admin interface elements
    const adminInterface = page.locator('body');
    await expect(adminInterface).toBeVisible();
  });
});

test.describe('API Health Checks', () => {
  test('materials API should respond', async ({ page }) => {
    const response = await page.request.get('http://localhost:9000/admin/materials', {
      headers: {
        'Authorization': 'Bearer test-token', // Update with actual auth
      },
    });

    // Should get some response (200 or 401 for auth)
    expect([200, 401, 403]).toContain(response.status());
  });

  test('products API should respond', async ({ page }) => {
    const response = await page.request.get('http://localhost:9000/admin/products', {
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });

    expect([200, 401, 403]).toContain(response.status());
  });

  test('store API should respond', async ({ page }) => {
    const response = await page.request.get('http://localhost:9000/store/products');
    expect([200, 401]).toContain(response.status());
  });
});

test.describe('Database Connectivity', () => {
  test('database should be accessible through API', async ({ page }) => {
    // Test that database operations work through API
    const response = await page.request.get('http://localhost:9000/admin/regions');

    // Should get some response indicating DB is working
    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });
});