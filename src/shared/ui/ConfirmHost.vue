<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'
import { computed, shallowRef } from 'vue'
import AppButton from './AppButton.vue'
import { pendingConfirm, settleConfirm } from './confirm'

const open = computed(() => pendingConfirm.value !== null)
const returnFocus = shallowRef<HTMLElement | null>(null)

function onOpenChange(value: boolean) {
  if (!value) settleConfirm(false)
}

function onOpenAutoFocus() {
  returnFocus.value = pendingConfirm.value?.returnFocus ?? null
}

/** Restore focus explicitly: the default can land on <body> when a menu item opened the dialog. */
function onCloseAutoFocus(event: Event) {
  const target = returnFocus.value
  if (target?.isConnected) {
    event.preventDefault()
    target.focus()
  }
}
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="onOpenChange">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-40 bg-overlay" />
      <AlertDialogContent
        v-if="pendingConfirm"
        class="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-(--radius-card) bg-surface p-6 shadow-(--shadow-pop)"
        @open-auto-focus="onOpenAutoFocus"
        @close-auto-focus="onCloseAutoFocus"
      >
        <AlertDialogTitle class="text-lg font-semibold">{{
          pendingConfirm.title
        }}</AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-sm text-muted">
          {{ pendingConfirm.message }}
        </AlertDialogDescription>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <!-- Cancel is focused first (Reka's AlertDialog default) so Enter never destroys data by accident. -->
          <AlertDialogCancel as-child>
            <AppButton>{{ pendingConfirm.cancelLabel ?? 'Cancel' }}</AppButton>
          </AlertDialogCancel>
          <!-- Plain button (not AlertDialogAction) so the "confirmed" result is settled
               before the dialog's own close handler runs. -->
          <AppButton
            :variant="pendingConfirm.tone === 'danger' ? 'danger' : 'primary'"
            @click="settleConfirm(true)"
          >
            {{ pendingConfirm.confirmLabel ?? 'Confirm' }}
          </AppButton>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
