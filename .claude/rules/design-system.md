# Finance Buddy Design System Rules

> **Purpose**: Ensure all UI development follows the established design system
> **Applies to**: Any UI changes, new components, or styling modifications

---

## MANDATORY RULES

### 1. Always Use Design Tokens

**NEVER hardcode colors.** Always use CSS variables via Tailwind classes.

```tsx
// CORRECT
<div className="bg-background text-foreground border-border" />
<div className="bg-primary text-primary-foreground" />
<div className="text-muted-foreground" />

// WRONG - Never do this
<div style={{ background: '#09090B', color: '#FAFAFA' }} />
<div className="bg-[#6366F1]" />
```

### 2. Reference the Design System

Before creating or modifying UI:
1. Read `docs/DESIGN_SYSTEM.md` for comprehensive guidelines
2. Check `src/styles/theme.css` for available CSS variables
3. Review existing components in `src/components/dashboard/` for patterns

### 3. Use shadcn/ui Components

Always prefer shadcn/ui components from `src/components/ui/`:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### 4. Dark Mode Only

This app is **dark-only**. Never add light mode considerations or conditional theming.

---

## COLOR USAGE

### Semantic Color Mapping

| Use Case | Tailwind Class |
|----------|---------------|
| Page background | `bg-background` |
| Card background | `bg-card` |
| Primary text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Primary actions | `bg-primary text-primary-foreground` |
| Success/Income | `text-green-400 bg-green-500/10` |
| Error/Expense | `text-red-400 bg-red-500/10` |
| Warning | `text-amber-400 bg-amber-500/10` |
| Borders | `border-border` or `border-border/50` |

### Opacity Patterns

Use Tailwind's opacity modifier for subtle effects:

```tsx
bg-primary/10      // 10% opacity background
bg-primary/20      // 20% opacity background
border-border/50   // 50% opacity border
text-muted-foreground/80  // 80% opacity text
```

### Adding New Colors

If a new color is absolutely needed:
1. Add to `src/styles/theme.css` as a CSS variable
2. Add to `tailwind.config.js` color mapping
3. Document in `docs/DESIGN_SYSTEM.md`

---

## COMPONENT PATTERNS

### Required Component Features

All card-like components should support:

```tsx
interface ComponentProps {
  loading?: boolean;    // Loading state
  href?: string;        // Optional clickable link
  // ... other props
}
```

### Clickable Card Pattern

```tsx
const MyCard = ({ href, children }) => {
  const cardContent = (
    <Card className="hover:-translate-y-0.5 transition-all duration-300">
      {children}
    </Card>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }
  return cardContent;
};
```

### Loading State Pattern

```tsx
{loading ? (
  <span className="text-muted-foreground/50">---</span>
) : (
  <span>{value}</span>
)}
```

### Hover Effects

Always include hover states:

```tsx
className="transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
```

### Use React.memo

Wrap components for performance:

```tsx
export const MyComponent = memo(function MyComponent(props) {
  // ...
});
```

---

## TYPOGRAPHY

### Font Usage

| Content | Classes |
|---------|---------|
| Body text | `font-sans` (default) |
| Numbers/amounts | `font-mono` |
| Labels | `text-[11px] font-medium uppercase tracking-wider` |
| Headlines | `font-bold` |

### Amount Display

```tsx
<span className="text-4xl font-bold font-mono text-foreground">
  ₹{amount.toLocaleString('en-IN')}
</span>
```

---

## ICONS

### Lucide React Only

```tsx
import { Mail, CreditCard, RefreshCw } from 'lucide-react';
```

### Size Guidelines

| Context | Class |
|---------|-------|
| Inline | `h-4 w-4` |
| Buttons | `h-5 w-5` |
| Cards | `h-6 w-6` to `h-8 w-8` |
| Features | `h-10 w-10` |

### Icon Containers

```tsx
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

## LAYOUT

### Page Structure

```tsx
<Layout title="Page Title">
  <div className="min-h-[calc(100vh-72px)] bg-background py-6 px-5">
    <div className="max-w-[1200px] mx-auto">
      {/* Content */}
    </div>
  </div>
</Layout>
```

### Grid Patterns

```tsx
// Stats grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Two-column
<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
```

### Spacing

Use consistent spacing: `gap-4`, `gap-5`, `mb-6`, `mb-8`, `p-5`, `p-6`

---

## ANIMATIONS

### Standard Transitions

```tsx
transition-all duration-300    // Default
transition-colors duration-200 // Color only
```

### Hover Lift

```tsx
hover:-translate-y-0.5  // Subtle
hover:-translate-y-1    // Standard
```

### Loading Spinner

```tsx
<RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
```

---

## MODALS & DIALOGS

### MANDATORY: Always Use shadcn/ui Dialog

**NEVER create custom modal implementations.** Always use the shadcn/ui Dialog component.

```tsx
// CORRECT - Using shadcn/ui Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const MyModal = ({ isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="bg-card border-border sm:max-w-lg">
      <DialogHeader className="border-b border-border pb-4">
        <DialogTitle>Modal Title</DialogTitle>
      </DialogHeader>
      {/* Content */}
      <DialogFooter className="border-t border-border pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// WRONG - Custom modal implementation
