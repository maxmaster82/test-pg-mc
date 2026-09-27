<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useEntityCreateForm } from '@/shared/composables/useEntityCreateForm'
import AppCard from '@/shared/ui/AppCard.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import EventForm from '../components/EventForm.vue'
import { useCreateEvent } from '../queries'
import { emptyEventForm, eventFormSchema } from '../schemas'

const router = useRouter()
const create = useCreateEvent()
const { form, submit } = useEntityCreateForm({
  schema: eventFormSchema,
  empty: emptyEventForm,
  save: create.mutateAsync,
  successMessage: 'Event created',
  onSaved: (event) => router.push({ name: 'event-detail', params: { id: event.id } }),
})
</script>

<template>
  <PageHeader title="New event" description="Schedule an event to sell tickets for." />
  <AppCard class="p-4 sm:p-6">
    <EventForm
      :form="form"
      submit-label="Create event"
      :cancel-to="{ name: 'events' }"
      @submit="submit"
    />
  </AppCard>
</template>
