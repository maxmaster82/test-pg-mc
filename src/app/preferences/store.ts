import { useMediaQuery } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watchEffect } from 'vue'

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

/** Also read by the inline script in index.html to apply the theme before first paint. */
export const THEME_STORAGE_KEY = 'ticket-admin:theme'

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return THEMES.includes(stored as Theme) ? (stored as Theme) : 'system'
  } catch {
    return 'system'
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref<Theme>(readTheme())
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const effectiveTheme = computed<'light' | 'dark'>(() =>
    theme.value === 'system' ? (systemPrefersDark.value ? 'dark' : 'light') : theme.value,
  )

  function setTheme(next: Theme) {
    theme.value = next
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Not persisted; still applied for this session.
    }
  }

  // "System" follows the OS setting live.
  watchEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme.value
  })

  return { theme, effectiveTheme, setTheme }
})
