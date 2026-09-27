<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon, { type IconName } from '@/shared/ui/AppIcon.vue'
import type { NavSection } from '@/app/router/meta'

defineEmits<{ navigate: [] }>()

const route = useRoute()
const current = computed(() => route.meta.section)

const ITEMS: { section: NavSection; label: string; to: string; icon: IconName }[] = [
  { section: 'overview', label: 'Overview', to: '/', icon: 'home' },
  { section: 'tickets', label: 'Tickets', to: '/tickets', icon: 'ticket' },
  { section: 'events', label: 'Events', to: '/events', icon: 'calendar' },
  { section: 'categories', label: 'Categories', to: '/categories', icon: 'tag' },
]
</script>

<template>
  <nav aria-label="Primary">
    <ul class="flex flex-col gap-1">
      <li v-for="item in ITEMS" :key="item.section">
        <RouterLink
          :to="item.to"
          :aria-current="current === item.section ? 'page' : undefined"
          class="flex min-h-11 items-center gap-3 rounded-(--radius-control) px-3 text-sm font-medium text-muted hover:bg-surface-muted hover:text-fg aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
          @click="$emit('navigate')"
        >
          <AppIcon :name="item.icon" />
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
