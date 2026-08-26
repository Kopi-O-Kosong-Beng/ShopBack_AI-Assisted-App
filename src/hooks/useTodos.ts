import { useCallback, useState } from 'react'
import {
  addTodo,
  clearCompleted,
  createTodo,
  deleteTodo,
  editTodoTitle,
  toggleTodo,
  validateTitle,
  type Filter,
  type Todo,
} from '../domain/todo'
import { loadTodos, saveTodos, type StorageError } from '../storage/todoRepository'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useTodos() {
  // Lazy initializer: localStorage is read once, on first render only.
  const [initial] = useState(loadTodos)
  const [todos, setTodos] = useState<Todo[]>(initial.todos)
  const [filter, setFilter] = useState<Filter>('all')
  const [storageWarning, setStorageWarning] = useState<StorageError>(initial.error)

  // Every change is persisted by the event that caused it, so a failed write
  // surfaces immediately instead of one render later.
  const commit = useCallback((next: Todo[]) => {
    setTodos(next)
    if (!saveTodos(next)) {
      setStorageWarning('unavailable')
    }
  }, [])

  const addTask = useCallback(
    (title: string): string | null => {
      const result = validateTitle(title)
      if (!result.ok) return result.error
      commit(addTodo(todos, createTodo(result.value, newId(), Date.now())))
      return null
    },
    [commit, todos],
  )

  const editTask = useCallback(
    (id: string, title: string): string | null => {
      const result = validateTitle(title)
      if (!result.ok) return result.error
      commit(editTodoTitle(todos, id, result.value))
      return null
    },
    [commit, todos],
  )

  const toggleTask = useCallback(
    (id: string) => commit(toggleTodo(todos, id)),
    [commit, todos],
  )

  const deleteTask = useCallback(
    (id: string) => commit(deleteTodo(todos, id)),
    [commit, todos],
  )

  const clearCompletedTasks = useCallback(
    () => commit(clearCompleted(todos)),
    [commit, todos],
  )

  const dismissWarning = useCallback(() => setStorageWarning(null), [])

  return {
    todos,
    filter,
    setFilter,
    storageWarning,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    dismissWarning,
  }
}
