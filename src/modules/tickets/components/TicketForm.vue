<script setup lang="ts">
import { ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useCategoryOptions } from '@/modules/categories/lookups'
import { useEventOptions } from '@/modules/events/lookups'
import AppButton from '@/shared/ui/AppButton.vue'
import AsyncCombobox from '@/shared/ui/AsyncCombobox.vue'
import SelectField from '@/shared/ui/SelectField.vue'
import TextField from '@/shared/ui/TextField.vue'
import type { ZodForm } from '@/shared/validation/useZodForm'
import { CURRENCY_OPTIONS, TICKET_STATUS_OPTIONS } from '../options'
import type { TicketFormValues, TicketInput } from '../schemas'

const { form, submitLabel, cancelTo, eventName } = defineProps<{
  form: ZodForm<TicketFormValues, TicketInput>
  submitLabel: string
  cancelTo: RouteLocationRaw
  /** Name of the currently selected event (edit mode), shown before options load. */
  eventName?: string
}>()
defineEmits<{ submit: [event: Event] }>()

const eventSearch = ref('')
const events = useEventOptions(eventSearch)
const categories = useCategoryOptions()
</script>

<template>
  <form novalidate class="flex flex-col gap-6" @submit="$emit('submit', $event)">
    <div class="grid gap-5 md:grid-cols-2">
      <div class="md:col-span-2">
        <TextField v-bind="form.field('name')" label="Name" required autocomplete="off" />
      </div>
      <div class="grid grid-cols-[1fr_7rem] gap-3">
        <TextField
          v-bind="form.field('price')"
          label="Price"
          inputmode="decimal"
          hint="Use a dot or comma for decimals, e.g. 49.90"
          required
        />
        <SelectField
          v-bind="form.field('currency')"
          label="Currency"
          :options="CURRENCY_OPTIONS"
          required
        />
      </div>
      <TextField
        v-bind="form.field('quantity')"
        label="Quantity available"
        inputmode="numeric"
        required
      />
      <AsyncCombobox
        v-bind="form.field('eventId')"
        label="Event"
        :options="events.options.value"
        :loading="events.isFetching.value"
        :selected-label="eventName"
        placeholder="Search events…"
        required
        @search="eventSearch = $event"
      />
      <SelectField
        v-bind="form.field('categoryId')"
        label="Category"
        :options="categories.options.value"
        placeholder="Select a category"
        required
      />
      <SelectField
        v-bind="form.field('status')"
        label="Status"
        :options="TICKET_STATUS_OPTIONS"
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
