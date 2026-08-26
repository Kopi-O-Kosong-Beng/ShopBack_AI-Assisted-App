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
    const error = await editTask(adb, todo.id, 'New', NOW + DAY)
    expect(error).toBeNull()
    const [updated] = listByUser(adb.db, 'u-1')
    expect(updated.title).toBe('New')
    expect(updated.dueDate).toBe(NOW + DAY)
  })

  it('rejects an empty edited title', async () => {
    await addTask(adb, 'u-1', 'Keep me', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    const error = await editTask(adb, todo.id, '  ', null)
    expect(error).toBe('Task cannot be empty')
    expect(listByUser(adb.db, 'u-1')[0].title).toBe('Keep me')
  })
})

describe('deleteTask and clearCompletedTasks', () => {
  it('deletes a task', async () => {
    await addTask(adb, 'u-1', 'Task', null, NOW)
    const [todo] = listByUser(adb.db, 'u-1')
    await deleteTask(adb, todo.id)
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
