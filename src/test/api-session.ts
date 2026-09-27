import { configureHttp } from '@/shared/api/http'
import { signInAsAdmin, TEST_TOKEN } from './render'

/** For repository/handler tests that call the API without rendering the app. */
export function useAuthenticatedApi() {
  beforeEach(() => {
    signInAsAdmin()
    configureHttp({ getToken: () => TEST_TOKEN, onUnauthorized: () => undefined })
  })
  afterEach(() => {
    configureHttp({ getToken: () => null })
  })
}
