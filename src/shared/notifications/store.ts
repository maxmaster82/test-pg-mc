import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

export const TOAST_DURATION_MS = 5000
const MAX_VISIBLE = 3
const DEDUPE_WINDOW_MS = 2000

interface Timer {
  handle: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

export const useNotificationsStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([])
  const timers = new Map<number, Timer>()
  const lastShown = new Map<string, number>()
  let nextId = 1

  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer?.handle) clearTimeout(timer.handle)
    timers.delete(id)
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function startTimer(id: number, duration: number) {
    timers.set(id, {
      handle: setTimeout(() => {
        dismiss(id)
      }, duration),
      remaining: duration,
      startedAt: Date.now(),
    })
  }

  function push(kind: ToastKind, message: string): number | null {
    const key = `${kind}:${message}`
    const now = Date.now()
    const previous = lastShown.get(key)
    if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) return null
    lastShown.set(key, now)

    const id = nextId++
    toasts.value = [...toasts.value, { id, kind, message }]
    // Errors stay until dismissed; others auto-dismiss.
    if (kind !== 'error') startTimer(id, TOAST_DURATION_MS)
    while (toasts.value.length > MAX_VISIBLE) {
      const oldest = toasts.value[0]
      if (oldest) dismiss(oldest.id)
    }
    return id
  }

  /** Pause auto-dismiss while the toast is hovered or focused. */
  function pause(id: number) {
    const timer = timers.get(id)
    if (!timer?.handle) return
    clearTimeout(timer.handle)
    timer.handle = null
    timer.remaining -= Date.now() - timer.startedAt
  }

  function resume(id: number) {
    const timer = timers.get(id)
    if (!timer || timer.handle) return
    startTimer(id, Math.max(timer.remaining, 1000))
  }

  function clear() {
    for (const toast of toasts.value) dismiss(toast.id)
    lastShown.clear()
  }

  return {
    toasts,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
    dismiss,
    pause,
    resume,
    clear,
  }
})

/** Feature-facing alias: `const notify = useNotify(); notify.success('Saved')`. */
export const useNotify = useNotificationsStore
