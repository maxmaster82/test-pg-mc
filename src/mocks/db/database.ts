import { createSeedData } from '../fixtures/seed'
import type { KeyValueStorage } from '../storage'
import type { DbData } from './types'

/** Bump when the stored shape changes so stale browser data is discarded. */
export const DB_STORAGE_KEY = 'ticket-admin:mock-db:v3'

export class MockDatabase {
  data: DbData

  constructor(private readonly storage: KeyValueStorage) {
    this.data = this.load() ?? createSeedData()
  }

  private load(): DbData | null {
    const raw = this.storage.get(DB_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as DbData
    } catch {
      return null
    }
  }

  /** Persist after every successful mutation, like a database commit. */
  commit(): void {
    this.storage.set(DB_STORAGE_KEY, JSON.stringify(this.data))
  }

  reset(): void {
    this.data = createSeedData()
    this.storage.remove(DB_STORAGE_KEY)
  }

  nextId(prefix: string): string {
    this.data.sequence += 1
    return `${prefix}_${this.data.sequence}`
  }
}
