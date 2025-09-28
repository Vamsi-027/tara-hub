/**
 * Jest E2E Setup File
 *
 * Global setup for E2E tests using the new infrastructure
 */

import { E2ETestSetup } from './e2e-test-setup';

// Global setup - runs once before all tests
beforeAll(async () => {
  const setup = E2ETestSetup.getInstance();
  await setup.globalSetup();
}, 120000); // 2 minute timeout for setup

// Global teardown - runs once after all tests
afterAll(async () => {
  const setup = E2ETestSetup.getInstance();
  await setup.globalTeardown();
}, 30000); // 30 second timeout for cleanup