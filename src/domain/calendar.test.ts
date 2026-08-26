import { describe, expect, it } from 'vitest'
import type { Todo } from './todo'
import {
  addDays,
  buildMonthGrid,
  dueBadge,
  isSameDay,
  monthLabel,
  startOfDay,
  todosOn,
} from './calendar'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 7, 26, 12, 0).getTime() // Wed 26 Aug 2026

const make = (overrides: Partial<Todo> = {}): Todo => ({
  id: Math.random().toString(36).slice(2),
  title: 'Task',
  completed: false,
  createdAt: 0,
  dueDate: null,
  xpAwarded: false,
  ...overrides,
})

describe('date helpers', () => {
  it('startOfDay zeroes the time part', () => {
    const start = startOfDay(NOW)
    expect(new Date(start).getHours()).toBe(0)
    expect(isSameDay(start, NOW)).toBe(true)
  })

  it('isSameDay distinguishes different days', () => {
    expect(isSameDay(NOW, NOW + DAY)).toBe(false)
  })

  it('addDays moves across month boundaries', () => {
    const nextMonth = addDays(NOW, 6)
    expect(new Date(nextMonth).getMonth()).toBe(8)
    expect(new Date(nextMonth).getDate()).toBe(1)
  })
})

describe('buildMonthGrid', () => {
  it('builds Monday-start weeks covering August 2026', () => {
    const grid = buildMonthGrid(2026, 7, NOW)
    // August 2026 starts on a Saturday and has 31 days -> 6 weeks
    expect(grid).toHaveLength(6)
    for (const week of grid) expect(week).toHaveLength(7)
    expect(new Date(grid[0][0].ts).getDay()).toBe(1) // Monday
  })

  it('marks days outside the month', () => {
    const grid = buildMonthGrid(2026, 7, NOW)
    expect(grid[0][0].inMonth).toBe(false) // Mon 27 Jul
    expect(grid[0][5].inMonth).toBe(true) // Sat 1 Aug
  })

  it('marks today exactly once', () => {
    const grid = buildMonthGrid(2026, 7, NOW)
    const todays = grid.flat().filter((d) => d.isToday)
    expect(todays).toHaveLength(1)
    expect(new Date(todays[0].ts).getDate()).toBe(26)
  })

  it('marks no today when showing another month', () => {
    const grid = buildMonthGrid(2026, 8, NOW)
    expect(grid.flat().filter((d) => d.isToday)).toHaveLength(0)
  })
})

describe('monthLabel', () => {
  it('formats the month and year', () => {
    expect(monthLabel(2026, 7)).toBe('August 2026')
  })
})

describe('todosOn', () => {
  it('returns todos due on the given day only', () => {
    const todayTask = make({ title: 'Today', dueDate: NOW })
    const tomorrowTask = make({ title: 'Tomorrow', dueDate: NOW + DAY })
    const noDue = make({ title: 'None' })
    const result = todosOn([todayTask, tomorrowTask, noDue], NOW)
    expect(result.map((t) => t.title)).toEqual(['Today'])
  })
})

describe('dueBadge', () => {
  it('returns null without a due date', () => {
    expect(dueBadge(make(), NOW)).toBeNull()
  })

  it('labels an overdue incomplete task', () => {
    const badge = dueBadge(make({ dueDate: NOW - 2 * DAY }), NOW)
    expect(badge).toEqual({ label: 'Overdue', tone: 'overdue' })
  })

  it('labels a task due today', () => {
    const badge = dueBadge(make({ dueDate: NOW + 60_000 }), NOW)
    expect(badge).toEqual({ label: 'Today', tone: 'today' })
  })

  it('labels a task due tomorrow', () => {
    const badge = dueBadge(make({ dueDate: NOW + DAY }), NOW)
    expect(badge).toEqual({ label: 'Tomorrow', tone: 'upcoming' })
  })

  it('labels a later task with a short date', () => {
    const badge = dueBadge(make({ dueDate: new Date(2026, 8, 4).getTime() }), NOW)
    expect(badge).toEqual({ label: '4 Sep', tone: 'upcoming' })
  })

  it('does not mark a completed task as overdue', () => {
    const badge = dueBadge(make({ dueDate: NOW - 2 * DAY, completed: true }), NOW)
    expect(badge?.tone).toBe('upcoming')
  })
})
