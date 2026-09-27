import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isApiError } from '@/shared/api/errors'
import { authApi } from './api'
import type { User } from './types'

/**
 * Demo trade-off: the opaque token lives in localStorage so reloads keep the session.
 * A production backend should issue an HttpOnly, SameSite cookie instead (see README).
 */
const TOKEN_KEY = 'ticket-admin:session-token'

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable: the session simply won't survive a reload.
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readToken())
  const user = ref<User | null>(null)
  let restoring: Promise<void> | null = null

  const isAuthenticated = computed(() => token.value !== null && user.value !== null)

  function setSession(nextToken: string, nextUser: User) {
    token.value = nextToken
    user.value = nextUser
    writeToken(nextToken)
  }

  function clear() {
    token.value = null
    user.value = null
    writeToken(null)
  }

  /** Validates a persisted token once per app start; awaited by the router guard. */
  function restoreSession(): Promise<void> {
    restoring ??= (async () => {
      if (!token.value || user.value) return
      try {
        user.value = await authApi.me()
      } catch (error) {
        // Only a 401 proves the token is invalid. On network/server errors keep the token so a
        // reload can recover; the guard still sends the user to the login page for now.
        if (isApiError(error) && error.status === 401) clear()
      }
    })()
    return restoring
  }

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password)
    setSession(response.token, response.user)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Signing out locally must always succeed, even if the server call fails.
    }
    clear()
  }

  return { token, user, isAuthenticated, restoreSession, login, logout, clear }
})
