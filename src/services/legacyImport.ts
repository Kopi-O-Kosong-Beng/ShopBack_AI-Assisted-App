import type { Database } from 'sql.js'
import type { Todo } from '../domain/todo'
import { insert } from '../storage/todoSqlRepository'

/** The v1 app stored todos as a JSON array under this localStorage key. */
export const LEGACY_STORAGE_KEY = 'shopback-todo.v1'

interface LegacyTodo {
  id: string
  title: string
  completed: boolean
  createdAt: number
  dueDate?: number | null
  xpAwarded?: boolean
}

export function isValidLegacyArray(value: unknown): value is LegacyTodo[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as LegacyTodo).id === 'string' &&
        typeof (item as LegacyTodo).title === 'string' &&
        typeof (item as LegacyTodo).completed === 'boolean' &&
        typeof (item as LegacyTodo).createdAt === 'number',
    )
  )
}

/**
 * One-time migration: moves any v1 localStorage todos into the given account,
 * then removes the legacy key. Already-completed tasks are marked xpAwarded so
 * the migration cannot mint retroactive XP. Returns how many were imported.
 */
export function importLegacyTodos(
  db: Database,
  userId: string,
  storage?: Storage,
): number {
  let raw: string | null
  let store: Storage
  try {
    store = storage ?? window.localStorage
    raw = store.getItem(LEGACY_STORAGE_KEY)
  } catch {
    return 0
  }
  if (raw === null) return 0

  let imported = 0
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isValidLegacyArray(parsed)) {
      for (const legacy of parsed) {
        const todo: Todo = {
          id: legacy.id,
          title: legacy.title,
          completed: legacy.completed,
          createdAt: legacy.createdAt,
          dueDate: legacy.dueDate ?? null,
          xpAwarded: legacy.xpAwarded ?? legacy.completed,
        }
        insert(db, userId, todo)
        imported++
      }
    }
  } catch {
    // Unreadable legacy data: drop it rather than block signup.
  }
  try {
    store.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Ignore: worst case the key lingers.
  }
  return imported
}
