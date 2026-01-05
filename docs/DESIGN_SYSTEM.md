# Finance Buddy Design System

> **Version**: 2.0
> **Last Updated**: January 2025
> **Theme**: Matte Dark
> **Framework**: Tailwind CSS + shadcn/ui

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Icons](#icons)
8. [Animations](#animations)
9. [Patterns & Examples](#patterns--examples)
10. [Accessibility](#accessibility)

---

## Overview

Finance Buddy uses a **Matte Dark** design system optimized for financial data visualization. The system is built on:

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **CSS Variables** - Theme tokens in HSL format
- **Lucide React** - Icon library

### Design Principles

1. **Dark-Only**: No light mode - optimized for the matte dark aesthetic
2. **Mobile-First**: Responsive design starting from mobile breakpoints
3. **Glanceable**: Financial data should be instantly readable
4. **Consistent**: Use design tokens, never hardcode values
5. **Accessible**: WCAG 2.1 AA compliant contrast ratios

---

## Architecture

```
src/styles/
├── theme.css       ← CSS Variables (SOURCE OF TRUTH)
├── globals.css     ← Imports theme + custom utilities

tailwind.config.js  ← Maps CSS vars to Tailwind classes

components.json     ← shadcn/ui configuration
```

### How Theming Works

```
┌─────────────────────────────────────────────────────────────┐
│  theme.css         Define: --primary: 238 84% 67%           │
│       ↓                                                      │
│  tailwind.config   Map: primary: "hsl(var(--primary))"      │
│       ↓                                                      │
│  Components        Use: className="bg-primary text-primary" │
└─────────────────────────────────────────────────────────────┘
```

---

## Color System

All colors are defined in `src/styles/theme.css` using **HSL format** (Hue Saturation Lightness).

### Primary Palette

| Token | HSL Value | Hex | Tailwind Class | Usage |
|-------|-----------|-----|----------------|-------|
| `--primary` | `238 84% 67%` | `#6366F1` | `bg-primary`, `text-primary` | Buttons, links, focus states |
| `--primary-foreground` | `0 0% 98%` | `#FAFAFA` | `text-primary-foreground` | Text on primary backgrounds |

### Background Layers

| Token | HSL Value | Hex | Tailwind Class | Usage |
|-------|-----------|-----|----------------|-------|
| `--background` | `0 0% 4%` | `#09090B` | `bg-background` | Page background |
| `--card` | `0 0% 4%` | `#0A0A0A` | `bg-card` | Card surfaces |
| `--popover` | `0 0% 4%` | `#0A0A0A` | `bg-popover` | Dropdowns, menus |
| `--muted` | `0 0% 15%` | `#262626` | `bg-muted` | Subtle backgrounds |

### Text Colors

| Token | HSL Value | Tailwind Class | Usage |
|-------|-----------|----------------|-------|
| `--foreground` | `0 0% 98%` | `text-foreground` | Primary text |
| `--muted-foreground` | `0 0% 60%` | `text-muted-foreground` | Secondary text, labels |
| `--card-foreground` | `0 0% 98%` | `text-card-foreground` | Text on cards |

### Semantic Colors

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--success` | `142 71% 45%` | `#22C55E` | Income, positive states |
| `--destructive` | `0 73% 67%` | `#F87171` | Expenses, errors, delete |
| `--warning` | `38 92% 50%` | `#FFA500` | Warnings, alerts |
| `--info` | `213 94% 54%` | `#3B82F6` | Information, tips |

### Border & Input

| Token | HSL Value | Tailwind Class | Usage |
|-------|-----------|----------------|-------|
| `--border` | `0 0% 15%` | `border-border` | Default borders |
| `--input` | `0 0% 18%` | `border-input` | Input borders |
| `--ring` | `0 0% 25%` | `ring-ring` | Focus rings |

### Chart Colors

For data visualization in reports:

```css
--chart-1: 238 84% 67%   /* Indigo - Primary */
--chart-2: 142 71% 45%   /* Green - Success */
--chart-3: 0 73% 67%     /* Red - Destructive */
--chart-4: 38 92% 50%    /* Orange - Warning */
--chart-5: 213 94% 54%   /* Blue - Info */
```

### Using Colors with Opacity

```tsx
// Tailwind opacity modifier syntax
<div className="bg-primary/10" />      // 10% opacity
<div className="bg-primary/20" />      // 20% opacity
<div className="border-border/50" />   // 50% opacity
<div className="text-muted-foreground/80" /> // 80% opacity
```

### Modifying Colors Globally

Edit `src/styles/theme.css`:

```css
/* Change primary from Indigo to Teal */
--primary: 172 66% 50%;  /* #14B8A6 */

/* Update chart color to match */
--chart-1: 172 66% 50%;
```

All components using `bg-primary`, `text-primary`, etc. will automatically update.

---

## Typography

### Font Families

| Family | Variable | Usage |
|--------|----------|-------|
| **Outfit** | `font-sans` | All UI text, headers, body |
| **JetBrains Mono** | `font-mono` | Numbers, amounts, code |

```tsx
<p className="font-sans">Regular text</p>
<span className="font-mono">₹12,500</span>
```

### Font Sizes

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Meta info, timestamps |
| `text-sm` | 14px | Secondary labels |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | Hero text |
| `text-4xl` | 36px | Large displays |
| `text-5xl` | 48px | Hero headlines |

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, emphasis |
| `font-semibold` | 600 | Amounts, buttons |
| `font-bold` | 700 | Headlines |

### Text Styling Pattern

```tsx
// Section label
<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
  Section Label
</p>

// Amount display
<span className="text-4xl font-bold font-mono text-foreground">
  ₹{amount.toLocaleString('en-IN')}
</span>

// Secondary info
<p className="text-sm text-muted-foreground/80">
  Additional context
</p>
```

---

## Spacing & Layout

### Spacing Scale

Tailwind's default spacing scale is used. Common values:

| Class | Size | Usage |
|-------|------|-------|
| `gap-1` / `p-1` | 4px | Tight spacing |
| `gap-2` / `p-2` | 8px | Icon gaps |
| `gap-3` / `p-3` | 12px | Small padding |
| `gap-4` / `p-4` | 16px | Default padding |
| `gap-5` / `p-5` | 20px | Card padding |
| `gap-6` / `p-6` | 24px | Section spacing |
| `gap-8` / `p-8` | 32px | Large spacing |
| `gap-10` / `p-10` | 40px | Section gaps |

### Border Radius

| Variable | Size | Usage |
|----------|------|-------|
| `--radius` | 12px | Default (cards, buttons) |
| `rounded-sm` | 8px | Small elements |
| `rounded-md` | 10px | Medium elements |
| `rounded-lg` | 12px | Cards, buttons |
| `rounded-xl` | 16px | Large cards |
| `rounded-2xl` | 24px | Hero sections |

### Container & Max Widths

```tsx
// Page container
<div className="max-w-[1200px] mx-auto px-5">

// Content sections
<div className="max-w-[1000px] mx-auto">

// Narrow content (auth, forms)
<div className="max-w-[600px] mx-auto">
```

### Grid Patterns

```tsx
// Stats grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Two-column layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

// Feature bento grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
```

---

## Components

### shadcn/ui Components

Located in `src/components/ui/`. Import and use:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### Custom Dashboard Components

Located in `src/components/dashboard/`:

| Component | File | Props |
|-----------|------|-------|
| `StatCard` | `StatCard.tsx` | `icon`, `iconColor`, `iconBg`, `label`, `value`, `subtitle`, `loading`, `hoverColor`, `href` |
| `HeroCard` | `HeroCard.tsx` | `weeklySpending`, `lastWeekSpending`, `lastSyncTime`, `onSync`, `syncing`, `loading`, `spendingHref` |
| `QuickActions` | `QuickActions.tsx` | `actions[]` |
| `ConnectedAccounts` | `ConnectedAccounts.tsx` | `connections[]`, `onConnect` |
| `RecentTransactions` | `RecentTransactions.tsx` | `limit` |

### Component Patterns

#### Clickable Card Pattern

```tsx
interface CardProps {
  href?: string;  // Optional link
  // ... other props
}

const MyCard = ({ href, ...props }) => {
  const cardContent = (
    <Card className="hover:-translate-y-0.5 transition-all duration-300">
      {/* content */}
    </Card>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }
  return cardContent;
};
```

#### Hover Effect Pattern

```tsx
<Card
  className="transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
  style={{
    borderColor: isHovered ? hoverColor : undefined,
    boxShadow: isHovered ? `0 0 20px ${hoverColor}30` : undefined,
  }}
>
```

#### Loading State Pattern

```tsx
{loading ? (
  <span className="text-muted-foreground/50">---</span>
) : (
  <span>{value}</span>
)}
```

---

## Icons

### Lucide React

All icons come from `lucide-react`:

```tsx
import {
  Mail,
  CreditCard,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
```

### Icon Sizing

| Context | Class | Size |
|---------|-------|------|
| Inline with text | `h-4 w-4` | 16px |
| Buttons | `h-5 w-5` | 20px |
| Card icons | `h-6 w-6` to `h-8 w-8` | 24-32px |
| Feature icons | `h-10 w-10` | 40px |

### Icon Containers

```tsx
// Colored icon container
<div
  className="w-12 h-12 rounded-xl flex items-center justify-center"
  style={{
    background: 'rgba(99, 102, 241, 0.12)',
    color: '#6366F1',
  }}
>
  <Mail className="h-5 w-5" />
</div>
```

---

## Animations

### Standard Transitions

```tsx
// Default transition
className="transition-all duration-300"

// Fast transition (hover states)
className="transition-colors duration-200"

// Transform transition
className="transition-transform duration-300"
```

### Hover Effects

```tsx
// Lift effect
className="hover:-translate-y-0.5"  // Subtle lift
className="hover:-translate-y-1"    // Standard lift

// Color changes
className="hover:border-primary/50"
className="hover:text-primary"
className="group-hover:opacity-100"
```

### Loading Animation

```tsx
// Spin animation
<RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />

// Pulse animation
<div className="animate-pulse" />
```

### Custom Keyframes

Defined in `theme.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}
```

---

## Patterns & Examples

### Page Layout

```tsx
<Layout title="Page Title">
  <div className="min-h-[calc(100vh-72px)] bg-background py-6 px-5">
    <div className="max-w-[1200px] mx-auto">
      {/* Page content */}
    </div>
  </div>
</Layout>
```

### Section Header

```tsx
<div className="text-center mb-16">
  <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
    Section Label
  </p>
  <h2 className="text-3xl md:text-4xl font-bold text-foreground">
    Section Title
  </h2>
</div>
```

### Gradient Background

```tsx
<div
  className="relative overflow-hidden rounded-2xl p-6"
  style={{
    background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)',
    border: '1px solid rgba(99,102,241,0.2)',
  }}
>
  {/* Gradient orb */}
  <div
    className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
  />
  {/* Content */}
</div>
```

### Trend Indicator

```tsx
<div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
  isIncrease
    ? 'bg-red-500/10 text-red-400'
    : 'bg-green-500/10 text-green-400'
}`}>
  {isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
  <span>{percent}%</span>
</div>
```

---

## Accessibility

### Focus States

```css
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 0.25rem;
}
```

### Contrast Requirements

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

### Keyboard Navigation

- All interactive elements must be focusable
- Tab order should follow visual order
- Focus indicators must be visible

### Screen Readers

```tsx
// Hidden but accessible text
<span className="sr-only">Loading</span>

// Aria labels
<button aria-label="Sync transactions">
  <RefreshCw />
</button>
```

---

## Quick Reference Card

### Most Used Classes

```tsx
// Backgrounds
bg-background bg-card bg-primary bg-muted

// Text
text-foreground text-muted-foreground text-primary

// Borders
border-border border-primary/50 border-border/50

// Spacing
p-4 p-5 p-6 gap-4 gap-5 mb-6 mb-8

// Typography
text-sm text-base font-medium font-semibold font-mono

// Effects
hover:-translate-y-0.5 transition-all duration-300
```

### Color Quick Reference

| Need | Use |
|------|-----|
| Primary action | `bg-primary text-primary-foreground` |
| Secondary action | `bg-secondary text-secondary-foreground` |
| Success/Income | `text-green-400 bg-green-500/10` |
| Error/Expense | `text-red-400 bg-red-500/10` |
| Warning | `text-amber-400 bg-amber-500/10` |
| Info | `text-blue-400 bg-blue-500/10` |
| Muted text | `text-muted-foreground` |
| Borders | `border-border` or `border-border/50` |

---

## File References

| File | Purpose |
|------|---------|
| `src/styles/theme.css` | All color definitions |
| `src/styles/globals.css` | Global styles, utilities |
| `tailwind.config.js` | Tailwind configuration |
| `components.json` | shadcn/ui settings |
| `src/components/ui/` | shadcn/ui components |
| `src/components/dashboard/` | Custom dashboard components |
