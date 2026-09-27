import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from '@/app/App.vue'
import { createAppContext } from '@/app/create-app-context'
import { isApiMockingEnabled } from '@/shared/config/mock-settings'
import '@/app/styles/main.css'

async function bootstrap() {
  // The demo has no backend: the mock API must be running before the first request.
  if (isApiMockingEnabled) {
    try {
      const { startMockApi } = await import('@/mocks/browser')
      await startMockApi()
    } catch (error) {
      renderStartupError()
      throw error
    }
  }

  const { pinia, router, queryClient } = createAppContext()
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.use(VueQueryPlugin, { queryClient })
  app.mount('#app')
}

/** Without the mock API nothing works; say so instead of showing a blank page. */
function renderStartupError() {
  const root = document.getElementById('app')
  if (!root) return
  root.innerHTML = `
    <main style="max-width:36rem;margin:4rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.5">
      <h1 style="font-size:1.5rem">The demo API could not start</h1>
      <p>This demo runs its API inside the browser using a Service Worker.
      Open the app via <code>http://localhost</code> (or HTTPS) in a regular browser window
      with Service Workers enabled, then reload.</p>
    </main>`
}

void bootstrap()
