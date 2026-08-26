import { describe, expect, it } from 'vitest'
import type { Todo } from './todo'
import { cortisolLevel, isOverdue, mascotMessage, moodForCortisol } from './mascot'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 7, 26, 12, 0).getTime()

const make = (overrides: Partial<Todo> = {}): Todo => ({
  id: Math.random().toString(36).slice(2),
  title: 'Task',
  completed: false,
  createdAt: 0,
  dueDate: null,
  xpAwarded: false,
  ...overrides,
})

describe('isOverdue', () => {
  it('is overdue when due before today and not completed', () => {
    expect(isOverdue(make({ dueDate: NOW - 2 * DAY }), NOW)).toBe(true)
  })

  it('is not overdue when due today', () => {
    const todayMorning = new Date(2026, 7, 26, 0, 30).getTime()
    expect(isOverdue(make({ dueDate: todayMorning }), NOW)).toBe(false)
  })

  it('is not overdue when completed', () => {
    expect(isOverdue(make({ dueDate: NOW - 2 * DAY, completed: true }), NOW)).toBe(false)
  })

  it('is not overdue without a due date', () => {
    expect(isOverdue(make(), NOW)).toBe(false)
  })
})

describe('cortisolLevel', () => {
  it('is zero with no tasks', () => {
    expect(cortisolLevel([], NOW)).toBe(0)
  })

  it('is zero when everything is completed', () => {
    expect(cortisolLevel([make({ completed: true })], NOW)).toBe(0)
  })

  it('adds 8 per active task', () => {
    expect(cortisolLevel([make(), make(), make()], NOW)).toBe(24)
  })

  it('adds an extra 12 per overdue task on top of active', () => {
    expect(cortisolLevel([make({ dueDate: NOW - 2 * DAY })], NOW)).toBe(20)
  })

  it('caps at 100', () => {
    const many = Array.from({ length: 30 }, () => make({ dueDate: NOW - 2 * DAY }))
    expect(cortisolLevel(many, NOW)).toBe(100)
  })

  it('computes the arithmetic exactly at and just below saturation', () => {
    const overdue = () => make({ dueDate: NOW - 2 * DAY })
    // 4 overdue: 4*8 + 4*12 = 80. 5 overdue: 5*8 + 5*12 = 100 exactly.
    expect(cortisolLevel([overdue(), overdue(), overdue(), overdue()], NOW)).toBe(80)
    expect(
      cortisolLevel([overdue(), overdue(), overdue(), overdue(), overdue()], NOW),
    ).toBe(100)
  })
})

describe('moodForCortisol', () => {
  it.each([
    [0, 'zen'],
    [1, 'chill'],
    [39, 'chill'],
    [40, 'worried'],
    [63, 'worried'],
    [64, 'stressed'],
    [89, 'stressed'],
    [90, 'panic'],
    [100, 'panic'],
  ] as const)('maps cortisol %i to %s', (level, mood) => {
    expect(moodForCortisol(level)).toBe(mood)
  })
})

describe('mascotMessage', () => {
  it('has a distinct message for every mood', () => {
    const messages = (['zen', 'chill', 'worried', 'stressed', 'panic'] as const).map(
      mascotMessage,
    )
    expect(new Set(messages).size).toBe(5)
  })
})
