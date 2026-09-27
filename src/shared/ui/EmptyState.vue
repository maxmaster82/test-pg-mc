<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'

const {
  title,
  description,
  icon = 'inbox',
} = defineProps<{
  title: string
  description?: string
  icon?: IconName
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 px-4 py-12 text-center">
    <span class="rounded-full bg-surface-muted p-3 text-muted"
      ><AppIcon :name="icon" :size="24"
    /></span>
    <h2 class="text-base font-semibold">{{ title }}</h2>
    <p v-if="description" class="max-w-md text-sm text-muted">{{ description }}</p>
    <div v-if="$slots.default" class="mt-2 flex flex-wrap justify-center gap-2"><slot /></div>
  </div>
</template>
