import { expect, test } from '@playwright/test'
import { signIn } from './support'

test('refuses to delete an event that still has tickets', async ({ page }) => {
  await signIn(page, '/events')
  const firstEvent = page.getByRole('table', { name: 'Events' }).getByRole('row').nth(1)
  const name = (await firstEvent.getByRole('link').first().textContent())?.trim() ?? ''
  await firstEvent.getByRole('button', { name: `Actions for ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete event' }).click()

  const dialog = page.getByRole('alertdialog', { name: 'Event cannot be deleted' })
  await expect(dialog).toContainText(`${name} has`)
  await dialog.getByRole('button', { name: 'View tickets' }).click()
  await expect(page).toHaveURL(/\/tickets\?eventId=evt_/)
  await expect(page.getByRole('table', { name: 'Tickets' }).getByRole('row').nth(1)).toContainText(
    name,
  )
})

test('keyboard only: create and delete a category', async ({ page }) => {
  await signIn(page, '/categories/new')
  await page.getByRole('textbox', { name: 'Name' }).focus()
  await page.keyboard.type('Keyboard Only')
  await page.keyboard.press('Tab')
  await page.keyboard.type('Created without a pointer')
  await page.keyboard.press('Enter') // newline in the textarea, not a submit
  await page.getByRole('button', { name: 'Create category' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Keyboard Only' })).toBeFocused()

  await page.getByRole('button', { name: 'Delete' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Shift+Tab') // focus stays trapped in the dialog
  await expect(page.getByRole('alertdialog')).toContainText('Delete category?')
  await page.getByRole('button', { name: 'Delete category' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/categories')
  await expect(page.getByText('Category deleted')).toBeVisible()
})
