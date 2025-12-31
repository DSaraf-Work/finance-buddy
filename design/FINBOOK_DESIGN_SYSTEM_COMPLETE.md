# FinBook Design System
### Matte Dark Minimalist Design Language v1.0

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border & Radius](#border--radius)
6. [Shadows & Effects](#shadows--effects)
7. [Motion & Animation](#motion--animation)
8. [Iconography](#iconography)
9. [Component Specifications](#component-specifications)
10. [CSS Variables](#css-variables)
11. [Tailwind Configuration](#tailwind-configuration)
12. [React Components](#react-components)
13. [Utility Functions](#utility-functions)
14. [Usage Guidelines](#usage-guidelines)

---

## Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Matte Dark** | Deep, non-reflective surfaces. No glossy gradients. Subtle depth through transparency layers. |
| **Minimalist** | Only essential elements. Generous whitespace. Every pixel has purpose. |
| **Modern** | Clean geometry. Precise spacing. Contemporary type choices. |
| **Functional** | Form follows function. Clear visual hierarchy. Intuitive interactions. |

### Visual Identity

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   DARK         +    MATTE        +    MINIMAL    =  FINBOOK │
│   #09090B           No gloss         Essentials             │
│                     No shine         only                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Design Rules

1. **Never use pure black (#000) or pure white (#FFF)** — Always use our palette values
2. **Borders and overlays use rgba()** — Never solid gray values
3. **Accent color (indigo) is used sparingly** — Only for logo and key CTAs
4. **Shadows are minimal** — Only subtle glows on primary actions
5. **Animations are purposeful** — Enhance UX, never decorative

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

#09090B ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-primary
#111113 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-secondary
rgba 3% ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-elevated
rgba 6% ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-hover
rgba 8% ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-active
rgba12% ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ bg-strong
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
| `accent-light` | `#A5B4FC` | — | Accent text on dark |

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

### Complete Color Palette

```javascript
const colors = {
  // Backgrounds
  bg: {
    primary: '#09090B',
    secondary: '#111113',
    elevated: 'rgba(255, 255, 255, 0.03)',
    hover: 'rgba(255, 255, 255, 0.06)',
    active: 'rgba(255, 255, 255, 0.08)',
    strong: 'rgba(255, 255, 255, 0.12)',
  },
  
  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.04)',
    default: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Text
  text: {
    primary: '#FAFAFA',
    secondary: 'rgba(255, 255, 255, 0.7)',
    muted: 'rgba(255, 255, 255, 0.5)',
    subtle: 'rgba(255, 255, 255, 0.35)',
    disabled: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Semantic
  income: {
    default: '#22C55E',
    muted: 'rgba(34, 197, 94, 0.12)',
  },
  expense: {
    default: '#F87171',
    muted: 'rgba(248, 113, 113, 0.12)',
  },
  accent: {
    default: '#6366F1',
    light: '#A5B4FC',
    muted: 'rgba(99, 102, 241, 0.2)',
  },
  
  // Payment Methods
  payment: {
    upi: '#6366F1',
    gpay: '#4285F4',
    phonepe: '#5F259F',
    paytm: '#00BAF2',
    card: '#F59E0B',
    neft: '#10B981',
    autodebit: '#EF4444',
    wire: '#14B8A6',
    credit: '#22C55E',
  },
};
```

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

### Typography Examples

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SECTION TITLE          11px / 600 / uppercase / 1px        │
│                                                             │
│  Page Title             18px / 700 / -0.3px                 │
│                                                             │
│  Body text here         13px / 400                          │
│                                                             │
│  ₹85,000               15px / 600 / JetBrains Mono          │
│                                                             │
│  Yesterday              11px / 500 / subtle                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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

### Grid System

```
Container: 430px max-width, centered
Padding:   20px horizontal
Gaps:      8-16px between elements

┌────────────────────────────────────────┐
│←20px→                          ←20px→│
│      ┌──────────────────────────┐      │
│      │                          │      │
│      │        Content           │      │
│      │                          │      │
│      └──────────────────────────┘      │
│                                        │
└────────────────────────────────────────┘
```

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

### Border Specifications

```css
/* Default border */
border: 1px solid rgba(255, 255, 255, 0.08);

/* Active/selected border */
border: 1px solid rgba(255, 255, 255, 0.12);

/* Focus border */
border: 1px solid rgba(255, 255, 255, 0.15);

/* Separator */
height: 1px;
background: rgba(255, 255, 255, 0.06);
width: 80%;
margin: 0 auto;
```

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
✅ DO: Use glow on logo and primary floating action buttons
✅ DO: Use subtle inner shadow for depth on cards

❌ DON'T: Use drop shadows on cards
❌ DON'T: Use shadows on text
❌ DON'T: Use shadows on borders
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
  from {
    opacity: 0;
    transform: translateX(-16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Slide up (modals, toasts) */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale in (popovers) */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Stagger Pattern

```javascript
// List item stagger delay
const staggerDelay = index * 0.04; // 40ms between items

// Usage
style={{ animationDelay: `${index * 0.04}s` }}
```

### Hover Transitions

```css
/* Standard hover transition */
transition: all 200ms ease;

/* Background hover */
transition: background-color 200ms ease;
```

---

## Iconography

### Icon System

| Property | Value |
|----------|-------|
| Library | Lucide React |
| Size | 20-24px |
| Stroke | 1.5-2px |
| Style | Outline only |

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| `sm` | 14px | Inline, chips |
| `default` | 20px | Buttons, nav |
| `lg` | 24px | Headers, actions |

### Common Icons

```jsx
import {
  Bell,           // Notifications
  RefreshCw,      // Sync
  Menu,           // Hamburger (custom)
  ArrowLeft,      // Back
  ArrowUp,        // Income
  ArrowDown,      // Expense
  Check,          // Selected
  Plus,           // Add
  Search,         // Search
  Filter,         // Filter
  Home,           // Home nav
  BarChart3,      // Stats nav
  User,           // Profile nav
} from 'lucide-react';
```

### Custom Hamburger Menu

```jsx
// Custom hamburger (not from Lucide)
<div className="flex flex-col gap-1 p-3">
  <span className="w-[18px] h-[2px] bg-white/70 rounded-full" />
  <span className="w-[18px] h-[2px] bg-white/70 rounded-full" />
  <span className="w-[14px] h-[2px] bg-white/70 rounded-full" />
</div>
```

---

## Component Specifications

### Header

```
┌─────────────────────────────────────────────────────────────┐
│ [₹ Logo]  AppName                    [🔔] [↻] [≡]          │
└─────────────────────────────────────────────────────────────┘

Height: 72px (including top padding)
Padding: 16px 20px
Background: #111113
Border-bottom: 1px solid rgba(255,255,255,0.04)

Logo: 40x40px, radius-12, gradient bg, glow shadow
Title: 18px, bold
Icon buttons: 40x40px, transparent bg, radius-12
Menu button: 44x44px, elevated bg, radius-14, border
```

### Transaction Item

```
┌─────────────────────────────────────────────────────────────┐
│ [🍜]  Title                                      -₹547     │
│       Category • METHOD                          Today     │
└─────────────────────────────────────────────────────────────┘

Padding: 16px 8px
Icon: 48x48px, radius-14
Gap (icon to text): 14px
Title: 15px, medium
Category: 12px, subtle
Method: 11px, semibold, uppercase, brand color
Amount: 15px, semibold, mono, semantic color
Date: 11px, subtle
```

### Chip

```
┌─────────────────┐
│    Label        │  Inactive
└─────────────────┘

┌─────────────────┐
│  ✓ Label        │  Active
└─────────────────┘

Padding: 10px 16px
Radius: 10px
Border: 1px
Font: 13px, medium

Inactive:
  Border: rgba(255,255,255,0.08)
  Background: transparent
  Color: rgba(255,255,255,0.5)

Active:
  Border: rgba(255,255,255,0.12)
  Background: rgba(255,255,255,0.06)
  Color: #FAFAFA
```

### Input Field

```
┌─────────────────────────────────────────┐
│ ₹  0                                    │
└─────────────────────────────────────────┘

Padding: 14px
Radius: 12px
Border: 1px solid rgba(255,255,255,0.08)
Background: rgba(255,255,255,0.03)
Font: 15px, JetBrains Mono, medium
Prefix: 15px, subtle

Focus:
  Border: rgba(255,255,255,0.15)
```

### Button

```
┌─────────────────────────────────────────┐
│           Apply Filters  [5]            │
└─────────────────────────────────────────┘

Padding: 16px 24px
Radius: 14px
Border: 1px solid rgba(255,255,255,0.1)
Background: rgba(255,255,255,0.08)
Font: 15px, semibold
Color: #FAFAFA

Hover:
  Background: rgba(255,255,255,0.12)
```

### Separator

```
         ────────────────────────────
         
Width: 80%
Height: 1px
Background: rgba(255,255,255,0.06)
Alignment: center
```

### Badge

```
┌─────┐
│ 12  │
└─────┘

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
  
  --text-2xs: 10px;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-md: 15px;
  --text-lg: 18px;
  --text-xl: 26px;
  --text-2xl: 38px;
  
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

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
  
  --ease-default: ease;
  --ease-out: ease-out;
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* ═══════════════════════════════════════════
     LAYOUT
     ═══════════════════════════════════════════ */
  
  --container-max: 430px;
  --header-height: 72px;
  --separator-width: 80%;
}
```

---

## Tailwind Configuration

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#09090B',
          secondary: '#111113',
          elevated: 'rgba(255, 255, 255, 0.03)',
          hover: 'rgba(255, 255, 255, 0.06)',
          active: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.12)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.04)',
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          strong: 'rgba(255, 255, 255, 0.15)',
        },
        text: {
          primary: '#FAFAFA',
          secondary: 'rgba(255, 255, 255, 0.7)',
          muted: 'rgba(255, 255, 255, 0.5)',
          subtle: 'rgba(255, 255, 255, 0.35)',
          disabled: 'rgba(255, 255, 255, 0.2)',
        },
        income: {
          DEFAULT: '#22C55E',
          muted: 'rgba(34, 197, 94, 0.12)',
        },
        expense: {
          DEFAULT: '#F87171',
          muted: 'rgba(248, 113, 113, 0.12)',
        },
        accent: {
          DEFAULT: '#6366F1',
          light: '#A5B4FC',
          muted: 'rgba(99, 102, 241, 0.2)',
        },
        payment: {
          upi: '#6366F1',
          gpay: '#4285F4',
          phonepe: '#5F259F',
          paytm: '#00BAF2',
          card: '#F59E0B',
          neft: '#10B981',
          autodebit: '#EF4444',
          wire: '#14B8A6',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.5px' }],
        xs: ['11px', { lineHeight: '16px', letterSpacing: '0.3px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['15px', { lineHeight: '22px' }],
        lg: ['18px', { lineHeight: '26px', letterSpacing: '-0.3px' }],
        xl: ['26px', { lineHeight: '32px', letterSpacing: '-0.5px' }],
        '2xl': ['38px', { lineHeight: '44px', letterSpacing: '-1px' }],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '10px',
        md: '12px',
        lg: '14px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(99, 102, 241, 0.3)',
        'glow-md': '0 4px 12px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 8px 32px rgba(99, 102, 241, 0.35)',
        'inner-subtle': 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      animation: {
        'slide-in': 'slideIn 350ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'fade-in': 'fadeIn 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

## React Components

### Utility: cn()

```typescript
// utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Component: Button

```tsx
// components/ui/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated border border-border text-text-primary hover:bg-bg-hover rounded-md',
        ghost: 'text-text-muted hover:bg-bg-hover hover:text-text-primary rounded-md',
        primary: 'bg-bg-active border border-border-medium text-text-primary hover:bg-bg-strong rounded-lg',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';
```

### Component: Chip

```tsx
// components/ui/chip.tsx
import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChipProps extends React.HTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  showCheck?: boolean;
  color?: string;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, showCheck, color, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border text-base font-medium transition-all duration-200 cursor-pointer',
        selected
          ? 'bg-bg-hover border-border-medium text-text-primary'
          : 'bg-transparent border-border text-text-muted hover:bg-bg-hover',
        className
      )}
      style={color && selected ? { color } : undefined}
      {...props}
    >
      {showCheck && selected && <Check className="w-3 h-3" strokeWidth={3} />}
      {color && selected && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  )
);
Chip.displayName = 'Chip';
```

### Component: Input

```tsx
// components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, ...props }, ref) => (
    <div className="flex items-center bg-bg-elevated border border-border rounded-md px-3.5 transition-all focus-within:border-border-strong">
      {prefix && (
        <span className="text-md text-text-subtle font-medium mr-1">{prefix}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'flex-1 bg-transparent py-3.5 text-md font-mono font-medium text-text-primary placeholder:text-text-disabled outline-none',
          className
        )}
        {...props}
      />
    </div>
  )
);
Input.displayName = 'Input';
```

### Component: Separator

```tsx
// components/ui/separator.tsx
import * as React from 'react';
import { cn } from '@/utils/cn';

export const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex justify-center w-full', className)} {...props}>
    <div className="w-[80%] h-px bg-border-subtle" />
  </div>
));
Separator.displayName = 'Separator';
```

### Component: Badge

```tsx
// components/ui/badge.tsx
import * as React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center h-6 px-2.5 rounded-lg text-sm font-semibold',
        variant === 'default' && 'bg-bg-hover text-text-subtle',
        variant === 'accent' && 'bg-accent-muted text-accent-light',
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';
```

### Component: TransactionItem

```tsx
// components/transaction-item.tsx
import * as React from 'react';
import { cn } from '@/utils/cn';

const PAYMENT_COLORS: Record<string, string> = {
  UPI: '#6366F1',
  GPay: '#4285F4',
  PhonePe: '#5F259F',
  Paytm: '#00BAF2',
  Card: '#F59E0B',
  NEFT: '#10B981',
  'Auto-debit': '#EF4444',
  Wire: '#14B8A6',
  Credit: '#22C55E',
};

interface TransactionItemProps {
  icon: string;
  title: string;
  category: string;
  method: string;
  amount: number;
  date: string;
  index?: number;
}

export function TransactionItem({
  icon,
  title,
  category,
  method,
  amount,
  date,
  index = 0,
}: TransactionItemProps) {
  const isIncome = amount > 0;

  return (
    <div
      className="flex justify-between items-center p-4 px-2 rounded-md cursor-pointer transition-colors hover:bg-bg-hover animate-slide-in"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center text-lg',
            isIncome ? 'bg-income-muted' : 'bg-bg-elevated'
          )}
        >
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-md font-medium">{title}</span>
          <div className="flex items-center gap-1.5 text-sm text-text-subtle">
            <span>{category}</span>
            <span className="text-2xs text-text-disabled">•</span>
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: PAYMENT_COLORS[method] }}
            >
              {method}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={cn(
            'text-md font-semibold font-mono',
            isIncome ? 'text-income' : 'text-expense'
          )}
        >
          {formatIndianCurrency(amount)}
        </span>
        <span className="text-xs text-text-subtle font-medium">{date}</span>
      </div>
    </div>
  );
}
```

---

## Utility Functions

### Indian Number Formatting

```typescript
// utils/formatters.ts

/**
 * Format number in Indian numbering system (Lakhs, Crores)
 */
export function formatIndianNumber(num: number): string {
  const absNum = Math.abs(num);
  
  if (absNum >= 10000000) {
    // Crores (1,00,00,000+)
    return (absNum / 10000000).toFixed(2) + ' Cr';
  } else if (absNum >= 100000) {
    // Lakhs (1,00,000+)
    return (absNum / 100000).toFixed(2) + ' L';
  } else {
    // Standard Indian format
    return absNum.toLocaleString('en-IN');
  }
}

/**
 * Format amount with sign and rupee symbol
 */
export function formatIndianCurrency(amount: number): string {
  const formatted = formatIndianNumber(amount);
  return amount >= 0 ? `+₹${formatted}` : `-₹${formatted}`;
}

/**
 * Format date relative to today
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
```

### Constants

```typescript
// utils/constants.ts

export const PAYMENT_METHODS = [
  { name: 'UPI', color: '#6366F1' },
  { name: 'GPay', color: '#4285F4' },
  { name: 'PhonePe', color: '#5F259F' },
  { name: 'Paytm', color: '#00BAF2' },
  { name: 'Card', color: '#F59E0B' },
  { name: 'NEFT', color: '#10B981' },
  { name: 'Auto-debit', color: '#EF4444' },
  { name: 'Wire', color: '#14B8A6' },
  { name: 'Credit', color: '#22C55E' },
] as const;

export const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Utilities',
  'Subscriptions',
  'Insurance',
  'Groceries',
  'Entertainment',
] as const;

export const TIME_FILTERS = [
  'Today',
  'This Week',
  'This Month',
  'This Year',
  'Custom',
] as const;

export const TRANSACTION_TYPES = ['All', 'Income', 'Expenses'] as const;
```

---

## Usage Guidelines

### ✅ Do's

| Rule | Example |
|------|---------|
| Use rgba for overlays | `rgba(255,255,255,0.06)` |
| Use semantic colors | `text-income` for positive |
| Use font-mono for numbers | `₹85,000` |
| Animate list items | Stagger 40ms delay |
| Center separators at 80% | `width: 80%; margin: 0 auto;` |
| Keep accent minimal | Only logo and primary CTA |

### ❌ Don'ts

| Rule | Why |
|------|-----|
| Don't use pure #000 or #FFF | Too harsh, breaks matte aesthetic |
| Don't use solid gray borders | Use rgba transparency instead |
| Don't use gradients (except logo) | Conflicts with matte style |
| Don't use drop shadows on cards | Use subtle transparency instead |
| Don't mix fonts in same element | Keep Outfit for text, Mono for numbers |
| Don't over-animate | Purpose over decoration |

### Accessibility Notes

- Maintain 4.5:1 contrast for body text
- Use semantic HTML elements
- Support keyboard navigation
- Include focus-visible states
- Test with screen readers

### Responsive Breakpoints

```css
/* Mobile-first (default) */
max-width: 430px;

/* If scaling up needed */
@media (min-width: 768px) {
  /* Tablet adjustments */
}

@media (min-width: 1024px) {
  /* Desktop adjustments */
}
```

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

**Version:** 1.0.0  
**Created:** December 2024  
**Design System:** FinBook Matte Dark Minimal
