<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useTemplateRef, type ComponentPublicInstance } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import AppButton from './AppButton.vue'
import AppIcon, { type IconName } from './AppIcon.vue'

export interface RowAction {
  label: string
  icon: IconName
  to?: RouteLocationRaw
  onSelect?: () => void
  danger?: boolean
}

const { label, actions } = defineProps<{
  /** Accessible name, e.g. "Actions for VIP Pass". */
  label: string
  actions: RowAction[]
}>()

const router = useRouter()
const trigger = useTemplateRef<ComponentPublicInstance>('trigger')

function run(action: RowAction) {
  if (action.to) {
    void router.push(action.to)
    return
  }
  // Move focus back to the trigger before the action runs, so a dialog it opens
  // (e.g. delete confirmation) returns focus here instead of to <body>.
  ;(trigger.value?.$el as HTMLElement | undefined)?.focus()
  action.onSelect?.()
}
</script>

<template>
  <DropdownMenuRoot :modal="false">
    <DropdownMenuTrigger as-child>
      <AppButton ref="trigger" variant="ghost" size="sm" icon="more" icon-only>{{
        label
      }}</AppButton>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="4"
        class="z-50 min-w-40 rounded-(--radius-card) border border-line bg-surface p-1 shadow-(--shadow-pop)"
      >
        <DropdownMenuItem
          v-for="action in actions"
          :key="action.label"
          :class="[
            'flex min-h-10 cursor-default items-center gap-2 rounded px-2 text-sm outline-none select-none data-highlighted:bg-surface-muted',
            action.danger && 'text-danger',
          ]"
          @select="run(action)"
        >
          <AppIcon :name="action.icon" :size="16" /> {{ action.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
