import { http } from '@/shared/api/http'
import type { MockSettings } from '@/shared/config/mock-settings'

/** Client for the mock API's developer endpoints (demo builds only). */
export const demoApi = {
  getSettings: (signal?: AbortSignal) => http.get<MockSettings>('/__dev/settings', { signal }),
  updateSettings: (patch: Partial<MockSettings>) =>
    http.put<MockSettings>('/__dev/settings', patch),
  resetData: async () => {
    await http.post('/__dev/reset')
  },
}
