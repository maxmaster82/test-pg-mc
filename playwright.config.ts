import { defineConfig, devices } from '@playwright/test'

const PORT = 4174
const CI = Boolean(process.env.CI)
/** Run against an already running app instead (e.g. the Docker container): E2E_BASE_URL=http://localhost:8080 */
const EXTERNAL_URL = process.env.E2E_BASE_URL

/**
 * E2E smoke suite against the production build (what Docker serves), with the in-browser
 * mock API and no simulated latency. Each test gets a fresh context: seed data, no session.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: EXTERNAL_URL ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /(mobile|auth)\.spec\.ts/,
    },
  ],
  webServer: EXTERNAL_URL
    ? undefined
    : {
        command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !CI,
        timeout: 180_000,
        env: { VITE_MOCK_LATENCY: '0', VITE_API_MOCKING: 'true' },
      },
})
