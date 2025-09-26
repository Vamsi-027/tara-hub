import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 120 * 1000,
  expect: { timeout: 30 * 1000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3006',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev:fabric-store',
        port: 3006,
        timeout: 120 * 1000,
        reuseExistingServer: true,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

