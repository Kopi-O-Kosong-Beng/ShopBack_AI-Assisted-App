import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../storage/todoRepository'
import TodoApp from './TodoApp'

async function addTask(title: string) {
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: /new task/i }), title)
  await user.click(screen.getByRole('button', { name: /^add$/i }))
}

beforeEach(() => {
  localStorage.clear()
})

describe('empty state', () => {
  it('shows the empty state when there are no tasks', () => {
    render(<TodoApp />)
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})

describe('adding tasks (UC-01)', () => {
  it('adds a task and shows it in the list', async () => {
    render(<TodoApp />)
    await addTask('Buy milk')
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.queryByText(/no tasks yet/i)).not.toBeInTheDocument()
  })

  it('clears the input after a successful add', async () => {
    render(<TodoApp />)
    await addTask('Buy milk')
    expect(screen.getByRole('textbox', { name: /new task/i })).toHaveValue('')
  })

  it('adds a task by pressing Enter', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await user.type(screen.getByRole('textbox', { name: /new task/i }), 'Buy milk{Enter}')
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('trims surrounding whitespace from the title', async () => {
    render(<TodoApp />)
    await addTask('  Buy milk  ')
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('shows the newest task first', async () => {
    render(<TodoApp />)
    await addTask('First')
    await addTask('Second')
    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('Second')).toBeInTheDocument()
    expect(within(items[1]).getByText('First')).toBeInTheDocument()
  })

  it('rejects an empty add with an error and adds nothing', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await user.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/task cannot be empty/i)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('clears the error after a successful add', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await user.click(screen.getByRole('button', { name: /^add$/i }))
    await addTask('Buy milk')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('completing tasks (UC-04)', () => {
  it('toggles a task complete and back via the checkbox', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('Buy milk')
    const checkbox = screen.getByRole('checkbox', { name: /buy milk/i })
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('updates the items-left counter', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('One')
    await addTask('Two')
    expect(screen.getByText(/2 items left/i)).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /one/i }))
    expect(screen.getByText(/1 item left/i)).toBeInTheDocument()
  })
})

describe('editing tasks (UC-02)', () => {
  it('edits a task title', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('Buy milk')
    await user.click(screen.getByRole('button', { name: /edit "buy milk"/i }))
    const editBox = screen.getByRole('textbox', { name: /edit task/i })
    await user.clear(editBox)
    await user.type(editBox, 'Buy oat milk')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByText('Buy oat milk')).toBeInTheDocument()
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
  })

  it('cancel keeps the original title', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('Buy milk')
    await user.click(screen.getByRole('button', { name: /edit "buy milk"/i }))
    const editBox = screen.getByRole('textbox', { name: /edit task/i })
    await user.clear(editBox)
    await user.type(editBox, 'Something else')
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.queryByText('Something else')).not.toBeInTheDocument()
  })

  it('rejects saving an empty title and keeps the task', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('Buy milk')
    await user.click(screen.getByRole('button', { name: /edit "buy milk"/i }))
    await user.clear(screen.getByRole('textbox', { name: /edit task/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/task cannot be empty/i)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })
})

describe('deleting tasks (UC-03)', () => {
  it('deletes a task', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('Buy milk')
    await user.click(screen.getByRole('button', { name: /delete "buy milk"/i }))
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
  })
})

describe('filtering (UC-06) and clearing completed (UC-07)', () => {
  it('filters active and completed tasks', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('Active task')
    await addTask('Done task')
    await user.click(screen.getByRole('checkbox', { name: /done task/i }))

    await user.click(screen.getByRole('button', { name: /^active$/i }))
    expect(screen.getByText('Active task')).toBeInTheDocument()
    expect(screen.queryByText('Done task')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^completed$/i }))
    expect(screen.getByText('Done task')).toBeInTheDocument()
    expect(screen.queryByText('Active task')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^all$/i }))
    expect(screen.getByText('Active task')).toBeInTheDocument()
    expect(screen.getByText('Done task')).toBeInTheDocument()
  })

  it('clears completed tasks only, and hides the button when none are completed', async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await addTask('Keep me')
    expect(screen.queryByRole('button', { name: /clear completed/i })).not.toBeInTheDocument()
    await addTask('Finish me')
    await user.click(screen.getByRole('checkbox', { name: /finish me/i }))
    await user.click(screen.getByRole('button', { name: /clear completed/i }))
    expect(screen.getByText('Keep me')).toBeInTheDocument()
    expect(screen.queryByText('Finish me')).not.toBeInTheDocument()
  })
})

describe('persistence (UC-05)', () => {
  it('saves tasks to localStorage', async () => {
    render(<TodoApp />)
    await addTask('Buy milk')
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].title).toBe('Buy milk')
  })

  it('restores tasks when the app is opened again', async () => {
    const first = render(<TodoApp />)
    await addTask('Buy milk')
    first.unmount()

    render(<TodoApp />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('shows a warning and starts fresh when stored data is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{')
    render(<TodoApp />)
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be read/i)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('lets the user dismiss the storage warning', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{')
    render(<TodoApp />)
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
