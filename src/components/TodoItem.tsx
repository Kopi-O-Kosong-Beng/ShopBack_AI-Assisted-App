import { useState, type KeyboardEvent } from 'react'
import { MAX_TITLE_LENGTH, type Todo } from '../domain/todo'

interface Props {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (id: string, title: string) => string | null
  onDelete: (id: string) => void
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const [error, setError] = useState<string | null>(null)

  function startEditing() {
    setDraft(todo.title)
    setError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setError(null)
  }

  function save() {
    const failure = onEdit(todo.id, draft)
    if (failure) {
      setError(failure)
      return
    }
    setIsEditing(false)
    setError(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      save()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }

  if (isEditing) {
    return (
      <li className="border-b border-slate-100 px-4 py-3 last:border-b-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={draft}
            autoFocus
            aria-label="Edit task"
            aria-invalid={error !== null}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => {
              setDraft(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 rounded-lg border border-indigo-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-600">
            {error}
          </p>
        )}
      </li>
    )
  }

  return (
    <li className="group flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-slate-50/70">
      <input
        type="checkbox"
        checked={todo.completed}
        aria-label={todo.title}
        onChange={() => onToggle(todo.id)}
        className="h-5 w-5 shrink-0 cursor-pointer accent-indigo-600"
      />
      <span
        className={`min-w-0 flex-1 wrap-break-word text-slate-800 ${
          todo.completed ? 'text-slate-400 line-through' : ''
        }`}
      >
        {todo.title}
      </span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Edit "${todo.title}"`}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete "${todo.title}"`}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Delete
        </button>
      </div>
    </li>
  )
}
