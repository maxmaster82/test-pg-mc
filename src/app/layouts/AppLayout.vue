<script setup lang="ts">
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { ref, useTemplateRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useIsDesktop } from '@/shared/composables/breakpoints'
import AppButton from '@/shared/ui/AppButton.vue'
import BrandMark from './BrandMark.vue'
import SidebarNav from './SidebarNav.vue'
import TopBarActions from './TopBarActions.vue'

const isDesktop = useIsDesktop()
const drawerOpen = ref(false)
const route = useRoute()
const main = useTemplateRef<HTMLElement>('main')

watch(
  () => route.fullPath,
  () => (drawerOpen.value = false),
)
watch(isDesktop, (desktop) => {
  if (desktop) drawerOpen.value = false
})

function skipToMain() {
  main.value?.focus()
}
</script>

<template>
  <a
    href="#main"
    class="sr-only z-50 rounded bg-surface px-4 py-2 font-medium text-primary shadow-(--shadow-pop) focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    @click.prevent="skipToMain"
    >Skip to main content</a
  >
  <!-- Grid is driven by the same JS media query that renders the sidebar: a CSS breakpoint here
       could disagree at fractional widths/zoom and squeeze the content into the sidebar column. -->
  <div :class="['min-h-dvh', isDesktop && 'grid grid-cols-[15rem_minmax(0,1fr)]']">
    <aside
      v-if="isDesktop"
      class="sticky top-0 flex h-dvh flex-col gap-6 border-r border-line bg-surface px-3 py-4"
    >
      <div class="px-3"><BrandMark /></div>
      <SidebarNav />
    </aside>

    <div class="flex min-w-0 flex-col">
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6"
      >
        <template v-if="!isDesktop">
          <AppButton variant="ghost" icon="menu" icon-only @click="drawerOpen = true">
            Open navigation
          </AppButton>
          <BrandMark />
        </template>
        <div class="ml-auto flex items-center gap-2">
          <TopBarActions />
        </div>
      </header>

      <main
        id="main"
        ref="main"
        tabindex="-1"
        class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8"
      >
        <RouterView />
      </main>
    </div>
  </div>

  <DialogRoot v-model:open="drawerOpen">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-overlay" />
      <DialogContent
        class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-6 bg-surface px-3 py-4 shadow-(--shadow-pop) motion-safe:animate-[slide-in_150ms_ease-out]"
      >
        <div class="flex items-center justify-between px-3">
          <DialogTitle as="div"><BrandMark /></DialogTitle>
          <AppButton variant="ghost" icon="close" icon-only @click="drawerOpen = false">
            Close navigation
          </AppButton>
        </div>
        <DialogDescription class="sr-only">Primary navigation</DialogDescription>
        <SidebarNav @navigate="drawerOpen = false" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
@keyframes slide-in {
  from {
    transform: translateX(-100%);
  }
}
</style>
