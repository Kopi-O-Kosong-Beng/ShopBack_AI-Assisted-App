/**
 * Not a test suite: this file drives the real app to capture the screenshots in
 * /screenshots for the assessment submission. Run with:
 *   npx playwright test e2e/screenshots.spec.ts
 */
import { test, type Page } from '@playwright/test'

const DIR = 'screenshots'

async function addTask(page: Page, title: string) {
  await page.getByLabel('New task').fill(title)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
}

async function seed(page: Page) {
  await addTask(page, 'Read the ShopBack assessment brief')
  await addTask(page, 'Write the design documents')
  await addTask(page, 'Build the to-do app')
  await addTask(page, 'Deploy to Vercel')
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 760 })
  await page.goto('/')
})

test('01 empty state', async ({ page }) => {
  await page.screenshot({ path: `${DIR}/01-empty-state.png` })
})

test('02 task list', async ({ page }) => {
  await seed(page)
  await page.screenshot({ path: `${DIR}/02-task-list.png` })
})

test('03 add validation error', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.screenshot({ path: `${DIR}/03-validation-error.png` })
})

test('04 completed tasks', async ({ page }) => {
  await seed(page)
  await page.getByRole('checkbox', { name: 'Read the ShopBack assessment brief' }).check()
  await page.getByRole('checkbox', { name: 'Write the design documents' }).check()
  await page.screenshot({ path: `${DIR}/04-completed-tasks.png` })
})

test('05 inline editing', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: 'Edit "Build the to-do app"' }).click()
  await page.getByLabel('Edit task').fill('Build the to-do app with tests')
  await page.screenshot({ path: `${DIR}/05-inline-edit.png` })
})

test('06 active filter', async ({ page }) => {
  await seed(page)
  await page.getByRole('checkbox', { name: 'Deploy to Vercel' }).check()
  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await page.screenshot({ path: `${DIR}/06-filter-active.png` })
})

test('07 completed filter', async ({ page }) => {
  await seed(page)
  await page.getByRole('checkbox', { name: 'Deploy to Vercel' }).check()
  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await page.screenshot({ path: `${DIR}/07-filter-completed.png` })
})

test('08 storage warning', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('shopback-todo.v1', 'corrupted{{{'))
  await page.reload()
  await page.screenshot({ path: `${DIR}/08-storage-warning.png` })
})

test('09 mobile view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await seed(page)
  await page.getByRole('checkbox', { name: 'Deploy to Vercel' }).check()
  await page.screenshot({ path: `${DIR}/09-mobile-view.png` })
})
