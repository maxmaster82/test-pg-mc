# Agent instructions

Context for AI coding agents working in this repository. Humans: see `README.md`.

## Product

Ticket Management Admin Portal (Vue 3). Admins manage Events, Ticket Categories and Tickets against a mock REST API (MSW). Treat the codebase as the foundation of a production admin platform.

## Workflow (spec-driven, OpenSpec)

- Requirements live in `openspec/changes/<change>/` (proposal, specs, design, tasks) and, once archived, in `openspec/specs/`.
- Implement changes in this order: bootstrap-frontend-architecture → add-authentication-flow → add-ticket-management → add-event-and-category-management → add-bulk-ticket-operations → add-responsive-accessible-experience → add-testing-quality-and-delivery.
- Before coding a change, read its proposal, specs, design and tasks. Only tick a task when code and its tests exist and pass.
- Record meaningful decisions and corrections in `docs/AI_WORKFLOW.md`; architecture decisions in `docs/decisions/`.
- Keep `docs/REQUIREMENTS_TRACEABILITY.md` status accurate.

## Architecture rules

- `src/modules/<domain>` owns its api (repository), queries, schemas, types, components, pages.
- `src/shared` never imports from `src/modules`. Nothing outside `src/mocks` and test setup imports `src/mocks`.
- Server state: TanStack Query only. Pinia: auth, preferences, notifications, mock dev settings. Never copy server data into Pinia.
- Money is integer minor units; convert only at the form boundary. Dates are ISO 8601 strings; format with `Intl`.
- Validation constraints and messages live in Zod schemas shared by forms and mock handlers.
- Do not build generic CRUD frameworks; extract shared code only after duplication is proven.

## Quality gates

`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` must pass; E2E via `pnpm test:e2e`. Tests query by role/label and assert user-visible behavior.

## Safety

Do not commit, push or publish without explicit permission. Do not commit the assessment PDF. No secrets in the repo (demo credentials are fake and labelled as such).
