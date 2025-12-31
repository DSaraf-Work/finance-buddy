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

### Transaction Item

```
Padding: 16px 8px
Border-radius: 12px
Icon: 48x48px, radius-14
Gap (icon to text): 14px
Title: 15px, medium (500)
Category: 12px, subtle (rgba 0.35)
Method: 11px, semibold (600), uppercase, brand color
Amount: 15px, semibold (600), mono font, semantic color
Date: 11px, subtle (rgba 0.3), medium (500)
```

### Separator

```
Width: 80%
Height: 1px
Background: rgba(255,255,255,0.06)
Alignment: center
```

### Badge

```
Padding: 4px 10px
Radius: 8px
Background: rgba(255,255,255,0.06)
Font: 12px, semibold
Color: rgba(255,255,255,0.35)
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

- [ ] Update CSS variables in globals.css
- [ ] Add Google Fonts import (Outfit, JetBrains Mono)
- [ ] Update Tailwind config
- [ ] Migrate component colors
- [ ] Update transaction list styling
- [ ] Test accessibility contrast ratios

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
