import type { MockSettings } from '@/shared/config/mock-settings'
import type { KeyValueStorage } from './storage'

const SETTINGS_KEY = 'ticket-admin:mock-settings'
const DEFAULTS: MockSettings = { latency: 'normal', failureMode: 'none' }

export class MockSettingsStore {
  current: MockSettings

  constructor(
    private readonly storage: KeyValueStorage,
    /** Overrides the latency mode (tests use 0; E2E sets VITE_MOCK_LATENCY=0). */
    private readonly fixedLatencyMs: number | null,
  ) {
    let stored: Partial<MockSettings> = {}
    try {
      stored = JSON.parse(storage.get(SETTINGS_KEY) ?? '{}') as Partial<MockSettings>
    } catch {
      // ignore corrupt settings
    }
    this.current = { ...DEFAULTS, ...stored }
  }

  update(patch: Partial<MockSettings>): MockSettings {
    this.current = { ...this.current, ...patch }
    this.storage.set(SETTINGS_KEY, JSON.stringify(this.current))
    return this.current
  }

  latencyMs(): number {
    if (this.fixedLatencyMs !== null) return this.fixedLatencyMs
    switch (this.current.latency) {
      case 'none':
        return 0
      case 'slow':
        return 1500 + Math.random() * 1500
      default:
        return 250 + Math.random() * 350
    }
  }

  shouldFail(): boolean {
    if (this.current.failureMode === 'always') return true
    return this.current.failureMode === 'random' && Math.random() < 0.2
  }
}
