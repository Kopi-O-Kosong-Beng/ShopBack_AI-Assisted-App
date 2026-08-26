import { expect, test, type Page } from '@playwright/test'

/**
 * End-to-end tests against a real Chromium browser, real IndexedDB and the real
 * SQLite WebAssembly build. Each test gets a clean origin, so signup and the
 * seeded demo account behave like a first visit.
 */

function isoToday(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

async function dismissTour(page: Page) {
  const skip = page.getByRole('button', { name: 'Skip' })
  if (await skip.isVisible().catch(() => false)) await skip.click()
}

async function loginDemo(page: Page) {
  await page.getByRole('button', { name: 'Try the demo account' }).click()
  await page.getByRole('tab', { name: 'Tasks' }).waitFor()
  await dismissTour(page)
}

async function signup(page: Page, username: string) {
  await page.getByRole('tab', { name: 'Sign up' }).click()
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill('password123')
  await page.getByLabel('Department').selectOption('Engineering')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('tab', { name: 'Tasks' }).waitFor()
  await dismissTour(page)
}

async function addTask(page: Page, title: string, dueIso?: string) {
  await page.getByLabel('New task').fill(title)
  if (dueIso) await page.getByLabel('Due date').fill(dueIso)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  // Anchor on the checkbox aria-label: it is exactly the title, so this cannot
  // substring-match the "Task added" toast or pick up due-date badge text.
  await expect(page.getByRole('checkbox', { name: title, exact: true })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('E2E-01: signs up, lands on an empty task list', async ({ page }) => {
  await signup(page, 'zhifeng')
  await expect(page.getByText('No tasks yet')).toBeVisible()
  await expect(page.getByText(/window shopper/i).first()).toBeVisible()
})

test('E2E-02: rejects an empty task with an inline error', async ({ page }) => {
  await signup(page, 'emptytest')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText(/task cannot be empty/i)).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('E2E-03: adds, edits and deletes a task', async ({ page }) => {
  await signup(page, 'crudtest')
  await addTask(page, 'Buy milk')

  await page.getByRole('button', { name: 'Edit "Buy milk"' }).click()
  await page.getByLabel('Edit task').fill('Buy oat milk')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Buy oat milk')).toBeVisible()

  await page.getByRole('button', { name: 'Delete "Buy oat milk"' }).click()
  await expect(page.getByText('No tasks yet')).toBeVisible()
})

test('E2E-04: completing a task awards XP', async ({ page }) => {
  await signup(page, 'xptest')
  await addTask(page, 'Earn some XP')
  await page.getByRole('checkbox', { name: 'Earn some XP' }).click()
  await expect(page.getByText('+10 XP')).toBeVisible()
  await expect(page.getByText(/10 XP/).first()).toBeVisible()
})

test('E2E-05: completing before the due date awards the bonus', async ({ page }) => {
  await signup(page, 'bonustest')
  await addTask(page, 'Finish early', isoToday(1))
  await page.getByRole('checkbox', { name: 'Finish early' }).click()
  await expect(page.getByText('+15 XP')).toBeVisible()
})

test('E2E-06: re-completing a task does not award XP twice', async ({ page }) => {
  await signup(page, 'nofarming')
  await addTask(page, 'No farming')
  const checkbox = page.getByRole('checkbox', { name: 'No farming' })
  await checkbox.click()
  await expect(page.getByText('+10 XP')).toBeVisible()
  await expect(page.getByText('10/50 XP to level 2')).toBeVisible()

  await checkbox.click() // un-complete
  await checkbox.click() // complete again
  await expect(page.getByText('10/50 XP to level 2')).toBeVisible()
})

test('E2E-07: tasks and session persist across a page reload', async ({ page }) => {
  await signup(page, 'persisttest')
  await addTask(page, 'Survives reload')
  await page.getByRole('checkbox', { name: 'Survives reload' }).click()
  await expect(page.getByText('+10 XP')).toBeVisible()

  await page.reload()

  await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible()
  await expect(page.getByText('Survives reload')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Survives reload' })).toBeChecked()
  await expect(page.getByText('10/50 XP to level 2')).toBeVisible()
})

test('E2E-08: filters tasks and clears completed ones', async ({ page }) => {
  await signup(page, 'filtertest')
  await addTask(page, 'Active task')
  await addTask(page, 'Done task')
  await page.getByRole('checkbox', { name: 'Done task' }).click()

  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await expect(page.getByText('Active task')).toBeVisible()
  await expect(page.getByText('Done task')).toBeHidden()

  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await expect(page.getByText('Done task')).toBeVisible()

  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.getByRole('button', { name: 'Clear completed' }).click()
  await expect(page.getByText('Done task')).toBeHidden()
  await expect(page.getByText('Active task')).toBeVisible()
})

test('E2E-09: due date badges and the calendar view', async ({ page }) => {
  await signup(page, 'caltest')
  await addTask(page, 'Due today', isoToday())
  await expect(page.getByText('Today', { exact: true })).toBeVisible()

  await page.getByRole('tab', { name: 'Calendar' }).click()
  const todayCell = page.getByTestId('calendar-today')
  await expect(todayCell.getByText('Due today')).toBeVisible()

  const label = await page.getByTestId('calendar-label').textContent()
  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(page.getByTestId('calendar-label')).not.toHaveText(label ?? '')
})

test('E2E-10: the mascot reacts to task load', async ({ page }) => {
  await signup(page, 'mascottest')
  await expect(page.getByTestId('mascot')).toHaveAttribute('data-mood', 'zen')

  for (const title of ['A', 'B', 'C', 'D', 'E', 'F']) {
    await addTask(page, `Task ${title}`)
  }
  await expect(page.getByTestId('mascot')).toHaveAttribute('data-mood', 'worried')
  await expect(page.getByRole('progressbar', { name: 'Cortisol level' })).toHaveAttribute(
    'aria-valuenow',
    '48',
  )
})

test('E2E-11: leaderboard ranks users and marks the current one', async ({ page }) => {
  await loginDemo(page)
  await page.getByRole('tab', { name: 'Leaderboard' }).click()
  const rows = page.getByRole('row')
  await expect(rows.nth(1)).toContainText('aisyah') // highest XP first
  await expect(page.getByText('You')).toBeVisible()
})

test('E2E-12: onboarding shows once, then reopens from the help button', async ({ page }) => {
  await page.getByRole('button', { name: 'Try the demo account' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.reload()
  await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByRole('button', { name: 'Open the guide' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('E2E-13: logging out returns to the login page and survives a reload', async ({ page }) => {
  await loginDemo(page)
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()

  // The cleared session must stay cleared: a lingering key would silently
  // log the user back in on the next visit.
  await page.reload()
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Tasks' })).toBeHidden()
})

test('E2E-14: rejects wrong credentials', async ({ page }) => {
  await page.getByLabel('Username').fill('demo')
  await page.getByLabel('Password').fill('wrongpassword')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page.getByText(/invalid username or password/i)).toBeVisible()
})
