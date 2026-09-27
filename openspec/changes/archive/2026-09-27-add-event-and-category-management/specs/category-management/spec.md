## ADDED Requirements

### Requirement: Category model and validation

A category SHALL have `id`, `name` (trimmed 2–60, unique case-insensitively), `description` (optional, max 500), `version`, `createdAt`, `updatedAt`.

#### Scenario: Duplicate name

- **GIVEN** a category "VIP" exists
- **WHEN** the user creates a category named "vip"
- **THEN** the API responds 422 and the Name field shows "A category with this name already exists"

### Requirement: Category list

The categories list SHALL show name, description (truncated), ticket count and last updated; search SHALL match name or description; sorting SHALL cover name and updatedAt (default name asc).

#### Scenario: Search description

- **WHEN** the user searches "backstage"
- **THEN** categories whose name or description contains "backstage" (any case) are listed

### Requirement: Category CRUD

The system SHALL support creating, viewing, editing and deleting categories with the same feedback, conflict and unsaved-changes behavior as tickets.

#### Scenario: Create category

- **WHEN** the user submits a valid new category
- **THEN** "Category created" is announced and it appears in the category list and in the ticket form's category select

### Requirement: Category deletion integrity

Deleting a category that has tickets SHALL be refused with 409 `CONFLICT` and an explanation linking to `/tickets?categoryId=<id>`; unreferenced categories SHALL be deletable after confirmation.

#### Scenario: Delete referenced category

- **GIVEN** category "General Admission" has 40 tickets
- **WHEN** the user confirms deletion
- **THEN** the category is kept and the user is told it has 40 tickets, with a "View tickets" link
