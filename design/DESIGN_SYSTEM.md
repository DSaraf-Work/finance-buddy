# Finance Buddy - Design System

**Version:** 2.0.0  
**Theme:** Midnight Blue Wealth  
**Last Updated:** 2025-01-03  
**Status:** ✅ Active

---

## 🎨 Theme Identity

**Vibe:** Private banking • executive dashboards • calm authority  
**Finish:** Matte (zero gloss, zero neon)  
**Contrast:** Deep blue-charcoal surfaces + soft icy blues  
**Goal:** Long-session readability for numbers & charts

---

## 🏗️ Architecture: Global CSS Variables

All design tokens are defined as **CSS custom properties** in `src/styles/globals.css`. This enables:

✅ **Zero component changes** for theme switching  
✅ **Single source of truth** for all design tokens  
✅ **Easy theme updates** - just change CSS variables  
✅ **Type-safe** - Tailwind config references CSS variables  
✅ **Consistent** - All components use the same design system

### Theme Switching

To switch themes, update CSS variables in `src/styles/globals.css`:

```css
:root {
  --color-bg-app: #NEW_COLOR;
  --color-text-primary: #NEW_COLOR;
  /* Update all variables */
}
```

**No component changes needed!** All components automatically use new colors.

---

## 🌑 Base Surfaces (Dark, Matte Blue)

| Usage | CSS Variable | Hex | Tailwind Class |
|-------|--------------|-----|----------------|
| App Background | `var(--color-bg-app)` | `#0F1624` | `bg-bg-app` |
| Primary Surface | `var(--color-bg-primary)` | `#151E2E` | `bg-bg-primary` |
| Card / Panel | `var(--color-bg-card)` | `#1B2638` | `bg-bg-card` |
| Elevated Surface | `var(--color-bg-elevated)` | `#22304A` | `bg-bg-elevated` |
| Divider / Border | `var(--color-border)` | `#2E3C55` | `border-border-default` |

**Design Principles:**
- ✔ No pure black
- ✔ Slight blue bias = richer than gray
- ✔ Very "expensive" dark look

**Usage:**
```tsx
// Direct CSS variable
<div className="bg-[var(--color-bg-app)]">

// Tailwind class (via CSS variable)
<div className="bg-bg-app">
```

---

## 🧾 Text Colors (Clear & Elegant)

| Usage | CSS Variable | Hex | Tailwind Class |
|-------|--------------|-----|----------------|
| Primary Text | `var(--color-text-primary)` | `#E9EEF5` | `text-text-primary` |
| Secondary Text | `var(--color-text-secondary)` | `#B8C4D6` | `text-text-secondary` |
| Muted / Labels | `var(--color-text-muted)` | `#8C9BB0` | `text-text-muted` |
| Disabled | `var(--color-text-disabled)` | `#64748B` | `text-text-disabled` |

**Important:** Balances, totals, amounts → Primary Text only

**Usage:**
```tsx
// Primary text (headings, amounts)
<h1 className="text-[var(--color-text-primary)]">₹12,345.67</h1>

// Tailwind class
<h1 className="text-text-primary">₹12,345.67</h1>
```

---

## 💎 Accent Blues (Pastel but Powerful)

| Purpose | CSS Variable | Hex | Tailwind Class |
|---------|--------------|-----|----------------|
| Primary CTA | `var(--color-accent-primary)` | `#5B8CFF` | `bg-accent-primary` |
| Hover / Focus | `var(--color-accent-hover)` | `#6FA0FF` | `bg-accent-hover` |
| Subtle Highlight | `var(--color-accent-highlight)` | `#8FB6FF` | `bg-accent-highlight` |

**Design Principles:**
- ✔ Flat colors only (no gradients)
- ✔ Accents should be rare and intentional
- ✔ No glows, no neon

---

## 💰 Finance Semantic Colors (Dark-Theme Safe)

| Meaning | CSS Variable | Hex | Tailwind Class |
|---------|--------------|-----|----------------|
| Income | `var(--color-income)` | `#4FBF9A` | `text-income` |
| Expense | `var(--color-expense)` | `#E07A7A` | `text-expense` |
| Warning | `var(--color-warning)` | `#E1B15C` | `text-warning` |
| Info | `var(--color-info)` | `#6FB6D9` | `text-info` |

