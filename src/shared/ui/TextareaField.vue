<script setup lang="ts">
import FormField from './FormField.vue'
import { CONTROL_CLASSES } from './field-classes'

const {
  label,
  error,
  hint,
  required,
  rows = 4,
} = defineProps<{
  label: string
  error?: string
  hint?: string
  required?: boolean
  rows?: number
}>()

defineEmits<{ blur: [] }>()
defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ default: '' })
</script>

<template>
  <FormField v-slot="{ id, describedBy, invalid }" :label :error :hint :required>
    <textarea
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :rows="rows"
      :class="[CONTROL_CLASSES, 'py-2']"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedBy"
      :aria-required="required || undefined"
      @blur="$emit('blur')"
    />
  </FormField>
</template>