const MyModal = ({ isOpen, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60" onClick={onClose} />
    <div className="relative bg-card rounded-xl">
      {/* Content */}
    </div>
  </div>
);
```

### Why This Matters

1. **Consistent Backdrop**: Dialog provides standardized overlay styling
2. **Portal Rendering**: Properly appends to body, avoiding z-index issues
3. **Animations**: Built-in `animate-in`/`animate-out` transitions
4. **Accessibility**: Proper focus trapping, ARIA attributes, ESC key handling
5. **Close Button**: Standardized X button in top-right corner

### Modal Styling Pattern

```tsx
<DialogContent
  className="flex flex-col bg-card border-border overflow-hidden sm:max-w-lg sm:max-h-[90vh]"
  onOpenAutoFocus={(e) => e.preventDefault()} // Optional: prevent auto-focus
>
  {/* Header - sticky at top */}
  <DialogHeader className="shrink-0 pt-4 pb-3 px-6 border-b border-border">
    <DialogTitle className="text-lg font-semibold text-foreground">
      Title
    </DialogTitle>
  </DialogHeader>

  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto px-6 py-6">
    {/* Content */}
  </div>

  {/* Footer - sticky at bottom */}
  <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/20">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </DialogFooter>
</DialogContent>
```

### Nested Modals

For modals that open on top of other modals (like SubTransactionEditor opening from TransactionModal):
- Use the same Dialog component - Radix handles stacking automatically
- Both modals use `z-50` but later ones naturally layer on top via DOM order
- Never manually override z-index with values like `z-[60]`

---

## FORBIDDEN PATTERNS

### Never Do These

1. **Hardcoded colors**
   ```tsx
   // WRONG
   style={{ color: '#6366F1' }}
   className="bg-[#09090B]"
   ```

2. **Light mode code**
   ```tsx
   // WRONG
   className="dark:bg-black bg-white"
   ```

3. **Inline styles for themeable properties**
   ```tsx
   // WRONG
   style={{ backgroundColor: 'black', color: 'white' }}
   ```

4. **Non-shadcn UI components for standard elements**
   ```tsx
   // WRONG - Use shadcn Button
   <button className="...">Click</button>
   ```

5. **Custom CSS files for component styling**
   - Use Tailwind classes
   - Use `theme.css` only for CSS variables

6. **Custom modal implementations**
   ```tsx
   // WRONG - Never do this
   <div className="fixed inset-0 z-50">
     <div className="bg-black/60" onClick={onClose} />
     <div className="bg-card rounded-xl">...</div>
   </div>

   // CORRECT - Use shadcn/ui Dialog
   <Dialog open={isOpen} onOpenChange={...}>
     <DialogContent>...</DialogContent>
   </Dialog>
   ```

7. **Legacy CSS variable patterns**
   ```tsx
   // WRONG - Legacy variables no longer in use
   style={{ background: 'var(--color-bg-card)' }}
   className="bg-[var(--color-bg-app)]"

   // CORRECT - Use design system tokens
   className="bg-card"
   className="bg-background"
   ```

---

## CHECKLIST BEFORE SUBMITTING UI CHANGES

- [ ] All colors use CSS variables via Tailwind classes (no `#hex` or `var(--color-*)`)
- [ ] Components use shadcn/ui primitives where applicable
- [ ] **Modals use shadcn/ui Dialog** (never custom `fixed inset-0` implementations)
- [ ] Loading states are implemented
- [ ] Hover effects are included
- [ ] Icons are from lucide-react
- [ ] Follows existing component patterns
- [ ] Mobile-responsive (test on 430px width)
- [ ] No light mode code
- [ ] Accessible (focus states, aria labels)

---

## QUICK REFERENCE

### Files to Check

| File | Purpose |
|------|---------|
| `src/styles/theme.css` | CSS variable definitions |
| `docs/DESIGN_SYSTEM.md` | Full documentation |
| `src/components/dashboard/StatCard.tsx` | Card pattern example |
| `src/components/dashboard/HeroCard.tsx` | Complex component example |

### Import Patterns

```tsx
// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Dashboard components
import { StatCard, HeroCard } from '@/components/dashboard';

// Icons
import { Mail, CreditCard } from 'lucide-react';

// Next.js
import Link from 'next/link';
```

### Common Classes

```tsx
// Backgrounds
bg-background bg-card bg-primary bg-muted

// Text
text-foreground text-muted-foreground text-primary

// Borders
border-border border-primary/50

// Effects
transition-all duration-300 hover:-translate-y-0.5
```
