<script setup lang="ts">
import { ref, useId } from 'vue'
import { useIsMobile } from '@/shared/composables/breakpoints'
import AppButton from './AppButton.vue'

/**
 * Below 768px, filters collapse behind a "Filters (n)" disclosure so the results stay visible.
 * On larger screens the filter controls render inline (the wrapper uses display: contents so
 * they participate in the parent grid).
 */
const { activeCount } = defineProps<{ activeCount: number }>()
const isMobile = useIsMobile()
const open = ref(false)
const panelId = useId()
</script>

<template>
  <AppButton
    v-if="isMobile"
    icon="filter"
    :aria-expanded="open"
    :aria-controls="panelId"
    @click="open = !open"
  >
    Filters<template v-if="activeCount > 0"> ({{ activeCount }})</template>
  </AppButton>
  <div v-show="!isMobile || open" :id="panelId" :class="isMobile ? 'grid gap-3' : 'contents'">
    <slot />
  </div>
</template>
