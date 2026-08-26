import type { Database } from 'sql.js'
import type { User } from '../domain/user'
import type { RankableUser } from '../domain/xp'

/** Full user row including credentials. Only the auth service should see these. */
export interface UserAuthRow extends User {
  passwordHash: string
  salt: string
}

interface RawRow {
  id: string
  username: string
  password_hash: string
  salt: string
  department: string
  xp: number
  has_seen_onboarding: number
  is_demo: number
  created_at: number
}

function mapRow(row: RawRow): UserAuthRow {
  return {
    id: row.id,
    username: row.username,
    department: row.department,
    xp: row.xp,
    hasSeenOnboarding: row.has_seen_onboarding === 1,
    isDemo: row.is_demo === 1,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
    salt: row.salt,
  }
}

function selectOne(db: Database, sql: string, params: (string | number)[]): UserAuthRow | null {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    if (!stmt.step()) return null
    return mapRow(stmt.getAsObject() as unknown as RawRow)
  } finally {
    stmt.free()
  }
}

export function findByUsername(db: Database, username: string): UserAuthRow | null {
  return selectOne(db, 'SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username])
}

export function findById(db: Database, id: string): UserAuthRow | null {
  return selectOne(db, 'SELECT * FROM users WHERE id = ?', [id])
}

export function insertUser(
  db: Database,
  user: {
    id: string
    username: string
    passwordHash: string
    salt: string
    department: string
    createdAt: number
  },
): void {
  db.run(
    `INSERT INTO users (id, username, password_hash, salt, department, xp, has_seen_onboarding, is_demo, created_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?)`,
    [user.id, user.username, user.passwordHash, user.salt, user.department, user.createdAt],
  )
}

export function addXp(db: Database, id: string, delta: number): void {
  db.run('UPDATE users SET xp = xp + ? WHERE id = ?', [delta, id])
}

export function setOnboardingSeen(db: Database, id: string): void {
  db.run('UPDATE users SET has_seen_onboarding = 1 WHERE id = ?', [id])
}

export function listLeaderboard(db: Database): RankableUser[] {
  const stmt = db.prepare(
    'SELECT username, department, xp FROM users ORDER BY xp DESC, username ASC',
  )
  const rows: RankableUser[] = []
  try {
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as RankableUser)
    }
  } finally {
    stmt.free()
  }
  return rows
}
