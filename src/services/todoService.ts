import type { AppDatabase } from '../db/database'
import { createTodo, validateTitle } from '../domain/todo'
import { completionXp } from '../domain/xp'
import { newId } from '../lib/id'
import { addXp } from '../storage/userRepository'
import {
  clearCompleted,
  insert,
  listByUser,
  markXpAwarded,
  remove,
  setCompleted,
  updateDueDate,
  updateTitle,
} from '../storage/todoSqlRepository'

export async function addTask(
  adb: AppDatabase,
  userId: string,
  title: string,
  dueDate: number | null,
  now: number = Date.now(),
): Promise<{ error: string | null }> {
  const result = validateTitle(title)
  if (!result.ok) return { error: result.error }
  insert(adb.db, userId, createTodo(result.value, newId(), now, dueDate))
  await adb.persist()
  return { error: null }
}

export interface ToggleResult {
  xpGained: number
  completed: boolean
  /** True when completing a task that already banked its XP earlier. */
  alreadyAwarded: boolean
}

/**
 * Flips completion. Completing a task awards XP exactly once in its lifetime:
 * the xpAwarded flag survives un-completing, so re-completing earns nothing.
 * The caller gets alreadyAwarded so the UI can explain the zero instead of
 * looking broken.
 */
export async function toggleTask(
  adb: AppDatabase,
  userId: string,
  id: string,
  now: number = Date.now(),
): Promise<ToggleResult> {
  const todo = listByUser(adb.db, userId).find((t) => t.id === id)
  if (!todo) return { xpGained: 0, completed: false, alreadyAwarded: false }

  const completing = !todo.completed
  setCompleted(adb.db, id, completing)

  let xpGained = 0
  if (completing) {
    xpGained = completionXp(todo, now)
    if (xpGained > 0) {
      addXp(adb.db, userId, xpGained)
      markXpAwarded(adb.db, id)
    }
  }
  await adb.persist()
  return {
    xpGained,
    completed: completing,
    alreadyAwarded: completing && todo.xpAwarded,
  }
}

export async function editTask(
  adb: AppDatabase,
  userId: string,
  id: string,
  title: string,
  dueDate: number | null,
): Promise<string | null> {
  const result = validateTitle(title)
  if (!result.ok) return result.error
  updateTitle(adb.db, userId, id, result.value)
  updateDueDate(adb.db, userId, id, dueDate)
  await adb.persist()
  return null
}

export async function deleteTask(
  adb: AppDatabase,
  userId: string,
  id: string,
): Promise<void> {
  remove(adb.db, userId, id)
  await adb.persist()
}

export async function clearCompletedTasks(
  adb: AppDatabase,
  userId: string,
): Promise<void> {
  clearCompleted(adb.db, userId)
  await adb.persist()
}
