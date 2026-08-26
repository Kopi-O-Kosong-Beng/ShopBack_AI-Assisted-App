/**
 * Not a test suite: drives the real app to capture the screenshots in
 * /screenshots for the assessment submission. Run with:
 *   npx playwright test e2e/screenshots.spec.ts --workers=1
 */
import { test, type Page } from '@playwright/test'

const DIR = 'screenshots'

async function loginDemo(page: Page) {
  await page.getByRole('button', { name: 'Try the demo account' }).click()
  await page.getByRole('tab', { name: 'Tasks' }).waitFor()
}

async function dismissTour(page: Page) {
  const skip = page.getByRole('button', { name: 'Skip' })
  if (await skip.isVisible().catch(() => false)) await skip.click()
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.goto('/')
})

test('01 login page', async ({ page }) => {
  await page.waitForTimeout(1800) // let the logo animation finish drawing
  await page.screenshot({ path: `${DIR}/01-login.png` })
})

test('02 signup form', async ({ page }) => {
  await page.getByRole('tab', { name: 'Sign up' }).click()
  await page.getByLabel('Username').fill('zhifeng')
  await page.getByLabel('Password').fill('password123')
  // The logo draws itself over ~1.3s; wait it out so the mark is complete.
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${DIR}/02-signup.png` })
})

test('03 onboarding tour', async ({ page }) => {
  await page.getByRole('button', { name: 'Try the demo account' }).click()
  await page.getByRole('dialog').waitFor()
  await page.screenshot({ path: `${DIR}/03-onboarding.png` })
})

test('04 task list with mascot', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  await page.screenshot({ path: `${DIR}/04-tasks-and-mascot.png` })
})

test('05 completing a task earns XP', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  await page.getByRole('checkbox', { name: 'Plan team lunch' }).check()
  await page.getByText('+10 XP').waitFor()
  await page.screenshot({ path: `${DIR}/05-xp-earned.png` })
})

test('06 inline editing with due date', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  await page.getByRole('button', { name: 'Edit "Plan team lunch"' }).click()
  await page.screenshot({ path: `${DIR}/06-inline-edit.png` })
})

test('07 validation error', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.screenshot({ path: `${DIR}/07-validation-error.png` })
})

test('08 calendar view', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  await page.getByRole('tab', { name: 'Calendar' }).click()
  await page.screenshot({ path: `${DIR}/08-calendar.png` })
})

test('09 leaderboard', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  await page.getByRole('tab', { name: 'Leaderboard' }).click()
  await page.screenshot({ path: `${DIR}/09-leaderboard.png` })
})

test('10 stressed mascot with a heavy task load', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  for (const title of ['Q3 report', 'Merchant audit', 'Fix payout bug', 'Reply to vendor']) {
    await page.getByLabel('New task').fill(title)
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page.getByText(title).waitFor()
  }
  await page.screenshot({ path: `${DIR}/10-mascot-stressed.png` })
})

test('12 toast notification', async ({ page }) => {
  await loginDemo(page)
  await dismissTour(page)
  await page.getByLabel('New task').fill('Prepare sprint demo')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByText('Task added').waitFor()
  await page.screenshot({ path: `${DIR}/12-toast-notification.png` })
})

test('11 mobile view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 })
  await loginDemo(page)
  await dismissTour(page)
  await page.screenshot({ path: `${DIR}/11-mobile.png` })
})
