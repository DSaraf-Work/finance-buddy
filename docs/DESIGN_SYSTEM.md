# Finance Buddy Design System

## Design Language: Matte Dark System

The application uses a sophisticated matte dark design system optimized for financial data visualization and mobile-first experiences.

## Core Design Principles

1. **Minimalist & Professional**: Clean, uncluttered interface with focus on data
2. **High Contrast**: Ensuring readability with careful contrast ratios
3. **Mobile-First**: Optimized for 430px width with responsive scaling
4. **Smooth Interactions**: Subtle animations and transitions for better UX

## Color Palette

### Background Colors
```css
--bg-app: #09090B          /* Primary app background - Near black */
--bg-card: #0a0a0a         /* Card backgrounds */
--bg-elevated: #1a1a1a     /* Elevated surfaces */
--bg-hover: rgba(255,255,255,0.02)  /* Hover states */
--bg-active: rgba(255,255,255,0.04) /* Active/pressed states */
```

### Text Colors
```css
--text-primary: #FAFAFA              /* Primary text - Almost white */
--text-secondary: rgba(255,255,255,0.7)   /* Secondary text */
--text-muted: rgba(255,255,255,0.35)      /* Muted/subtle text */
--text-disabled: rgba(255,255,255,0.3)    /* Disabled text */
```

### Semantic Colors
```css
--color-success: #22C55E    /* Income, positive values */
--color-danger: #F87171     /* Expenses, negative values */
--color-warning: #FFA500    /* Warnings, alerts */
--color-info: #3B82F6       /* Information, links */
```

### Border & Divider
```css
--border-default: rgba(255,255,255,0.06)  /* Default borders */
--divider: rgba(255,255,255,0.06)         /* Divider lines */
```

### Interactive States
```css
--button-bg: rgba(255,255,255,0.1)        /* Default button bg */
--button-hover: rgba(255,255,255,0.2)     /* Button hover state */
--focus-ring: rgba(255,255,255,0.2)       /* Focus indicators */
```

## Typography

### Font Families
- **Primary**: `"Outfit", -apple-system, sans-serif` - Used for all UI text
- **Monospace**: `"JetBrains Mono", monospace` - Used for numbers, amounts

### Font Sizes
```css
--text-xs: 10px    /* Meta info, timestamps */
--text-sm: 12px    /* Secondary info, labels */
--text-base: 15px  /* Body text, primary content */
--text-lg: 18px    /* Headers, emphasis */
--text-xl: 24px    /* Page titles */
--text-2xl: 32px   /* Large headers */
```

### Font Weights
- 400: Regular text
- 500: Medium emphasis
- 600: Strong emphasis (amounts)
- 700: Bold headers

## Spacing System

```css
--space-1: 2px
--space-2: 4px
--space-3: 8px
--space-4: 12px
--space-5: 14px   /* Icon gaps */
--space-6: 16px   /* Default padding */
--space-8: 24px
--space-10: 32px
```

## Border Radius

```css
--radius-sm: 8px
--radius-md: 12px   /* Cards, buttons */
--radius-lg: 14px   /* Icons, badges */
--radius-xl: 16px   /* Modals */
--radius-2xl: 24px  /* Large elements */
```

## Component Specifications

### Transaction Card
- **Container**: padding 16px 8px, borderRadius 12px
- **Icon**: 48x48px, borderRadius 14px
- **Layout**: Flexbox with 14px gap between icon and content
- **Typography**:
  - Title: 15px, weight 500
  - Category: 12px, muted color
  - Amount: 15px, weight 600, JetBrains Mono
  - Meta: 10px, weight 500
- **Separator**: 80% width, 1px height, centered

### Buttons
- **Height**: 44px minimum
- **Padding**: 12px 24px
- **Border Radius**: 12px
- **Transitions**: 0.2s ease

### Input Fields
- **Height**: 44px minimum
- **Padding**: 12px 16px
- **Border**: 1px solid border color
- **Focus**: Ring with primary color

### Cards
- **Background**: bg-card color
- **Border**: 1px solid border color
- **Border Radius**: 12px
- **Padding**: 24px (desktop), 16px (mobile)

## Animation Guidelines

### Timing Functions
- **ease-out**: Default for most animations
- **ease-in-out**: For continuous animations

### Durations
- **0.15s**: Micro interactions (hover)
- **0.2s**: Standard transitions
- **0.35s**: Page/content animations

### Common Animations
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## Layout Specifications

### Mobile-First Design
- **Primary Width**: 430px (mobile optimized)
- **Max Width**: Applied via container
- **Padding**: 8px (list views), 16px (content)

### Grid System
- **Columns**: 4 (mobile), 6 (tablet), 12 (desktop)
- **Gap**: 16px default

## Accessibility

### Focus States
- Clear focus indicators on all interactive elements
- Minimum 3:1 contrast ratio for focus rings
- Keyboard navigation support

### Color Contrast
- Text on background: Minimum 7:1 ratio
- Large text: Minimum 4.5:1 ratio
- Interactive elements: Minimum 3:1 ratio

## Migration to shadcn/ui

The design system is being migrated to use shadcn/ui components while maintaining the exact visual appearance. Key considerations:

1. **CSS Variables**: All colors defined as CSS custom properties for shadcn/ui theming
2. **Component Mapping**: Each custom component mapped to shadcn/ui equivalent
3. **Custom Styling**: Tailwind classes and CSS-in-JS for precise control
4. **Composite Components**: Domain-specific components built on shadcn/ui primitives

## Implementation Status

### Completed
- ✅ Transactions page and components
- ✅ Dashboard (Phase 2)
- ✅ Reports & Analytics (Phase 3)

### In Progress
- 🔄 Migration to shadcn/ui component library
- 🔄 Consolidation of design tokens
- 🔄 Component standardization

### Pending
- ⏳ Settings page
- ⏳ Profile page
- ⏳ Onboarding flow