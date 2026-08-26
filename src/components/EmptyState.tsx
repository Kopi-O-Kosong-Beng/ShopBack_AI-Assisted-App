import type { Filter } from '../domain/todo'

const MESSAGES: Record<Filter, { title: string; hint: string }> = {
  all: { title: 'No tasks yet', hint: 'Add your first task above to get started.' },
  active: { title: 'No tasks yet to do', hint: 'Everything here is done. Nice work!' },
  completed: { title: 'No tasks yet completed', hint: 'Tick a task off to see it here.' },
}

export default function EmptyState({ filter }: { filter: Filter }) {
  const { title, hint } = MESSAGES[filter]
  return (
    <div className="px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl"
      >
        📝
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{hint}</p>
    </div>
  )
}
