import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../db/database'
import { testDatabase } from '../test/testDb'
import { listByUser } from '../storage/todoSqlRepository'
import { LEGACY_STORAGE_KEY } from './legacyImport'
import { demoLogin, login, signup } from './authService'

let adb: AppDatabase

beforeEach(async () => {
  localStorage.clear()
  adb = (await testDatabase()).adb
})
afterEach(() => adb.close())

const valid = { username: 'zhifeng', password: 'password123', department: 'Engineering' }

describe('signup', () => {
  it('creates an account that can log in', async () => {
    const result = await signup(adb, valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.user.username).toBe('zhifeng')
    expect(result.user.xp).toBe(0)

    const back = await login(adb, { username: 'zhifeng', password: 'password123' })
    expect(back.ok).toBe(true)
  })

  it('rejects a duplicate username case-insensitively', async () => {
    await signup(adb, valid)
    const result = await signup(adb, { ...valid, username: 'ZHIFENG' })
    expect(result).toEqual({ ok: false, error: 'That username is already taken' })
  })

  it('rejects usernames that are too short or have invalid characters', async () => {
    expect((await signup(adb, { ...valid, username: 'ab' })).ok).toBe(false)
    expect((await signup(adb, { ...valid, username: 'has space' })).ok).toBe(false)
  })

  it('rejects passwords shorter than 8 characters', async () => {
    const result = await signup(adb, { ...valid, password: 'short12' })
    expect(result).toEqual({
      ok: false,
      error: 'Password must be at least 8 characters',
    })
  })

  it('rejects an unknown department', async () => {
    const result = await signup(adb, { ...valid, department: 'Astronauts' })
    expect(result.ok).toBe(false)
  })

  it('imports v1 localStorage tasks into the new account and removes the key', async () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([{ id: 'legacy-1', title: 'Old task', completed: true, createdAt: 5 }]),
    )
    const result = await signup(adb, valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const todos = listByUser(adb.db, result.user.id)
    expect(todos.map((t) => t.title)).toEqual(['Old task'])
    expect(todos[0].completed).toBe(true)
    expect(todos[0].xpAwarded).toBe(true) // imported completed tasks earn no retroactive XP
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })
})

describe('login', () => {
  it('rejects a wrong password with a generic error', async () => {
    await signup(adb, valid)
    const result = await login(adb, { username: 'zhifeng', password: 'wrongpass1' })
    expect(result).toEqual({ ok: false, error: 'Invalid username or password' })
  })

  it('rejects an unknown user with the same generic error', async () => {
    const result = await login(adb, { username: 'ghost', password: 'whatever1' })
    expect(result).toEqual({ ok: false, error: 'Invalid username or password' })
  })
})

describe('demoLogin', () => {
  it('logs into the seeded demo account with sample tasks', async () => {
    const result = await demoLogin(adb)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.user.username).toBe('demo')
    expect(listByUser(adb.db, result.user.id).length).toBeGreaterThan(0)
  })
})
