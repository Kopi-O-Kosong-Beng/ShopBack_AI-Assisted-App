import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../db/database'
import { memoryAdapter } from '../db/database'
import { testDatabase } from '../test/testDb'
import { findById, insertUser } from '../storage/userRepository'
import { listByUser } from '../storage/todoSqlRepository'
import { COMPLETION_XP, ON_TIME_BONUS_XP } from '../domain/xp'
import {
  addTask,
  clearCompletedTasks,
  deleteTask,
  editTask,
  toggleTask,
} from './todoService'

let adb: AppDatabase
let saves = 0

beforeEach(async () => {
  const adapter = memoryAdapter()
  const realSave = adapter.save.bind(adapter)
  saves = 0
  adapter.save = async (bytes) => {
    saves++
    await realSave(bytes)
  }
  adb = (await testDatabase(adapter)).adb
  insertUser(adb.db, {
    id: 'u-1',
    username: 'zhifeng',
    passwordHash: 'x',
    salt: 'x',
    department: 'Engineering',
    createdAt: 0,
  })
})
afterEach(() => adb.close())

const NOW = new Date(2026, 7, 26, 12, 0).getTime()
const DAY = 24 * 60 * 60 * 1000

describe('addTask', () => {
  it('adds a valid task and persists a snapshot', async () => {
    const result = await addTask(adb, 'u-1', 'Buy milk', null, NOW)
    expect(result.error).toBeNull()
    expect(listByUser(adb.db, 'u-1').map((t) => t.title)).toEqual(['Buy milk'])
    expect(saves).toBeGreaterThan(0)
  })

  it('stores the due date when given', async () => {
    await addTask(adb, 'u-1', 'Dated', NOW + DAY, NOW)
    expect(listByUser(adb.db, 'u-1')[0].dueDate).toBe(NOW + DAY)
  })

  it('rejects an invalid title without touching the database', async () => {
    const result = await addTask(adb, 'u-1', '   ', null, NOW)
    expect(result.error).toBe('Task cannot be empty')
    expect(listByUser(adb.db, 'u-1')).toHaveLength(0)
  })
})

