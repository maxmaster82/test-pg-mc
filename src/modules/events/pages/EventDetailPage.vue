<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { errorMessage, isApiError } from '@/shared/api/errors'
import AppButton from '@/shared/ui/AppButton.vue'
import AppCard from '@/shared/ui/AppCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ErrorState from '@/shared/ui/ErrorState.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { formatCountry, formatDateTime, pluralize } from '@/shared/utils/format'
import EventStatusBadge from '../components/EventStatusBadge.vue'
import { useRequestEventDelete } from '../delete'
import { useEvent } from '../queries'

const { id } = defineProps<{ id: string }>()

const router = useRouter()
const query = useEvent(() => id)
const event = computed(() => query.data.value)
const notFound = computed(() => isApiError(query.error.value) && query.error.value.status === 404)
const { request, isPending } = useRequestEventDelete(() => router.push({ name: 'events' }))

async function onDelete() {
  if (event.value) await request(event.value)
}
</script>

<template>
  <SkeletonBlock v-if="query.isPending.value" :lines="6" />
  <AppCard v-else-if="notFound">
    <EmptyState
      title="Event not found"
      description="It may have been deleted by another administrator."
    >
      <AppButton :to="{ name: 'events' }">Back to events</AppButton>
    </EmptyState>
  </AppCard>
  <AppCard v-else-if="query.isError.value || !event">
    <ErrorState
      :message="errorMessage(query.error.value)"
      :retrying="query.isFetching.value"
      @retry="query.refetch()"
    />
  </AppCard>
  <template v-else>
    <PageHeader :title="event.name">
      <template #breadcrumb>
        <RouterLink
          :to="{ name: 'events' }"
          class="mb-1 inline-block text-sm text-muted hover:text-fg"
        >
          ← Events
        </RouterLink>
      </template>
      <template #actions>
        <AppButton icon="edit" :to="{ name: 'event-edit', params: { id } }">Edit</AppButton>
        <AppButton icon="trash" variant="danger" :loading="isPending" @click="onDelete">
          Delete
        </AppButton>
      </template>
    </PageHeader>
    <AppCard class="p-4 sm:p-6">
      <dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt class="text-sm text-muted">Status</dt>
          <dd class="mt-1"><EventStatusBadge :status="event.status" /></dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Venue</dt>
          <dd class="mt-1">{{ event.venue }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Country</dt>
          <dd class="mt-1">{{ formatCountry(event.country) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Starts</dt>
          <dd class="mt-1">{{ formatDateTime(event.startDate) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Ends</dt>
          <dd class="mt-1">{{ formatDateTime(event.endDate) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Tickets</dt>
          <dd class="mt-1">
            <RouterLink
              :to="{ name: 'tickets', query: { eventId: event.id } }"
              class="text-primary hover:underline"
            >
              {{ pluralize(event.ticketCount, 'ticket') }}
            </RouterLink>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Created</dt>
          <dd class="mt-1">{{ formatDateTime(event.createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Last updated</dt>
          <dd class="mt-1">{{ formatDateTime(event.updatedAt) }}</dd>
        </div>
      </dl>
    </AppCard>
  </template>
</template>
