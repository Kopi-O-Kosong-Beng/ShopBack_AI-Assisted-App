// fake-indexeddb provides a real, spec-compliant IndexedDB implementation so
// the production adapter is tested for real instead of being mocked away.
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { indexedDbAdapter } from './database'

describe('indexedDbAdapter', () => {
  it('returns null when nothing has been saved yet', async () => {
    expect(await indexedDbAdapter().load()).toBeNull()
  })

  it('round-trips bytes through a save and load', async () => {
    const adapter = indexedDbAdapter()
    const bytes = new Uint8Array([1, 2, 3, 250, 251, 252])
    await adapter.save(bytes)
    expect(await adapter.load()).toEqual(bytes)
  })

  it('shares the snapshot between adapter instances, like two page loads', async () => {
    await indexedDbAdapter().save(new Uint8Array([9, 9, 9]))
    expect(await indexedDbAdapter().load()).toEqual(new Uint8Array([9, 9, 9]))
  })

  it('overwrites the previous snapshot on the next save', async () => {
    const adapter = indexedDbAdapter()
    await adapter.save(new Uint8Array([1]))
    await adapter.save(new Uint8Array([2, 2]))
    expect(await adapter.load()).toEqual(new Uint8Array([2, 2]))
  })
})
