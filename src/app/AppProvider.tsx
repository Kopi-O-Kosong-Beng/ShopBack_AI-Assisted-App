import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { clearSession, getSession, saveSession } from '../auth/sessionStore'
import type { AppDatabase } from '../db/database'
import type { User } from '../domain/user'
import { AppContext, type BootStatus } from './appContext'
import {
  demoLogin as demoLoginService,
  login as loginService,
  signup as signupService,
} from '../services/authService'
import {
  findById,
  setOnboardingSeen,
  type UserAuthRow,
} from '../storage/userRepository'

function publicUser(row: UserAuthRow): User {
  const { passwordHash: _hash, salt: _salt, ...user } = row
  return user
}

export function AppProvider({
  createDatabase,
  children,
}: {
  createDatabase: () => Promise<{ adb: AppDatabase; loadError: boolean }>
  children: ReactNode
}) {
  const [status, setStatus] = useState<BootStatus>('booting')
  const [adb, setAdb] = useState<AppDatabase | null>(null)
  const [dbLoadError, setDbLoadError] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Boot exactly once per provider mount, even if the prop identity changes.
  const createRef = useRef(createDatabase)
  useEffect(() => {
    let active = true
    createRef
      .current()
      .then(({ adb: booted, loadError }) => {
        if (!active) {
          booted.close()
          return
        }
        const session = getSession()
        if (session) {
          const row = findById(booted.db, session.userId)
          if (row) setUser(publicUser(row))
          else clearSession()
        }
        setAdb(booted)
        setDbLoadError(loadError)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  const signup = useCallback(
    async (input: { username: string; password: string; department: string }) => {
      if (!adb) return 'The app is still loading'
      const result = await signupService(adb, input)
      if (!result.ok) return result.error
      setUser(result.user)
      saveSession(result.user.id)
      return null
    },
    [adb],
  )

  const login = useCallback(
    async (input: { username: string; password: string }) => {
      if (!adb) return 'The app is still loading'
      const result = await loginService(adb, input)
      if (!result.ok) return result.error
      setUser(result.user)
      saveSession(result.user.id)
      return null
    },
    [adb],
  )

  const loginDemo = useCallback(async () => {
    if (!adb) return 'The app is still loading'
    const result = await demoLoginService(adb)
    if (!result.ok) return result.error
    setUser(result.user)
    saveSession(result.user.id)
    return null
  }, [adb])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const refreshUser = useCallback(() => {
    if (!adb) return
    setUser((current) => {
      if (!current) return current
      const row = findById(adb.db, current.id)
      return row ? publicUser(row) : current
    })
  }, [adb])

  const completeOnboarding = useCallback(() => {
    if (!adb || !user) return
    setOnboardingSeen(adb.db, user.id)
    void adb.persist()
    refreshUser()
  }, [adb, user, refreshUser])

  return (
    <AppContext.Provider
      value={{
        status,
        adb,
        user,
        dbLoadError,
        signup,
        login,
        loginDemo,
        logout,
        refreshUser,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
