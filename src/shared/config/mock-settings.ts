/**
 * Contract of the mock API's developer endpoints (`/api/__dev/*`). The UI only uses these
 * over HTTP; it never imports the mock implementation.
 */
export const LATENCY_MODES = ['none', 'normal', 'slow'] as const
export type LatencyMode = (typeof LATENCY_MODES)[number]

export const FAILURE_MODES = ['none', 'random', 'always'] as const
export type FailureMode = (typeof FAILURE_MODES)[number]

export interface MockSettings {
  latency: LatencyMode
  failureMode: FailureMode
}

export const isApiMockingEnabled = import.meta.env.VITE_API_MOCKING !== 'false'
