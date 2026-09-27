<script setup lang="ts">
import FormField from './FormField.vue'
import { CONTROL_CLASSES } from './field-classes'

export interface SelectOption {
  value: string
  label: string
}

const { label, options, error, hint, required, placeholder } = defineProps<{
  label: string
  options: readonly SelectOption[]
  error?: string
  hint?: string
  required?: boolean
  /** Adds an empty first option (e.g. "Select a currency" or "All statuses"). */
  placeholder?: string
}>()

defineEmits<{ blur: [] }>()
defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ default: '' })
</script>

<template>
  <FormField v-slot="{ id, describedBy, invalid }" :label :error :hint :required>
    <select
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :class="[CONTROL_CLASSES, 'pr-8']"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedBy"
      :aria-required="required || undefined"
      @blur="$emit('blur')"
    >
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </FormField>
</template>
