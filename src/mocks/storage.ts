export interface KeyValueStorage {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
}

export function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>()
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => void store.set(key, value),
    remove: (key) => void store.delete(key),
  }
}

/** localStorage adapter that degrades to no persistence (private mode, quota, disabled storage). */
export function createBrowserStorage(): KeyValueStorage {
  return {
    get: (key) => {
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    set: (key, value) => {
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // Persistence is a demo convenience; ignore storage failures.
      }
    },
    remove: (key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    },
  }
}
