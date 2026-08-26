import { describe, expect, it } from 'vitest'
import type { Todo } from './todo'
import {
  COMPLETION_XP,
  LEVEL_TITLES,
  ON_TIME_BONUS_XP,
  XP_PER_LEVEL,
  completionXp,
  levelForXp,
  levelProgress,
  levelTitle,
  rankUsers,
} from './xp'

const DAY = 24 * 60 * 60 * 1000
const make = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'id-1',
  title: 'Task',
  completed: false,
  createdAt: 0,
  dueDate: null,
  xpAwarded: false,
  ...overrides,
})

describe('completionXp', () => {
  it('awards the base XP for a task with no due date', () => {
    expect(completionXp(make(), Date.now())).toBe(COMPLETION_XP)
  })

  it('awards the on-time bonus when completed before the due date', () => {
    const due = Date.now() + 2 * DAY
    expect(completionXp(make({ dueDate: due }), Date.now())).toBe(
      COMPLETION_XP + ON_TIME_BONUS_XP,
    )
  })

  it('awards the bonus when completed on the due day itself', () => {
    const now = new Date(2026, 7, 26, 22, 0).getTime()
    const dueMorning = new Date(2026, 7, 26, 0, 0).getTime()
    expect(completionXp(make({ dueDate: dueMorning }), now)).toBe(
      COMPLETION_XP + ON_TIME_BONUS_XP,
    )
  })

  it('awards no bonus when completed after the due day', () => {
    const now = new Date(2026, 7, 26, 9, 0).getTime()
    const dueYesterday = new Date(2026, 7, 25, 12, 0).getTime()
    expect(completionXp(make({ dueDate: dueYesterday }), now)).toBe(COMPLETION_XP)
  })

  it('awards zero when XP was already awarded for this task', () => {
    expect(completionXp(make({ xpAwarded: true }), Date.now())).toBe(0)
  })
})

describe('levels', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(levelForXp(0)).toBe(1)
  })

  it('stays level 1 just below the threshold', () => {
    expect(levelForXp(XP_PER_LEVEL - 1)).toBe(1)
  })

  it('reaches level 2 exactly at the threshold', () => {
    expect(levelForXp(XP_PER_LEVEL)).toBe(2)
  })

  it('maps levels to titles and clamps past the last title', () => {
    expect(levelTitle(1)).toBe(LEVEL_TITLES[0])
    expect(levelTitle(LEVEL_TITLES.length + 5)).toBe(LEVEL_TITLES[LEVEL_TITLES.length - 1])
  })

  it('reports progress within the current level', () => {
    const progress = levelProgress(XP_PER_LEVEL + 20)
    expect(progress.current).toBe(20)
    expect(progress.needed).toBe(XP_PER_LEVEL)
    expect(progress.percent).toBe(40)
  })
})

describe('rankUsers', () => {
  const user = (username: string, xp: number) => ({
    username,
    department: 'Engineering',
    xp,
  })

  it('sorts by XP descending with rank numbers', () => {
    const ranked = rankUsers([user('low', 10), user('high', 100), user('mid', 50)])
    expect(ranked.map((r) => [r.rank, r.username])).toEqual([
      [1, 'high'],
      [2, 'mid'],
      [3, 'low'],
    ])
  })

  it('gives tied users the same rank and skips the next rank', () => {
    const ranked = rankUsers([user('a', 100), user('b', 100), user('c', 50)])
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3])
  })
})
