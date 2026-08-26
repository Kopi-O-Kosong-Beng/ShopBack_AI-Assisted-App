/** Test helper: creates a real sql.js database in memory, wasm loaded from node_modules. */
import { readFileSync } from 'node:fs'
import { createAppDatabase, memoryAdapter, type SnapshotAdapter } from '../db/database'

const wasmBinary = new Uint8Array(
  readFileSync('node_modules/sql.js/dist/sql-wasm.wasm'),
)

export function testWasmBinary(): Uint8Array {
  return wasmBinary
}

export function testDatabase(adapter: SnapshotAdapter = memoryAdapter()) {
  return createAppDatabase({ wasmBinary, adapter })
}
