<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useHeadingFocus } from '@/shared/composables/route-focus'

const { title, description } = defineProps<{ title: string; description?: string }>()
useHeadingFocus(useTemplateRef<HTMLElement>('heading'))
</script>

<template>
  <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <slot name="breadcrumb" />
      <h1 ref="heading" tabindex="-1" class="text-2xl font-semibold tracking-tight break-words">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2"><slot name="actions" /></div>
  </header>
</template>
