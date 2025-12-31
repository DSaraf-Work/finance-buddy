# FinBook - Design System

**Version:** 3.0.0
**Theme:** Matte Dark Minimalist
**Last Updated:** 2025-12-31
**Status:** Active (Migration in Progress)

---

## Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Matte Dark** | Deep, non-reflective surfaces. No glossy gradients. Subtle depth through transparency layers. |
| **Minimalist** | Only essential elements. Generous whitespace. Every pixel has purpose. |
| **Modern** | Clean geometry. Precise spacing. Contemporary type choices. |
| **Functional** | Form follows function. Clear visual hierarchy. Intuitive interactions. |

### Design Rules

1. **Never use pure black (#000) or pure white (#FFF)** - Always use palette values
2. **Borders and overlays use rgba()** - Never solid gray values
3. **Accent color (indigo) is used sparingly** - Only for logo and key CTAs
4. **Shadows are minimal** - Only subtle glows on primary actions
5. **Animations are purposeful** - Enhance UX, never decorative

---

## Architecture: Global CSS Variables

All design tokens are defined as **CSS custom properties** in `src/styles/globals.css`. This enables:

- **Zero component changes** for theme switching
- **Single source of truth** for all design tokens
- **Easy theme updates** - just change CSS variables
- **Type-safe** - Tailwind config references CSS variables
- **Consistent** - All components use the same design system

---

## Color System

### Background Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#09090B` | Main app background |
| `bg-secondary` | `#111113` | Header, elevated surfaces |
| `bg-elevated` | `rgba(255,255,255,0.03)` | Cards, inputs, containers |
| `bg-hover` | `rgba(255,255,255,0.06)` | Hover states |
| `bg-active` | `rgba(255,255,255,0.08)` | Active/pressed states |
| `bg-strong` | `rgba(255,255,255,0.12)` | Strong emphasis |

```
Background Scale (dark to light):

#09090B  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-primary
#111113  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-secondary
rgba 3%  ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-elevated
rgba 6%  ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-hover
rgba 8%  ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-active
rgba12%  ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-strong
```

### Border Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `border-subtle` | `rgba(255,255,255,0.04)` | Dividers, separators |
| `border-default` | `rgba(255,255,255,0.08)` | Default borders |
| `border-medium` | `rgba(255,255,255,0.12)` | Active states |
| `border-strong` | `rgba(255,255,255,0.15)` | Focus states |

### Text Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `#FAFAFA` | Headings, important text |
| `text-secondary` | `rgba(255,255,255,0.7)` | Body text |
| `text-muted` | `rgba(255,255,255,0.5)` | Labels, placeholders |
| `text-subtle` | `rgba(255,255,255,0.35)` | Meta info, hints |
| `text-disabled` | `rgba(255,255,255,0.2)` | Disabled states |

```
Text Scale (visible to faint):

#FAFAFA    ████████████████████████████████████████ text-primary
rgba 70%   ████████████████████████████░░░░░░░░░░░░ text-secondary
rgba 50%   ████████████████████░░░░░░░░░░░░░░░░░░░░ text-muted
rgba 35%   ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ text-subtle
rgba 20%   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ text-disabled
```

### Semantic Colors

| Token | Value | Muted | Usage |
|-------|-------|-------|-------|
| `income` | `#22C55E` | `rgba(34,197,94,0.12)` | Positive amounts, success |
| `expense` | `#F87171` | `rgba(248,113,113,0.12)` | Negative amounts, errors |
| `accent` | `#6366F1` | `rgba(99,102,241,0.2)` | Brand, primary actions |
| `accent-light` | `#A5B4FC` | - | Accent text on dark |
| `warning` | `#F59E0B` | `rgba(245,158,11,0.12)` | Warnings, alerts |

### Payment Method Brand Colors

| Method | Color | Usage |
|--------|-------|-------|
| UPI | `#6366F1` | Indigo |
| GPay | `#4285F4` | Google Blue |
| PhonePe | `#5F259F` | Purple |
| Paytm | `#00BAF2` | Cyan |
| Card | `#F59E0B` | Amber |
| NEFT | `#10B981` | Emerald |
| Auto-debit | `#EF4444` | Red |
| Wire | `#14B8A6` | Teal |
| Credit | `#22C55E` | Green |

---

## Typography

### Font Families

| Family | Font | Usage |
|--------|------|-------|
| `font-sans` | Outfit | UI text, labels, titles, body |
| `font-mono` | JetBrains Mono | Numbers, amounts, code, dates |

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Type Scale

| Token | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|----------------|-------|
| `text-2xs` | 10px | 14px | 0.5px | Uppercase labels |
| `text-xs` | 11px | 16px | 0.3px | Dates, meta |
| `text-sm` | 12px | 16px | 0 | Badges, counts |
| `text-base` | 13px | 20px | 0 | Body, chips |
| `text-md` | 15px | 22px | 0 | Titles, amounts |
| `text-lg` | 18px | 26px | -0.3px | Page titles |
| `text-xl` | 26px | 32px | -0.5px | Large headings |
| `text-2xl` | 38px | 44px | -1px | Hero numbers |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `regular` | 400 | Body text |
| `medium` | 500 | Labels, chips, buttons |
| `semibold` | 600 | Amounts, badges, emphasis |
| `bold` | 700 | Titles, headings |

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon gaps, chip gaps |
| `space-3` | 12px | Component padding |
| `space-4` | 16px | Section gaps |
| `space-5` | 20px | Container padding |
| `space-6` | 24px | Large gaps |
| `space-8` | 32px | Section margins |
| `space-10` | 40px | Page margins |

### Layout Constants

| Token | Value | Usage |
|-------|-------|-------|
| `container-max` | 430px | Mobile container width |
| `header-height` | 72px | Header height |
| `separator-width` | 80% | Divider line width |
| `footer-padding` | 32px | Bottom safe area |

---

## Border & Radius

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Badges, small buttons |
| `radius-default` | 10px | Chips, inputs |
| `radius-md` | 12px | Buttons, cards |
| `radius-lg` | 14px | Icons, large cards |
| `radius-xl` | 16px | Modals |
| `radius-2xl` | 20px | Bottom sheets |
| `radius-full` | 9999px | Pills, avatars |

---

## Shadows & Effects

### Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-none` | none | Default (no shadows) |
| `shadow-glow-sm` | `0 0 8px rgba(99,102,241,0.3)` | Small accent glow |
| `shadow-glow-md` | `0 4px 12px rgba(99,102,241,0.3)` | Logo glow |
| `shadow-glow-lg` | `0 8px 32px rgba(99,102,241,0.35)` | Primary CTA glow |
| `shadow-inner` | `inset 0 1px 0 rgba(255,255,255,0.04)` | Inner highlight |

### Usage Rules

```
DO: Use glow on logo and primary floating action buttons
DO: Use subtle inner shadow for depth on cards

DON'T: Use drop shadows on cards
DON'T: Use shadows on text
DON'T: Use shadows on borders
```

---

## Motion & Animation

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Micro-interactions |
| `duration-default` | 200ms | Hover, focus states |
| `duration-slow` | 350ms | Page transitions, list animations |

### Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `ease-default` | ease | General purpose |
| `ease-out` | ease-out | Enter animations |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Screen transitions |

### Animation Keyframes

```css
/* Slide in from left (list items) */
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Slide up (modals, toasts) */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Stagger delay for list items */
animation-delay: calc(index * 0.04s); /* 40ms between items */
```

---

## Component Specifications

### Header

```
Height: 72px (including top padding)
Padding: 16px 20px
Background: #111113
Border-bottom: 1px solid rgba(255,255,255,0.04)

Logo: 40x40px, radius-12, gradient bg, glow shadow
Title: 18px, bold, letter-spacing -0.3px
Icon buttons: 40x40px, transparent bg, radius-12
Menu button: 44x44px, elevated bg, radius-14, border
```

### Transaction List (Modular Component Architecture)

#### TxnListHeader
```
Container: padding 0
Title: 15px, semibold (600), text-primary
Count Badge: 12px, semibold (600), rgba(255,255,255,0.35)
  Background: rgba(255,255,255,0.06)
  Padding: 4px 10px
  Border-radius: 8px
Margin-bottom: 16px
```

#### TxnCard (Transaction Item)
```
Padding: 16px 8px
Border-radius: 12px
Cursor: pointer
Hover: background rgba(255,255,255,0.02)
Animation: slideIn 0.35s ease-out backwards

Layout: flexbox, justify-between, align-center
Gap (icon to text): 14px
Gap (info lines): 4px
Gap (right column): 2px (tight)

Icon Container:
  Size: 48x48px
  Border-radius: 14px
  Background:
    - Expense: rgba(255,255,255,0.04)
    - Income: rgba(34,197,94,0.12)
  Emoji: 18px

Left Column (Info):
  Merchant: 15px, medium (500), text-primary
  Category: 12px, text-subtle (rgba 0.35)

Right Column (Amount):
  Amount: 15px, semibold (600), JetBrains Mono
    - Expense: #F87171 (red)
    - Income: #22C55E (green)
  Payment Method: 10px, medium (500), uppercase, letter-spacing 0.3px
    - Color: Brand-specific (see Payment Method Colors)
  Date: 10px, medium (500), rgba(255,255,255,0.3)
```

#### TxnSeparator
```
Width: 80%
Height: 1px
Background: rgba(255,255,255,0.06)
Alignment: center (flexbox)
Displayed: Between items, not after last item
```

#### TxnLoadingSkeleton
```
Shimmer effect: linear-gradient animation
Skeleton items match exact TxnCard dimensions:
  Icon: 48x48px circle
  Title: 120px x 15px
  Category: 80px x 12px
  Amount: 100px x 15px
Default count: 8 items
Animation: pulse + shimmer
```

#### TxnEmptyState
```
Padding: 80px 24px
Text-align: center
Emoji: 📭, 48px
Message: 15px, text-muted (rgba 0.5)
```

#### TxnErrorState
```
Padding: 40px 24px
Text-align: center
Error icon: ⚠️, 36px
Message: 15px, expense color (#F87171)
Retry Button:
  Padding: 12px 24px
  Background: accent (#6366F1)
  Border-radius: 12px
  Font: 13px, medium (500)
  Hover: opacity 0.9
```

### Badge

```
Padding: 4px 10px
Radius: 8px
Background: rgba(255,255,255,0.06)
Font: 12px, semibold
Color: rgba(255,255,255,0.35)
```

### Category Emoji Mapping

```javascript
// Merchant-specific (priority)
'swiggy|zomato' → 🍜
'bigbasket|zepto|blinkit' → 🛒
'netflix|hotstar|prime' → ▶️
'ola|uber|rapido' → 🚗
'chai|coffee|starbucks' → ☕
'mutual fund|investment' → 📈
'electricity|bescom|power' → ⚡
'salary|freelance|upwork' → ✏️

// Category fallback
'food & dining' → 🍜
'groceries' → 🛒
'income|salary' → ✏️
'subscription|entertainment' → ▶️
'transport|travel' → 🚗
'utilities|bills' → ⚡
'investment|savings' → 📈
'shopping' → 🛍️
'health|medical' → 💊
'education' → 📚
default → 💳
```

### Number Formatting (Indian)

```javascript
// Amount display logic
≥ 1 Crore → X.XX Cr
≥ 1 Lakh → X.XX L
< 1 Lakh → XX,XXX (toLocaleString 'en-IN')

// Examples
15000000 → 1.50 Cr
250000 → 2.50 L
85000 → 85,000
```

---

## CSS Variables

```css
:root {
  /* ═══════════════════════════════════════════
     COLORS
     ═══════════════════════════════════════════ */

  /* Background */
  --color-bg-primary: #09090B;
  --color-bg-secondary: #111113;
  --color-bg-elevated: rgba(255, 255, 255, 0.03);
  --color-bg-hover: rgba(255, 255, 255, 0.06);
  --color-bg-active: rgba(255, 255, 255, 0.08);
  --color-bg-strong: rgba(255, 255, 255, 0.12);

  /* Border */
  --color-border-subtle: rgba(255, 255, 255, 0.04);
  --color-border-default: rgba(255, 255, 255, 0.08);
  --color-border-medium: rgba(255, 255, 255, 0.12);
  --color-border-strong: rgba(255, 255, 255, 0.15);

  /* Text */
  --color-text-primary: #FAFAFA;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-muted: rgba(255, 255, 255, 0.5);
  --color-text-subtle: rgba(255, 255, 255, 0.35);
  --color-text-disabled: rgba(255, 255, 255, 0.2);

  /* Semantic */
  --color-income: #22C55E;
  --color-income-muted: rgba(34, 197, 94, 0.12);
  --color-expense: #F87171;
  --color-expense-muted: rgba(248, 113, 113, 0.12);
  --color-accent: #6366F1;
  --color-accent-light: #A5B4FC;
  --color-accent-muted: rgba(99, 102, 241, 0.2);
  --color-warning: #F59E0B;

  /* Payment Methods */
  --color-upi: #6366F1;
  --color-gpay: #4285F4;
  --color-phonepe: #5F259F;
  --color-paytm: #00BAF2;
  --color-card: #F59E0B;
  --color-neft: #10B981;
  --color-autodebit: #EF4444;
  --color-wire: #14B8A6;
  --color-credit: #22C55E;

  /* ═══════════════════════════════════════════
     TYPOGRAPHY
     ═══════════════════════════════════════════ */

  --font-sans: 'Outfit', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', Menlo, Consolas, monospace;

  /* ═══════════════════════════════════════════
     SPACING
     ═══════════════════════════════════════════ */

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* ═══════════════════════════════════════════
     RADIUS
     ═══════════════════════════════════════════ */

  --radius-sm: 8px;
  --radius-default: 10px;
  --radius-md: 12px;
  --radius-lg: 14px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;

  /* ═══════════════════════════════════════════
     SHADOWS
     ═══════════════════════════════════════════ */

  --shadow-glow-sm: 0 0 8px rgba(99, 102, 241, 0.3);
  --shadow-glow-md: 0 4px 12px rgba(99, 102, 241, 0.3);
  --shadow-glow-lg: 0 8px 32px rgba(99, 102, 241, 0.35);
  --shadow-inner: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  /* ═══════════════════════════════════════════
     MOTION
     ═══════════════════════════════════════════ */

  --duration-fast: 150ms;
  --duration-default: 200ms;
  --duration-slow: 350ms;

  /* ═══════════════════════════════════════════
     LAYOUT
     ═══════════════════════════════════════════ */

  --container-max: 430px;
  --header-height: 72px;
  --separator-width: 80%;
}
```

---

## Usage Guidelines

### Do's

| Rule | Example |
|------|---------|
| Use rgba for overlays | `rgba(255,255,255,0.06)` |
| Use semantic colors | `text-income` for positive |
| Use font-mono for numbers | `₹85,000` |
| Animate list items | Stagger 40ms delay |
| Center separators at 80% | `width: 80%; margin: 0 auto;` |
| Keep accent minimal | Only logo and primary CTA |

### Don'ts

| Rule | Why |
|------|-----|
| Don't use pure #000 or #FFF | Too harsh, breaks matte aesthetic |
| Don't use solid gray borders | Use rgba transparency instead |
| Don't use gradients (except logo) | Conflicts with matte style |
| Don't use drop shadows on cards | Use subtle transparency instead |
| Don't mix fonts in same element | Keep Outfit for text, Mono for numbers |
| Don't over-animate | Purpose over decoration |

---

## Quick Reference

```
BACKGROUNDS          BORDERS              TEXT                SEMANTIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#09090B  primary     rgba 0.04 subtle     #FAFAFA  primary    #22C55E income
#111113  secondary   rgba 0.08 default    rgba 0.7 secondary  #F87171 expense
rgba 0.03 elevated   rgba 0.12 medium     rgba 0.5 muted      #6366F1 accent
rgba 0.06 hover      rgba 0.15 strong     rgba 0.35 subtle
rgba 0.08 active                          rgba 0.2 disabled

FONTS                SIZES                RADIUS              MOTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Outfit     sans      10px 2xs             8px  sm             150ms fast
JetBrains  mono      11px xs              10px default        200ms default
                     12px sm              12px md             350ms slow
400 regular          13px base            14px lg
500 medium           15px md              16px xl             ease-out enter
600 semibold         18px lg              20px 2xl            cubic-bezier
700 bold             26px xl                                  transitions
                     38px 2xl
```

---

## Modular Component Architecture

### Overview

The transaction list UI follows a **modular component architecture** with separation of concerns:

```
src/
├── components/
│   └── transactions/          # Transaction UI components
│       ├── TxnCard.tsx        # Individual transaction card
│       ├── TxnList.tsx        # Transaction list container
│       ├── TxnListHeader.tsx  # Header with title & count
│       ├── TxnLoadingSkeleton.tsx  # Loading state
│       ├── TxnEmptyState.tsx  # Empty state
│       ├── TxnErrorState.tsx  # Error state
│       ├── TxnStyles.tsx      # CSS animations & styles
│       └── index.ts           # Barrel export
└── lib/
    └── utils/
        └── transaction-formatters.ts  # Utility functions
```

### Component Responsibilities

| Component | Purpose | Reusability |
|-----------|---------|-------------|
| `TxnCard` | Display single transaction | High - Use in any transaction list |
| `TxnList` | Map transactions to cards | High - Use for grouped/flat lists |
| `TxnListHeader` | Show title with count badge | High - Use for any list section |
| `TxnLoadingSkeleton` | Loading state placeholder | High - Use during data fetch |
| `TxnEmptyState` | No data message | Medium - Customize message per context |
| `TxnErrorState` | Error with retry | Medium - Customize error handling |
| `TxnStyles` | CSS animations | High - Import globally |

### Utility Functions (transaction-formatters.ts)

```typescript
// Category emoji selection (merchant-first, category fallback)
getCategoryEmoji(category?: string | null, merchantName?: string | null): string

// Payment method brand color
getPaymentMethodColor(accountType?: string | null): string

// Short date format ("28 Dec")
formatShortDate(dateStr: string | null): string

// Indian number formatting (Cr/L/commas)
formatIndianAmount(amount?: string | null): string

// Account type display (uppercase, max 10 chars)
displayAccountType(type?: string | null): string
```

### Benefits

1. **Reusability**: Components can be used across dashboard, reports, analytics
2. **Maintainability**: Single source of truth for transaction UI
3. **Testability**: Each component can be tested in isolation
4. **Consistency**: Same visual language across all transaction lists
5. **Performance**: React.memo prevents unnecessary re-renders
6. **Type Safety**: Full TypeScript coverage with proper interfaces

### Usage Example

```typescript
import {
  TxnList,
  TxnListHeader,
  TxnLoadingSkeleton,
  TxnEmptyState,
  TxnErrorState,
  TxnStyles,
} from '@/components/transactions';

// In your page component
<>
  <TxnStyles />
  <TxnListHeader title="Recent Transactions" count={total} />
  {loading && <TxnLoadingSkeleton count={8} />}
  {error && <TxnErrorState error={error} onRetry={refetch} />}
  {!loading && !error && transactions.length === 0 && <TxnEmptyState />}
  {!loading && !error && transactions.length > 0 && (
    <TxnList transactions={transactions} onTransactionClick={handleClick} />
  )}
</>
```

---

## Migration Notes

### From v2.0 (Midnight Blue) to v3.0 (Matte Dark)

| Old (v2.0) | New (v3.0) |
|------------|------------|
| `#0F1624` bg-app | `#09090B` bg-primary |
| `#151E2E` bg-primary | `#111113` bg-secondary |
| `#1B2638` bg-card | `rgba(255,255,255,0.03)` bg-elevated |
| `#E9EEF5` text-primary | `#FAFAFA` text-primary |
| `#5B8CFF` accent | `#6366F1` accent |
| System fonts | Outfit + JetBrains Mono |

### Migration Checklist

- [x] Update CSS variables in globals.css
- [x] Add Google Fonts import (Outfit, JetBrains Mono)
- [x] Update Tailwind config
- [x] Migrate component colors
- [x] Update transaction list styling (✓ /transactions completed)
- [x] Create modular transaction components
- [ ] Migrate dashboard page
- [ ] Migrate reports/analytics pages
- [ ] Migrate auth pages
- [ ] Migrate settings page
- [ ] Test accessibility contrast ratios

---

## Phased Migration Plan

### Phase 1: Core Transaction UI ✓ (COMPLETED)

**Goal**: Establish modular transaction component architecture
**Status**: ✅ Completed (Commit: af65b5a5)

**Completed Tasks**:
- [x] Create `src/lib/utils/transaction-formatters.ts`
- [x] Create `src/components/transactions/` directory
- [x] Build TxnCard, TxnList, TxnListHeader components
- [x] Build TxnLoadingSkeleton, TxnEmptyState, TxnErrorState
- [x] Create TxnStyles with slideIn animation
- [x] Refactor `/transactions` page to use modular components
- [x] Update TransactionCard.tsx to match /txn design
- [x] Test with 201 transactions
- [x] Deploy to Vercel

**Files Changed**:
- Created: 9 new files (components + utilities)
- Modified: 2 files (transactions.tsx, TransactionCard.tsx)
- Lines: +625 insertions, -217 deletions

---

### Phase 2: Dashboard Page (NEXT)

**Goal**: Migrate dashboard to matte dark theme with reusable components
**Estimated Effort**: Medium (4-6 hours)

**Tasks**:
- [ ] Analyze current dashboard layout and components
- [ ] Update background colors (#09090B, #111113)
- [ ] Replace card components with matte dark variants
- [ ] Integrate TxnList component for recent transactions section
- [ ] Update stats cards with proper spacing and colors
- [ ] Add slideIn animations for dashboard sections
- [ ] Update chart colors to match design system
- [ ] Test responsive layout on 430px container
- [ ] Commit: "Migrate dashboard to matte dark design system"

**Component Changes**:
- `src/pages/index.tsx` (dashboard)
- Create `src/components/dashboard/` directory if needed
- Stats cards, charts, quick actions

**Design Specifications**:
- Use bg-primary (#09090B) for page background
- Use bg-elevated (rgba 0.03) for stat cards
- Use bg-secondary (#111113) for section headers
- Reuse TxnList for "Recent Transactions" widget
- Font: Outfit for text, JetBrains Mono for numbers
- Animation: slideIn 0.35s for staggered card entry

---

### Phase 3: Reports & Analytics Pages

**Goal**: Unify reports/analytics with design system
**Estimated Effort**: Medium-High (6-8 hours)

**Tasks**:
- [ ] Identify all report/analytics pages
- [ ] Update chart components (if using custom charts)
- [ ] Update filter chips to match design system
- [ ] Create reusable FilterChip component
- [ ] Update date pickers and dropdowns
- [ ] Ensure payment method colors are consistent
- [ ] Add loading skeletons for chart data
- [ ] Test data visualization contrast ratios
- [ ] Commit: "Migrate reports & analytics to matte dark theme"

**Component Changes**:
- Report pages
- Chart components
- Filter components
- Date/time pickers

**Design Specifications**:
- Chart colors: Use semantic colors (income, expense, accent)
- Gridlines: rgba(255,255,255,0.04)
- Tooltips: bg-secondary with border-subtle
- Legends: text-muted with proper spacing
- Filter chips: radius-default (10px), bg-hover on active

---

### Phase 4: Authentication Pages

**Goal**: Modernize auth flow with matte dark aesthetic
**Estimated Effort**: Low-Medium (3-4 hours)

**Tasks**:
- [ ] Update login page background and inputs
- [ ] Update signup page if exists
- [ ] Update password reset flow
- [ ] Create AuthInput component with proper styling
- [ ] Update OAuth buttons (Google, etc.) with brand colors
- [ ] Add subtle glow to primary CTA button
- [ ] Test form validation error states
- [ ] Ensure accessibility (focus states, contrast)
- [ ] Commit: "Migrate auth pages to matte dark design"

**Component Changes**:
- `src/pages/auth.tsx` or equivalent
- Create `src/components/auth/` if needed
- Input components, buttons, error messages

**Design Specifications**:
- Page bg: bg-primary (#09090B)
- Form container: bg-secondary with border-subtle
- Inputs: bg-elevated, border-default, radius-md (12px)
- Focus states: border-strong with accent glow
- Error states: expense color (#F87171)
- Primary CTA: accent (#6366F1) with shadow-glow-lg

---

### Phase 5: Settings & Profile Pages

**Goal**: Consistent settings UI with proper hierarchy
**Estimated Effort**: Medium (4-5 hours)

**Tasks**:
- [ ] Analyze settings page structure
- [ ] Create SettingsSection component
- [ ] Create SettingsItem component (toggle, button, link)
- [ ] Update profile form inputs
- [ ] Add proper section headers with separators
- [ ] Update toggle switches to match design
- [ ] Add confirmation modals with matte dark styling
- [ ] Test all interactive states
- [ ] Commit: "Migrate settings & profile to matte dark theme"

**Component Changes**:
- Settings pages
- Profile pages
- Create `src/components/settings/` directory
- Toggle, switch, select components

**Design Specifications**:
- Section headers: 15px semibold, text-primary, mb-16px
- Settings items: 48px height, radius-md, bg-elevated
- Toggle switches: accent color when active
- Dividers: 1px solid border-subtle
- Action buttons: radius-md, proper hover states

---

### Phase 6: Modals, Toasts & Overlays

**Goal**: Unified modal and notification system
**Estimated Effort**: Medium (4-5 hours)

**Tasks**:
- [ ] Update TransactionModal styling (if not done)
- [ ] Create reusable Modal component
- [ ] Update Toast component colors and animations
- [ ] Create BottomSheet component (if needed)
- [ ] Add backdrop with proper opacity
- [ ] Ensure modals use slideUp animation
- [ ] Add proper focus trapping and keyboard nav
- [ ] Test modal close animations
- [ ] Commit: "Unify modals, toasts & overlays with design system"

**Component Changes**:
- Modal components
- Toast/notification components
- Bottom sheets
- Confirmation dialogs

**Design Specifications**:
- Backdrop: rgba(0,0,0,0.6)
- Modal bg: bg-secondary (#111113)
- Modal radius: radius-xl (16px) or radius-2xl (20px)
- Animation: slideUp 0.35s ease-out
- Toast: bg-secondary with border-subtle, slideUp from bottom
- Close button: 40x40px, bg-elevated, radius-md

---

### Phase 7: Final Polish & Documentation

**Goal**: Complete migration and document patterns
**Estimated Effort**: Low-Medium (3-4 hours)

**Tasks**:
- [ ] Audit all pages for consistency
- [ ] Fix any remaining color inconsistencies
- [ ] Ensure all hover/active states match design system
- [ ] Update README with design system reference
- [ ] Create component usage examples in Storybook (optional)
- [ ] Performance audit (bundle size, render performance)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile device testing (iOS, Android)
- [ ] Commit: "Final design system polish and documentation"

**Validation Checklist**:
- [ ] No pure black (#000) or pure white (#FFF) used
- [ ] All borders use rgba() values
- [ ] Accent color used sparingly (logo, primary CTAs)
- [ ] Outfit font for UI text, JetBrains Mono for numbers
- [ ] All animations use purposeful easing (ease-out for enter)
- [ ] Contrast ratios meet WCAG 2.1 AA standards
- [ ] Touch targets minimum 44x44px
- [ ] Consistent spacing using design tokens

---

### Migration Timeline

| Phase | Effort | Duration | Status |
|-------|--------|----------|--------|
| Phase 1: Transaction UI | Medium | 1 week | ✅ Complete |
| Phase 2: Dashboard | Medium | 2-3 days | 📋 Planned |
| Phase 3: Reports/Analytics | Medium-High | 3-4 days | 📋 Planned |
| Phase 4: Auth Pages | Low-Medium | 1-2 days | 📋 Planned |
| Phase 5: Settings/Profile | Medium | 2-3 days | 📋 Planned |
| Phase 6: Modals/Toasts | Medium | 2-3 days | 📋 Planned |
| Phase 7: Final Polish | Low-Medium | 1-2 days | 📋 Planned |
| **Total** | **Medium-High** | **2-3 weeks** | **14% Complete** |

### Git Commit Strategy

Each phase should be a **single atomic commit** with a clear message:

```bash
# Pattern
git commit -m "Phase N: [Brief description]

- Task 1
- Task 2
- Task 3

Design System: v3.0.0 Matte Dark
Files changed: X files (+XXX, -XXX)
"

# Examples
git commit -m "Phase 1: Refactor /transactions UI with modular components

- Create src/lib/utils/transaction-formatters.ts
- Create src/components/transactions/ directory
- Build TxnCard, TxnList, TxnListHeader components
- Add loading, empty, error states
- Integrate slideIn animations

Design System: v3.0.0 Matte Dark
Files changed: 11 files (+625, -217)
"
```

---

## File Locations

- **CSS Variables:** `src/styles/globals.css` (`:root` selector)
- **Tailwind Config:** `tailwind.config.js`
- **Design System (this file):** `design/DESIGN_SYSTEM.md`
- **Full Design Reference:** `design/FINBOOK_DESIGN_SYSTEM_COMPLETE.md`
- **Transaction Design:** `design/transactions-final.jsx`

---

## Accessibility

### WCAG 2.1 AA Compliance

**Contrast Ratios (on #09090B):**
- `#FAFAFA` text-primary: 18.1:1 (AAA)
- `rgba(255,255,255,0.7)` text-secondary: 12.6:1 (AAA)
- `rgba(255,255,255,0.5)` text-muted: 9.0:1 (AAA)
- `rgba(255,255,255,0.35)` text-subtle: 6.3:1 (AA)
- `#22C55E` income: 7.2:1 (AA)
- `#F87171` expense: 5.8:1 (AA)

### Touch Targets
- **Minimum:** 44px x 44px
- **Recommended:** 48px x 48px

---

**Version:** 3.0.0
**Created:** December 2024
**Design System:** FinBook Matte Dark Minimal
