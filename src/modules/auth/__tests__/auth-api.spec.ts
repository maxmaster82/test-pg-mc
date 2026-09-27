import { DEMO_USER } from '@/mocks/fixtures/demo-user'
import { configureHttp } from '@/shared/api/http'
import { authApi } from '../api'

describe('mock auth API', () => {
  afterEach(() => {
    configureHttp({ getToken: () => null })
  })

  it('issues a token for the demo administrator (email is case-insensitive)', async () => {
    const response = await authApi.login(DEMO_USER.email.toUpperCase(), DEMO_USER.password)
    expect(response.token).toEqual(expect.any(String))
    expect(response.user).toEqual({
      id: DEMO_USER.id,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
    })
    expect(response.user).not.toHaveProperty('password')
  })

  it('rejects wrong credentials with INVALID_CREDENTIALS', async () => {
    await expect(authApi.login(DEMO_USER.email, 'wrong')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('protects endpoints with the bearer token and invalidates it on logout', async () => {
    await expect(authApi.me()).rejects.toMatchObject({ status: 401 })
    const { token } = await authApi.login(DEMO_USER.email, DEMO_USER.password)
    configureHttp({ getToken: () => token })
    await expect(authApi.me()).resolves.toMatchObject({ email: DEMO_USER.email })
    await authApi.logout()
    await expect(authApi.me()).rejects.toMatchObject({ status: 401 })
  })
})
