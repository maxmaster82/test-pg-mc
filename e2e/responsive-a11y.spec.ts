import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, expectNoSeriousA11yViolations, signIn } from './support'

const PAGES = [
  '/',
  '/tickets',
  '/tickets/new',
  '/tickets/tkt_0002',
  '/events',
  '/events/evt_001/edit',
  '/categories',
  '/categories/cat_01',
]
const WIDTHS = [320, 390, 768, 1024, 1440]

test('no horizontal overflow at any supported width', async ({ page }) => {
  // 5 widths × 8 full page loads; with realistic mock latency (Docker build) this takes a while.
  test.setTimeout(120_000)
  await signIn(page)
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of PAGES) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('.animate-pulse')).toHaveCount(0)
      await test.step(`${width}px ${path}`, () => expectNoHorizontalOverflow(page))
      if (path === '/tickets') {
        await page.screenshot({
          path: `test-results/screens/tickets-${width}.png`,
          fullPage: false,
        })
      }
    }
  }
})

for (const theme of ['light', 'dark'] as const) {
  test(`axe: no serious violations in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('ticket-admin:theme', t)
    }, theme)
    await page.goto('/login')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await expectNoSeriousA11yViolations(page)
    await signIn(page)
    for (const path of ['/', '/tickets', '/tickets/new', '/events', '/categories']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('.animate-pulse')).toHaveCount(0)
      await test.step(`${theme} ${path}`, () => expectNoSeriousA11yViolations(page))
    }
    await page.goto('/tickets')
    await expect(page.getByRole('table', { name: 'Tickets' })).toBeVisible()
    await page.screenshot({ path: `test-results/screens/tickets-${theme}.png` })
  })
}
