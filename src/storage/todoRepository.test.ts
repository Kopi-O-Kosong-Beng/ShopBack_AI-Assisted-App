import { beforeEach, describe, expect, it } from 'vitest'
import type { Todo } from '../domain/todo'
import { STORAGE_KEY, isValidTodoArray, loadTodos, saveTodos } from './todoRepository'

const sample: Todo[] = [
  { id: 'a', title: 'Buy milk', completed: false, createdAt: 1000 },
  { id: 'b', title: 'Walk dog', completed: true, createdAt: 2000 },
]

function makeMemoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  }
}

function makeThrowingStorage(): Storage {
  const boom = () => {
    throw new Error('storage disabled')
  }
  return {
    length: 0,
    key: boom,
    getItem: boom,
    setItem: boom,
    removeItem: boom,
    clear: boom,
  }
}

describe('isValidTodoArray', () => {
  it('accepts a valid todo array', () => {
    expect(isValidTodoArray(sample)).toBe(true)
  })

  it('accepts an empty array', () => {
    expect(isValidTodoArray([])).toBe(true)
  })

  it('rejects a non-array value', () => {
    expect(isValidTodoArray({ todos: [] })).toBe(false)
  })

  it('rejects items missing required fields', () => {
    expect(isValidTodoArray([{ id: 'a', title: 'x' }])).toBe(false)
  })

  it('rejects items with wrong field types', () => {
    expect(
      isValidTodoArray([{ id: 1, title: 'x', completed: false, createdAt: 0 }]),
    ).toBe(false)
  })
})

describe('loadTodos', () => {
  it('returns an empty list with no error when nothing is stored', () => {
    expect(loadTodos(makeMemoryStorage())).toEqual({ todos: [], error: null })
  })

  it('returns saved todos after a save round-trip', () => {
    const storage = makeMemoryStorage()
    expect(saveTodos(sample, storage)).toBe(true)
    expect(loadTodos(storage)).toEqual({ todos: sample, error: null })
  })

  it('reports corrupted data for invalid JSON', () => {
    const storage = makeMemoryStorage({ [STORAGE_KEY]: 'not-json{{{' })
    expect(loadTodos(storage)).toEqual({ todos: [], error: 'corrupted' })
  })

  it('reports corrupted data for valid JSON with the wrong shape', () => {
    const storage = makeMemoryStorage({ [STORAGE_KEY]: '{"hello":"world"}' })
    expect(loadTodos(storage)).toEqual({ todos: [], error: 'corrupted' })
  })

  it('reports unavailable when the storage throws', () => {
    expect(loadTodos(makeThrowingStorage())).toEqual({ todos: [], error: 'unavailable' })
  })
})

describe('saveTodos', () => {
  it('returns false when the storage throws', () => {
    expect(saveTodos(sample, makeThrowingStorage())).toBe(false)
  })
})

describe('default browser storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses window.localStorage when no storage is passed', () => {
    expect(saveTodos(sample)).toBe(true)
    expect(loadTodos()).toEqual({ todos: sample, error: null })
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })
})
