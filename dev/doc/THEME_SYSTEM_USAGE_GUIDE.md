# Midnight Blue Wealth Theme - Usage Guide

**Theme System:** Global CSS Variables  
**Last Updated:** 2025-01-03

---

## 🎯 Quick Start

All colors are defined as CSS variables in `src/styles/globals.css`. Use them in components like this:

```tsx
// Direct CSS variable
<div className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">

// Tailwind class (via CSS variable)
<div className="bg-bg-card text-text-primary">
```

---

## 📋 Color Variables Reference

### Base Surfaces

```tsx
bg-[var(--color-bg-app)]        // App background
bg-[var(--color-bg-primary)]    // Primary surface
bg-[var(--color-bg-card)]       // Cards, panels
bg-[var(--color-bg-elevated)]   // Elevated surfaces
border-[var(--color-border)]    // Borders, dividers
```

### Text Colors

```tsx
text-[var(--color-text-primary)]      // Primary text (headings, amounts)
text-[var(--color-text-secondary)]    // Secondary text
text-[var(--color-text-muted)]        // Muted text, labels
text-[var(--color-text-disabled)]     // Disabled state
```

### Accent Blues

```tsx
bg-[var(--color-accent-primary)]      // Primary CTA
bg-[var(--color-accent-hover)]        // Hover state
bg-[var(--color-accent-highlight)]    // Subtle highlight
```

### Finance Semantic

```tsx
text-[var(--color-income)]      // Income, credit
text-[var(--color-expense)]     // Expense, debit
text-[var(--color-warning)]     // Warning
text-[var(--color-info)]        // Info
```

### Border Radius

```tsx
rounded-[var(--radius-sm)]   // 10px
rounded-[var(--radius-md)]   // 12px
rounded-[var(--radius-lg)]   // 14px
rounded-[var(--radius-xl)]   // 16px
```

### Shadows

```tsx
shadow-[var(--shadow-sm)]   // Small shadow
shadow-[var(--shadow-md)]   // Medium shadow
shadow-[var(--shadow-lg)]   // Large shadow
shadow-[var(--shadow-xl)]   // Extra large shadow
```

---

## 🎨 Common Patterns

### Card
```tsx
<div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-sm)]">
  Card Content
</div>
```

### Button (Primary)
```tsx
<button className="bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] px-6 py-3 hover:bg-[var(--color-accent-hover)] min-h-[44px]">
  Click Me
</button>
```

### Button (Secondary)
```tsx
<button className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-6 py-3 hover:bg-[var(--color-bg-elevated)] min-h-[44px]">
  Click Me
</button>
```

### Input Field
```tsx
<input 
  className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)]"
  placeholder="Enter text..."
/>
```

### Amount Display
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

## 🔄 Theme Switching

To switch themes, update CSS variables in `src/styles/globals.css`:

```css
:root {
  --color-bg-app: #NEW_COLOR;
  --color-text-primary: #NEW_COLOR;
  /* Update all variables */
}
```

**No component changes needed!** All components automatically use the new colors.

---

## ✅ Best Practices

1. **Always use CSS variables** - Never hardcode hex colors
2. **Use component classes** - `.btn-primary`, `.card`, `.input-field` when possible
3. **Consistent naming** - Follow the `--color-*` naming convention
4. **Mobile-first** - Ensure all colors work on 375px viewport
5. **Accessibility** - Maintain WCAG AA contrast ratios

---

**Last Updated:** 2025-01-03
