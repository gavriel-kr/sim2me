# PRD — Ticket 016: Orders: Filtering, Search & Pagination

## Background

The current admin orders page loads a hard-coded maximum of 500 orders and performs all filtering client-side. As order volume grows, this approach will:
- Slow down the page (large JS payload)
- Miss orders beyond 500 (invisible to admin)
- Lose filter state on page refresh or when sharing a URL

Additionally, the filter options are limited and don't include useful dimensions like eSIM status, archived state, or the new ABANDONED status introduced in Ticket 014.

## Goal

Server-side pagination and URL-persisted filters so the admin can efficiently find any order at any scale, and share/bookmark specific filtered views.

## User Stories

- As an admin, I want to **search by ICCID** so I can find the exact order for a customer who gives me their SIM number.
- As an admin, I want filters to **persist in the URL** so I can bookmark "all FAILED orders this month" and return to it later.
- As an admin, I want **real pagination** so I'm not limited to the first 500 orders.
- As an admin, I want to filter by **archived status** (show active only / show archived only / show all).
- As an admin, I want to filter by **ABANDONED** orders (Ticket 014).

## Functional Requirements

### Pagination
- Server-side pagination: 50 orders per page (configurable)
- URL param: `page=1`
- Navigation: Previous / Next buttons + "Page X of Y" display
- Total count shown: "Showing 51–100 of 843 orders"

### Persistent URL Filters
All filter state encoded in URL search params. Changing a filter updates the URL (no full page reload — use `router.push` / `router.replace`).

| Filter | URL param | Values |
|--------|-----------|--------|
| Search | `q` | free text |
| Status | `status` | comma-separated enum values + ABANDONED |
| Country | `country` | location code |
| Date from | `from` | ISO date string |
| Date to | `to` | ISO date string |
| Archived | `archived` | `active` (default) / `archived` / `all` |
| Page | `page` | integer |

### Extended Filter Options
- **Status**: all existing statuses + `ABANDONED` (from Ticket 014)
- **Archived**: Active only / Archived only / All (default: Active only)
- **Search**: extend to include `iccid` matching in addition to email, name, orderNo

### Search by ICCID
- Search box: if input matches ICCID pattern (numeric, 18–22 chars) → search against `iccid` field in DB
- Otherwise: existing search behavior (email, name, orderNo)

## Non-Goals
- Saved filter presets (future)
- Column sorting (future)
- Full-text search across all fields
