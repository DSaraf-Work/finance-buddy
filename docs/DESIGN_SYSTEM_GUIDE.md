# Finance Buddy - Global Design System Guide

## Overview

Finance Buddy now has a **centralized, controllable design system** that allows you to:
- ✅ Change color schemes globally from a single location
- ✅ Switch themes at runtime (Dark Purple, Dark Blue, Light)
- ✅ Maintain consistent typography, spacing, and styling across the app
- ✅ Use CSS variables for dynamic theming
- ✅ Leverage Tailwind CSS with design tokens

---

## 🎨 How to Change the Design System Globally

### 1. Update Color Schemes

**File:** `src/styles/design-tokens.ts`

To modify colors globally, edit the `colorSchemes` object:

```typescript
export const colorSchemes = {
  darkPurple: {
    name: 'Dark Purple',
    colors: {
      bgPrimary: '#0f0a1a',      // Change this to update background
      brandPrimary: '#6b4ce6',   // Change this to update primary brand color
      // ... etc
    },
  },
  // Add new color schemes here
}
```

**To add a new color scheme:**

```typescript
export const colorSchemes = {
  // ... existing schemes
  
  darkGreen: {
    name: 'Dark Green',
    colors: {
      bgPrimary: '#0a1a0f',
      bgSecondary: '#162519',
      bgElevated: '#1b4e2d',
      bgHover: '#2b5e3d',
      
      brandPrimary: '#10b981',
      brandHover: '#34d399',
      brandLight: '#6ee7b7',
      brandDark: '#059669',
      
      // ... copy other required colors
    },
  },
}
```

Then update the `ColorScheme` type and `availableSchemes` in `src/contexts/ThemeContext.tsx`.

### 2. Update Typography

**File:** `src/styles/design-tokens.ts`

```typescript
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',  // Change font family
    mono: 'Fira Code, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',   // Adjust font sizes
    sm: '0.875rem',
    // ...
  },
  
  fontWeight: {
    normal: 400,     // Adjust font weights
    bold: 700,
  },
}
```

### 3. Update Spacing, Borders, Shadows

**File:** `src/styles/design-tokens.ts`

```typescript
export const spacing = {
  1: '0.25rem',  // Change spacing scale
  2: '0.5rem',
  // ...
}

export const borderRadius = {
  sm: '0.375rem',  // Change border radius
  md: '0.5rem',
  // ...
}

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',  // Change shadows
  // ...
}
```

---

## 🔧 How to Use the Design System

### In React Components

#### Using Tailwind Classes (Recommended)

```tsx
// Use design token classes
<div className="bg-bg-secondary text-text-primary border border-border rounded-xl p-6">
  <h1 className="text-2xl font-bold text-brand-primary">Hello</h1>
  <button className="bg-brand-primary hover:bg-brand-hover text-text-primary px-4 py-2 rounded-lg">
    Click Me
  </button>
</div>
```

#### Using CSS Variables

```tsx
<div style={{
  backgroundColor: 'var(--color-bg-secondary)',
  color: 'var(--color-text-primary)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-6)',
}}>
  Content
</div>
```

#### Using CSS Classes

```tsx
// Use predefined classes from globals.css
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
<input className="input-field" />
<div className="card">Card Content</div>
```

---

## 🎭 Theme Switching

### Available Color Schemes

Finance Buddy includes **7 built-in color schemes**:

1. **Dark Purple** (default) - Professional, modern purple theme
2. **Dark Blue** - Corporate blue theme
3. **Light** - Clean light theme for daytime use
4. **Dark Green** - Nature-inspired green theme
5. **Light Blue** - Sky blue theme with cloud aesthetics
6. **Yellow** - Warm amber/gold theme
7. **Monotone** - Grayscale theme for minimal distraction

### Setup Theme Provider

**File:** `src/pages/_app.tsx`

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultScheme="darkPurple">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

### Use Theme Switcher Component

```tsx
import ThemeSwitcher from '@/components/ThemeSwitcher';

function Header() {
  return (
    <nav>
      {/* Other nav items */}
      <ThemeSwitcher />
    </nav>
  );
}
```

### Programmatic Theme Switching

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { colorScheme, setColorScheme } = useTheme();
  
  return (
    <button onClick={() => setColorScheme('darkBlue')}>
      Switch to Dark Blue
    </button>
  );
}
```

---

## 📋 Available Design Tokens

### Colors
- `bg-primary`, `bg-secondary`, `bg-elevated`, `bg-hover`
- `brand-primary`, `brand-hover`, `brand-light`, `brand-dark`
- `accent-pink`, `accent-cyan`, `accent-emerald`, `accent-amber`
- `text-primary`, `text-secondary`, `text-muted`, `text-disabled`
- `success`, `warning`, `error`, `info`
- `border`, `border-light`, `divider`

### Typography
- Font families: `font-sans`, `font-mono`
- Font sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`
- Font weights: `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Spacing
- `space-0` through `space-16` (0, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px)

### Border Radius
- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`

### Shadows
- `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- `shadow-purple`, `shadow-blue`, `shadow-emerald`, `shadow-amber`

---

## 🚀 Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use Tailwind classes** for consistency
3. **Use CSS variables** for dynamic values
4. **Test theme changes** across all color schemes
5. **Maintain accessibility** (contrast ratios, focus states)
6. **Document custom components** that use the design system

---

## 📝 Migration Guide

### Migrating Existing Components

**Before:**
```tsx
<div className="bg-[#1a1625] text-[#f8fafc] border-[#2d1b4e]">
```

**After:**
```tsx
<div className="bg-bg-secondary text-text-primary border-border">
```

**Before:**
```tsx
<button style={{ backgroundColor: '#6b4ce6' }}>
```

**After:**
```tsx
<button className="bg-brand-primary">
```

---

## 🎯 Quick Reference

| Old Hardcoded Value | New Design Token |
|---------------------|------------------|
| `#0f0a1a` | `bg-bg-primary` |
| `#1a1625` | `bg-bg-secondary` |
| `#2d1b4e` | `bg-bg-elevated` |
| `#6b4ce6` | `bg-brand-primary` |
| `#8b5cf6` | `bg-brand-hover` |
| `#f8fafc` | `text-text-primary` |
| `#cbd5e1` | `text-text-secondary` |
| `#10b981` | `bg-success` |
| `#f59e0b` | `bg-warning` |
| `#ef4444` | `bg-error` |

---

## 🔍 Troubleshooting

**Theme not changing?**
- Ensure `ThemeProvider` wraps your app in `_app.tsx`
- Check browser console for errors
- Clear localStorage: `localStorage.removeItem('fb-color-scheme')`

**Colors not updating?**
- Verify CSS variables are defined in `globals.css`
- Check Tailwind config imports design tokens correctly
- Rebuild: `npm run build`

**New color scheme not appearing?**
- Add to `colorSchemes` in `design-tokens.ts`
- Update `availableSchemes` in `ThemeContext.tsx`
- Update `ColorScheme` type

---

For more details, see:
- `src/styles/design-tokens.ts` - Design token definitions
- `src/contexts/ThemeContext.tsx` - Theme management
- `src/styles/globals.css` - CSS variables and base styles
- `tailwind.config.js` - Tailwind configuration

