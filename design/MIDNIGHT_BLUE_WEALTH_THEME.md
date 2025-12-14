# Midnight Blue Wealth Theme

**Theme Identity:** Private banking • executive dashboards • calm authority  
**Finish:** Matte (zero gloss, zero neon)  
**Contrast:** Deep blue-charcoal surfaces + soft icy blues  
**Goal:** Long-session readability for numbers & charts

---

## 🎯 Global CSS Variables System

All colors are defined as **CSS custom properties** in `src/styles/globals.css` for easy theme switching without component-level code changes.

### How Theme Switching Works

1. **Update CSS Variables** in `src/styles/globals.css`:
```css
:root {
  --color-bg-app: #NEW_COLOR;
  --color-text-primary: #NEW_COLOR;
  /* Update all variables */
}
```

2. **No Component Changes Needed!** All components automatically use new colors.

3. **Build and Deploy** - That's it!

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

### Income Badge
```tsx
<span className="px-3 py-1 bg-[var(--color-income)]/10 text-[var(--color-income)] border border-[var(--color-income)]/30 rounded-[var(--radius-sm)]">
  Income
</span>
```

### Expense Badge
```tsx
<span className="px-3 py-1 bg-[var(--color-expense)]/10 text-[var(--color-expense)] border border-[var(--color-expense)]/30 rounded-[var(--radius-sm)]">
  Expense
</span>
```

---

## 🎯 Theme Switching Guide

### Step 1: Update CSS Variables

Edit `src/styles/globals.css`:

```css
:root {
  /* Change any color */
  --color-bg-app: #NEW_COLOR;
  --color-text-primary: #NEW_COLOR;
  /* ... update all variables */
}
```

### Step 2: No Component Changes Needed!

All components automatically use the new colors because they reference CSS variables.

### Step 3: Build and Deploy

```bash
npm run build
# Deploy to production
```

**That's it!** The entire app now uses the new theme.

---

## 📚 File Locations

- **CSS Variables:** `src/styles/globals.css` (`:root` selector)
- **Tailwind Config:** `tailwind.config.js` (references CSS variables)
- **Component Classes:** `src/styles/globals.css` (`.btn-primary`, `.card`, etc.)

---

## ✅ Migration Status

- ✅ **CSS Variables System** - Complete
- ✅ **Tailwind Config** - Complete
- ✅ **Component Classes** - Complete
- ✅ **Layout Component** - Migrated to CSS variables
- ✅ **TransactionCard Component** - Migrated to CSS variables
- ✅ **Migration Script** - Created (`scripts/migrate-to-css-variables.js`)
- 🔄 **Component Migration** - In Progress (35/45 files migrated)

---

## 🚀 Benefits

1. **Easy Theme Switching** - Change colors in one place
2. **No Code Changes** - Components automatically update
3. **Consistency** - Single source of truth for all colors
4. **Maintainability** - Easy to update and maintain
5. **Type Safety** - Tailwind classes reference CSS variables

---

**Last Updated:** 2025-01-03  
**Theme:** Midnight Blue Wealth v1.0.0  
**Architecture:** CSS Variables (Global Theme System)  
**Status:** ✅ Active
