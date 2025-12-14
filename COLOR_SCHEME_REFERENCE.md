# Finance Buddy - Midnight Blue Wealth Theme Reference

## 🎨 Theme Identity

**Vibe:** Private banking • executive dashboards • calm authority  
**Finish:** Matte (zero gloss, zero neon)  
**Contrast:** Deep blue-charcoal surfaces + soft icy blues  
**Goal:** Long-session readability for numbers & charts

---

## 🌑 Base Surfaces (Dark, Matte Blue)

All surfaces use CSS variables for easy theme switching:

```css
--color-bg-app: #0F1624              /* Midnight Navy - App Background */
--color-bg-primary: #151E2E          /* Deep Blue Charcoal - Primary Surface */
--color-bg-card: #1B2638             /* Muted Ink Blue - Card / Panel */
--color-bg-elevated: #22304A         /* Soft Slate Blue - Elevated Surface */
--color-border: #2E3C55              /* Smoky Blue Gray - Divider / Border */
```

**Design Principles:**
- ✔ No pure black
- ✔ Slight blue bias = richer than gray
- ✔ Very "expensive" dark look

**Usage in Components:**
```tsx
// App background
<div className="bg-[var(--color-bg-app)]">

// Card
<div className="bg-[var(--color-bg-card)] border border-[var(--color-border)]">

// Elevated surface
<div className="bg-[var(--color-bg-elevated)]">
```

**Tailwind Classes (via CSS variables):**
```tsx
bg-bg-app        // App Background
bg-bg-primary    // Primary Surface
bg-bg-card       // Card / Panel
bg-bg-elevated   // Elevated Surface
border-border-default  // Divider / Border
```

---

## 🧾 Text Colors (Clear & Elegant)

```css
--color-text-primary: #E9EEF5        /* Soft Off-White - Primary Text */
--color-text-secondary: #B8C4D6     /* Cool Mist Blue - Secondary Text */
--color-text-muted: #8C9BB0         /* Dusty Steel Blue - Muted / Labels */
--color-text-disabled: #64748B      /* Cool Ash Blue - Disabled */
```

**Important:** Balances, totals, amounts → Primary Text only

**Usage:**
```tsx
// Primary text (headings, amounts)
<h1 className="text-[var(--color-text-primary)]">₹12,345.67</h1>

// Secondary text
<p className="text-[var(--color-text-secondary)]">Description</p>

// Muted text
<span className="text-[var(--color-text-muted)]">Label</span>

// Disabled
<button disabled className="text-[var(--color-text-disabled)]">Disabled</button>
```

**Tailwind Classes:**
```tsx
text-text-primary      // Primary Text
text-text-secondary    // Secondary Text
text-text-muted       // Muted / Labels
text-text-disabled    // Disabled
```

---

## 💎 Accent Blues (Pastel but Powerful)

```css
--color-accent-primary: #5B8CFF     /* Rich Pastel Blue - Primary CTA */
--color-accent-hover: #6FA0FF       /* Soft Royal Blue - Hover / Focus */
--color-accent-highlight: #8FB6FF   /* Icy Powder Blue - Subtle Highlight */
```

**Design Principles:**
- ✔ Flat colors only (no gradients)
- ✔ Accents should be rare and intentional
- ✔ No glows, no neon

**Usage:**
```tsx
// Primary button
<button className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)]">

// Focus ring
<input className="focus:ring-[var(--color-accent-primary)]">
```

**Tailwind Classes:**
```tsx
bg-accent-primary     // Primary CTA
bg-accent-hover       // Hover / Focus
bg-accent-highlight   // Subtle Highlight
```

---

## 💰 Finance Semantic Colors (Dark-Theme Safe)

```css
--color-income: #4FBF9A              /* Muted Emerald - Income */
--color-expense: #E07A7A             /* Soft Rose Red - Expense */
--color-warning: #E1B15C             /* Desaturated Amber - Warning */
--color-info: #6FB6D9                /* Calm Cyan - Info */
```

**Design Principles:**
- ✔ Tuned to sit naturally inside dark blue
- ✔ No harsh popping
- ✔ Long-session readable

