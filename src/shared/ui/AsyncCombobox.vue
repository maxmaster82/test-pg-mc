<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
import { computed, ref } from 'vue'
import type { EntitySummary } from '@/shared/api/types'
import AppIcon from './AppIcon.vue'
import AppSpinner from './AppSpinner.vue'
import FormField from './FormField.vue'
import { CONTROL_CLASSES } from './field-classes'

/**
 * Searchable single-select whose options come from the server (the parent runs the query
 * for each emitted search term). Keyboard and ARIA behavior come from Reka UI's Combobox.
 */
const {
  label,
  options,
  selectedLabel,
  loading,
  error,
  hint,
  required,
  placeholder = 'Search…',
} = defineProps<{
  label: string
  options: EntitySummary[]
  /** Name of the current value when it is not among the loaded options (e.g. edit form). */
  selectedLabel?: string
  loading?: boolean
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
}>()
const emit = defineEmits<{ search: [term: string]; blur: [] }>()
const model = defineModel<string>({ default: '' })

const term = ref('')
const open = ref(false)

const selected = computed<EntitySummary | undefined>(() => {
  if (!model.value) return undefined
  const match = options.find((o) => o.id === model.value)
  return { id: model.value, name: match?.name ?? selectedLabel ?? '' }
})

function onSelect(value: unknown) {
  const option = value as EntitySummary | undefined
  model.value = option?.id ?? ''
}

watchDebounced(
  term,
  (value) => {
    emit('search', value.trim())
  },
  { debounce: 250 },
)
</script>

<template>
  <FormField v-slot="{ id, describedBy, invalid }" :label :error :hint :required>
    <ComboboxRoot
      v-model:open="open"
      :model-value="selected"
      by="id"
      ignore-filter
      open-on-click
      @update:model-value="onSelect"
    >
      <ComboboxAnchor class="relative">
        <ComboboxInput
          :id="id"
          v-model="term"
          :display-value="(v: EntitySummary | undefined) => v?.name ?? ''"
          :placeholder="placeholder"
          :class="[CONTROL_CLASSES, 'pr-10']"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedBy"
          :aria-required="required || undefined"
          @blur="emit('blur')"
        />
        <ComboboxTrigger
          class="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted"
          tabindex="-1"
        >
          <AppIcon name="chevronDown" :size="18" />
          <span class="sr-only">Show options</span>
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxPortal>
        <ComboboxContent
          position="popper"
          :side-offset="4"
          class="z-50 max-h-72 w-(--reka-combobox-trigger-width) overflow-hidden rounded-(--radius-card) border border-line bg-surface shadow-(--shadow-pop)"
        >
          <ComboboxViewport class="p-1">
            <div v-if="loading" class="flex items-center gap-2 px-2 py-2 text-sm text-muted">
              <AppSpinner /> Searching…
            </div>
            <ComboboxEmpty v-else class="px-2 py-2 text-sm text-muted">No matches</ComboboxEmpty>
            <ComboboxItem
              v-for="option in options"
              :key="option.id"
              :value="option"
              :text-value="option.name"
              class="flex min-h-10 cursor-default items-center gap-2 rounded px-2 text-sm outline-none select-none data-highlighted:bg-surface-muted data-[state=checked]:font-medium"
            >
              {{ option.name }}
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </FormField>
</template>
