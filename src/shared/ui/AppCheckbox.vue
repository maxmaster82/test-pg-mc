<script setup lang="ts">
import { useTemplateRef, watchEffect } from 'vue'

const { label, indeterminate } = defineProps<{
  /** Accessible name (visually hidden), e.g. "Select VIP Pass". */
  label: string
  /** Mixed state, exposed to assistive technology as aria-checked="mixed". */
  indeterminate?: boolean
}>()
const model = defineModel<boolean>({ default: false })
const input = useTemplateRef<HTMLInputElement>('input')

watchEffect(() => {
  if (input.value) input.value.indeterminate = indeterminate
})
</script>

<template>
  <label class="-m-2 inline-grid cursor-pointer place-items-center p-2">
    <input
      ref="input"
      v-model="model"
      type="checkbox"
      :aria-label="label"
      class="size-5 cursor-pointer rounded border-line-strong accent-(--color-primary)"
    />
  </label>
</template>