**Usage:**
```tsx
// Income badge
<span className="text-[var(--color-income)]">Income</span>

// Expense badge
<span className="text-[var(--color-expense)]">Expense</span>

// Warning
<div className="bg-[var(--color-warning)]/10 text-[var(--color-warning)]">

// Info
<div className="bg-[var(--color-info)]/10 text-[var(--color-info)]">
```

**Tailwind Classes:**
```tsx
text-income       // Income
text-expense      // Expense
text-warning      // Warning
text-info         // Info
```

---

## 📊 Charts & Data (Premium Look)

```css
--color-chart-1: #6F94FF             /* Pastel Blue */
--color-chart-2: #5FA6A6             /* Steel Teal */
--color-chart-3: #7A8FB8             /* Dusty Indigo */
--color-chart-4: #C8B46A             /* Muted Gold */
--color-chart-grid: #2E3C55          /* Grid lines */
--color-chart-axis: #8C9BB0          /* Axis labels */
```

**Usage:**
```tsx
// Chart colors
<div className="bg-[var(--color-chart-1)]">Series 1</div>
<div className="bg-[var(--color-chart-2)]">Series 2</div>

// Grid lines
<line stroke="var(--color-chart-grid)" />

// Axis labels
<text fill="var(--color-chart-axis)">Label</text>
```

---

## 🧩 UI Polish Rules

### Border Radius (10-14px range)

```css
--radius-sm: 10px
--radius-md: 12px
--radius-lg: 14px
--radius-xl: 16px
```

**Usage:**
```tsx
<div className="rounded-[var(--radius-md)]">
```

**Tailwind Classes:**
```tsx
rounded-theme-sm   // 10px
rounded-theme-md  // 12px
rounded-theme-lg  // 14px
rounded-theme-xl  // 16px
```

### Shadows (Extremely Subtle, Matte)

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35)
--shadow-md: 0 2px 6px rgba(0, 0, 0, 0.35)
--shadow-lg: 0 4px 12px rgba(30, 60, 120, 0.12)
--shadow-xl: 0 8px 24px rgba(30, 60, 120, 0.12)
```

**Usage:**
```tsx
<div className="shadow-[var(--shadow-sm)]">
```

**Tailwind Classes:**
```tsx
shadow-theme-sm   // Small shadow
shadow-theme-md   // Medium shadow
shadow-theme-lg   // Large shadow
shadow-theme-xl   // Extra large shadow
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
```

### Secondary Button
```tsx
<button className="px-6 py-3 bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-bg-elevated)] min-h-[44px]">
  Secondary Action
</button>
```

### Card
```tsx
<div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-sm)]">
  Card Content
</div>
```

### Input Field
```tsx
<input 
  className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary)]/12"
  placeholder="Enter text..."
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

## 🎯 Global Theme Switching

All colors are defined as CSS custom properties in `src/styles/globals.css`. To switch themes:

1. **Update CSS Variables** in `globals.css`:
```css
:root {
  --color-bg-app: #NEW_COLOR;
  --color-text-primary: #NEW_COLOR;
  /* ... update all variables */
}
```

2. **No Component Changes Needed** - All components automatically use the new colors!

3. **Tailwind Config** references CSS variables, so Tailwind classes also update automatically.

---

## ✅ Accessibility (WCAG AA Compliance)

### Contrast Ratios
- `#E9EEF5` on `#0F1624`: 15.2:1 ✅ (AAA)
- `#B8C4D6` on `#0F1624`: 9.8:1 ✅ (AAA)
- `#8C9BB0` on `#0F1624`: 6.2:1 ✅ (AA)
- `#5B8CFF` on `#0F1624`: 4.9:1 ✅ (AA)
- `#E9EEF5` on `#1B2638`: 13.1:1 ✅ (AAA)

---

## 📚 File Locations

- **CSS Variables:** `src/styles/globals.css` (`:root` selector)
- **Tailwind Config:** `tailwind.config.js` (references CSS variables)
- **Component Classes:** `src/styles/globals.css` (`.btn-primary`, `.card`, etc.)

---

**Last Updated:** 2025-01-03  
**Theme:** Midnight Blue Wealth v1.0.0  
**Status:** ✅ Active with CSS Variables
