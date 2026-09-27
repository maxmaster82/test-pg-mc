<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationsStore, type Toast } from '@/shared/notifications/store'
import AppIcon from './AppIcon.vue'

const store = useNotificationsStore()
const polite = computed(() => store.toasts.filter((t) => t.kind !== 'error'))
const assertive = computed(() => store.toasts.filter((t) => t.kind === 'error'))

const STYLES: Record<Toast['kind'], { icon: 'check' | 'alert' | 'info'; tone: string }> = {
  success: { icon: 'check', tone: 'text-success' },
  error: { icon: 'alert', tone: 'text-danger' },
  info: { icon: 'info', tone: 'text-info' },
}
</script>

<template>
  <!-- Live regions exist from first render so assistive technology announces inserted toasts.
       The assertive region deliberately has no role="alert": an always-present empty alert is noise.
       Toasts never take focus. -->
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex flex-col items-stretch gap-2 p-4 sm:items-end"
  >
    <template
      v-for="region in [
        { kind: 'polite', items: polite },
        { kind: 'assertive', items: assertive },
      ]"
      :key="region.kind"
    >
      <div
        :aria-live="region.kind === 'polite' ? 'polite' : 'assertive'"
        :role="region.kind === 'polite' ? 'status' : undefined"
        aria-atomic="false"
        :data-testid="`toasts-${region.kind}`"
        class="flex flex-col gap-2 sm:items-end"
      >
        <!-- Hover/focus only pause auto-dismiss; the element itself is not interactive. -->
        <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
        <div
          v-for="toast in region.items"
          :key="toast.id"
          class="pointer-events-auto flex w-full items-start gap-3 rounded-(--radius-card) border border-line bg-surface p-3 text-sm shadow-(--shadow-pop) sm:w-96"
          @mouseenter="store.pause(toast.id)"
          @mouseleave="store.resume(toast.id)"
          @focusin="store.pause(toast.id)"
          @focusout="store.resume(toast.id)"
        >
          <AppIcon :name="STYLES[toast.kind].icon" :class="STYLES[toast.kind].tone" />
          <p class="flex-1 pt-0.5">{{ toast.message }}</p>
          <button
            type="button"
            class="-m-1 rounded p-1 text-muted hover:text-fg"
            @click="store.dismiss(toast.id)"
          >
            <AppIcon name="close" :size="16" />
            <span class="sr-only">Dismiss notification</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
