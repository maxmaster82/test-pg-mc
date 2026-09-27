<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { errorMessage, isApiError } from '@/shared/api/errors'
import { useDeleteWithConfirm } from '@/shared/composables/useDeleteWithConfirm'
import AppButton from '@/shared/ui/AppButton.vue'
import AppCard from '@/shared/ui/AppCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ErrorState from '@/shared/ui/ErrorState.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { formatDateTime, formatMoney, formatNumber } from '@/shared/utils/format'
import TicketStatusBadge from '../components/TicketStatusBadge.vue'
import { useDeleteTicket, useTicket } from '../queries'

const { id } = defineProps<{ id: string }>()

const router = useRouter()
const query = useTicket(() => id)
const remove = useDeleteTicket()
const requestDelete = useDeleteWithConfirm({
  noun: 'ticket',
  remove: remove.mutateAsync,
  onDeleted: () => router.push({ name: 'tickets' }),
})
const ticket = computed(() => query.data.value)
const notFound = computed(() => isApiError(query.error.value) && query.error.value.status === 404)

async function onDelete() {
  if (ticket.value) await requestDelete(ticket.value)
}
</script>

<template>
  <SkeletonBlock v-if="query.isPending.value" :lines="6" />
  <AppCard v-else-if="notFound">
    <EmptyState
      title="Ticket not found"
      description="It may have been deleted by another administrator."
    >
      <AppButton :to="{ name: 'tickets' }">Back to tickets</AppButton>
    </EmptyState>
  </AppCard>
  <AppCard v-else-if="query.isError.value || !ticket">
    <ErrorState
      :message="errorMessage(query.error.value)"
      :retrying="query.isFetching.value"
      @retry="query.refetch()"
    />
  </AppCard>
  <template v-else>
    <PageHeader :title="ticket.name">
      <template #breadcrumb>
        <RouterLink
          :to="{ name: 'tickets' }"
          class="mb-1 inline-block text-sm text-muted hover:text-fg"
        >
          ← Tickets
        </RouterLink>
      </template>
      <template #actions>
        <AppButton icon="edit" :to="{ name: 'ticket-edit', params: { id } }">Edit</AppButton>
        <AppButton
          icon="trash"
          variant="danger"
          :loading="remove.isPending.value"
          @click="onDelete"
        >
          Delete
        </AppButton>
      </template>
    </PageHeader>
    <AppCard class="p-4 sm:p-6">
      <dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt class="text-sm text-muted">Status</dt>
          <dd class="mt-1"><TicketStatusBadge :status="ticket.status" /></dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Price</dt>
          <dd class="mt-1 font-medium tabular-nums">
            {{ formatMoney(ticket.price, ticket.currency) }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Quantity available</dt>
          <dd class="mt-1 font-medium tabular-nums">{{ formatNumber(ticket.quantity) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Event</dt>
          <dd class="mt-1">
            <RouterLink
              :to="{ name: 'event-detail', params: { id: ticket.event.id } }"
              class="text-primary hover:underline"
            >
              {{ ticket.event.name }}
            </RouterLink>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Category</dt>
          <dd class="mt-1">
            <RouterLink
              :to="{ name: 'category-detail', params: { id: ticket.category.id } }"
              class="text-primary hover:underline"
            >
              {{ ticket.category.name }}
            </RouterLink>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Currency</dt>
          <dd class="mt-1">{{ ticket.currency }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Created</dt>
          <dd class="mt-1">{{ formatDateTime(ticket.createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Last updated</dt>
          <dd class="mt-1">{{ formatDateTime(ticket.updatedAt) }}</dd>
        </div>
      </dl>
    </AppCard>
  </template>
</template>
