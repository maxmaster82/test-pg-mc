import type { UserRecord } from '../db/types'

/**
 * Fake administrator for the mocked login. These are NOT secrets: they exist only in the
 * in-browser mock API and are documented in the README and on the login page.
 */
export const DEMO_USER: UserRecord = {
  id: 'usr_1',
  name: 'Alex Morgan',
  email: 'admin@ticketadmin.test',
  password: 'demo-password',
}
