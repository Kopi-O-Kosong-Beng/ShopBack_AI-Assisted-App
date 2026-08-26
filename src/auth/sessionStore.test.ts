import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, getSession, saveSession } from './sessionStore'

const KEY = 'shopback-todo.session.v1'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('getSession', () => {
  it('round-trips a saved session', () => {
    saveSession('u-1')
    expect(getSession()).toEqual({ userId: 'u-1' })
  })

  it('returns null when nothing is stored', () => {
    expect(getSession()).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(KEY, '{oops')
    expect(getSession()).toBeNull()
  })

  it.each(['null', '[]', '42', '"userId"'])(
    'returns null for valid JSON that is not a session object: %s',
    (raw) => {
      localStorage.setItem(KEY, raw)
      expect(getSession()).toBeNull()
    },
  )

  it('returns null when userId has the wrong type', () => {
    localStorage.setItem(KEY, JSON.stringify({ userId: 123 }))
    expect(getSession()).toBeNull()
  })

  it('returns null instead of throwing when storage access throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(getSession()).toBeNull()
  })
})

describe('saveSession and clearSession', () => {
  it('clearSession removes the stored session', () => {
    saveSession('u-1')
    clearSession()
    expect(getSession()).toBeNull()
  })

  it('saveSession does not throw when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => saveSession('u-1')).not.toThrow()
  })

  it('clearSession does not throw when storage throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(() => clearSession()).not.toThrow()
  })
})
