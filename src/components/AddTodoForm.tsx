import { useState, type FormEvent } from 'react'
import { MAX_TITLE_LENGTH } from '../domain/todo'
import { parseDueInput } from '../lib/dateInput'

interface Props {
  onAdd: (title: string, dueDate: number | null) => Promise<string | null>
}

export default function AddTodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const failure = await onAdd(title, parseDueInput(due))
    if (failure) {
      setError(failure)
      return
    }
    setTitle('')
    setDue('')
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mb-5">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={title}
          aria-label="New task"
          aria-invalid={error !== null}
          placeholder="What needs to be done?"
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError(null)
          }}
          className="min-w-0 flex-1 basis-52 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <input
          type="date"
          value={due}
          aria-label="Due date"
          onChange={(e) => setDue(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-600 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-brand-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:bg-brand-800"
        >
          Add
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {error}
        </p>
      )}
    </form>
  )
}
