<script setup lang="ts">
import { useRouter } from 'vue-router'
import { errorMessage } from '@/shared/api/errors'
import { useEntityEditForm } from '@/shared/composables/useEntityEditForm'
import AppButton from '@/shared/ui/AppButton.vue'
import AppCard from '@/shared/ui/AppCard.vue'
import ConflictNotice from '@/shared/ui/ConflictNotice.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ErrorState from '@/shared/ui/ErrorState.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import TicketForm from '../components/TicketForm.vue'
import { useTicket, useUpdateTicket } from '../queries'
import { emptyTicketForm, ticketFormSchema, toTicketFormValues } from '../schemas'

const { id } = defineProps<{ id: string }>()

const router = useRouter()
const query = useTicket(() => id)
const update = useUpdateTicket()
const { form, loaded, conflict, notFound, reloadLatest, submit } = useEntityEditForm({
  query,
  schema: ticketFormSchema,
  empty: emptyTicketForm,
  toFormValues: toTicketFormValues,
  save: update.mutateAsync,
  successMessage: 'Ticket saved',
  onSaved: (ticket) => router.push({ name: 'ticket-detail', params: { id: ticket.id } }),
})
</script>

<template>
  <PageHeader :title="loaded ? `Edit ${loaded.name}` : 'Edit ticket'" />
  <AppCard class="p-4 sm:p-6">
    <SkeletonBlock v-if="query.isPending.value" :lines="6" />
    <EmptyState
      v-else-if="notFound"
      title="Ticket not found"
      description="It may have been deleted by another administrator."
    >
      <AppButton :to="{ name: 'tickets' }">Back to tickets</AppButton>
    </EmptyState>
    <ErrorState
      v-else-if="query.isError.value && !loaded"
      :message="errorMessage(query.error.value)"
      :retrying="query.isFetching.value"
      @retry="query.refetch()"
    />
    <template v-else-if="loaded">
      <ConflictNotice v-if="conflict" noun="ticket" @reload="reloadLatest" />
      <TicketForm
        :form="form"
        submit-label="Save changes"
        :cancel-to="{ name: 'ticket-detail', params: { id } }"
        :event-name="loaded.event.name"
        @submit="submit"
      />
    </template>
  </AppCard>
</template>
