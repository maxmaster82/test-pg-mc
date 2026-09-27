<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/ui/AppIcon.vue'
import { useNotificationsStore } from '@/shared/notifications/store'
import { useAuthStore } from '../store'

const auth = useAuthStore()
const router = useRouter()
const queryClient = useQueryClient()
const notifications = useNotificationsStore()

async function signOut() {
  await auth.logout()
  queryClient.clear()
  notifications.clear()
  await router.replace({ name: 'login' })
}

const itemClass =
  'flex min-h-10 cursor-default items-center gap-2 rounded px-2 text-sm outline-none select-none data-highlighted:bg-surface-muted'
</script>

<template>
  <DropdownMenuRoot v-if="auth.user">
    <DropdownMenuTrigger
      class="flex min-h-11 items-center gap-2 rounded-(--radius-control) px-2 text-sm font-medium hover:bg-surface-muted"
    >
      <span
        class="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
        aria-hidden="true"
      >
        {{
          auth.user.name
            .split(' ')
            .map((part) => part[0])
            .join('')
        }}
      </span>
      <span class="hidden sm:inline">{{ auth.user.name }}</span>
      <span class="sr-only sm:hidden">Account menu for {{ auth.user.name }}</span>
      <AppIcon name="chevronDown" :size="16" class="hidden text-muted sm:block" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="6"
        class="z-50 w-60 rounded-(--radius-card) border border-line bg-surface p-1 shadow-(--shadow-pop)"
      >
        <DropdownMenuLabel class="px-2 py-2">
          <span class="block text-sm font-medium">{{ auth.user.name }}</span>
          <span class="block truncate text-xs text-muted">{{ auth.user.email }}</span>
        </DropdownMenuLabel>
        <slot />
        <DropdownMenuSeparator class="my-1 h-px bg-line" />
        <DropdownMenuItem :class="itemClass" @select="signOut">
          <AppIcon name="logout" :size="16" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
