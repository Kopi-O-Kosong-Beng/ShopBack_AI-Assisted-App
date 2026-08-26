import { expect, test, type Page } from '@playwright/test'

async function addTask(page: Page, title: string) {
  await page.getByLabel('New task').fill(title)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('E2E-01: adds a task and shows it in the list', async ({ page }) => {
  await expect(page.getByText('No tasks yet')).toBeVisible()
  await addTask(page, 'Buy milk')
  await expect(page.getByText('Buy milk')).toBeVisible()
  await expect(page.getByText('No tasks yet')).toBeHidden()
})

test('E2E-02: rejects an empty task with an inline error', async ({ page }) => {
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(/task cannot be empty/i)
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('E2E-03: edits a task title', async ({ page }) => {
  await addTask(page, 'Buy milk')
  await page.getByRole('button', { name: 'Edit "Buy milk"' }).click()
  await page.getByLabel('Edit task').fill('Buy oat milk')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Buy oat milk')).toBeVisible()
  await expect(page.getByText('Buy milk', { exact: true })).toBeHidden()
})

test('E2E-04: marks a task complete and updates the counter', async ({ page }) => {
  await addTask(page, 'Buy milk')
  await expect(page.getByText('1 item left')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Buy milk' }).check()
  await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toBeChecked()
  await expect(page.getByText('0 items left')).toBeVisible()
})

test('E2E-05: deletes a task', async ({ page }) => {
  await addTask(page, 'Buy milk')
  await page.getByRole('button', { name: 'Delete "Buy milk"' }).click()
  await expect(page.getByText('Buy milk')).toBeHidden()
  await expect(page.getByText('No tasks yet')).toBeVisible()
})

test('E2E-06: tasks persist across a page reload', async ({ page }) => {
  await addTask(page, 'Persisted task')
  await page.getByRole('checkbox', { name: 'Persisted task' }).check()

  await page.reload()

  await expect(page.getByText('Persisted task')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Persisted task' })).toBeChecked()
})

test('E2E-07: filters tasks and clears completed ones', async ({ page }) => {
  await addTask(page, 'Active task')
  await addTask(page, 'Done task')
  await page.getByRole('checkbox', { name: 'Done task' }).check()

  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await expect(page.getByText('Active task')).toBeVisible()
  await expect(page.getByText('Done task')).toBeHidden()

  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await expect(page.getByText('Done task')).toBeVisible()
  await expect(page.getByText('Active task')).toBeHidden()

  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.getByRole('button', { name: 'Clear completed' }).click()
  await expect(page.getByText('Active task')).toBeVisible()
  await expect(page.getByText('Done task')).toBeHidden()
})
