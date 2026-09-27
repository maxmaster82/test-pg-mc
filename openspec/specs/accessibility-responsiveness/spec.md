# accessibility-responsiveness Specification

## Purpose
TBD - created by archiving change add-responsive-accessible-experience. Update Purpose after archive.
## Requirements
### Requirement: No horizontal overflow

Every page SHALL render without horizontal page scrolling at 320px, 390px, 768px, 1024px and 1440px widths; touch targets on mobile SHALL be at least 24×24 CSS px (WCAG 2.5.8), with primary controls at 44 px height.

#### Scenario: Narrow phone

- **GIVEN** a 320px wide viewport
- **WHEN** any list, detail or form page is displayed
- **THEN** `document.documentElement.scrollWidth` is not greater than the viewport width

### Requirement: Layout per breakpoint

Forms SHALL use a single column below 768px and up to two columns above; detail pages SHALL stack sections below 768px; list filters SHALL collapse into a "Filters" disclosure below 768px showing the number of active filters.

#### Scenario: Collapsed filters on mobile

- **GIVEN** a 390px viewport with two active filters
- **WHEN** the tickets list renders
- **THEN** a "Filters (2)" button is shown and expanding it reveals the filter controls

### Requirement: Keyboard operability

All functionality SHALL be operable with the keyboard alone, in a logical tab order, with a visible focus indicator meeting 3:1 contrast. Dialogs SHALL trap focus, close on Escape and restore focus to their trigger; menus SHALL support arrow keys.

#### Scenario: Full CRUD by keyboard

- **WHEN** a keyboard-only user creates, edits and deletes a ticket
- **THEN** every step is completed without a pointer and focus is never lost to `<body>`

#### Scenario: Focus after navigation

- **WHEN** a route change completes
- **THEN** focus moves to the page's `<h1>` and the new title is announced

### Requirement: Accessible content

Pages SHALL have exactly one `<h1>`, landmark regions, text contrast of at least 4.5:1 in both themes, status conveyed by text (not color alone), and no critical or serious axe violations.

#### Scenario: Automated audit

- **WHEN** the axe check runs on login, tickets list, ticket form, events list and categories list in both themes
- **THEN** it reports no critical or serious violations

### Requirement: Theme preference

The user SHALL be able to choose System, Light or Dark theme from the user menu; the choice SHALL persist across reloads and "System" SHALL follow `prefers-color-scheme` live.

#### Scenario: Persisted theme

- **WHEN** the user selects "Dark" and reloads
- **THEN** the dark theme is applied before first paint without a flash of the light theme

### Requirement: Reduced motion

When `prefers-reduced-motion: reduce` is set, the system SHALL disable non-essential transitions and animations.

#### Scenario: Reduced motion

- **GIVEN** the OS requests reduced motion
- **WHEN** the navigation drawer opens
- **THEN** it appears without a slide animation

