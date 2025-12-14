# Airbnb Design Language Migration Plan

## Overview
This document outlines the comprehensive migration from the current Purple + Slate Gray dark theme to Airbnb's clean, minimal design language.

## Current Design System Analysis

### Current Color Palette (Purple + Slate Gray)
- **Backgrounds:**
  - Main: `#0A0B0D`
  - Card: `#15161A`
  - Panel: `#1E2026`
  - Border: `#2A2C35`

- **Text:**
  - Primary: `#F0F1F5`
  - Secondary: `#B2B4C2`
  - Disabled: `#6F7280`

- **Accents:**
  - Purple Primary: `#5D5FEF`
  - Purple Accent: `#888BFF`
  - Green Positive: `#4ECF9E`
  - Red Negative: `#F45C63`
  - Blue Neutral: `#6C85FF`

### Current Typography
- Font: System fonts (system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- Base size: 16px
- Line height: 1.6

### Current Spacing
- Uses Tailwind default spacing (4px base)
- Custom spacing in some components

### Current Components
- Dark theme cards with borders
- Gradient buttons
- Custom input fields
- Status badges with colored backgrounds

---

## Airbnb Design System Specification

### Color Palette

#### Primary Colors
- **Airbnb Red/Pink:** `#FF5A5F` (Primary action, links, errors)
- **Airbnb Teal:** `#00A699` (Secondary actions, success states)
- **Airbnb Dark Teal:** `#008489` (Hover states, emphasis)

#### Neutral Colors
- **Background White:** `#FFFFFF` (Main background)
- **Background Light:** `#F7F7F7` (Secondary backgrounds, cards)
- **Background Hover:** `#F0F0F0` (Hover states)
- **Text Primary:** `#222222` (Main text)
- **Text Secondary:** `#717171` (Secondary text, labels)
- **Text Tertiary:** `#B0B0B0` (Disabled, placeholder)
- **Border Light:** `#DDDDDD` (Borders, dividers)
- **Border Medium:** `#C4C4C4` (Active borders)

#### Semantic Colors
- **Success:** `#00A699` (Teal)
- **Error:** `#FF5A5F` (Red)
- **Warning:** `#FFB400` (Amber/Yellow)
- **Info:** `#00A699` (Teal)

### Typography

#### Font Family
- **Primary:** `Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Fallback:** System fonts if Circular not available

#### Font Sizes
- **Display Large:** 32px (2rem) - Hero headings
- **Display Medium:** 24px (1.5rem) - Page titles
- **Heading Large:** 22px (1.375rem) - Section headings
- **Heading Medium:** 18px (1.125rem) - Subsection headings
- **Body Large:** 16px (1rem) - Body text
- **Body Medium:** 14px (0.875rem) - Secondary text
- **Body Small:** 12px (0.75rem) - Labels, captions

#### Font Weights
- **Bold:** 700 - Headings, emphasis
- **Semibold:** 600 - Subheadings
- **Medium:** 500 - Buttons, labels
- **Regular:** 400 - Body text
- **Light:** 300 - Large display text

#### Line Heights
- **Tight:** 1.2 - Headings
- **Normal:** 1.5 - Body text
- **Relaxed:** 1.6 - Long-form content

### Spacing System (8px Base)

- **0:** 0px
- **1:** 4px (0.25rem)
- **2:** 8px (0.5rem)
- **3:** 12px (0.75rem)
- **4:** 16px (1rem)
- **5:** 20px (1.25rem)
- **6:** 24px (1.5rem)
- **8:** 32px (2rem)
- **10:** 40px (2.5rem)
- **12:** 48px (3rem)
- **16:** 64px (4rem)

### Border Radius

- **None:** 0px
- **Small:** 4px (0.25rem)
- **Medium:** 8px (0.5rem) - Default
- **Large:** 12px (0.75rem) - Cards
- **XLarge:** 16px (1rem) - Large cards
- **Full:** 9999px (Pills, badges)

### Shadows

- **None:** No shadow
- **Small:** `0 1px 2px rgba(0, 0, 0, 0.05)`
- **Medium:** `0 2px 4px rgba(0, 0, 0, 0.1)`
- **Large:** `0 4px 8px rgba(0, 0, 0, 0.1)`
- **XLarge:** `0 8px 16px rgba(0, 0, 0, 0.1)`

### Component Patterns

#### Buttons

**Primary Button:**
- Background: `#FF5A5F`
- Text: White
- Hover: Darker red `#E04A4F`
- Border radius: 8px
- Padding: 12px 24px
- Font: 16px, Medium weight

**Secondary Button:**
- Background: White
- Text: `#222222`
- Border: `#DDDDDD`
- Hover: `#F7F7F7`
- Border radius: 8px
- Padding: 12px 24px

**Text Button:**
- Background: Transparent
- Text: `#FF5A5F`
- Hover: `#F7F7F7`
- No border
- Padding: 12px 16px

#### Cards

- Background: White
- Border: `#DDDDDD` (1px)
- Border radius: 12px
- Padding: 24px
- Shadow: Medium
- Hover: Slight elevation increase

#### Input Fields

- Background: White
- Border: `#DDDDDD`
- Border radius: 8px
- Padding: 12px 16px
- Focus: Border `#FF5A5F`, ring `rgba(255, 90, 95, 0.1)`
- Placeholder: `#B0B0B0`

#### Status Badges

- **Success:** Background `#00A699` with 10% opacity, text `#00A699`, border `#00A699` with 30% opacity
- **Error:** Background `#FF5A5F` with 10% opacity, text `#FF5A5F`, border `#FF5A5F` with 30% opacity
- **Warning:** Background `#FFB400` with 10% opacity, text `#FFB400`, border `#FFB400` with 30% opacity
- **Info:** Background `#00A699` with 10% opacity, text `#00A699`, border `#00A699` with 30% opacity

---

## Migration Phases

### Phase 1: Research & Planning ✅
- [x] Document current design system
- [x] Create Airbnb design system specification
- [x] Create migration plan

### Phase 2: Design Tokens
- [ ] Update Tailwind config with Airbnb colors
- [ ] Add Airbnb typography system
- [ ] Configure spacing system
- [ ] Add border radius tokens
- [ ] Add shadow tokens
- [ ] Update global CSS

### Phase 3: Core Components
- [ ] Update Layout component
- [ ] Create/update Button components
- [ ] Update Input components
- [ ] Update Card components
- [ ] Update Badge components

### Phase 4: Transaction Components
- [ ] Update TransactionCard
- [ ] Update TransactionStats
- [ ] Update TransactionFilters
- [ ] Update TransactionRow
- [ ] Update TransactionModal
- [ ] Update TransactionSkeleton
- [ ] Update TransactionEmptyState

### Phase 5: Page Components
- [ ] Update transactions page
- [ ] Update emails page
- [ ] Update admin pages
- [ ] Update settings pages
- [ ] Update auth pages
- [ ] Update review route page

### Phase 6: Forms & Modals
- [ ] Update all forms
- [ ] Update all modals
- [ ] Update dropdowns/menus
- [ ] Update notification components
- [ ] Update manager components

### Phase 7: Testing & Validation
- [ ] Build and check for compile errors
- [ ] Test with Playwright MCP (mobile viewport first)
- [ ] Test all user flows
- [ ] Fix any issues
- [ ] Deploy with Vercel MCP
- [ ] Test production environment
- [ ] Final validation

---

## Key Migration Principles

1. **Maintain Functionality:** All existing features must continue to work
2. **Mobile-First:** Maintain mobile-first approach
3. **Accessibility:** Preserve all accessibility features
4. **Performance:** No performance degradation
5. **Progressive Enhancement:** Update components systematically
6. **Testing:** Test each phase before moving to next

---

## Color Mapping Reference

| Current Color | Airbnb Color | Usage |
|--------------|-------------|-------|
| `#5D5FEF` (Purple Primary) | `#FF5A5F` (Red) | Primary actions, links |
| `#888BFF` (Purple Accent) | `#00A699` (Teal) | Secondary actions |
| `#4ECF9E` (Green) | `#00A699` (Teal) | Success states |
| `#F45C63` (Red) | `#FF5A5F` (Red) | Error states |
| `#6C85FF` (Blue) | `#00A699` (Teal) | Info states |
| `#0A0B0D` (Dark BG) | `#FFFFFF` (White) | Main background |
| `#15161A` (Card BG) | `#F7F7F7` (Light Gray) | Card backgrounds |
| `#F0F1F5` (Text Primary) | `#222222` (Dark) | Primary text |
| `#B2B4C2` (Text Secondary) | `#717171` (Gray) | Secondary text |
| `#2A2C35` (Border) | `#DDDDDD` (Light Gray) | Borders |

---

## Notes

- This migration changes from dark theme to light theme
- All components need to be updated to use new color palette
- Typography will use Circular font family (with system fallbacks)
- Spacing system remains 8px base (compatible with Tailwind)
- Border radius increases for more modern look
- Shadows become more subtle
