import { useState, type KeyboardEvent } from 'react'
import { dueBadge } from '../domain/calendar'
import { MAX_TITLE_LENGTH, type Todo } from '../domain/todo'
import { useNow } from '../hooks/useNow'
import { parseDueInput, toDateInputValue } from '../lib/dateInput'

interface Props {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, dueDate: number | null) => Promise<string | null>
  onDelete: (id: string) => void
}

const BADGE_STYLES = {
  overdue: 'bg-rose-50 text-rose-700',
  today: 'bg-amber-50 text-amber-700',
  upcoming: 'bg-slate-100 text-slate-500',
} as const

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const [draftDue, setDraftDue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const badge = dueBadge(todo, useNow())

  function startEditing() {
    setDraft(todo.title)
    setDraftDue(toDateInputValue(todo.dueDate))
    setError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setError(null)
  }

  async function save() {
    const failure = await onEdit(todo.id, draft, parseDueInput(draftDue))
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
      void save()
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
            className="min-w-0 flex-1 rounded-lg border border-brand-300 px-3 py-2 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="date"
            value={draftDue}
            aria-label="Due date"
            onChange={(e) => setDraftDue(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void save()}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
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
        className="h-5 w-5 shrink-0 cursor-pointer accent-brand-600"
      />
      <span
        className={`min-w-0 flex-1 wrap-break-word text-slate-800 ${
          todo.completed ? 'text-slate-400 line-through' : ''
        }`}
      >
        {todo.title}
        {badge && (
          <span
            className={`ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-xs font-medium ${BADGE_STYLES[badge.tone]}`}
          >
            {badge.label}
          </span>
        )}
      </span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Edit "${todo.title}"`}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
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
