# ADR 0006 — Forms and validation: Zod schemas + in-house `useZodForm`

- Status: Accepted (revised during bootstrap)
- Change: bootstrap-frontend-architecture

## Context

Validation constraints and messages must be defined once and shared by the forms and the mock API. The plan was Zod + VeeValidate.

## What happened

A spike test (bootstrap task 1.4) showed that VeeValidate 4.15.1 does not understand Zod 4 schemas: `validate()` returned `valid: true` for invalid input, silently. `@vee-validate/zod` only supports Zod 3, and VeeValidate 5 (with Standard Schema support) is still in beta.

## Decision

Keep Zod 4 as the single source of validation truth. Replace VeeValidate with a small typed composable, `shared/validation/useZodForm.ts`, which provides: reactive values, per-field errors (first issue per path), touched state, validate-on-blur after first touch, validate-all on submit with focus on the first invalid field, `isDirty`, `isSubmitting`, and `setServerErrors(fieldErrors)` for 422 responses.

## Alternatives

- Downgrade to Zod 3 + `@vee-validate/zod`: older Zod and an adapter just to keep a library.
- VeeValidate 5 beta: beta dependency in a production foundation.

## Consequences

~100 lines we own and test, one fewer runtime dependency, no adapter layer. Features we do not need (field arrays, nested wizard forms) are not provided; reconsider VeeValidate 5 when stable if forms grow.
