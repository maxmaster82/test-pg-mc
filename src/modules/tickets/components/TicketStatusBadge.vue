<script setup lang="ts">
import StatusBadge, { type BadgeTone } from '@/shared/ui/StatusBadge.vue'
import { TICKET_STATUS_LABELS, type TicketStatus } from '../types'

const { status } = defineProps<{ status: TicketStatus }>()

const TONES: Record<TicketStatus, BadgeTone> = {
  draft: 'neutral',
  on_sale: 'success',
  paused: 'warning',
  sold_out: 'danger',
}
</script>

<template>
  <StatusBadge :tone="TONES[status]">{{ TICKET_STATUS_LABELS[status] }}</StatusBadge>
</template>
