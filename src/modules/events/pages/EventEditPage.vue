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
import EventForm from '../components/EventForm.vue'
import { useEvent, useUpdateEvent } from '../queries'
import { emptyEventForm, eventFormSchema, toEventFormValues } from '../schemas'

const { id } = defineProps<{ id: string }>()

const router = useRouter()
const query = useEvent(() => id)
const update = useUpdateEvent()
const { form, loaded, conflict, notFound, reloadLatest, submit } = useEntityEditForm({
  query,
  schema: eventFormSchema,
  empty: emptyEventForm,
  toFormValues: toEventFormValues,
  save: update.mutateAsync,
  successMessage: 'Event saved',
  onSaved: (event) => router.push({ name: 'event-detail', params: { id: event.id } }),
})
</script>

<template>
  <PageHeader :title="loaded ? `Edit ${loaded.name}` : 'Edit event'" />
  <AppCard class="p-4 sm:p-6">
    <SkeletonBlock v-if="query.isPending.value" :lines="6" />
    <EmptyState
      v-else-if="notFound"
      title="Event not found"
      description="It may have been deleted by another administrator."
    >
      <AppButton :to="{ name: 'events' }">Back to events</AppButton>
    </EmptyState>
    <ErrorState
      v-else-if="query.isError.value && !loaded"
      :message="errorMessage(query.error.value)"
      :retrying="query.isFetching.value"
      @retry="query.refetch()"
    />
    <template v-else-if="loaded">
      <ConflictNotice v-if="conflict" noun="event" @reload="reloadLatest" />
      <EventForm
        :form="form"
        submit-label="Save changes"
        :cancel-to="{ name: 'event-detail', params: { id } }"
        @submit="submit"
      />
    </template>
  </AppCard>
</template>
