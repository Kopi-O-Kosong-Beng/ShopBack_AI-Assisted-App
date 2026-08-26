import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { hashPassword } from '../auth/password'
import { startOfDay } from '../domain/calendar'
import { newId } from '../lib/id'

export interface SnapshotAdapter {
  load(): Promise<Uint8Array | null>
  save(bytes: Uint8Array): Promise<void>
}

export interface AppDatabase {
  db: Database
  /** Export the whole database and store the snapshot through the adapter. */
  persist(): Promise<void>
  close(): void
}

let sqlJsPromise: Promise<SqlJsStatic> | null = null

function getSqlJs(wasmBinary: Uint8Array): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({ wasmBinary: wasmBinary as unknown as ArrayBuffer })
  }
  return sqlJsPromise
}

export function memoryAdapter(initial: Uint8Array | null = null): SnapshotAdapter {
  let bytes = initial
  return {
    load: async () => bytes,
    save: async (next) => {
      bytes = new Uint8Array(next)
    },
  }
}

const IDB_NAME = 'shopback-todo-db'
const IDB_STORE = 'snapshots'
const IDB_KEY = 'main'

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function indexedDbAdapter(): SnapshotAdapter {
  return {
    async load() {
      const idb = await openIdb()
      try {
        return await new Promise((resolve, reject) => {
          const request = idb
            .transaction(IDB_STORE, 'readonly')
            .objectStore(IDB_STORE)
            .get(IDB_KEY)
          request.onsuccess = () =>
            resolve(request.result ? new Uint8Array(request.result) : null)
          request.onerror = () => reject(request.error)
        })
      } finally {
        idb.close()
      }
    },
    async save(bytes) {
      const idb = await openIdb()
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = idb.transaction(IDB_STORE, 'readwrite')
          tx.objectStore(IDB_STORE).put(bytes, IDB_KEY)
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      } finally {
        idb.close()
      }
    },
  }
}

/**
 * A snapshot can be a perfectly valid SQLite file from an older or foreign
 * schema. CREATE TABLE IF NOT EXISTS would silently keep the wrong shape and
 * the first INSERT would then crash the boot forever, so tables that exist
 * must already carry every column this version needs.
 */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  users: [
    'id', 'username', 'password_hash', 'salt', 'department',
    'xp', 'has_seen_onboarding', 'is_demo', 'created_at',
  ],
  todos: ['id', 'user_id', 'title', 'completed', 'created_at', 'due_date', 'xp_awarded'],
}

function assertSchemaCompatible(db: Database): void {
  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    const result = db.exec(`SELECT name FROM pragma_table_info('${table}')`)
    if (result.length === 0) continue // absent table: migrate() will create it
    const present = new Set(result[0].values.flat() as string[])
    for (const column of columns) {
      if (!present.has(column)) {
        throw new Error(`snapshot table ${table} is missing column ${column}`)
      }
    }
  }
}

function migrate(db: Database): void {
  db.run('PRAGMA foreign_keys = ON;')
  db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      department TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      has_seen_onboarding INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      due_date INTEGER,
      xp_awarded INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
    INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
  `)
}

const SEED_COLLEAGUES: [username: string, department: string, xp: number][] = [
  ['aisyah', 'Engineering', 320],
  ['weiling', 'Product', 280],
  ['rohan', 'Marketing', 210],
  ['meiqi', 'Design', 150],
  ['daniel', 'Operations', 150],
  ['farah', 'Finance', 90],
  ['junjie', 'People & Culture', 60],
]

export const DEMO_USERNAME = 'demo'
export const DEMO_PASSWORD = 'demo1234'

async function seedIfEmpty(db: Database, now: () => number): Promise<boolean> {
  const stmt = db.prepare('SELECT COUNT(*) AS n FROM users')
  stmt.step()
  const count = (stmt.getAsObject() as { n: number }).n
  stmt.free()
  if (count > 0) return false

  const ts = now()
  for (const [username, department, xp] of SEED_COLLEAGUES) {
    db.run(
      `INSERT INTO users (id, username, password_hash, salt, department, xp, has_seen_onboarding, is_demo, created_at)
       VALUES (?, ?, '', '', ?, ?, 1, 1, ?)`,
      [newId(), username, department, xp, ts],
    )
  }

  const { hash, salt } = await hashPassword(DEMO_PASSWORD)
  const demoId = newId()
  db.run(
    `INSERT INTO users (id, username, password_hash, salt, department, xp, has_seen_onboarding, is_demo, created_at)
     VALUES (?, ?, ?, ?, 'Engineering', 45, 0, 1, ?)`,
    [demoId, DEMO_USERNAME, hash, salt, ts],
  )

  const DAY = 24 * 60 * 60 * 1000
  const today = startOfDay(ts)
  const demoTasks: [title: string, completed: number, dueDate: number | null, xpAwarded: number][] = [
    ['Review cashback campaign brief', 0, today, 0],
    ['Update partner merchant list', 0, today + 3 * DAY, 0],
    ['Submit expense claims', 0, today - 2 * DAY, 0],
    ['Plan team lunch', 0, null, 0],
    ['Set up dev environment', 1, null, 1],
  ]
  demoTasks.forEach(([title, completed, dueDate, xpAwarded], index) => {
    db.run(
      `INSERT INTO todos (id, user_id, title, completed, created_at, due_date, xp_awarded)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId(), demoId, title, completed, ts - index, dueDate, xpAwarded],
    )
  })
  return true
}

export async function createAppDatabase(options: {
  wasmBinary: Uint8Array
  adapter?: SnapshotAdapter
  now?: () => number
}): Promise<{ adb: AppDatabase; loadError: boolean }> {
  const { wasmBinary, adapter = indexedDbAdapter(), now = Date.now } = options
  const SQL = await getSqlJs(wasmBinary)

  let snapshot: Uint8Array | null = null
  let loadThrew = false
  try {
    snapshot = await adapter.load()
  } catch {
    // Transient read failure: the stored snapshot may still be intact, so it
    // must not be overwritten by an auto-persisted fresh database below.
    snapshot = null
    loadThrew = true
  }

  let db: Database
  let loadError = loadThrew
  if (snapshot) {
    try {
      db = new SQL.Database(snapshot)
      db.exec('SELECT count(*) FROM sqlite_master')
      assertSchemaCompatible(db)
    } catch {
      loadError = true
      db = new SQL.Database()
    }
  } else {
    db = new SQL.Database()
  }

  let seeded: boolean
  try {
    migrate(db)
    seeded = await seedIfEmpty(db, now)
  } catch {
    // Last-resort recovery: whatever shape the snapshot had, the app must
    // still boot. Start over with a fresh, seeded database.
    loadError = true
    db = new SQL.Database()
    migrate(db)
    seeded = await seedIfEmpty(db, now)
  }

  const adb: AppDatabase = {
    db,
    async persist() {
      try {
        await adapter.save(db.export())
      } catch {
        // Snapshot writes are best-effort: the in-memory database stays usable.
      }
    },
    close: () => db.close(),
  }

  if ((seeded || loadError) && !loadThrew) await adb.persist()
  return { adb, loadError }
}
