import { errorMessage, isApiError } from '@/shared/api/errors'
import type { FieldErrors } from '@/shared/api/types'

export type SaveFailure = 'validation' | 'conflict' | 'failed'

interface Deps {
  setServerErrors: (errors: FieldErrors) => void
  notifyError: (message: string) => void
}

/**
 * Routes a failed create/update to the right feedback: field errors (422), a conflict the page
 * handles itself (409), or a toast for everything else. Entered values are never cleared.
 */
export function handleSaveError(
  error: unknown,
  { setServerErrors, notifyError }: Deps,
): SaveFailure {
  if (isApiError(error) && error.code === 'VALIDATION_ERROR' && error.fieldErrors) {
    setServerErrors(error.fieldErrors)
    notifyError('Some fields need your attention.')
    return 'validation'
  }
  if (isApiError(error) && error.code === 'CONFLICT') return 'conflict'
  notifyError(errorMessage(error))
  return 'failed'
}
