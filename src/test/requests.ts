import { server } from '@/mocks/node'

/** Records API requests (path + query) seen by the mock server during a test. */
export function recordRequests(pathname: string) {
  const seen: URLSearchParams[] = []
  const listener = ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    if (url.pathname === pathname && request.method === 'GET') seen.push(url.searchParams)
  }
  server.events.on('request:start', listener)
  return {
    seen,
    stop: () => {
      server.events.removeListener('request:start', listener)
    },
  }
}
