import path from 'path'
import { defineConfig, devices } from '@playwright/test'

// E2E tests run against their OWN production server on port 3100 with an
// isolated data folder and no API key – they must never touch the real
// settings (data/settings.json) or spend API credit.
const PORT = 3100
export const QA_DATA_DIR = path.join(__dirname, 'tests', '.qa-data')

export default defineConfig({
  testDir: './tests',
  // Settings are a single shared file on the server → run tests one at a time
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: `npm run build && npx next start -H 127.0.0.1 -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/einstellungen`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      SCANTOOL_DATA_DIR: QA_DATA_DIR,
      // Empty value wins over .env.local → "no API key" state, no real API calls
      ANTHROPIC_API_KEY: '',
    },
  },
})
