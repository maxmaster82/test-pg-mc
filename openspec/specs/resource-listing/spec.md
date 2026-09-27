# resource-listing Specification

## Purpose
TBD - created by archiving change add-ticket-management. Update Purpose after archive.
## Requirements
### Requirement: URL-synchronized list state

List pages SHALL store search, filters, sort, order, page and pageSize in the URL query string, omitting values equal to defaults. Invalid or unknown values in the URL SHALL be replaced by defaults without an error.

#### Scenario: Shareable URL

- **GIVEN** the user filtered tickets by status "On sale", sorted by price descending and went to page 3
- **WHEN** they copy the URL into a new tab
- **THEN** the same filters, sort and page are applied

#### Scenario: Back button

- **GIVEN** the user moved from page 1 to page 2
- **WHEN** they press the browser back button
- **THEN** page 1 is shown with the previous results

#### Scenario: Invalid URL values

- **WHEN** the user opens `/tickets?page=abc&status=bogus`
- **THEN** page 1 is shown with no status filter and the URL is normalized

### Requirement: Search behavior

Search SHALL be case-insensitive substring matching, debounced by 300ms, trimmed, and SHALL reset pagination to page 1. Only the most recent search result SHALL ever be displayed.

#### Scenario: Debounced search

- **WHEN** the user types "vip" quickly
- **THEN** a single request with `q=vip&page=1` is made after typing stops

#### Scenario: Out-of-order responses

- **GIVEN** a request for `q=v` is slower than a later request for `q=vip`
- **WHEN** both responses arrive
- **THEN** only results for `q=vip` are displayed

### Requirement: Filtering and sorting

Changing a filter SHALL reset to page 1. Clicking a sortable column header SHALL toggle ascending → descending; sortable headers SHALL expose `aria-sort`. A "Clear filters" action SHALL appear whenever any filter or search is active.

#### Scenario: Sort toggle

- **WHEN** the user activates the "Price" header twice
- **THEN** results are sorted ascending then descending, and the header's `aria-sort` reflects it

#### Scenario: Clear filters

- **GIVEN** a search and a status filter are active
- **WHEN** the user activates "Clear filters"
- **THEN** all filters and search are removed and page 1 is shown

### Requirement: Pagination

Lists SHALL show the range and total ("21–40 of 250"), previous/next controls, and a page-size selector (10, 20, 50). If the current page becomes empty after a deletion, the list SHALL move to the last available page.

#### Scenario: Previous results kept while loading

- **WHEN** the user moves to the next page
- **THEN** the current rows stay visible with a loading indicator until the new page arrives

#### Scenario: Last item on last page deleted

- **GIVEN** the user is on page 13 which holds a single ticket
- **WHEN** they delete it
- **THEN** page 12 is shown

### Requirement: Loading, empty and error states

Lists SHALL show a skeleton on first load, a distinct empty state for "no data yet" (with a create action) versus "no results for these filters" (with "Clear filters"), and an error state with a "Retry" action on failure.

#### Scenario: No matches

- **WHEN** a search matches nothing
- **THEN** "No tickets match your filters" and a "Clear filters" button are shown

#### Scenario: Retry after failure

- **GIVEN** the list request failed with a 500
- **WHEN** the user activates "Retry" and the API recovers
- **THEN** the list renders the data

### Requirement: Responsive list presentation

At widths below 768px, lists SHALL render each row as a card with the same data and actions instead of a table; between 768px and 1279px low-priority columns SHALL be hidden so the table fits beside the navigation. The page MUST NOT scroll horizontally at 320px width.

#### Scenario: Mobile cards

- **GIVEN** a 390px viewport
- **WHEN** the tickets list renders
- **THEN** each ticket appears as a card showing name, event, price, quantity and status with its actions menu

