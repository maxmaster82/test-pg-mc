## ADDED Requirements

### Requirement: Application layout

The system SHALL render authenticated pages inside a shell containing a primary navigation (Overview, Tickets, Events, Categories), a top bar with the current user menu, and a main content region with a skip link to it.

#### Scenario: Navigation reflects the current section

- **GIVEN** the user is on any page under `/tickets`
- **WHEN** the shell renders
- **THEN** the "Tickets" navigation item is marked with `aria-current="page"`

#### Scenario: Skip link

- **WHEN** a keyboard user presses Tab once after page load
- **THEN** a visible "Skip to main content" link receives focus and activating it moves focus to the main region

### Requirement: Responsive navigation

The system SHALL show a persistent sidebar at viewport widths of 1024px and above, and a toggleable navigation drawer below 1024px.

#### Scenario: Drawer on small screens

- **GIVEN** a viewport 390px wide
- **WHEN** the user activates the "Open navigation" button
- **THEN** a modal navigation drawer opens with focus inside it, and Escape closes it and returns focus to the button

#### Scenario: Drawer closes on navigation

- **GIVEN** the drawer is open
- **WHEN** the user selects a navigation item
- **THEN** the route changes and the drawer closes

### Requirement: Not-found handling

The system SHALL render a "Page not found" view with a link back to the overview for unknown routes.

#### Scenario: Unknown URL

- **WHEN** the user navigates to `/does-not-exist`
- **THEN** a "Page not found" heading and a link to the overview are displayed

### Requirement: Document title

The system SHALL set the document title to `<Page> · Ticket Admin` on every route change.

#### Scenario: Title updates

- **WHEN** the user navigates to the Events list
- **THEN** `document.title` equals `Events · Ticket Admin`
