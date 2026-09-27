<script setup lang="ts">
import {
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from 'reka-ui'
import { computed } from 'vue'
import AppIcon from '@/shared/ui/AppIcon.vue'
import { usePreferencesStore, type Theme } from './store'

const preferences = usePreferencesStore()
const theme = computed({
  get: () => preferences.theme,
  set: (value: Theme) => {
    preferences.setTheme(value)
  },
})

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
</script>

<template>
  <DropdownMenuSeparator class="my-1 h-px bg-line" />
  <DropdownMenuLabel class="px-2 py-1.5 text-xs font-semibold text-muted uppercase"
    >Theme</DropdownMenuLabel
  >
  <DropdownMenuRadioGroup v-model="theme">
    <DropdownMenuRadioItem
      v-for="option in OPTIONS"
      :key="option.value"
      :value="option.value"
      class="flex min-h-10 cursor-default items-center gap-2 rounded px-2 text-sm outline-none select-none data-highlighted:bg-surface-muted"
    >
      <span class="w-4">
        <DropdownMenuItemIndicator><AppIcon name="check" :size="16" /></DropdownMenuItemIndicator>
      </span>
      {{ option.label }}
    </DropdownMenuRadioItem>
  </DropdownMenuRadioGroup>
</template>
