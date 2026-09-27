import { MockDatabase } from './db/database'
import { MockSettingsStore } from './settings'
import type { KeyValueStorage } from './storage'

export interface MockContext {
  db: MockDatabase
  settings: MockSettingsStore
}

export function createMockContext(
  storage: KeyValueStorage,
  fixedLatencyMs: number | null,
): MockContext {
  return { db: new MockDatabase(storage), settings: new MockSettingsStore(storage, fixedLatencyMs) }
}
