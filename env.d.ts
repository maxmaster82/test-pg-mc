/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" enables the MSW mock API (default in this demo; no real backend exists). */
  readonly VITE_API_MOCKING?: string
  /** Fixed mock latency in ms. Unset = random 250–600ms. */
  readonly VITE_MOCK_LATENCY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
