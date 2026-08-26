import { useCallback, useState } from 'react'
import type { AppDatabase } from '../db/database'
import type { Filter, Todo } from '../domain/todo'
import {
  addTask as addTaskService,
  clearCompletedTasks as clearService,
  deleteTask as deleteService,
  editTask as editService,
  toggleTask as toggleService,
} from '../services/todoService'
import { listByUser } from '../storage/todoSqlRepository'

/**
 * Task state for one signed-in user. The SQLite database is the source of
 * truth: every action goes through the service layer, then re-queries.
 */
export function useTodos(adb: AppDatabase, userId: string, onXp?: (gained: number) => void) {
  const [todos, setTodos] = useState<Todo[]>(() => listByUser(adb.db, userId))
  const [filter, setFilter] = useState<Filter>('all')

  const reload = useCallback(
    () => setTodos(listByUser(adb.db, userId)),
    [adb, userId],
  )

  const addTask = useCallback(
    async (title: string, dueDate: number | null): Promise<string | null> => {
      const { error } = await addTaskService(adb, userId, title, dueDate)
      if (error) return error
      reload()
      return null
    },
    [adb, userId, reload],
  )

  const toggleTask = useCallback(
    async (id: string) => {
      // Flip locally first so the checkbox responds instantly; the re-query
      // below replaces this with whatever the database actually stored.
      setTodos((current) =>
        current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      )
      const { xpGained } = await toggleService(adb, userId, id)
      reload()
      if (xpGained > 0) onXp?.(xpGained)
    },
    [adb, userId, reload, onXp],
  )

  const editTask = useCallback(
    async (id: string, title: string, dueDate: number | null): Promise<string | null> => {
      const error = await editService(adb, id, title, dueDate)
      if (error) return error
      reload()
      return null
    },
    [adb, reload],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      await deleteService(adb, id)
      reload()
    },
    [adb, reload],
  )

  const clearCompletedTasks = useCallback(async () => {
    await clearService(adb, userId)
    reload()
  }, [adb, userId, reload])

  return { todos, filter, setFilter, addTask, toggleTask, editTask, deleteTask, clearCompletedTasks }
}
