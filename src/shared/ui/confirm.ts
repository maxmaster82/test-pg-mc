import { shallowRef } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
  /** Element to refocus when the dialog closes (the control that asked for confirmation). */
  returnFocus: HTMLElement | null
}

/** Single app-wide confirmation dialog, rendered by <ConfirmHost/>. */
export const pendingConfirm = shallowRef<PendingConfirm | null>(null)

export function confirm(options: ConfirmOptions): Promise<boolean> {
  pendingConfirm.value?.resolve(false)
  return new Promise((resolve) => {
    const active = document.activeElement
    pendingConfirm.value = {
      ...options,
      resolve,
      returnFocus: active instanceof HTMLElement && active !== document.body ? active : null,
    }
  })
}

export function settleConfirm(confirmed: boolean) {
  pendingConfirm.value?.resolve(confirmed)
  pendingConfirm.value = null
}

export function useConfirm() {
  return confirm
}
