import { http } from '@/shared/api/http'
import type { LoginResponse, User } from './types'

export const authApi = {
  login: (email: string, password: string) =>
    http.post<LoginResponse>('/auth/login', { email, password }),
  me: (signal?: AbortSignal) => http.get<User>('/auth/me', { signal }),
  logout: async () => {
    await http.post('/auth/logout')
  },
}