describe('toggleTask and XP', () => {
  it('awards base XP for completing a task without a due date', async () => {
    await addTask(adb, 'u-1', 'Task', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    const { xpGained } = await toggleTask(adb, 'u-1', todo.id, NOW)
    expect(xpGained).toBe(COMPLETION_XP)
    expect(findById(adb.db, 'u-1')?.xp).toBe(COMPLETION_XP)
  })

  it('awards the on-time bonus for completing before the due date', async () => {
    await addTask(adb, 'u-1', 'Task', NOW + DAY, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    const { xpGained } = await toggleTask(adb, 'u-1', todo.id, NOW)
    expect(xpGained).toBe(COMPLETION_XP + ON_TIME_BONUS_XP)
  })

  it('never awards XP twice for the same task', async () => {
    await addTask(adb, 'u-1', 'Task', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    await toggleTask(adb, 'u-1', todo.id, NOW) // complete: +10
    await toggleTask(adb, 'u-1', todo.id, NOW) // un-complete: keeps XP
    const again = await toggleTask(adb, 'u-1', todo.id, NOW) // complete again: +0
    expect(again.xpGained).toBe(0)
    expect(findById(adb.db, 'u-1')?.xp).toBe(COMPLETION_XP)
  })

  it('reports when a re-completed task had already earned its XP', async () => {
    await addTask(adb, 'u-1', 'Task', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')

    const first = await toggleTask(adb, 'u-1', todo.id, NOW)
    expect(first).toMatchObject({ completed: true, alreadyAwarded: false })

    const undo = await toggleTask(adb, 'u-1', todo.id, NOW)
    expect(undo).toMatchObject({ completed: false, alreadyAwarded: false })

    const redo = await toggleTask(adb, 'u-1', todo.id, NOW)
    expect(redo).toMatchObject({ xpGained: 0, completed: true, alreadyAwarded: true })
  })
})

describe('editTask', () => {
  it('updates title and due date', async () => {
    await addTask(adb, 'u-1', 'Old', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    const error = await editTask(adb, 'u-1', todo.id, 'New', NOW + DAY)
    expect(error).toBeNull()
    const [updated] = listByUser(adb.db, 'u-1')
    expect(updated.title).toBe('New')
    expect(updated.dueDate).toBe(NOW + DAY)
  })

  it('rejects an empty edited title', async () => {
    await addTask(adb, 'u-1', 'Keep me', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    const error = await editTask(adb, 'u-1', todo.id, '  ', null)
    expect(error).toBe('Task cannot be empty')
    expect(listByUser(adb.db, 'u-1')[0].title).toBe('Keep me')
  })
})

describe('ownership', () => {
  beforeEach(async () => {
    insertUser(adb.db, {
      id: 'u-2',
      username: 'other',
      passwordHash: 'x',
      salt: 'x',
      department: 'Product',
      createdAt: 0,
    })
    await addTask(adb, 'u-2', 'Their task', null, NOW)
  })

  it('cannot edit another user\'s task', async () => {
    const [theirs] = listByUser(adb.db, 'u-2')
    await editTask(adb, 'u-1', theirs.id, 'Hijacked', null)
    expect(listByUser(adb.db, 'u-2')[0].title).toBe('Their task')
  })

  it('cannot delete another user\'s task', async () => {
    const [theirs] = listByUser(adb.db, 'u-2')
    await deleteTask(adb, 'u-1', theirs.id)
    expect(listByUser(adb.db, 'u-2')).toHaveLength(1)
  })

  it('cannot toggle another user\'s task or earn XP from it', async () => {
    const [theirs] = listByUser(adb.db, 'u-2')
    const result = await toggleTask(adb, 'u-1', theirs.id, NOW)
    expect(result.xpGained).toBe(0)
    expect(listByUser(adb.db, 'u-2')[0].completed).toBe(false)
    expect(findById(adb.db, 'u-1')?.xp).toBe(0)
  })
})

describe('unknown ids and persistence discipline', () => {
  it('toggling an unknown id changes nothing and skips the snapshot write', async () => {
    const before = saves
    const result = await toggleTask(adb, 'u-1', 'ghost-id', NOW)
    expect(result).toEqual({ xpGained: 0, completed: false, alreadyAwarded: false })
    expect(saves).toBe(before)
  })

  it('persists a snapshot on every successful mutation', async () => {
    await addTask(adb, 'u-1', 'Track saves', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')

    let before = saves
    await toggleTask(adb, 'u-1', todo.id, NOW)
    expect(saves).toBe(before + 1)

    before = saves
    await editTask(adb, 'u-1', todo.id, 'Renamed', null)
    expect(saves).toBe(before + 1)

    before = saves
    await deleteTask(adb, 'u-1', todo.id)
    expect(saves).toBe(before + 1)

    before = saves
    await clearCompletedTasks(adb, 'u-1')
    expect(saves).toBe(before + 1)
  })

  it('does not persist when validation rejects the input', async () => {
    const before = saves
    await addTask(adb, 'u-1', '   ', null, NOW)
    expect(saves).toBe(before)
  })

  it('still succeeds in memory when the snapshot write throws', async () => {
    const adapter = memoryAdapter()
    adapter.save = async () => {
      throw new Error('quota exceeded')
    }
    const broken = (await testDatabase(adapter)).adb
    insertUser(broken.db, {
      id: 'u-1',
      username: 'zhifeng',
      passwordHash: 'x',
      salt: 'x',
      department: 'Engineering',
      createdAt: 0,
    })
    const result = await addTask(broken, 'u-1', 'Survives quota', null, NOW)
    expect(result.error).toBeNull()
    expect(listByUser(broken.db, 'u-1')).toHaveLength(1)
    broken.close()
  })
})

describe('deleteTask and clearCompletedTasks', () => {
  it('deletes a task', async () => {
    await addTask(adb, 'u-1', 'Task', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    await deleteTask(adb, 'u-1', todo.id)
    expect(listByUser(adb.db, 'u-1')).toHaveLength(0)
  })

  it('clears only completed tasks', async () => {
    await addTask(adb, 'u-1', 'Stays', null, NOW)
    await addTask(adb, 'u-1', 'Goes', null, NOW)
    const goes = listByUser(adb.db, 'u-1').find((t) => t.title === 'Goes')!
    await toggleTask(adb, 'u-1', goes.id, NOW)
    await clearCompletedTasks(adb, 'u-1')
    expect(listByUser(adb.db, 'u-1').map((t) => t.title)).toEqual(['Stays'])
  })
})
