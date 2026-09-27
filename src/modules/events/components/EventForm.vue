<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import AppButton from '@/shared/ui/AppButton.vue'
import SelectField from '@/shared/ui/SelectField.vue'
import TextField from '@/shared/ui/TextField.vue'
import type { ZodForm } from '@/shared/validation/useZodForm'
import { COUNTRY_OPTIONS } from '../countries'
import { EVENT_STATUS_OPTIONS } from '../options'
import type { EventFormValues, EventInput } from '../schemas'

const { form, submitLabel, cancelTo } = defineProps<{
  form: ZodForm<EventFormValues, EventInput>
  submitLabel: string
  cancelTo: RouteLocationRaw
}>()
defineEmits<{ submit: [event: Event] }>()
</script>

<template>
  <form novalidate class="flex flex-col gap-6" @submit="$emit('submit', $event)">
    <div class="grid gap-5 md:grid-cols-2">
      <div class="md:col-span-2">
        <TextField v-bind="form.field('name')" label="Name" required autocomplete="off" />
      </div>
      <TextField v-bind="form.field('venue')" label="Venue" required autocomplete="off" />
      <SelectField
        v-bind="form.field('country')"
        label="Country"
        :options="COUNTRY_OPTIONS"
        placeholder="Select a country"
        required
      />
      <TextField
        v-bind="form.field('startDate')"
        label="Start date"
        type="datetime-local"
        hint="In your local time zone"
        required
      />
      <TextField v-bind="form.field('endDate')" label="End date" type="datetime-local" required />
      <SelectField
        v-bind="form.field('status')"
        label="Status"
        :options="EVENT_STATUS_OPTIONS"
        required
      />
    </div>
    <div class="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
      <AppButton :to="cancelTo">Cancel</AppButton>
      <AppButton type="submit" variant="primary" :loading="form.isSubmitting.value">
        {{ submitLabel }}
      </AppButton>
    </div>
  </form>
</template>
