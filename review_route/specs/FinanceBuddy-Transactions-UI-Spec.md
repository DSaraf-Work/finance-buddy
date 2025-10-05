# FinanceBuddy — Transactions List & Edit UI (Desktop + Mobile)

**Updated:** 2025-10-04

## Goals
- Fast scan + compact density on desktop; readable cards on mobile.
- One-tap date range & sort; zero-conf fetch.
- Modal edit that respects schema; safe read-only for system/source fields.

## Header (both)
- Left: Brand + logo.
- Center: Primary nav (Dashboard, Admin, Emails, Rejected, Transactions, Reports, Settings).
- Right: Global search, account chip (gmail), Sign Out.
- Mobile: Burger → drawer with nav; search collapses to icon.

See `/assets/header.png`.

## Filters / Toolbar
- Date range picker with quick presets: **Today, 7d, 30d, This month, Custom**.
- Sort order: **Newest → Oldest** (default) or **Oldest → Newest**.
- Fetch button (debounced) calling backend with `start`, `end`, `sort`.
- Optional: keyword search against merchant/category/notes.

## Desktop List (table)
Columns (in order):
1. **Date/Time**
2. **Merchant** (primary), secondary: `Ref • Location`
3. **Category** (chip)
4. **Account** (`hint • type`)
5. **Confidence** (badge)
6. **Amount** (right-aligned; debit red, credit green)
7. **Actions** (Edit)

Density: 48–60px rows; sticky header; virtualized list when >500 rows.
Empty state and error states included.

See `/assets/desktop_list.png`.

## Mobile List (cards)
- Each card: **Merchant + Category chip + Amount** on first line.
- Second line: **Date/Time • Account hint**; confidence badge on the right.
- Third line (muted): `Ref • Location` and **Edit** button.
- Infinite scroll; filter button opens sheet with date + sort controls.

See `/assets/mobile_list.png`.

## Row interactions
- Hover reveals **Edit** on desktop; tap on mobile opens action sheet.
- Optional: expand row (⌄) to show `user_notes` and `ai_notes` preview.

## Edit Modal
Sections:
- **Primary**: amount, currency, direction, datetime, merchant (normalized), category.
- **Account**: account_hint, account_type.
- **Source**: email_row_id (link), reference_id, location.
- **Meta**: confidence (slider+input), ai_notes (read‑only), user_notes.

Read‑only: id, google_user_id, connection_id, extraction_version, created_at, updated_at.

Form affordances:
- Copy icons for UUIDs.
- Clear buttons for optional fields.
- Save, Cancel; optimistic update with toasts.

See `/assets/edit_modal.png`.

## Accessibility
- WCAG AA contrast on text and badges.
- Keyboard nav: `Tab` order; `Esc` closes modal; `Enter` saves.
- ARIA labels on all interactive controls.

## API / Data
**Request:** `/transactions?start=ISO&end=ISO&sort=asc|desc`  
**Row model:** see `/specs/component_props.json`  
**Field mapping & validation:** `/specs/sql_fields_mapping.md`

## Design tokens
See `/specs/design_tokens.json` for colors, radii, spacing, typography.

---

**Hand-off tips**
- Use a headless table (e.g., TanStack) with virtualization.
- Date picker: any lib with range + time support.
- Keep currency + direction tightly coupled for formatting and colors.