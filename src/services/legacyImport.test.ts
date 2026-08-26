import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../db/database'
import { testDatabase } from '../test/testDb'
import { insertUser } from '../storage/userRepository'
import { insert, listByUser } from '../storage/todoSqlRepository'
import { createTodo } from '../domain/todo'
import { LEGACY_STORAGE_KEY, importLegacyTodos } from './legacyImport'

let adb: AppDatabase

beforeEach(async () => {
  localStorage.clear()
  adb = (await testDatabase()).adb
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

const valid = (id: string, title: string) => ({
  id,
  title,
  completed: false,
  createdAt: 1,
})

describe('importLegacyTodos', () => {
  it('imports a valid array and removes the legacy key', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify([valid('a', 'Old task')]))
    expect(importLegacyTodos(adb.db, 'u-1')).toBe(1)
    expect(listByUser(adb.db, 'u-1').map((t) => t.title)).toEqual(['Old task'])
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })

  it('keeps the legacy key when the data is unreadable JSON', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, '{not json at all')
    expect(importLegacyTodos(adb.db, 'u-1')).toBe(0)
    // The data we could not read must not be destroyed.
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBe('{not json at all')
  })

  it('keeps the legacy key when the JSON is not an array', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, '{"hello":"world"}')
    expect(importLegacyTodos(adb.db, 'u-1')).toBe(0)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).not.toBeNull()
  })

  it('imports the valid items and skips the invalid ones', () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([
        valid('a', 'Good one'),
        { id: 1, title: 'broken', completed: 'yes' },
        valid('b', 'Also good'),
      ]),
    )
    expect(importLegacyTodos(adb.db, 'u-1')).toBe(2)
    expect(listByUser(adb.db, 'u-1').map((t) => t.title).sort()).toEqual([
      'Also good',
      'Good one',
    ])
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })

  it('skips an item whose id already exists instead of failing the import', () => {
    insert(adb.db, 'u-1', createTodo('Existing', 'a', 5))
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([valid('a', 'Colliding'), valid('b', 'Fresh')]),
    )
    expect(importLegacyTodos(adb.db, 'u-1')).toBe(1)
    const titles = listByUser(adb.db, 'u-1').map((t) => t.title)
    expect(titles).toContain('Existing')
    expect(titles).toContain('Fresh')
    expect(titles).not.toContain('Colliding')
  })

  it('sanitises bad due dates and titles instead of importing them raw', () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([
        { ...valid('a', 'Bad due date'), dueDate: 'tomorrow' },
        { ...valid('b', '   ') },
        valid('c', 'Fine'),
      ]),
    )
    expect(importLegacyTodos(adb.db, 'u-1')).toBe(2)
    const todos = listByUser(adb.db, 'u-1')
    expect(todos.find((t) => t.title === 'Bad due date')?.dueDate).toBeNull()
    expect(todos.map((t) => t.title).sort()).toEqual(['Bad due date', 'Fine'])
  })

  it('marks imported completed tasks as already XP-awarded', () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([{ ...valid('a', 'Done before'), completed: true }]),
    )
    importLegacyTodos(adb.db, 'u-1')
    expect(listByUser(adb.db, 'u-1')[0].xpAwarded).toBe(true)
  })

  it('returns 0 when storage access throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('disabled')
      },
    } as unknown as Storage
    expect(importLegacyTodos(adb.db, 'u-1', throwing)).toBe(0)
  })
})
