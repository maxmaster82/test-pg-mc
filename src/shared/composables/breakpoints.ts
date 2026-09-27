import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'

/** Mirrors --breakpoint-md / --breakpoint-lg in main.css. */
export const BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 } as const

/** ≥1024px: persistent sidebar, full tables. */
export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
}

/** ≥1280px: room for low-priority table columns next to the sidebar. */
export function useIsWide() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`)
}

/** <768px: drawer navigation, card lists, single-column forms. */
export function useIsMobile() {
  const atLeastMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`)
  return computed(() => !atLeastMd.value)
}
