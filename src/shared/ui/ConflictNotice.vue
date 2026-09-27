<script setup lang="ts">
import AppButton from './AppButton.vue'

const { noun } = defineProps<{ noun: string }>()
defineEmits<{ reload: [] }>()
</script>

<template>
  <div
    role="alert"
    class="mb-6 flex flex-col gap-3 rounded-(--radius-control) bg-warning-soft p-4 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
  >
    <p>
      <strong>This {{ noun }} was changed by someone else.</strong> Reload the latest version to
      continue; your unsaved edits will be replaced.
    </p>
    <AppButton size="sm" icon="refresh" @click="$emit('reload')">Load latest version</AppButton>
  </div>
</template>
