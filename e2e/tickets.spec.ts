import { expect, test } from '@playwright/test'
import { signIn } from './support'

test('search, filter, sort and paginate through the URL', async ({ page }) => {
  await signIn(page, '/tickets')
  const pagination = page.getByRole('navigation', { name: 'Pagination' })
  await expect(pagination).toContainText('1–20 of 250')

  await page.getByRole('searchbox', { name: 'Search tickets by name' }).fill('vip')
  await expect(page).toHaveURL(/q=vip/)
  await page.getByRole('combobox', { name: 'Status' }).selectOption('On sale')
  await expect(page).toHaveURL(/status=on_sale/)
  await page.getByRole('columnheader', { name: /Price/ }).getByRole('button').click()
  await expect(page.getByRole('columnheader', { name: /Price/ })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )

  const rows = page.getByRole('table', { name: 'Tickets' }).getByRole('row')
  await expect(rows.nth(1)).toContainText(/VIP/)
  await expect(rows.nth(1)).toContainText('On sale')

  await page.goBack()
  await expect(page.getByRole('columnheader', { name: /Updated/ })).toHaveAttribute(
    'aria-sort',
    'descending',
  )
})

test('create, edit and delete a ticket', async ({ page }) => {
  await signIn(page, '/tickets')
  await page.getByRole('link', { name: 'New ticket' }).first().click()

  await page.getByRole('textbox', { name: 'Name' }).fill('E2E Pass')
  await page.getByRole('textbox', { name: 'Price' }).fill('39.50')
  await page.getByRole('textbox', { name: 'Quantity available' }).fill('75')
  const event = page.getByRole('combobox', { name: 'Event' })
  await event.click()
  await event.fill('jazz')
  await page.getByRole('listbox').getByRole('option').first().click()
  await page.getByRole('combobox', { name: 'Category' }).selectOption('VIP')
  await page.getByRole('button', { name: 'Create ticket' }).click()

  await expect(page.getByText('Ticket created')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'E2E Pass' })).toBeVisible()
  await expect(page.getByText(/39[.,]50/)).toBeVisible()

  await page.getByRole('link', { name: 'Edit' }).click()
  await page.getByRole('textbox', { name: 'Name' }).fill('E2E Pass (updated)')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'E2E Pass (updated)' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'Delete ticket?' })
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await dialog.getByRole('button', { name: 'Delete ticket' }).click()
  await expect(page).toHaveURL('/tickets')
  await expect(page.getByText('Ticket deleted')).toBeVisible()
  await expect(page.getByRole('link', { name: 'E2E Pass (updated)' })).toHaveCount(0)
})

test('changes the status of several tickets at once', async ({ page }) => {
  await signIn(page, '/tickets?status=draft')
  const table = page.getByRole('table', { name: 'Tickets' })
  await expect(table).toBeVisible()
  const boxes = table.getByRole('checkbox', { name: /^Select (?!all)/ })
  for (let i = 0; i < 3; i++) await boxes.nth(i).check()

  const bar = page.getByRole('region', { name: 'Bulk actions' })
  await expect(bar).toContainText('3 selected')
  await bar.getByRole('combobox', { name: 'Change status to' }).selectOption('Paused')
  await bar.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('3 tickets set to Paused.')).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Apply' })).toBeFocused()
})
