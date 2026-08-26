import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('hashPassword', () => {
  it('produces a hash and salt', async () => {
    const { hash, salt } = await hashPassword('correct horse battery')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(salt).toMatch(/^[0-9a-f]{32}$/)
  })

  it('produces different salts and hashes for the same password', async () => {
    const a = await hashPassword('same password')
    const b = await hashPassword('same password')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })
})

describe('verifyPassword', () => {
  it('accepts the correct password', async () => {
    const { hash, salt } = await hashPassword('demo1234')
    expect(await verifyPassword('demo1234', salt, hash)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const { hash, salt } = await hashPassword('demo1234')
    expect(await verifyPassword('demo1235', salt, hash)).toBe(false)
  })
})
