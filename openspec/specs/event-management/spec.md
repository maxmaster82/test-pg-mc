# event-management Specification

## Purpose
TBD - created by archiving change add-event-and-category-management. Update Purpose after archive.
## Requirements
### Requirement: Event model and validation

An event SHALL have `id`, `name` (trimmed 2–120), `country` (ISO 3166-1 alpha-2, chosen from a list and displayed by name), `venue` (trimmed 2–120), `startDate` and `endDate` (ISO 8601 date-times, entered in the user's local time zone), `status` (`draft`|`published`|`cancelled`|`completed`), `version`, `createdAt`, `updatedAt`. `endDate` MUST be on or after `startDate`.

#### Scenario: End before start

- **WHEN** the user sets an end date earlier than the start date
- **THEN** the End date field shows "End date must be on or after the start date" and submission is blocked

### Requirement: Event list

The events list SHALL show name, venue, country, start date, status and ticket count; search SHALL match name or venue; filters SHALL cover status and country; sorting SHALL cover name, startDate and status (default `startDate` asc).

#### Scenario: Filter by country

- **WHEN** the user selects "France" in the Country filter
- **THEN** only events with `country = FR` are shown and the URL contains `country=FR`

### Requirement: Event CRUD

The system SHALL support creating, viewing, editing and deleting events with the same feedback, conflict and unsaved-changes behavior as tickets.

#### Scenario: Rename propagates

- **GIVEN** event "Summer Fest" has tickets
- **WHEN** the user renames it to "Summer Fest 2027"
- **THEN** the tickets list shows "Summer Fest 2027" for those tickets without a manual reload

### Requirement: Event deletion integrity

Deleting an event that has tickets SHALL be refused by the API with 409 `CONFLICT` including the ticket count. The UI SHALL explain why and link to the event's tickets. Events without tickets SHALL be deletable after confirmation.

#### Scenario: Delete referenced event

- **GIVEN** event "Summer Fest" has 12 tickets
- **WHEN** the user confirms deletion
- **THEN** the event is kept and the message "Summer Fest has 12 tickets. Delete or move them before deleting the event." is shown with a "View tickets" link to `/tickets?eventId=<id>`

#### Scenario: Delete unreferenced event

- **GIVEN** an event with no tickets
- **WHEN** the user confirms deletion
- **THEN** the event is removed and "Event deleted" is announced

