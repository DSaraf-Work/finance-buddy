# Finance Buddy - Dark Purple Design System

## Color Palette

### Primary Colors (Purple)
```css
--color-bg-primary: #0f0a1a;        /* Darkest background */
--color-bg-secondary: #1a1625;      /* Card backgrounds */
--color-bg-elevated: #2d1b4e;       /* Elevated elements */

--color-purple-500: #6b4ce6;        /* Primary accent */
--color-purple-600: #8b5cf6;        /* Hover states */
--color-purple-400: #a78bfa;        /* Highlights */
--color-purple-700: #5b3cc4;        /* Pressed states */
```

### Accent Colors
```css
--color-pink-500: #ec4899;          /* Secondary accent */
--color-cyan-500: #06b6d4;          /* Info/Links */
```

### Text Colors
```css
--color-text-primary: #f8fafc;      /* Primary text (white) */
--color-text-secondary: #cbd5e1;    /* Secondary text */
--color-text-muted: #94a3b8;        /* Muted text */
--color-text-disabled: #64748b;     /* Disabled text */
```

### State Colors
```css
--color-success: #10b981;           /* Success (emerald) */
--color-warning: #f59e0b;           /* Warning (amber) */
--color-error: #ef4444;             /* Error (red) */
--color-info: #06b6d4;              /* Info (cyan) */
```

### Border & Divider Colors
```css
--color-border: #2d1b4e;            /* Default borders */
--color-border-light: #3d2b5e;      /* Light borders */
--color-divider: #1a1625;           /* Dividers */
```

## Typography

### Font Families
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

## Border Radius
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
```

## Shadows (Dark Theme)
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
--shadow-purple: 0 0 20px rgba(107, 76, 230, 0.3);
```

## Component Styles

### Buttons
**Primary Button:**
- Background: `--color-purple-500`
- Hover: `--color-purple-600`
- Text: `--color-text-primary`
- Border radius: `--radius-lg`
- Padding: `12px 24px`
- Shadow: `--shadow-purple` on hover

**Secondary Button:**
- Background: `--color-bg-elevated`
- Hover: `--color-purple-500` with 20% opacity
- Border: `1px solid --color-border`
- Text: `--color-text-primary`

**Ghost Button:**
- Background: transparent
- Hover: `--color-bg-elevated`
- Text: `--color-purple-400`

### Cards
- Background: `--color-bg-secondary`
- Border: `1px solid --color-border`
- Border radius: `--radius-xl`
- Padding: `24px`
- Hover: border color `--color-purple-500`
- Shadow: `--shadow-md`

### Input Fields
- Background: `--color-bg-elevated`
- Border: `1px solid --color-border`
- Focus border: `--color-purple-500`
- Focus ring: `0 0 0 3px rgba(107, 76, 230, 0.2)`
- Text: `--color-text-primary`
- Placeholder: `--color-text-muted`

## Accessibility
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Focus indicators: Always visible
- Touch targets: Minimum 44px × 44px

