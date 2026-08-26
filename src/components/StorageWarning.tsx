import type { StorageError } from '../storage/todoRepository'

const MESSAGES: Record<Exclude<StorageError, null>, string> = {
  corrupted: 'Your saved tasks could not be read, so we started with an empty list.',
  unavailable:
    'Storage is unavailable, so your tasks could not be read or saved. They will be lost when you close this tab.',
}

interface Props {
  error: Exclude<StorageError, null>
  onDismiss: () => void
}

export default function StorageWarning({ error, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <span aria-hidden="true" className="mt-0.5 text-base leading-none">
        ⚠️
      </span>
      <p className="flex-1">{MESSAGES[error]}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss warning"
        className="rounded-md px-2 py-0.5 font-medium text-amber-900 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        Dismiss
      </button>
    </div>
  )
}
