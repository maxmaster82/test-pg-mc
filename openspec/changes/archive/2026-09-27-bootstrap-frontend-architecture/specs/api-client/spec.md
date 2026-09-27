## ADDED Requirements

### Requirement: Typed request helper

The frontend SHALL perform all HTTP calls through a shared client that serializes JSON, attaches the bearer token when present, forwards an `AbortSignal`, and returns typed results.

#### Scenario: Token attached

- **GIVEN** a session token exists
- **WHEN** any API request is made
- **THEN** the request carries `Authorization: Bearer <token>`

### Requirement: Normalized errors

The client SHALL convert every non-2xx response and network failure into an `ApiError` with `status`, `code`, `message` and optional `fieldErrors`. Network failures MUST use code `NETWORK_ERROR`; aborted requests MUST NOT be reported to the user.

#### Scenario: Server error

- **WHEN** the API responds 500
- **THEN** the caller receives an `ApiError` with `status: 500` and `code: 'INTERNAL_ERROR'`

#### Scenario: Unparseable body

- **WHEN** the API responds 502 with an HTML body
- **THEN** the caller receives an `ApiError` with a generic user-safe message

#### Scenario: Aborted request

- **WHEN** a request is aborted because its query was superseded
- **THEN** no error notification is shown

### Requirement: Unauthorized handling hook

The client SHALL invoke a registered `onUnauthorized` callback on any 401 response except the login request.

#### Scenario: Expired session

- **GIVEN** a registered `onUnauthorized` callback
- **WHEN** a request returns 401
- **THEN** the callback is invoked once and the error is propagated
