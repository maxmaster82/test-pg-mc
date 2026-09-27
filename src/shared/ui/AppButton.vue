<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon, { type IconName } from './AppIcon.vue'
import AppSpinner from './AppSpinner.vue'

const {
  variant = 'secondary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  to,
  icon,
  iconOnly = false,
} = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  /** Renders a RouterLink styled as a button. */
  to?: RouteLocationRaw
  icon?: IconName
  /** Visually hide the label (it stays available to assistive technology). */
  iconOnly?: boolean
}>()

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover border-transparent',
  secondary: 'bg-surface text-fg border-line-strong hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:bg-danger-hover border-transparent dark:text-canvas',
  ghost: 'bg-transparent text-fg border-transparent hover:bg-surface-muted',
} as const

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-(--radius-control) border font-medium whitespace-nowrap transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
  size === 'sm' ? 'min-h-9 px-3 text-sm' : 'min-h-11 px-4 text-sm',
  iconOnly && (size === 'sm' ? 'w-9 px-0' : 'w-11 px-0'),
  VARIANTS[variant],
])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <AppIcon v-if="icon" :name="icon" :size="18" />
    <span :class="{ 'sr-only': iconOnly }"><slot /></span>
  </RouterLink>
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <AppSpinner v-if="loading" />
    <AppIcon v-else-if="icon" :name="icon" :size="18" />
    <span :class="{ 'sr-only': iconOnly }"><slot /></span>
  </button>
</template>
