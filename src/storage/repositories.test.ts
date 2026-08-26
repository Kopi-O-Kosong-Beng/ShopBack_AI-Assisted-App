import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTodo } from '../domain/todo'
import type { AppDatabase } from '../db/database'
import { testDatabase } from '../test/testDb'
import {
  addXp,
  findById,
  findByUsername,
  insertUser,
  listLeaderboard,
  setOnboardingSeen,
} from './userRepository'
import {
  clearCompleted,
  insert,
  listByUser,
  markXpAwarded,
  remove,
  setCompleted,
  updateDueDate,
  updateTitle,
} from './todoSqlRepository'

let adb: AppDatabase

beforeEach(async () => {
  adb = (await testDatabase()).adb
})
afterEach(() => adb.close())

const sampleUser = {
  id: 'u-1',
  username: 'zhifeng',
  passwordHash: 'hash',
  salt: 'salt',
  department: 'Engineering',
  createdAt: 1000,
}

describe('userRepository', () => {
  it('inserts and finds a user by username', () => {
    insertUser(adb.db, sampleUser)
    const found = findByUsername(adb.db, 'zhifeng')
    expect(found?.id).toBe('u-1')
    expect(found?.department).toBe('Engineering')
    expect(found?.xp).toBe(0)
    expect(found?.hasSeenOnboarding).toBe(false)
  })

  it('finds usernames case-insensitively', () => {
    insertUser(adb.db, sampleUser)
    expect(findByUsername(adb.db, 'ZhiFeng')?.id).toBe('u-1')
  })

  it('finds a user by id', () => {
    insertUser(adb.db, sampleUser)
    expect(findById(adb.db, 'u-1')?.username).toBe('zhifeng')
  })

  it('returns null for unknown users', () => {
    expect(findByUsername(adb.db, 'ghost')).toBeNull()
    expect(findById(adb.db, 'ghost')).toBeNull()
  })

  it('accumulates XP', () => {
    insertUser(adb.db, sampleUser)
    addXp(adb.db, 'u-1', 10)
    addXp(adb.db, 'u-1', 15)
    expect(findById(adb.db, 'u-1')?.xp).toBe(25)
  })

  it('records that onboarding was seen', () => {
    insertUser(adb.db, sampleUser)
    setOnboardingSeen(adb.db, 'u-1')
    expect(findById(adb.db, 'u-1')?.hasSeenOnboarding).toBe(true)
  })

  it('lists every user on the leaderboard including seeds', () => {
    insertUser(adb.db, sampleUser)
    const board = listLeaderboard(adb.db)
    expect(board.length).toBe(9)
    expect(board.some((u) => u.username === 'zhifeng')).toBe(true)
  })
})

describe('todoSqlRepository', () => {
  beforeEach(() => {
    insertUser(adb.db, sampleUser)
  })

  it('inserts and lists todos newest-first', () => {
    insert(adb.db, 'u-1', createTodo('First', 'a', 100))
    insert(adb.db, 'u-1', createTodo('Second', 'b', 200))
    expect(listByUser(adb.db, 'u-1').map((t) => t.title)).toEqual(['Second', 'First'])
  })

  it('round-trips due date and xpAwarded fields', () => {
    insert(adb.db, 'u-1', { ...createTodo('Dated', 'a', 100, 5000), xpAwarded: true })
    const [todo] = listByUser(adb.db, 'u-1')
    expect(todo.dueDate).toBe(5000)
    expect(todo.xpAwarded).toBe(true)
  })

  it('keeps each user\'s todos separate', () => {
    insertUser(adb.db, { ...sampleUser, id: 'u-2', username: 'other' })
    insert(adb.db, 'u-1', createTodo('Mine', 'a', 100))
    insert(adb.db, 'u-2', createTodo('Theirs', 'b', 200))
    expect(listByUser(adb.db, 'u-1').map((t) => t.title)).toEqual(['Mine'])
    expect(listByUser(adb.db, 'u-2').map((t) => t.title)).toEqual(['Theirs'])
  })

  it('updates title and due date', () => {
    insert(adb.db, 'u-1', createTodo('Old', 'a', 100))
    updateTitle(adb.db, 'u-1', 'a', 'New')
    updateDueDate(adb.db, 'u-1', 'a', 9000)
    let [todo] = listByUser(adb.db, 'u-1')
    expect(todo.title).toBe('New')
    expect(todo.dueDate).toBe(9000)
    updateDueDate(adb.db, 'u-1', 'a', null)
    ;[todo] = listByUser(adb.db, 'u-1')
    expect(todo.dueDate).toBeNull()
  })

  it('scopes updates and deletes to the owning user', () => {
    insertUser(adb.db, { ...sampleUser, id: 'u-2', username: 'intruder' })
    insert(adb.db, 'u-1', createTodo('Mine', 'a', 100))
    updateTitle(adb.db, 'u-2', 'a', 'Stolen')
    updateDueDate(adb.db, 'u-2', 'a', 1234)
    remove(adb.db, 'u-2', 'a')
    const [todo] = listByUser(adb.db, 'u-1')
    expect(todo.title).toBe('Mine')
    expect(todo.dueDate).toBeNull()
  })

  it('sets completion and marks XP as awarded', () => {
    insert(adb.db, 'u-1', createTodo('Task', 'a', 100))
    setCompleted(adb.db, 'a', true)
    markXpAwarded(adb.db, 'a')
    const [todo] = listByUser(adb.db, 'u-1')
    expect(todo.completed).toBe(true)
    expect(todo.xpAwarded).toBe(true)
  })

  it('removes a todo', () => {
    insert(adb.db, 'u-1', createTodo('Task', 'a', 100))
    remove(adb.db, 'u-1', 'a')
    expect(listByUser(adb.db, 'u-1')).toHaveLength(0)
  })

  it('documents that orphan rows are possible: the service layer scopes writes', () => {
    // The DDL declares REFERENCES users(id), but sql.js does not enforce
    // foreign keys, so integrity is upheld by the service layer instead.
    // Pinned here so a future engine change is a visible test failure.
    insert(adb.db, 'ghost-user', createTodo('Orphan', 'x', 100))
    expect(listByUser(adb.db, 'ghost-user')).toHaveLength(1)
    expect(listByUser(adb.db, 'u-1')).toHaveLength(0)
  })

  it('clears completed todos for one user only', () => {
    insertUser(adb.db, { ...sampleUser, id: 'u-2', username: 'other' })
    insert(adb.db, 'u-1', createTodo('Done here', 'a', 100))
    insert(adb.db, 'u-2', createTodo('Done there', 'b', 100))
    setCompleted(adb.db, 'a', true)
    setCompleted(adb.db, 'b', true)
    clearCompleted(adb.db, 'u-1')
    expect(listByUser(adb.db, 'u-1')).toHaveLength(0)
    expect(listByUser(adb.db, 'u-2')).toHaveLength(1)
  })
})
