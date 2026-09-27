<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'

const {
  title = 'Something went wrong',
  message,
  retrying,
} = defineProps<{
  title?: string
  message: string
  retrying?: boolean
}>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div role="alert" class="flex flex-col items-center gap-3 px-4 py-12 text-center">
    <span class="rounded-full bg-danger-soft p-3 text-danger"
      ><AppIcon name="alert" :size="24"
    /></span>
    <h2 class="text-base font-semibold">{{ title }}</h2>
    <p class="max-w-md text-sm text-muted">{{ message }}</p>
    <AppButton icon="refresh" :loading="retrying" @click="$emit('retry')">Retry</AppButton>
    <slot />
  </div>
</template>
