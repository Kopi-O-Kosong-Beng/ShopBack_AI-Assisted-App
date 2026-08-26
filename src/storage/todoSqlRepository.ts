import type { Database } from 'sql.js'
import type { Todo } from '../domain/todo'

interface RawRow {
  id: string
  title: string
  completed: number
  created_at: number
  due_date: number | null
  xp_awarded: number
}

function mapRow(row: RawRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
    dueDate: row.due_date ?? null,
    xpAwarded: row.xp_awarded === 1,
  }
}

export function listByUser(db: Database, userId: string): Todo[] {
  const stmt = db.prepare(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC, id DESC',
  )
  const rows: Todo[] = []
  try {
    stmt.bind([userId])
    while (stmt.step()) {
      rows.push(mapRow(stmt.getAsObject() as unknown as RawRow))
    }
  } finally {
    stmt.free()
  }
  return rows
}

export function insert(db: Database, userId: string, todo: Todo): void {
  db.run(
    `INSERT INTO todos (id, user_id, title, completed, created_at, due_date, xp_awarded)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      todo.id,
      userId,
      todo.title,
      todo.completed ? 1 : 0,
      todo.createdAt,
      todo.dueDate,
      todo.xpAwarded ? 1 : 0,
    ],
  )
}

export function updateTitle(db: Database, userId: string, id: string, title: string): void {
  db.run('UPDATE todos SET title = ? WHERE id = ? AND user_id = ?', [title, id, userId])
}

export function updateDueDate(
  db: Database,
  userId: string,
  id: string,
  dueDate: number | null,
): void {
  db.run('UPDATE todos SET due_date = ? WHERE id = ? AND user_id = ?', [
    dueDate,
    id,
    userId,
  ])
}

export function setCompleted(db: Database, id: string, completed: boolean): void {
  db.run('UPDATE todos SET completed = ? WHERE id = ?', [completed ? 1 : 0, id])
}

export function markXpAwarded(db: Database, id: string): void {
  db.run('UPDATE todos SET xp_awarded = 1 WHERE id = ?', [id])
}

export function remove(db: Database, userId: string, id: string): void {
  db.run('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, userId])
}

export function clearCompleted(db: Database, userId: string): void {
  db.run('DELETE FROM todos WHERE user_id = ? AND completed = 1', [userId])
}
