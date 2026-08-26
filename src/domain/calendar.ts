import type { Todo } from './todo'

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b)
}

export function addDays(ts: number, days: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export interface CalendarDay {
  ts: number
  inMonth: boolean
  isToday: boolean
}

/** Monday-start weeks covering the given month. monthIndex is 0-based. */
export function buildMonthGrid(
  year: number,
  monthIndex: number,
  today: number,
): CalendarDay[][] {
  const first = new Date(year, monthIndex, 1).getTime()
  // getDay(): Sunday 0 .. Saturday 6 -> days back to the previous Monday
  const backToMonday = (new Date(first).getDay() + 6) % 7
  let cursor = addDays(first, -backToMonday)

  const weeks: CalendarDay[][] = []
  do {
    const week: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      week.push({
        ts: cursor,
        inMonth: new Date(cursor).getMonth() === monthIndex,
        isToday: isSameDay(cursor, today),
      })
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  } while (new Date(cursor).getMonth() === monthIndex)
  return weeks
}

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTHS_LONG[monthIndex]} ${year}`
}

export function todosOn(todos: Todo[], dayTs: number): Todo[] {
  return todos.filter((t) => t.dueDate !== null && isSameDay(t.dueDate, dayTs))
}

export interface DueBadge {
  label: string
  tone: 'overdue' | 'today' | 'upcoming'
}

export function dueBadge(todo: Todo, now: number): DueBadge | null {
  if (todo.dueDate === null) return null
  const due = startOfDay(todo.dueDate)
  const today = startOfDay(now)
  if (due < today && !todo.completed) return { label: 'Overdue', tone: 'overdue' }
  if (due === today) return { label: 'Today', tone: 'today' }
  if (due === addDays(today, 1)) return { label: 'Tomorrow', tone: 'upcoming' }
  const d = new Date(due)
  return { label: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`, tone: 'upcoming' }
}
