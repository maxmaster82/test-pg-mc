<script setup lang="ts">
import FormField from './FormField.vue'
import { CONTROL_CLASSES } from './field-classes'

const {
  label,
  error,
  hint,
  required,
  type = 'text',
} = defineProps<{
  label: string
  error?: string
  hint?: string
  required?: boolean
  type?: 'text' | 'email' | 'password' | 'search' | 'datetime-local'
}>()

defineEmits<{ blur: [] }>()
defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ default: '' })
</script>

<template>
  <FormField v-slot="{ id, describedBy, invalid }" :label :error :hint :required>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="type"
      :class="CONTROL_CLASSES"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedBy"
      :aria-required="required || undefined"
      @blur="$emit('blur')"
    />
  </FormField>
</template>
