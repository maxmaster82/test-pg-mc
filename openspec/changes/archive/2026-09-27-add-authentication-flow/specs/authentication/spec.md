## ADDED Requirements

### Requirement: Mocked login

The system SHALL provide a login page at `/login` accepting email and password. The mock API SHALL accept only the seeded demo administrator (credentials documented in the README and displayed as a hint on the login page) and SHALL respond 401 `INVALID_CREDENTIALS` otherwise.

#### Scenario: Successful login

- **GIVEN** the user is on `/login`
- **WHEN** they submit the demo administrator credentials
- **THEN** a session is stored and they are redirected to the overview

#### Scenario: Wrong credentials

- **WHEN** the user submits a valid email with a wrong password
- **THEN** the form shows "Invalid email or password" in an alert region, the password field is cleared, and focus moves to the alert

#### Scenario: Client-side validation

- **WHEN** the user submits an empty form
- **THEN** "Email is required" and "Password is required" appear next to the fields, no request is sent, and focus moves to the first invalid field

#### Scenario: Pending state

- **WHEN** the login request is in flight
- **THEN** the submit button shows a busy state and is disabled to prevent duplicate submission

### Requirement: Route protection

All routes except `/login` and the not-found page SHALL require authentication. Unauthenticated navigation SHALL redirect to `/login?redirect=<original path and query>`.

#### Scenario: Deep link while signed out

- **GIVEN** no session exists
- **WHEN** the user opens `/tickets?status=on_sale&page=2`
- **THEN** they land on `/login`, and after login they are returned to `/tickets?status=on_sale&page=2`

#### Scenario: Open redirect prevented

- **WHEN** the user logs in from `/login?redirect=https://evil.example`
- **THEN** they are redirected to the overview instead

#### Scenario: Signed-in user visits login

- **GIVEN** an active session
- **WHEN** the user navigates to `/login`
- **THEN** they are redirected to the overview

### Requirement: Session restore

On application start the system SHALL validate a persisted token via `GET /api/auth/me` before resolving the first protected route.

#### Scenario: Reload keeps the session

- **GIVEN** the user is signed in
- **WHEN** they reload the page
- **THEN** they remain on the same page without seeing the login screen

#### Scenario: Invalid persisted token

- **GIVEN** `localStorage` holds a token the API rejects
- **WHEN** the app starts
- **THEN** the token is discarded and the user is shown the login page

### Requirement: Logout and expiry

The system SHALL let the user sign out from the user menu, and SHALL treat any 401 from a protected endpoint as an expired session.

#### Scenario: Logout

- **WHEN** the user selects "Sign out"
- **THEN** the session and all cached server data are cleared and the login page is shown

#### Scenario: Session expires mid-use

- **GIVEN** the user is on the tickets list
- **WHEN** an API call returns 401
- **THEN** the user is redirected to `/login?redirect=/tickets` with the message "Your session has expired. Please sign in again."
