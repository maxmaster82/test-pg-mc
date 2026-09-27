import { isAbortError, networkError, toApiError } from './errors'

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

interface RequestOptions {
  query?: QueryParams
  body?: unknown
  signal?: AbortSignal
}

interface HttpConfig {
  baseUrl: string
  getToken: () => string | null
  onUnauthorized: () => void
}

const config: HttpConfig = {
  baseUrl: '/api',
  getToken: () => null,
  onUnauthorized: () => undefined,
}

/** Called once by the composition root to connect auth to the transport layer. */
export function configureHttp(overrides: Partial<HttpConfig>): void {
  Object.assign(config, overrides)
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${config.baseUrl}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  const token = config.getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (isAbortError(error) || options.signal?.aborted) throw error
    throw networkError()
  }

  if (!response.ok) {
    const error = await toApiError(response)
    if (response.status === 401 && token) config.onUnauthorized()
    throw error
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  delete: <T = void>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('DELETE', path, options),
}
