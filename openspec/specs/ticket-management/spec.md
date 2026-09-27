# ticket-management Specification

## Purpose
TBD - created by archiving change add-ticket-management. Update Purpose after archive.
## Requirements
### Requirement: Ticket model

A ticket SHALL have `id` (string), `name`, `price` (integer minor units), `currency` (`EUR`|`USD`|`GBP`|`CHF`), `quantity` (available inventory), `status` (`draft`|`on_sale`|`paused`|`sold_out`), `eventId`, `categoryId`, `version` (integer, incremented on every update), `createdAt` and `updatedAt` (ISO 8601).

#### Scenario: Server-managed fields

- **WHEN** a ticket is created
- **THEN** the API assigns `id`, `version: 1`, `createdAt` and `updatedAt`, ignoring any client-provided values for them

### Requirement: Ticket validation

The system SHALL enforce on the client and the mock API: name trimmed 2–120 characters; price 0.00–100,000.00 with at most 2 decimals; quantity integer 0–1,000,000; currency and status from the allowed lists; event and category required and existing.

#### Scenario: Invalid price

- **WHEN** the user enters "12.345" as the price and leaves the field
- **THEN** "Price can have at most 2 decimal places" is shown and the form cannot be submitted

#### Scenario: Server-side reference check

- **GIVEN** the selected event was deleted by someone else after the form loaded
- **WHEN** the user submits
- **THEN** the API responds 422 and the Event field shows "Selected event no longer exists"

### Requirement: Ticket list

The tickets list SHALL show name, event, category, price (formatted in its currency), quantity, status and last updated, and SHALL support search by name, filters by status, event and category, and sorting by name, price, quantity, status and updatedAt (default `updatedAt` desc).

#### Scenario: Filter by event

- **WHEN** the user selects an event in the Event filter
- **THEN** only tickets for that event are listed and the URL contains `eventId`

### Requirement: Create and edit tickets

Tickets SHALL be created at `/tickets/new` and edited at `/tickets/:id/edit` using the same form. Event selection SHALL be a searchable combobox; category a select. On success the user SHALL see a success toast and land on the ticket detail page; lists SHALL reflect the change without a manual refresh.

#### Scenario: Create ticket

- **WHEN** the user submits a valid new ticket
- **THEN** "Ticket created" is announced, the detail page is shown, and returning to the list shows the ticket

#### Scenario: Save failure keeps input

- **GIVEN** the API responds 500 on save
- **WHEN** the user submits the form
- **THEN** an error toast is shown, all entered values remain, and the submit button is enabled again

#### Scenario: Concurrent edit conflict

- **GIVEN** another administrator updated the ticket after the form was loaded
- **WHEN** the user saves
- **THEN** the API responds 409 and the user sees "This ticket was changed by someone else" with an option to reload the latest version

#### Scenario: Unsaved changes

- **GIVEN** the form has unsaved changes
- **WHEN** the user navigates away
- **THEN** a confirmation asks whether to discard the changes

### Requirement: View ticket

The ticket detail page at `/tickets/:id` SHALL show all fields including linked event and category names (as links) and timestamps, with Edit and Delete actions.

#### Scenario: Missing ticket

- **WHEN** the user opens `/tickets/does-not-exist`
- **THEN** a "Ticket not found" state with a link back to the list is shown

### Requirement: Delete ticket

Deleting a ticket SHALL require confirmation in an alert dialog naming the ticket. Cancel SHALL be the initially focused button.

#### Scenario: Confirmed delete

- **WHEN** the user confirms deletion of "VIP Pass"
- **THEN** the ticket is removed, "Ticket deleted" is announced, and it disappears from the list

#### Scenario: Cancelled delete

- **WHEN** the user presses Escape in the confirmation
- **THEN** nothing is deleted and focus returns to the control that opened the dialog

