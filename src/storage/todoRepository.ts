import type { Todo } from '../domain/todo'

export const STORAGE_KEY = 'shopback-todo.v1'

export type StorageError = 'unavailable' | 'corrupted' | null

export interface LoadResult {
  todos: Todo[]
  error: StorageError
}

export function isValidTodoArray(value: unknown): value is Todo[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Todo).id === 'string' &&
        typeof (item as Todo).title === 'string' &&
        typeof (item as Todo).completed === 'boolean' &&
        typeof (item as Todo).createdAt === 'number',
    )
  )
}

function resolveStorage(storage?: Storage): Storage {
  return storage ?? window.localStorage
}

export function loadTodos(storage?: Storage): LoadResult {
  let raw: string | null
  try {
    raw = resolveStorage(storage).getItem(STORAGE_KEY)
  } catch {
    return { todos: [], error: 'unavailable' }
  }
  if (raw === null) {
    return { todos: [], error: null }
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isValidTodoArray(parsed)) {
      return { todos: [], error: 'corrupted' }
    }
    return { todos: parsed, error: null }
  } catch {
    return { todos: [], error: 'corrupted' }
  }
}

export function saveTodos(todos: Todo[], storage?: Storage): boolean {
  try {
    resolveStorage(storage).setItem(STORAGE_KEY, JSON.stringify(todos))
    return true
  } catch {
    return false
  }
}
