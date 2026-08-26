import { afterEach, describe, expect, it } from 'vitest'
import { memoryAdapter } from './database'
import { testDatabase } from '../test/testDb'
import { findByUsername, listLeaderboard } from '../storage/userRepository'
import { insert, listByUser } from '../storage/todoSqlRepository'
import { createTodo } from '../domain/todo'
import type { AppDatabase } from './database'

let open: AppDatabase[] = []
afterEach(() => {
  for (const adb of open) adb.close()
  open = []
})

async function make(adapter = memoryAdapter()) {
  const result = await testDatabase(adapter)
  open.push(result.adb)
  return result
}

describe('createAppDatabase', () => {
  it('seeds demo users on a fresh database', async () => {
    const { adb, loadError } = await make()
    expect(loadError).toBe(false)
    const board = listLeaderboard(adb.db)
    expect(board.length).toBe(8) // demo account + 7 colleagues
    expect(findByUsername(adb.db, 'demo')).not.toBeNull()
  })

  it('seeds sample tasks for the demo account', async () => {
    const { adb } = await make()
    const demo = findByUsername(adb.db, 'demo')!
    expect(listByUser(adb.db, demo.id).length).toBeGreaterThan(0)
  })

  it('persists a snapshot and restores it on the next boot', async () => {
    const adapter = memoryAdapter()
    const first = await make(adapter)
    const demo = findByUsername(first.adb.db, 'demo')!
    insert(first.adb.db, demo.id, createTodo('Survives reboot', 'reboot-1', 1))
    await first.adb.persist()

    const second = await make(adapter)
    const todos = listByUser(second.adb.db, demo.id)
    expect(todos.some((t) => t.title === 'Survives reboot')).toBe(true)
  })

  it('does not re-seed an existing database', async () => {
    const adapter = memoryAdapter()
    const first = await make(adapter)
    await first.adb.persist()
    const second = await make(adapter)
    expect(listLeaderboard(second.adb.db).length).toBe(8)
  })

  it('recovers with a fresh database when the snapshot is corrupted', async () => {
    const adapter = memoryAdapter(new Uint8Array([1, 2, 3, 4, 5]))
    const { adb, loadError } = await make(adapter)
    expect(loadError).toBe(true)
    expect(listLeaderboard(adb.db).length).toBe(8)
  })

  it('recovers when the snapshot is valid SQLite with an incompatible schema', async () => {
    // A snapshot from a hypothetical old version whose users table lacks
    // password_hash. CREATE TABLE IF NOT EXISTS would no-op over it, and
    // seeding would then crash the boot forever.
    const first = await make()
    first.adb.db.run('DROP TABLE todos; DROP TABLE users; DROP TABLE meta;')
    first.adb.db.run('CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, created_at INTEGER)')
    const adapter = memoryAdapter(first.adb.db.export())

    const second = await make(adapter)
    expect(second.loadError).toBe(true)
    expect(listLeaderboard(second.adb.db).length).toBe(8)
  })

  it('flags the failure and does not overwrite the snapshot when reading it throws', async () => {
    let saves = 0
    const adapter = {
      load: async (): Promise<Uint8Array | null> => {
        throw new Error('transient IndexedDB failure')
      },
      save: async () => {
        saves++
      },
    }
    const { loadError } = await make(adapter)
    // The user must see a notice, and their real snapshot must not be
    // clobbered by an auto-persisted fresh database.
    expect(loadError).toBe(true)
    expect(saves).toBe(0)
  })
})
