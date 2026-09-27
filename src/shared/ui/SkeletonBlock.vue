<script setup lang="ts">
const { lines = 5 } = defineProps<{ lines?: number }>()
</script>

<template>
  <div role="status" aria-live="polite" class="flex flex-col gap-3 p-4">
    <span class="sr-only">Loading…</span>
    <div
      v-for="line in lines"
      :key="line"
      aria-hidden="true"
      class="h-10 animate-pulse rounded-(--radius-control) bg-surface-muted"
    />
  </div>
</template>
