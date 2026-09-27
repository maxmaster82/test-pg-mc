import type { ApiErrorBody, ApiErrorCode, FieldErrors } from './types'

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

export class ApiError extends Error {
  override readonly name = 'ApiError'

  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const { error } = value
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

/** Builds an ApiError from a failed response, tolerating non-JSON bodies (e.g. proxy HTML pages). */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // Non-JSON body: fall through to a generic, user-safe message.
  }
  if (isErrorBody(body)) {
    const { code, message, fieldErrors, details } = body.error
    return new ApiError(response.status, code, message, fieldErrors, details)
  }
  const code: ApiErrorCode = response.status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR'
  return new ApiError(response.status, code, GENERIC_MESSAGE)
}

export function networkError(): ApiError {
  return new ApiError(
    0,
    'NETWORK_ERROR',
    'Cannot reach the server. Check your connection and try again.',
  )
}

/** A message that is always safe to show to the user. */
export function errorMessage(error: unknown): string {
  return isApiError(error) ? error.message : GENERIC_MESSAGE
}
