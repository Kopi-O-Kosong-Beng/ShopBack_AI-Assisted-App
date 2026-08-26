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
})
