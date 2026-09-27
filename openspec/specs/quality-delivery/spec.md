# quality-delivery Specification

## Purpose
TBD - created by archiving change add-testing-quality-and-delivery. Update Purpose after archive.
## Requirements
### Requirement: Single verification command

The repository SHALL provide `pnpm verify` that fails on any formatting, lint, type, unit/integration test, coverage threshold, build or E2E failure.

#### Scenario: Type error blocks verification

- **GIVEN** a type error is introduced
- **WHEN** `pnpm verify` runs
- **THEN** it exits non-zero at the typecheck step

### Requirement: E2E smoke coverage

The E2E suite SHALL cover: login failure and success, route protection redirect round trip, ticket search + filter + sort + pagination via URL, ticket create → edit → delete, referenced event delete refusal, bulk status update, one complete flow at a 390px mobile viewport, and axe checks on key pages.

#### Scenario: Smoke suite on production build

- **WHEN** `pnpm test:e2e` runs
- **THEN** it builds and previews the production bundle with mocks enabled; the full suite passes in the desktop project and the mobile journey plus authentication tests pass in the mobile project

### Requirement: Coverage thresholds

Vitest SHALL enforce minimum line coverage: 85% overall, 90% for `src/shared` and `src/mocks/db`, and 80% for `src/modules/**/{api,queries,schemas,list-params}.ts`, reported in CI.

#### Scenario: Coverage drop

- **WHEN** coverage falls below a threshold
- **THEN** `pnpm test:coverage` exits non-zero

### Requirement: Docker delivery

`docker compose up --build` SHALL serve the production app on `http://localhost:8080` from a non-root nginx container with a passing healthcheck, and `scripts/docker-smoke.sh` SHALL verify the root and a deep link return the app shell.

#### Scenario: Docker smoke

- **WHEN** the smoke script runs against a freshly built container
- **THEN** `/` and `/tickets/123` return 200 with the app's HTML and the container reports healthy

### Requirement: Documentation deliverables

`README.md` SHALL contain project overview, installation, development, Docker, build, testing commands, project structure, architecture overview, technical decisions, assumptions and trade-offs. `TECHNICAL_REVIEW.md` SHALL answer every question in the assessment. `docs/AI_WORKFLOW.md` SHALL describe context given to AI, decomposition, accepted/rejected/corrected proposals, review and validation, with concrete examples. All documentation MUST describe the actual implementation.

#### Scenario: Documentation check

- **WHEN** a reviewer follows the README commands on a clean clone
- **THEN** every command works as documented

