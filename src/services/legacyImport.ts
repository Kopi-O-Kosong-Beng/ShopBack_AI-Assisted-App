import type { Database } from 'sql.js'
import { validateTitle, type Todo } from '../domain/todo'
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

export function isValidLegacyItem(item: unknown): item is LegacyTodo {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as LegacyTodo).id === 'string' &&
    typeof (item as LegacyTodo).title === 'string' &&
    typeof (item as LegacyTodo).completed === 'boolean' &&
    typeof (item as LegacyTodo).createdAt === 'number'
  )
}

/**
 * One-time migration: moves any v1 localStorage todos into the given account.
 * Validation is per item, so one malformed entry cannot discard the rest.
 * The legacy key is removed only after a successful read; data we could not
 * read is left in place rather than destroyed. Already-completed tasks are
 * marked xpAwarded so the migration cannot mint retroactive XP.
 * Returns how many todos were imported. Never throws: a broken legacy blob
 * must never block signup.
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

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return 0 // Unreadable: keep the key so the data is not silently destroyed.
  }
  if (!Array.isArray(parsed)) return 0 // Wrong shape: same rule, keep the key.

  let imported = 0
  for (const item of parsed) {
    if (!isValidLegacyItem(item)) continue
    // Titles and due dates go through the same rules as fresh input: a blank
    // title or a non-numeric due date must not sneak into the database.
    const title = validateTitle(item.title)
    if (!title.ok) continue
    const dueDate =
      typeof item.dueDate === 'number' && Number.isFinite(item.dueDate)
        ? item.dueDate
        : null
    const todo: Todo = {
      id: item.id,
      title: title.value,
      completed: item.completed,
      createdAt: item.createdAt,
      dueDate,
      xpAwarded: item.xpAwarded ?? item.completed,
    }
    try {
      insert(db, userId, todo)
      imported++
    } catch {
      // Most likely an id collision from a repeated import: skip this row.
    }
  }
  try {
    store.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Ignore: worst case the key lingers and the next signup re-skips duplicates.
  }
  return imported
}
