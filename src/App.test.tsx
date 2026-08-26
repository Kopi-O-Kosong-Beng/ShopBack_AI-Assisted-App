import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { memoryAdapter, type SnapshotAdapter } from './db/database'
import { testDatabase } from './test/testDb'

function isoToday(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

async function renderApp(adapter: SnapshotAdapter = memoryAdapter()) {
  const view = render(<App createDatabase={() => testDatabase(adapter)} />)
  // Wait for boot to finish: either the auth page or the signed-in shell.
  await waitFor(
    () => {
      const loggedOut = screen.queryByRole('button', { name: /^log in$/i })
      const loggedIn = screen.queryByRole('tab', { name: /tasks/i })
      expect(loggedOut ?? loggedIn).not.toBeNull()
    },
    { timeout: 15_000 },
  )
  return view
}

async function skipTourIfShown(user: UserEvent) {
  const skip = screen.queryByRole('button', { name: /skip/i })
  if (skip) await user.click(skip)
}

async function loginAsDemo(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: /try the demo account/i }))
  await screen.findByRole('tab', { name: /tasks/i })
  await skipTourIfShown(user)
}

async function signupFresh(user: UserEvent, username = 'zhifeng') {
  await user.click(screen.getByRole('tab', { name: /sign up/i }))
  await user.type(screen.getByLabelText(/username/i), username)
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.selectOptions(screen.getByLabelText(/department/i), 'Engineering')
  await user.click(screen.getByRole('button', { name: /create account/i }))
  await screen.findByRole('tab', { name: /tasks/i })
}

async function addTask(user: UserEvent, title: string, dueIso?: string) {
  await user.type(screen.getByRole('textbox', { name: /new task/i }), title)
  if (dueIso) {
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: dueIso } })
  }
  await user.click(screen.getByRole('button', { name: /^add$/i }))
  await screen.findByText(title)
}

beforeEach(() => {
  localStorage.clear()
})

describe('authentication (UC-08, UC-09)', () => {
  it('shows the login page when signed out', async () => {
    await renderApp()
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try the demo account/i })).toBeInTheDocument()
  })

  it('logs into the demo account with seeded tasks', async () => {
    const user = userEvent.setup()
    await renderApp()
    await loginAsDemo(user)
    expect(screen.getByText('Review cashback campaign brief')).toBeInTheDocument()
    expect(screen.getAllByText(/demo/).length).toBeGreaterThan(0)
  })

  it('rejects a short password at signup', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('tab', { name: /sign up/i }))
    await user.type(screen.getByLabelText(/username/i), 'zhifeng')
    await user.type(screen.getByLabelText(/password/i), 'short')
    await user.selectOptions(screen.getByLabelText(/department/i), 'Engineering')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument()
  })

  it('rejects wrong credentials with a generic error', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.type(screen.getByLabelText(/username/i), 'demo')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument()
  })

  it('keeps the session across a reload and can log out', async () => {
    const user = userEvent.setup()
    const adapter = memoryAdapter()
    const first = await renderApp(adapter)
    await loginAsDemo(user)
    first.unmount()

    await renderApp(adapter)
    await screen.findByRole('tab', { name: /tasks/i })
    expect(screen.getByText('Review cashback campaign brief')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(await screen.findByRole('button', { name: /^log in$/i })).toBeInTheDocument()
  })
})

describe('onboarding (UC-14)', () => {
  it('shows the tour on first login and not after finishing it', async () => {
    const user = userEvent.setup()
    const adapter = memoryAdapter()
    const first = await renderApp(adapter)
    await user.click(screen.getByRole('button', { name: /try the demo account/i }))
    expect(await screen.findByRole('dialog', { name: /welcome/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    first.unmount()

    await renderApp(adapter)
    await screen.findByRole('tab', { name: /tasks/i })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('walks through the steps and reopens from the help button', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('button', { name: /try the demo account/i }))
    await screen.findByRole('dialog', { name: /welcome/i })
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /done/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open the guide/i }))
    expect(await screen.findByRole('dialog', { name: /welcome/i })).toBeInTheDocument()
  })
})

