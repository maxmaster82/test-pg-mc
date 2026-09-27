<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useEntityCreateForm } from '@/shared/composables/useEntityCreateForm'
import AppCard from '@/shared/ui/AppCard.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import TicketForm from '../components/TicketForm.vue'
import { useCreateTicket } from '../queries'
import { emptyTicketForm, ticketFormSchema } from '../schemas'

const router = useRouter()
const create = useCreateTicket()
const { form, submit } = useEntityCreateForm({
  schema: ticketFormSchema,
  empty: emptyTicketForm,
  save: create.mutateAsync,
  successMessage: 'Ticket created',
  onSaved: (ticket) => router.push({ name: 'ticket-detail', params: { id: ticket.id } }),
})
</script>

<template>
  <PageHeader title="New ticket" description="Add a ticket type to an event." />
  <AppCard class="p-4 sm:p-6">
    <TicketForm
      :form="form"
      submit-label="Create ticket"
      :cancel-to="{ name: 'tickets' }"
      @submit="submit"
    />
  </AppCard>
</template>