**Usage:**
```tsx
// Income badge
<span className="text-[var(--color-income)]">Income</span>

// Expense badge
<span className="text-[var(--color-expense)]">Expense</span>
```

---

## 📊 Charts & Data (Premium Look)

| Element | CSS Variable | Hex |
|---------|--------------|-----|
| Chart Color 1 | `var(--color-chart-1)` | `#6F94FF` |
| Chart Color 2 | `var(--color-chart-2)` | `#5FA6A6` |
| Chart Color 3 | `var(--color-chart-3)` | `#7A8FB8` |
| Chart Color 4 | `var(--color-chart-4)` | `#C8B46A` |
| Grid lines | `var(--color-chart-grid)` | `#2E3C55` |
| Axis labels | `var(--color-chart-axis)` | `#8C9BB0` |

---

## 🧩 UI Polish Rules

### Border Radius (10-14px range)

| Size | CSS Variable | Value | Tailwind Class |
|------|--------------|-------|----------------|
| Small | `var(--radius-sm)` | `10px` | `rounded-theme-sm` |
| Medium | `var(--radius-md)` | `12px` | `rounded-theme-md` |
| Large | `var(--radius-lg)` | `14px` | `rounded-theme-lg` |
| Extra Large | `var(--radius-xl)` | `16px` | `rounded-theme-xl` |

**Usage:**
```tsx
<div className="rounded-[var(--radius-md)]">
// or
<div className="rounded-theme-md">
```

### Shadows (Extremely Subtle, Matte)

| Size | CSS Variable | Value | Tailwind Class |
|------|--------------|-------|----------------|
| Small | `var(--shadow-sm)` | `0 1px 3px rgba(0, 0, 0, 0.35)` | `shadow-theme-sm` |
| Medium | `var(--shadow-md)` | `0 2px 6px rgba(0, 0, 0, 0.35)` | `shadow-theme-md` |
| Large | `var(--shadow-lg)` | `0 4px 12px rgba(30, 60, 120, 0.12)` | `shadow-theme-lg` |
| Extra Large | `var(--shadow-xl)` | `0 8px 24px rgba(30, 60, 120, 0.12)` | `shadow-theme-xl` |

**Usage:**
```tsx
<div className="shadow-[var(--shadow-sm)]">
// or
<div className="shadow-theme-sm">
```

### Design Principles
- ❌ **No gradients**
- ❌ **No glows**
- ❌ **No neon**
- ✅ **Matte finish only**
- ✅ **Borders preferred over shadows**
- ✅ **Flat colors**

---

## 📝 Component Patterns

### Primary Button
```tsx
<button className="px-6 py-3 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] min-h-[44px]">
  Primary Action
</button>

// Or use component class
<button className="btn-primary">
  Primary Action
</button>
```

### Secondary Button
```tsx
<button className="px-6 py-3 bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-elevated)] min-h-[44px]">
  Secondary Action
</button>

// Or use component class
<button className="btn-secondary">
  Secondary Action
</button>
```

### Card
```tsx
<div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-sm)]">
  Card Content
</div>

// Or use component class
<div className="card">
  Card Content
</div>
```

### Input Field
```tsx
<input 
  className="input-field"
  placeholder="Enter text..."
/>

// Or custom styling
<input 
  className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)]"
/>
```

### Amount Display (Primary Text Only)
```tsx
<span className="text-[var(--color-text-primary)] text-2xl font-semibold">
  ₹12,345.67
</span>
```

### Status Badge
```tsx
// Income
<span className="px-3 py-1 bg-[var(--color-income)]/10 text-[var(--color-income)] border border-[var(--color-income)]/30 rounded-[var(--radius-sm)]">
  Income
</span>

// Expense
<span className="px-3 py-1 bg-[var(--color-expense)]/10 text-[var(--color-expense)] border border-[var(--color-expense)]/30 rounded-[var(--radius-sm)]">
  Expense
</span>
```

