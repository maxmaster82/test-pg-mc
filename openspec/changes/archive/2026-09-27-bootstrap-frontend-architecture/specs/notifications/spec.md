## ADDED Requirements

### Requirement: Toast notifications

The system SHALL display success, error and info toasts in a fixed region. Success and info toasts SHALL auto-dismiss after 5 seconds; error toasts SHALL remain until dismissed. Every toast SHALL have a close button.

#### Scenario: Success toast

- **WHEN** a feature calls `notify.success('Ticket created')`
- **THEN** a toast with that text appears and disappears after 5 seconds

#### Scenario: Error toast persists

- **WHEN** a feature calls `notify.error('Could not delete event')`
- **THEN** the toast stays visible until the user dismisses it

### Requirement: Accessible announcements

Toasts SHALL be announced by assistive technology: success/info politely, errors assertively, and SHALL NOT steal focus. Auto-dismiss SHALL pause while the toast is hovered or focused.

#### Scenario: Screen reader announcement

- **WHEN** an error toast appears
- **THEN** it is rendered inside a live region with `aria-live="assertive"` and focus stays on the current element

### Requirement: Deduplication and limit

The system SHALL show at most 3 toasts at once and SHALL NOT stack identical messages shown within 2 seconds.

#### Scenario: Repeated error

- **WHEN** the same error message is raised twice within 2 seconds
- **THEN** only one toast is visible
