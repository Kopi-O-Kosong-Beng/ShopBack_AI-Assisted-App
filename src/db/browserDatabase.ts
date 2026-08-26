import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { createAppDatabase, type AppDatabase } from './database'

/** Boots the real browser database: fetches the SQLite wasm and uses IndexedDB snapshots. */
export async function browserDatabase(): Promise<{
  adb: AppDatabase
  loadError: boolean
}> {
  const response = await fetch(wasmUrl)
  const wasmBinary = new Uint8Array(await response.arrayBuffer())
  return createAppDatabase({ wasmBinary })
}
