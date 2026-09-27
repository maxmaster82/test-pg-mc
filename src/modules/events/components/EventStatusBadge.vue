<script setup lang="ts">
import StatusBadge, { type BadgeTone } from '@/shared/ui/StatusBadge.vue'
import { EVENT_STATUS_LABELS, type EventStatus } from '../types'

const { status } = defineProps<{ status: EventStatus }>()

const TONES: Record<EventStatus, BadgeTone> = {
  draft: 'neutral',
  published: 'success',
  cancelled: 'danger',
  completed: 'info',
}
</script>

<template>
  <StatusBadge :tone="TONES[status]">{{ EVENT_STATUS_LABELS[status] }}</StatusBadge>
</template>
