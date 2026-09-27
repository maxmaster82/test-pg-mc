<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { TICKET_STATUS_LABELS } from '@/modules/tickets/types'
import AppButton from '@/shared/ui/AppButton.vue'
import AppIcon, { type IconName } from '@/shared/ui/AppIcon.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import { formatNumber } from '@/shared/utils/format'
import { useOverviewStats } from './overview-stats'

const { totals, ticketsByStatus, isError, retry } = useOverviewStats()

const SECTIONS: {
  key: 'tickets' | 'events' | 'categories'
  to: string
  title: string
  description: string
  icon: IconName
}[] = [
  {
    key: 'tickets',
    to: '/tickets',
    title: 'Tickets',
    description: 'Prices, inventory and sale status.',
    icon: 'ticket',
  },
  {
    key: 'events',
    to: '/events',
    title: 'Events',
    description: 'Dates, venues and event status.',
    icon: 'calendar',
  },
  {
    key: 'categories',
    to: '/categories',
    title: 'Categories',
    description: 'Ticket types offered across events.',
    icon: 'tag',
  },
]

const display = (value: number | undefined) => (value === undefined ? '—' : formatNumber(value))
</script>

<template>
  <PageHeader title="Overview" description="Manage events, ticket categories and tickets." />

  <p
    v-if="isError"
    role="alert"
    class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-(--radius-control) bg-danger-soft p-3 text-sm text-danger"
  >
    Some figures could not be loaded.
    <AppButton size="sm" icon="refresh" @click="retry">Retry</AppButton>
  </p>

  <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <li v-for="section in SECTIONS" :key="section.key">
      <RouterLink
        :to="section.to"
        class="flex h-full items-start gap-4 rounded-(--radius-card) border border-line bg-surface p-5 shadow-(--shadow-card) hover:border-primary"
      >
        <span class="rounded-(--radius-control) bg-primary-soft p-2 text-primary">
          <AppIcon :name="section.icon" />
        </span>
        <span class="min-w-0">
          <span class="block font-semibold">{{ section.title }}</span>
          <span
            class="mt-1 block text-2xl font-semibold tabular-nums"
            :aria-label="`${display(totals[section.key])} ${section.title.toLowerCase()}`"
          >
            {{ display(totals[section.key]) }}
          </span>
          <span class="mt-1 block text-sm text-muted">{{ section.description }}</span>
        </span>
      </RouterLink>
    </li>
  </ul>

  <section class="mt-8" aria-labelledby="by-status">
    <h2 id="by-status" class="mb-3 text-base font-semibold">Tickets by status</h2>
    <ul class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <li v-for="item in ticketsByStatus" :key="item.status">
        <RouterLink
          :to="{ name: 'tickets', query: { status: item.status } }"
          class="block rounded-(--radius-card) border border-line bg-surface p-4 hover:border-primary"
        >
          <span class="block text-sm text-muted">{{ TICKET_STATUS_LABELS[item.status] }}</span>
          <span class="mt-1 block text-xl font-semibold tabular-nums">{{
            display(item.count)
          }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
