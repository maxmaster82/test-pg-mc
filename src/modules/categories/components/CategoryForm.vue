<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import AppButton from '@/shared/ui/AppButton.vue'
import TextareaField from '@/shared/ui/TextareaField.vue'
import TextField from '@/shared/ui/TextField.vue'
import type { ZodForm } from '@/shared/validation/useZodForm'
import type { CategoryFormValues, CategoryInput } from '../schemas'

const { form, submitLabel, cancelTo } = defineProps<{
  form: ZodForm<CategoryFormValues, CategoryInput>
  submitLabel: string
  cancelTo: RouteLocationRaw
}>()
defineEmits<{ submit: [event: Event] }>()
</script>

<template>
  <form novalidate class="flex max-w-2xl flex-col gap-6" @submit="$emit('submit', $event)">
    <TextField v-bind="form.field('name')" label="Name" required autocomplete="off" />
    <TextareaField
      v-bind="form.field('description')"
      label="Description"
      hint="Optional. Shown to administrators when choosing a category (max 500 characters)."
    />
    <div class="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
      <AppButton :to="cancelTo">Cancel</AppButton>
      <AppButton type="submit" variant="primary" :loading="form.isSubmitting.value">
        {{ submitLabel }}
      </AppButton>
    </div>
  </form>
</template>
