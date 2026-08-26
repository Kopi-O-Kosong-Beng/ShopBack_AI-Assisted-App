import type { Todo } from './todo'

export const COMPLETION_XP = 10
export const ON_TIME_BONUS_XP = 5
export const XP_PER_LEVEL = 50

export const LEVEL_TITLES = [
  'Window Shopper',
  'Deal Hunter',
  'Cashback Collector',
  'Voucher Veteran',
  'Savings Star',
  'Rebate Royalty',
] as const

function endOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** XP for completing this task now. Zero if this task already awarded XP once. */
export function completionXp(todo: Todo, completedAt: number): number {
  if (todo.xpAwarded) return 0
  const onTime = todo.dueDate !== null && completedAt <= endOfDay(todo.dueDate)
  return COMPLETION_XP + (onTime ? ON_TIME_BONUS_XP : 0)
}

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
}

export function levelProgress(xp: number): {
  current: number
  needed: number
  percent: number
} {
  const current = xp % XP_PER_LEVEL
  return {
    current,
    needed: XP_PER_LEVEL,
    percent: Math.round((current / XP_PER_LEVEL) * 100),
  }
}

export interface RankableUser {
  username: string
  department: string
  xp: number
}

export type RankedUser = RankableUser & { rank: number }

/** Competition ranking: ties share a rank, the next rank is skipped. */
export function rankUsers<T extends RankableUser>(users: T[]): (T & { rank: number })[] {
  const sorted = [...users].sort((a, b) => b.xp - a.xp)
  return sorted.map((user) => ({
    ...user,
    rank: sorted.findIndex((u) => u.xp === user.xp) + 1,
  }))
}
