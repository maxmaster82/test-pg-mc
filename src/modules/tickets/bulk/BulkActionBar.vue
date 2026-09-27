<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch, type ComponentPublicInstance } from 'vue'
import AppButton from '@/shared/ui/AppButton.vue'
import { formatNumber } from '@/shared/utils/format'
import { TICKET_STATUS_OPTIONS } from '../options'
import { BULK_LIMIT } from '../schemas'
import type { TicketStatus } from '../types'

const { count, pending } = defineProps<{ count: number; pending?: boolean }>()
const emit = defineEmits<{ apply: [status: TicketStatus]; clear: [] }>()

const status = ref<TicketStatus | ''>('')
const overLimit = computed(() => count > BULK_LIMIT)
const canApply = computed(() => status.value !== '' && !overLimit.value && !pending)

const applyButton = useTemplateRef<ComponentPublicInstance>('applyButton')
let restoreFocus = false

function apply() {
  if (!status.value) return
  restoreFocus = true
  emit('apply', status.value)
}

// The busy button is disabled while the request runs, which drops focus to <body> in browsers.
// Put it back so keyboard users stay in the bulk bar.
watch(
  () => pending,
  async (isPending) => {
    if (isPending || !restoreFocus) return
    restoreFocus = false
    await nextTick()
    const active = document.activeElement
    if (!active || active === document.body)
      (applyButton.value?.$el as HTMLElement | undefined)?.focus()
  },
)
</script>

<template>
  <section
    aria-label="Bulk actions"
    class="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-line bg-primary-soft px-4 py-3 text-sm sm:flex-row sm:items-center"
  >
    <p class="font-medium">{{ formatNumber(count) }} selected</p>
    <div class="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
      <label class="flex items-center gap-2">
        <span>Change status to</span>
        <select
          v-model="status"
          class="min-h-9 rounded-(--radius-control) border border-line-strong bg-surface px-2 text-fg"
        >
          <option value="" disabled>Choose…</option>
          <option v-for="option in TICKET_STATUS_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <AppButton
        ref="applyButton"
        size="sm"
        variant="primary"
        :disabled="!canApply"
        :loading="pending"
        :aria-describedby="overLimit ? 'bulk-limit' : undefined"
        @click="apply"
      >
        Apply
      </AppButton>
      <AppButton size="sm" variant="ghost" :disabled="pending" @click="emit('clear')"
        >Clear selection</AppButton
      >
    </div>
    <p v-if="overLimit" id="bulk-limit" class="text-danger">
      Select up to {{ BULK_LIMIT }} tickets
    </p>
  </section>
</template>
