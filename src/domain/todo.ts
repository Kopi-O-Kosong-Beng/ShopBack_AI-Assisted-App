export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: number
  /** Epoch ms of the day the task is due, or null when it has no due date. */
  dueDate: number | null
  /** True once completing this task has awarded XP, so re-completing cannot farm XP. */
  xpAwarded: boolean
}

export type Filter = 'all' | 'active' | 'completed'

export const MAX_TITLE_LENGTH = 200

export type TitleValidation =
  | { ok: true; value: string }
  | { ok: false; error: string }

export function validateTitle(raw: string): TitleValidation {
  const value = raw.trim()
  if (value.length === 0) {
    return { ok: false, error: 'Task cannot be empty' }
  }
  if (value.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Task cannot be longer than ${MAX_TITLE_LENGTH} characters` }
  }
  return { ok: true, value }
}

export function createTodo(
  title: string,
  id: string,
  createdAt: number,
  dueDate: number | null = null,
): Todo {
  return { id, title, completed: false, createdAt, dueDate, xpAwarded: false }
}

export function addTodo(todos: Todo[], todo: Todo): Todo[] {
  return [todo, ...todos]
}

export function editTodoTitle(todos: Todo[], id: string, title: string): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, title } : t))
}

export function toggleTodo(todos: Todo[], id: string): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
}

export function deleteTodo(todos: Todo[], id: string): Todo[] {
  return todos.filter((t) => t.id !== id)
}

export function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'active') return todos.filter((t) => !t.completed)
  if (filter === 'completed') return todos.filter((t) => t.completed)
  return todos
}

export function activeCount(todos: Todo[]): number {
  return todos.filter((t) => !t.completed).length
}

export function clearCompleted(todos: Todo[]): Todo[] {
  return todos.filter((t) => !t.completed)
}
