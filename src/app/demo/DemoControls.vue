<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { computed } from 'vue'
import { errorMessage } from '@/shared/api/errors'
import type { FailureMode, LatencyMode, MockSettings } from '@/shared/config/mock-settings'
import { useNotify } from '@/shared/notifications/store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppIcon from '@/shared/ui/AppIcon.vue'
import { useConfirm } from '@/shared/ui/confirm'
import { demoApi } from './api'

const queryClient = useQueryClient()
const notify = useNotify()
const confirm = useConfirm()

const settingsKey = ['__dev', 'settings'] as const
const { data: settings } = useQuery({
  queryKey: settingsKey,
  queryFn: ({ signal }) => demoApi.getSettings(signal),
  staleTime: Infinity,
})

const update = useMutation({
  mutationFn: demoApi.updateSettings,
  onSuccess: (next) => queryClient.setQueryData(settingsKey, next),
  onError: (error) => {
    notify.error(errorMessage(error))
  },
})

const latency = computed({
  get: () => settings.value?.latency ?? 'normal',
  set: (value: LatencyMode) => {
    update.mutate({ latency: value })
  },
})
const failureMode = computed({
  get: () => settings.value?.failureMode ?? 'none',
  set: (value: FailureMode) => {
    update.mutate({ failureMode: value })
  },
})

const LATENCY: { value: MockSettings['latency']; label: string }[] = [
  { value: 'none', label: 'Instant' },
  { value: 'normal', label: 'Realistic (250–600 ms)' },
  { value: 'slow', label: 'Slow (1.5–3 s)' },
]
const FAILURES: { value: MockSettings['failureMode']; label: string }[] = [
  { value: 'none', label: 'Never fail' },
  { value: 'random', label: 'Fail 20% of requests' },
  { value: 'always', label: 'Always fail' },
]

async function resetData() {
  const confirmed = await confirm({
    title: 'Reset demo data?',
    message:
      'All changes made in this browser will be discarded and the original sample data restored.',
    confirmLabel: 'Reset data',
    tone: 'danger',
  })
  if (!confirmed) return
  try {
    await demoApi.resetData()
    await queryClient.invalidateQueries()
    notify.success('Demo data has been reset')
  } catch (error) {
    notify.error(errorMessage(error))
  }
}

const itemClass =
  'flex min-h-9 cursor-default items-center gap-2 rounded px-2 text-sm outline-none select-none data-highlighted:bg-surface-muted'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <!-- The accessible name contains the visible label "Demo" (WCAG 2.5.3 label in name). -->
      <AppButton variant="ghost" icon="settings" size="sm" aria-label="Demo controls">
        <span class="hidden sm:inline">Demo</span>
      </AppButton>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="6"
        class="z-50 w-64 rounded-(--radius-card) border border-line bg-surface p-1 shadow-(--shadow-pop)"
      >
        <DropdownMenuLabel class="px-2 py-1.5 text-xs font-semibold text-muted uppercase">
          Mock API latency
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup v-model="latency">
          <DropdownMenuRadioItem
            v-for="o in LATENCY"
            :key="o.value"
            :value="o.value"
            :class="itemClass"
          >
            <span class="w-4"
              ><DropdownMenuItemIndicator
                ><AppIcon name="check" :size="16" /></DropdownMenuItemIndicator
            ></span>
            {{ o.label }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator class="my-1 h-px bg-line" />
        <DropdownMenuLabel class="px-2 py-1.5 text-xs font-semibold text-muted uppercase">
          Simulated failures
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup v-model="failureMode">
          <DropdownMenuRadioItem
            v-for="o in FAILURES"
            :key="o.value"
            :value="o.value"
            :class="itemClass"
          >
            <span class="w-4"
              ><DropdownMenuItemIndicator
                ><AppIcon name="check" :size="16" /></DropdownMenuItemIndicator
            ></span>
            {{ o.label }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator class="my-1 h-px bg-line" />
        <DropdownMenuItem :class="[itemClass, 'text-danger']" @select="resetData">
          <AppIcon name="refresh" :size="16" /> Reset demo data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
