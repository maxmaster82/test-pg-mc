import { QueryClient } from '@tanstack/vue-query'
import { isApiError } from '@/shared/api/errors'

/** Retry once on transient failures (network/5xx); never on client errors. See ADR 0001. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  return !isApiError(error) || error.status === 0 || error.status >= 500
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: 0 },
    },
  })
}
