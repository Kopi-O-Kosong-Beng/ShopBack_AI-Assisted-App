import type { Filter } from '../domain/todo'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

interface Props {
  filter: Filter
  onFilterChange: (filter: Filter) => void
  remaining: number
  hasCompleted: boolean
  onClearCompleted: () => void
}

export default function FilterBar({
  filter,
  onFilterChange,
  remaining,
  hasCompleted,
  onClearCompleted,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm">
      <span className="text-slate-500">
        {remaining} {remaining === 1 ? 'item' : 'items'} left
      </span>

      <div className="flex gap-1" role="group" aria-label="Filter tasks">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            aria-pressed={filter === value}
            className={`rounded-lg px-3 py-1.5 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              filter === value
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {hasCompleted && (
        <button
          type="button"
          onClick={onClearCompleted}
          className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Clear completed
        </button>
      )}
    </div>
  )
}
