import { hashPassword, verifyPassword } from '../auth/password'
import type { AppDatabase } from '../db/database'
import { DEPARTMENTS, type User } from '../domain/user'
import { newId } from '../lib/id'
import {
  findById,
  findByUsername,
  insertUser,
  type UserAuthRow,
} from '../storage/userRepository'
import { importLegacyTodos } from './legacyImport'

export type AuthResult = { ok: true; user: User } | { ok: false; error: string }

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

function toUser(row: UserAuthRow): User {
  const { passwordHash: _hash, salt: _salt, ...user } = row
  return user
}

export async function signup(
  adb: AppDatabase,
  input: { username: string; password: string; department: string },
  now: () => number = Date.now,
): Promise<AuthResult> {
  const username = input.username.trim()
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: 'Username must be 3-20 characters: letters, numbers or underscores',
    }
  }
  if (input.password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters' }
  }
  if (!DEPARTMENTS.includes(input.department as (typeof DEPARTMENTS)[number])) {
    return { ok: false, error: 'Please choose a department' }
  }
  if (findByUsername(adb.db, username) !== null) {
    return { ok: false, error: 'That username is already taken' }
  }

  const { hash, salt } = await hashPassword(input.password)
  const id = newId()
  insertUser(adb.db, {
    id,
    username,
    passwordHash: hash,
    salt,
    department: input.department,
    createdAt: now(),
  })
  importLegacyTodos(adb.db, id)
  await adb.persist()
  return { ok: true, user: toUser(findById(adb.db, id)!) }
}

export async function login(
  adb: AppDatabase,
  input: { username: string; password: string },
): Promise<AuthResult> {
  const failure: AuthResult = { ok: false, error: 'Invalid username or password' }
  const row = findByUsername(adb.db, input.username.trim())
  if (row === null || row.passwordHash === '') return failure
  if (!(await verifyPassword(input.password, row.salt, row.passwordHash))) {
    return failure
  }
  return { ok: true, user: toUser(row) }
}

/** One-click login into the seeded evaluation account. */
export async function demoLogin(adb: AppDatabase): Promise<AuthResult> {
  const row = findByUsername(adb.db, 'demo')
  if (row === null) return { ok: false, error: 'Demo account is missing' }
  return { ok: true, user: toUser(row) }
}
