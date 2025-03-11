const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    const locator = page.getByText('log in to application')
    const buttonLogin =page.getByRole('button', { name: 'login' })

    await expect(buttonLogin).toBeVisible()
    await expect(locator).toBeVisible()
  })
})