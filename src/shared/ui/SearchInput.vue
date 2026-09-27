<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { ref, useId, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { SEARCH_DEBOUNCE_MS } from './search'

const { modelValue, label, placeholder } = defineProps<{
  /** Committed (debounced) search term. */
  modelValue: string
  label: string
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const draft = ref(modelValue)

watch(
  () => modelValue,
  (value) => {
    if (value !== draft.value.trim()) draft.value = value
  },
)

watchDebounced(
  draft,
  (value) => {
    const next = value.trim()
    if (next !== modelValue) emit('update:modelValue', next)
  },
  { debounce: SEARCH_DEBOUNCE_MS },
)

function clear() {
  draft.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="relative">
    <label :for="id" class="sr-only">{{ label }}</label>
    <AppIcon
      name="search"
      :size="18"
      class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
    />
    <input
      :id="id"
      v-model="draft"
      type="search"
      :placeholder="placeholder ?? label"
      autocomplete="off"
      class="min-h-11 w-full rounded-(--radius-control) border border-line-strong bg-surface pr-10 pl-10 text-sm text-fg placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
    />
    <button
      v-if="draft"
      type="button"
      class="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded text-muted hover:text-fg"
      @click="clear"
    >
      <AppIcon name="close" :size="16" />
      <span class="sr-only">Clear search</span>
    </button>
  </div>
</template>
