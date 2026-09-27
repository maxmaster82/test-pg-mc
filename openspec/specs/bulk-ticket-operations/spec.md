# bulk-ticket-operations Specification

## Purpose
TBD - created by archiving change add-bulk-ticket-operations. Update Purpose after archive.
## Requirements
### Requirement: Ticket selection

The tickets list SHALL let users select tickets via a labelled checkbox per row (and per card on mobile) and a header checkbox that selects or clears all tickets on the current page (showing a mixed state when partially selected). Selection SHALL persist across page changes and SHALL be cleared when search or filters change.

#### Scenario: Select across pages

- **GIVEN** the user selected 3 tickets on page 1
- **WHEN** they go to page 2 and select 2 more
- **THEN** the bulk bar shows "5 selected"

#### Scenario: Filter change clears selection

- **GIVEN** 5 tickets are selected
- **WHEN** the user changes the status filter
- **THEN** the selection is cleared and the change is announced

### Requirement: Bulk status update

With at least one ticket selected, the system SHALL offer "Change status" to one of the ticket statuses and SHALL send a single `POST /api/tickets/bulk-status` request `{ ids, status }` (maximum 100 ids).

#### Scenario: Limit

- **WHEN** more than 100 tickets are selected
- **THEN** the "Change status" action is disabled with the explanation "Select up to 100 tickets"

### Requirement: Optimistic update and rollback

The new status SHALL be shown immediately for all selected tickets in every cached list page and detail. If the request fails entirely, all tickets SHALL revert to their previous status and an error toast SHALL be shown.

#### Scenario: Optimistic display

- **GIVEN** the API responds after 1 second
- **WHEN** the user sets 5 tickets to "Paused"
- **THEN** all 5 show "Paused" before the response arrives

#### Scenario: Total failure rollback

- **GIVEN** the API responds 500
- **WHEN** the user sets 5 tickets to "Paused"
- **THEN** all 5 show their original statuses again, "Could not update tickets. No changes were saved." is shown, and the selection is kept

### Requirement: Partial failure handling

The API SHALL return `{ updated: Ticket[], failed: { id, code, message }[] }`. A ticket with `quantity = 0` MUST NOT be set to `on_sale` (code `OUT_OF_STOCK`). Only failed tickets SHALL revert; succeeded tickets keep the new status; failed tickets SHALL remain selected and be visually marked with the reason.

#### Scenario: Partial failure

- **GIVEN** 5 selected tickets, 2 with quantity 0
- **WHEN** the user sets them to "On sale"
- **THEN** 3 tickets show "On sale", 2 revert, the message "3 of 5 tickets updated. 2 tickets could not be put on sale because they are out of stock." is announced, and only the 2 failed tickets remain selected

### Requirement: Accessible feedback

The outcome of a bulk update SHALL be announced via a live region, the bulk bar SHALL be keyboard reachable immediately after the selection controls, and the busy state SHALL be exposed with `aria-busy` on the list.

#### Scenario: Keyboard-only bulk update

- **WHEN** a keyboard user selects tickets with Space, tabs to "Change status", chooses a status and confirms with Enter
- **THEN** the update runs and its outcome is announced without moving focus away from the bulk bar

