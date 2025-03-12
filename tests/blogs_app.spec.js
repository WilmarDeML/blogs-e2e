const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog, createUser, addLikes } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await createUser(request, 'Matti Luukkainen', 'mluukkai', 'salainen')

    await page.goto('/')
  })

  test('Login form is shown', async ({ page }) => {
    const locator = page.getByText('log in to application')
    const buttonLogin =page.getByRole('button', { name: 'login' })

    await expect(buttonLogin).toBeVisible()
    await expect(locator).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'wrong password')      
      const errorDiv = page.locator('.error')
      await expect(errorDiv).toContainText('invalid username or password')
      await expect(errorDiv).toHaveCSS('border-style', 'solid')
      await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
    })
  })

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, 'a blog created by playwright', 'playwright', 'https://playwright.dev')
      const location = page.locator('.blog').getByText('a blog created by playwright')
      await expect(location).toBeVisible()
    })

    describe('and a blog exists', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, 'another blog by playwright', 'playwright', 'https://playwright.dev')
      })
  
      test('likes can be changed', async ({ page }) => {
        await page.getByRole('button', { name: 'view' }).click()
        await page.getByRole('button', { name: 'like' }).click()
        await page.waitForTimeout(200);
        await page.getByRole('button', { name: 'like' }).click()
        await page.waitForTimeout(200);
        await expect(page.getByText('likes: 2')).toBeVisible();
      })

      test('blog can be deleted by creator', async ({ page }) => {
        page.on('dialog', async dialog => {
          await dialog.accept()
        })

        await page.getByRole('button', { name: 'view' }).click()
        const location = page.locator('.blog').getByText('another blog by playwright')
        await expect(location).toBeVisible()
        await page.getByRole('button', { name: 'remove' }).click()
        await page.waitForTimeout(200);
        await expect(location).not.toBeVisible()
      })
      
      test('button to delete blog is not visible by other users', async ({ page, request }) => {
        await createUser(request, 'Wilmar De ML', 'wilmardeml', 'salainen')

        await page.getByRole('button', { name: 'view' }).click()
        await expect(page.getByRole('button', { name: 'remove' })).toBeVisible()

        await page.getByRole('button', { name: 'logout' }).click()
        await loginWith(page, 'wilmardeml', 'salainen')
        
        await page.getByRole('button', { name: 'view' }).click()
        await expect(page.getByRole('button', { name: 'remove' })).not.toBeVisible()
      })
    })

    describe('and a list of blogs exists', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, '1 blog by playwright', 'playwright', 'https://playwright.dev')
        await page.waitForTimeout(200)
        await createBlog(page, '2 blog by playwright', 'playwright', 'https://playwright.dev')
        await page.waitForTimeout(200)
        await createBlog(page, '3 blog by playwright', 'playwright', 'https://playwright.dev')
        await page.waitForTimeout(200)
        await createBlog(page, '4 blog by playwright', 'playwright', 'https://playwright.dev')
        await page.waitForTimeout(200)
      })
  
      test('the list of blogs are ordered by likes number', async ({ page }) => {
        await addLikes(page, '1 blog by playwright', 1)
        await addLikes(page, '2 blog by playwright', 2)
        await addLikes(page, '3 blog by playwright', 3)
        await addLikes(page, '4 blog by playwright', 4)

        const blogs = await page.locator('.blog').all()

        await expect(blogs[0]).toContainText('4 blog by playwright')
        await expect(blogs[1]).toContainText('3 blog by playwright')
        await expect(blogs[2]).toContainText('2 blog by playwright')
        await expect(blogs[3]).toContainText('1 blog by playwright')
      })
    })
  })

})