describe('tasks with due dates (UC-01, UC-02, UC-12)', () => {
  it('adds a task due today with a Today badge', async () => {
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    await addTask(user, 'Ship the assessment', isoToday())
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('shows an Overdue badge after editing the due date into the past', async () => {
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    await addTask(user, 'Late task')
    await user.click(screen.getByRole('button', { name: /edit "late task"/i }))
    const editRow = screen.getByRole('textbox', { name: /edit task/i }).closest('li')!
    fireEvent.change(within(editRow).getByLabelText(/due date/i), {
      target: { value: isoToday(-2) },
    })
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Overdue')).toBeInTheDocument()
  })

  it('still rejects an empty task with an inline error', async () => {
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    await user.click(screen.getByRole('button', { name: /^add$/i }))
    expect(await screen.findByText(/task cannot be empty/i)).toBeInTheDocument()
  })
})

describe('XP (UC-04, UC-10)', () => {
  it('awards 10 XP for completing a task and shows it in the header', async () => {
    const user = userEvent.setup()
    await renderApp()
    await loginAsDemo(user)
    expect(screen.getAllByText(/45 xp/i).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('checkbox', { name: /plan team lunch/i }))
    expect(await screen.findByText('+10 XP')).toBeInTheDocument()
    expect(screen.getAllByText(/55 xp/i).length).toBeGreaterThan(0)
  })

  it('awards 15 XP for completing before the due date', async () => {
    const user = userEvent.setup()
    await renderApp()
    await loginAsDemo(user)
    await user.click(screen.getByRole('checkbox', { name: /review cashback campaign brief/i }))
    expect(await screen.findByText('+15 XP')).toBeInTheDocument()
  })

  it('never awards XP twice for the same task', async () => {
    const user = userEvent.setup()
    await renderApp()
    await loginAsDemo(user)
    const checkbox = screen.getByRole('checkbox', { name: /plan team lunch/i })
    await user.click(checkbox) // +10 -> 55
    await user.click(checkbox) // un-complete, XP kept
    await user.click(checkbox) // complete again, no XP
    expect(screen.getAllByText(/55 xp/i).length).toBeGreaterThan(0)
  })
})

describe('leaderboard (UC-11)', () => {
  it('ranks everyone and highlights the signed-in user', async () => {
    const user = userEvent.setup()
    await renderApp()
    await loginAsDemo(user)
    await user.click(screen.getByRole('tab', { name: /leaderboard/i }))
    expect(await screen.findByText('aisyah')).toBeInTheDocument()
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('aisyah')).toBeInTheDocument() // top XP first
    const you = screen.getByText(/you/i).closest('tr')!
    expect(within(you).getByText('demo')).toBeInTheDocument()
  })
})

describe('calendar (UC-12)', () => {
  it('shows a task chip on its due day in the calendar', async () => {
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    await addTask(user, 'Calendar task', isoToday())
    await user.click(screen.getByRole('tab', { name: /calendar/i }))
    const todayCell = screen.getByTestId('calendar-today')
    expect(within(todayCell).getByText('Calendar task')).toBeInTheDocument()
  })

  it('navigates between months', async () => {
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    await user.click(screen.getByRole('tab', { name: /calendar/i }))
    const label = screen.getByTestId('calendar-label').textContent
    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByTestId('calendar-label').textContent).not.toBe(label)
    await user.click(screen.getByRole('button', { name: /previous month/i }))
    expect(screen.getByTestId('calendar-label').textContent).toBe(label)
  })
})

describe('mascot (UC-13)', () => {
  it('is zen with no active tasks and relaxes as tasks are completed', async () => {
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    expect(screen.getByTestId('mascot')).toHaveAttribute('data-mood', 'zen')

    await addTask(user, 'One thing to do')
    expect(screen.getByTestId('mascot')).toHaveAttribute('data-mood', 'chill')

    await user.click(screen.getByRole('checkbox', { name: /one thing to do/i }))
    expect(screen.getByTestId('mascot')).toHaveAttribute('data-mood', 'zen')
  })

  it('shows the cortisol level rising with load', async () => {
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    const bar = screen.getByRole('progressbar', { name: /cortisol/i })
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    await addTask(user, 'Stress source')
    expect(bar).toHaveAttribute('aria-valuenow', '8')
  })
})

describe('legacy migration (UC-08)', () => {
  it('imports v1 localStorage tasks into a new account', async () => {
    localStorage.setItem(
      'shopback-todo.v1',
      JSON.stringify([{ id: 'l1', title: 'Task from v1', completed: false, createdAt: 5 }]),
    )
    const user = userEvent.setup()
    await renderApp()
    await signupFresh(user)
    await skipTourIfShown(user)
    expect(screen.getByText('Task from v1')).toBeInTheDocument()
    expect(localStorage.getItem('shopback-todo.v1')).toBeNull()
  })
})

describe('corrupted snapshot (UC-05)', () => {
  it('starts fresh with a visible notice when the snapshot is unreadable', async () => {
    const adapter = memoryAdapter(new Uint8Array([9, 9, 9, 9]))
    await renderApp(adapter)
    expect(screen.getByText(/could not be read/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument()
  })
})
