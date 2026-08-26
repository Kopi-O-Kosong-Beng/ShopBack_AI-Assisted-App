export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Operations',
  'Finance',
  'People & Culture',
] as const

export type Department = (typeof DEPARTMENTS)[number]

export interface User {
  id: string
  username: string
  department: string
  xp: number
  hasSeenOnboarding: boolean
  isDemo: boolean
  createdAt: number
}
