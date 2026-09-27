/**
 * jsdom has no layout engine. This polyfill evaluates min/max-width media queries against a
 * configurable viewport width so responsive components can be tested (see setViewportWidth).
 */
let viewportWidth = 1280
type Listener = (event: { matches: boolean; media: string }) => void
const listeners = new Map<Listener, string>()

function matches(query: string): boolean {
  const min = /min-width:\s*(\d+)px/.exec(query)
  const max = /max-width:\s*(\d+(?:\.\d+)?)px/.exec(query)
  if (min && viewportWidth < Number(min[1])) return false
  if (max && viewportWidth > Number(max[1])) return false
  if (query.includes('prefers-reduced-motion') || query.includes('prefers-color-scheme: dark')) {
    return false
  }
  return Boolean(min ?? max)
}

export function installMatchMedia() {
  window.matchMedia = (query: string) => {
    const mql = {
      media: query,
      get matches() {
        return matches(query)
      },
      onchange: null,
      addEventListener: (_: string, cb: Listener) => listeners.set(cb, query),
      removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
      addListener: (cb: Listener) => listeners.set(cb, query),
      removeListener: (cb: Listener) => listeners.delete(cb),
      dispatchEvent: () => true,
    }
    return mql as unknown as MediaQueryList
  }
}

export function setViewportWidth(width: number) {
  viewportWidth = width
  window.innerWidth = width
  for (const [listener, query] of listeners) listener({ matches: matches(query), media: query })
}

afterEach(() => {
  setViewportWidth(1280)
})
