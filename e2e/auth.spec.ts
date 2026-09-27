import { expect, test } from '@playwright/test'
import { DEMO } from './support'

test('rejects wrong credentials with an accessible alert', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(DEMO.email)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.')
  await expect(page.getByRole('alert')).toBeFocused()
  await expect(page.getByLabel('Password')).toHaveValue('')
})

test('redirects a protected deep link to login and back after signing in', async ({ page }) => {
  await page.goto('/tickets?status=on_sale&page=2')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByLabel('Email').fill(DEMO.email)
  await page.getByLabel('Password').fill(DEMO.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/tickets?status=on_sale&page=2')
  await expect(page.getByRole('heading', { level: 1, name: 'Tickets' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText(/^21–40 of/)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Tickets' })).toBeVisible()
})
