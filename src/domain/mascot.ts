import { startOfDay } from './calendar'
import type { Todo } from './todo'

export const ACTIVE_CORTISOL = 8
export const OVERDUE_CORTISOL = 12

export type Mood = 'zen' | 'chill' | 'worried' | 'stressed' | 'panic'

export function isOverdue(todo: Todo, now: number): boolean {
  return !todo.completed && todo.dueDate !== null && todo.dueDate < startOfDay(now)
}

/** 0-100. Each active task adds 8, each overdue task adds another 12 on top. */
export function cortisolLevel(todos: Todo[], now: number): number {
  const active = todos.filter((t) => !t.completed)
  const overdue = active.filter((t) => isOverdue(t, now))
  return Math.min(100, active.length * ACTIVE_CORTISOL + overdue.length * OVERDUE_CORTISOL)
}

export function moodForCortisol(cortisol: number): Mood {
  if (cortisol <= 0) return 'zen'
  if (cortisol < 40) return 'chill'
  if (cortisol < 64) return 'worried'
  if (cortisol < 90) return 'stressed'
  return 'panic'
}

const MESSAGES: Record<Mood, string> = {
  zen: 'All clear. Kapi is basically on holiday.',
  chill: 'A few things to do, nothing Kapi cannot handle.',
  worried: 'The list is growing. Kapi is starting to notice.',
  stressed: 'That is a lot of tasks. Kapi is chewing grass nervously.',
  panic: 'Cortisol critical! Clear some tasks before Kapi combusts.',
}

export function mascotMessage(mood: Mood): string {
  return MESSAGES[mood]
}
