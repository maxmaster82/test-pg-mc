<script setup lang="ts">
export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const { tone = 'neutral' } = defineProps<{ tone?: BadgeTone }>()

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-muted border-line',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      TONES[tone],
    ]"
  >
    <slot />
  </span>
</template>
