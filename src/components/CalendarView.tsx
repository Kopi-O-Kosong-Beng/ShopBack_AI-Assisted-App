import { useState } from 'react'
import {
  buildMonthGrid,
  dueBadge,
  monthLabel,
  todosOn,
} from '../domain/calendar'
import type { Todo } from '../domain/todo'
import { useNow } from '../hooks/useNow'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 3

export default function CalendarView({ todos }: { todos: Todo[] }) {
  const now = useNow()
  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  function shiftMonth(delta: number) {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const grid = buildMonthGrid(view.year, view.month, now)

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          ‹
        </button>
        <h2 data-testid="calendar-label" className="font-semibold text-slate-800">
          {monthLabel(view.year, view.month)}
        </h2>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          ›
        </button>
      </header>

      <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.flat().map((day) => {
          const dayTodos = todosOn(todos, day.ts)
          const extra = dayTodos.length - MAX_CHIPS
          return (
            <div
              key={day.ts}
              data-testid={day.isToday ? 'calendar-today' : undefined}
              className={`min-h-20 border-b border-r border-slate-50 p-1.5 align-top last:border-r-0 sm:min-h-24 ${
                day.inMonth ? '' : 'bg-slate-50/60'
              }`}
            >
              <span
                className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  day.isToday
                    ? 'bg-brand-600 text-white'
                    : day.inMonth
                      ? 'text-slate-600'
                      : 'text-slate-300'
                }`}
              >
                {new Date(day.ts).getDate()}
              </span>
              <div className="space-y-1">
                {dayTodos.slice(0, MAX_CHIPS).map((todo) => {
                  const overdue = dueBadge(todo, now)?.tone === 'overdue'
                  return (
                    <p
                      key={todo.id}
                      title={todo.title}
                      className={`truncate rounded-md px-1.5 py-0.5 text-xs ${
                        todo.completed
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : overdue
                            ? 'bg-rose-50 font-medium text-rose-700'
                            : 'bg-brand-50 font-medium text-brand-800'
                      }`}
                    >
                      {todo.title}
                    </p>
                  )
                })}
                {extra > 0 && (
                  <p className="px-1.5 text-xs text-slate-400">+{extra} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