---

## 📐 Typography

### Font Families
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
- **Display Large:** 32px (2rem)
- **Display Medium:** 24px (1.5rem)
- **Heading Large:** 22px (1.375rem)
- **Heading Medium:** 18px (1.125rem)
- **Body Large:** 16px (1rem)
- **Body Medium:** 14px (0.875rem)
- **Body Small:** 12px (0.75rem)

### Font Weights
- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

---

## 📏 Spacing System

Based on 8px grid:

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

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

**Contrast Ratios:**
- `#E9EEF5` on `#0F1624`: 15.2:1 ✅ (AAA)
- `#B8C4D6` on `#0F1624`: 9.8:1 ✅ (AAA)
- `#8C9BB0` on `#0F1624`: 6.2:1 ✅ (AA)
- `#5B8CFF` on `#0F1624`: 4.9:1 ✅ (AA)
- `#E9EEF5` on `#1B2638`: 13.1:1 ✅ (AAA)

### Touch Targets
- **Minimum:** 44px × 44px
- **Recommended:** 48px × 48px

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus indicators must be visible
- Tab order must be logical

### ARIA Labels
- All interactive elements must have proper ARIA labels
- Form inputs must have associated labels
- Icons must have descriptive text or aria-labels

---

## 📱 Mobile-First Design

### Viewport Breakpoints
- **Mobile:** 320px - 428px (primary)
- **Tablet:** 768px - 1024px
- **Desktop:** 1024px+

### Mobile Considerations
- Touch targets ≥ 44px
- Text size ≥ 16px (prevents iOS zoom)
- Adequate spacing between interactive elements
- Bottom navigation for primary actions
- Thumb-reachable navigation zones

---

## 📚 File Locations

- **CSS Variables:** `src/styles/globals.css` (`:root` selector)
- **Tailwind Config:** `tailwind.config.js` (references CSS variables)
- **Component Classes:** `src/styles/globals.css` (`.btn-primary`, `.card`, etc.)
- **Design System:** `design/DESIGN_SYSTEM.md` (this file)

---

## 🔄 Migration Status

- ✅ **CSS Variables System** - Complete (30 variables)
- ✅ **Tailwind Config** - Complete
- ✅ **Component Classes** - Complete
- ✅ **Core Components** - Migrated (Layout, TransactionCard, index)
- ✅ **Build Status** - ✅ Passing
- ✅ **Accessibility** - ✅ WCAG AA compliant

---

## 🚀 Usage Examples

### Quick Reference

```tsx
// Backgrounds
bg-[var(--color-bg-app)]        // App background
bg-[var(--color-bg-card)]       // Card background
bg-[var(--color-bg-elevated)]   // Elevated surface

// Text
text-[var(--color-text-primary)]      // Primary text
text-[var(--color-text-secondary)]    // Secondary text
text-[var(--color-text-muted)]        // Muted text

// Accents
bg-[var(--color-accent-primary)]      // Primary CTA
bg-[var(--color-accent-hover)]        // Hover state

// Semantic
text-[var(--color-income)]      // Income
text-[var(--color-expense)]     // Expense
text-[var(--color-warning)]     // Warning
text-[var(--color-info)]        // Info

// Borders & Radius
border-[var(--color-border)]    // Border
rounded-[var(--radius-md)]      // Border radius

// Shadows
shadow-[var(--shadow-sm)]       // Small shadow
shadow-[var(--shadow-md)]       // Medium shadow
```

---

## ✅ Best Practices

1. **Always use CSS variables** - Never hardcode hex colors
2. **Use component classes** - `.btn-primary`, `.card`, `.input-field` when possible
3. **Consistent naming** - Follow the `--color-*` naming convention
4. **Mobile-first** - Ensure all colors work on 375px viewport
5. **Accessibility** - Maintain WCAG AA contrast ratios
6. **No gradients** - Use flat colors only
7. **Matte finish** - No glows, no neon, no gloss

---

**Last Updated:** 2025-01-03  
**Version:** 2.0.0  
**Theme:** Midnight Blue Wealth  
**Status:** ✅ Active
