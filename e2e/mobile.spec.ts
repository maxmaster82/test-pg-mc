import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, signIn } from './support'

test('mobile: navigate with the drawer, filter with the disclosure and create a category', async ({
  page,
}) => {
  await signIn(page)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByRole('link', { name: 'Tickets' }).click()
  await expect(drawer).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Tickets' })).toBeVisible()

  const cards = page.getByRole('list', { name: 'Tickets' }).getByRole('listitem')
  await expect(cards).toHaveCount(20)
  await expect(page.getByRole('table')).toHaveCount(0)
  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Filters' }).click()
  await page.getByRole('combobox', { name: 'Status' }).selectOption('Paused')
  await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeVisible()
  await expect(cards.first()).toContainText('Paused')

  await page.goto('/categories/new')
  await page.getByRole('textbox', { name: 'Name' }).fill('Mobile Category')
  await page.getByRole('button', { name: 'Create category' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mobile Category' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
