import { useEventListener } from '@vueuse/core'
import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { confirm } from '@/shared/ui/confirm'

/**
 * Asks before leaving a form with unsaved changes (in-app navigation and tab close/reload).
 * Call `allowLeave()` right before navigating away after a successful save.
 */
export function useUnsavedChangesGuard(isDirty: MaybeRefOrGetter<boolean>) {
  const bypass = ref(false)

  onBeforeRouteLeave(async () => {
    if (bypass.value || !toValue(isDirty)) return true
    return confirm({
      title: 'Discard unsaved changes?',
      message: 'You have changes that have not been saved. If you leave now they will be lost.',
      confirmLabel: 'Discard changes',
      cancelLabel: 'Keep editing',
      tone: 'danger',
    })
  })

  useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
    if (!bypass.value && toValue(isDirty)) event.preventDefault()
  })

  return {
    allowLeave: () => {
      bypass.value = true
    },
  }
}
