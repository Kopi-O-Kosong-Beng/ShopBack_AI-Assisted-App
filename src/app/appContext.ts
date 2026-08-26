import { createContext, useContext } from 'react'
import type { AppDatabase } from '../db/database'
import type { User } from '../domain/user'

export type BootStatus = 'booting' | 'ready' | 'error'

export interface AppContextValue {
  status: BootStatus
  /** Non-null once status is 'ready'. */
  adb: AppDatabase | null
  user: User | null
  dbLoadError: boolean
  signup(input: {
    username: string
    password: string
    department: string
  }): Promise<string | null>
  login(input: { username: string; password: string }): Promise<string | null>
  loginDemo(): Promise<string | null>
  logout(): void
  refreshUser(): void
  completeOnboarding(): void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

/** For components rendered only after boot + login, where adb and user are guaranteed. */
export function useReadyApp(): AppContextValue & { adb: AppDatabase; user: User } {
  const ctx = useApp()
  if (!ctx.adb || !ctx.user) throw new Error('useReadyApp used before the app is ready')
  return ctx as AppContextValue & { adb: AppDatabase; user: User }
}
