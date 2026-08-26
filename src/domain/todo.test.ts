import { describe, expect, it } from 'vitest'
import {
  MAX_TITLE_LENGTH,
  activeCount,
  addTodo,
  clearCompleted,
  createTodo,
  deleteTodo,
  editTodoTitle,
  filterTodos,
  toggleTodo,
  validateTitle,
  type Todo,
} from './todo'

const make = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'id-1',
  title: 'Buy milk',
  completed: false,
  createdAt: 1000,
  dueDate: null,
  xpAwarded: false,
  ...overrides,
})

describe('validateTitle', () => {
  it('accepts a normal title', () => {
    expect(validateTitle('Buy milk')).toEqual({ ok: true, value: 'Buy milk' })
  })

  it('trims surrounding whitespace', () => {
    expect(validateTitle('  Buy milk  ')).toEqual({ ok: true, value: 'Buy milk' })
  })

  it('rejects an empty title', () => {
    const result = validateTitle('')
    expect(result.ok).toBe(false)
  })

  it('rejects a whitespace-only title', () => {
    const result = validateTitle('   ')
    expect(result.ok).toBe(false)
  })

  it('accepts a title exactly at the max length', () => {
    const result = validateTitle('a'.repeat(MAX_TITLE_LENGTH))
    expect(result.ok).toBe(true)
  })

  it('rejects a title longer than the max length', () => {
    const result = validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1))
    expect(result.ok).toBe(false)
  })
})

describe('createTodo', () => {
  it('creates an incomplete todo with the given id and timestamp', () => {
    expect(createTodo('Buy milk', 'id-9', 123)).toEqual({
      id: 'id-9',
      title: 'Buy milk',
      completed: false,
      createdAt: 123,
      dueDate: null,
      xpAwarded: false,
    })
  })

  it('creates a todo with a due date when one is given', () => {
    expect(createTodo('Buy milk', 'id-9', 123, 456).dueDate).toBe(456)
  })
})

describe('addTodo', () => {
  it('prepends the new todo so newest is first', () => {
    const existing = make({ id: 'old' })
    const added = make({ id: 'new' })
    expect(addTodo([existing], added).map((t) => t.id)).toEqual(['new', 'old'])
  })

  it('does not mutate the original list', () => {
    const list = [make()]
    addTodo(list, make({ id: 'new' }))
    expect(list).toHaveLength(1)
  })
})

describe('editTodoTitle', () => {
  it('updates only the matching todo', () => {
    const list = [make({ id: 'a', title: 'One' }), make({ id: 'b', title: 'Two' })]
    const result = editTodoTitle(list, 'b', 'Two edited')
    expect(result.find((t) => t.id === 'a')?.title).toBe('One')
    expect(result.find((t) => t.id === 'b')?.title).toBe('Two edited')
  })

  it('returns the list unchanged for an unknown id', () => {
    const list = [make()]
    expect(editTodoTitle(list, 'missing', 'X')).toEqual(list)
  })

  it('does not mutate the original todo', () => {
    const list = [make({ id: 'a', title: 'One' })]
    editTodoTitle(list, 'a', 'Changed')
    expect(list[0].title).toBe('One')
  })
})

describe('toggleTodo', () => {
  it('marks an incomplete todo as completed', () => {
    const result = toggleTodo([make({ completed: false })], 'id-1')
    expect(result[0].completed).toBe(true)
  })

  it('marks a completed todo as incomplete again', () => {
    const result = toggleTodo([make({ completed: true })], 'id-1')
    expect(result[0].completed).toBe(false)
  })

  it('returns the list unchanged for an unknown id', () => {
    const list = [make()]
    expect(toggleTodo(list, 'missing')).toEqual(list)
  })
})

describe('deleteTodo', () => {
  it('removes the matching todo', () => {
    const list = [make({ id: 'a' }), make({ id: 'b' })]
    expect(deleteTodo(list, 'a').map((t) => t.id)).toEqual(['b'])
  })

  it('returns the list unchanged for an unknown id', () => {
    const list = [make()]
    expect(deleteTodo(list, 'missing')).toEqual(list)
  })
})

describe('filterTodos', () => {
  const list = [
    make({ id: 'a', completed: false }),
    make({ id: 'b', completed: true }),
    make({ id: 'c', completed: false }),
  ]

  it('returns everything for the all filter', () => {
    expect(filterTodos(list, 'all')).toHaveLength(3)
  })

  it('returns only incomplete todos for the active filter', () => {
    expect(filterTodos(list, 'active').map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('returns only completed todos for the completed filter', () => {
    expect(filterTodos(list, 'completed').map((t) => t.id)).toEqual(['b'])
  })
})

describe('activeCount', () => {
  it('counts only incomplete todos', () => {
    const list = [make({ completed: false }), make({ id: 'x', completed: true })]
    expect(activeCount(list)).toBe(1)
  })
})

describe('clearCompleted', () => {
  it('removes all completed todos', () => {
    const list = [
      make({ id: 'a', completed: true }),
      make({ id: 'b', completed: false }),
      make({ id: 'c', completed: true }),
    ]
    expect(clearCompleted(list).map((t) => t.id)).toEqual(['b'])
  })
})
