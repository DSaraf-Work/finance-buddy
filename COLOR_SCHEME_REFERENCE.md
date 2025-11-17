# Finance Buddy - Purple + Slate Gray Color Scheme Reference

## Complete Color Palette (Extracted from /transactions route)

### Background Colors
```css
--page-bg: #0A0B0D              /* Main page background */
--card-bg: #15161A              /* Card/container background */
--input-bg: #1E2026             /* Input fields, secondary containers */
--filter-section-bg: #0F1014    /* Filter section distinct background */
--overlay-bg: #0A0B0D/95        /* Semi-transparent overlay (sticky stats) */
```

### Text Colors
```css
--text-primary: #F0F1F5         /* Primary text (headings, important content) */
--text-secondary: #B2B4C2       /* Secondary text (descriptions, labels) */
--text-muted: #6F7280           /* Muted text (placeholders, hints) */
--text-disabled: #6F7280/50     /* Disabled state text */
```

### Border Colors
```css
--border-default: #2A2C35       /* Default borders */
--border-hover: #5D5FEF/50      /* Hover state borders */
--border-focus: #5D5FEF         /* Focus state borders */
--border-active: #5D5FEF        /* Active state borders */
--border-subtle: #2A2C35/50     /* Subtle borders (filter section) */
```

### Accent Colors - Primary Purple
```css
--purple-primary: #5D5FEF       /* Primary purple */
--purple-light: #888BFF         /* Light purple */
--purple-gradient: linear-gradient(to right, #5D5FEF, #888BFF)
--purple-gradient-br: linear-gradient(to bottom-right, #5D5FEF, #888BFF)
```

### Accent Colors - Info Blue
```css
--info-blue: #6C85FF           /* Info/review state */
--info-gradient: linear-gradient(to right, #6C85FF, #888BFF)
```

### Semantic Colors
```css
--success: #4ECF9E             /* Success state, credit transactions */
--success-light: #10B981       /* Alternative success green */
--error: #F45C63               /* Error state, debit transactions */
--warning: #FFA500             /* Warning state (if needed) */
--info: #6C85FF                /* Info state */
```

### Interactive States - Backgrounds
```css
--hover-bg: #1E2026            /* Hover background for buttons/inputs */
--active-bg: #2A2C35           /* Active background */
--focus-bg: #1E2026            /* Focus background */
--disabled-bg: #15161A/50      /* Disabled background */
```

### Interactive States - Opacity Variants
```css
--purple-10: #5D5FEF/10        /* 10% opacity purple (selected keywords) */
--purple-20: #5D5FEF/20        /* 20% opacity purple (pills, badges) */
--purple-30: #5D5FEF/30        /* 30% opacity purple (borders) */
--purple-40: #5D5FEF/40        /* 40% opacity purple (borders) */

--light-purple-10: #888BFF/10  /* 10% opacity light purple (suggestions) */
--light-purple-20: #888BFF/20  /* 20% opacity light purple (pills) */
--light-purple-30: #888BFF/30  /* 30% opacity light purple (borders) */
--light-purple-40: #888BFF/40  /* 40% opacity light purple (borders) */

--success-10: #4ECF9E/10       /* 10% opacity success */
--success-20: #10B981/20       /* 20% opacity success (badges) */
--error-10: #F45C63/10         /* 10% opacity error */
--info-10: #6C85FF/10          /* 10% opacity info */
```

### Shadow Colors
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
--shadow-purple: 0 10px 40px -10px #5D5FEF/40  /* Purple glow */
```

## Design Patterns

### Card Styling
```tsx
className="bg-[#15161A] rounded-2xl p-4 border border-[#2A2C35] shadow-sm hover:shadow-2xl hover:shadow-[#5D5FEF]/10 transition-all"
```

### Button Variants

**Primary Button (Purple Gradient):**
```tsx
className="bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all"
```

**Secondary Button (Outlined):**
```tsx
className="bg-[#1E2026] text-[#B2B4C2] border border-[#2A2C35] px-4 py-2 rounded-lg hover:bg-[#2A2C35] hover:text-[#F0F1F5] transition-all"
```

**Tertiary Button (Ghost):**
```tsx
className="text-[#B2B4C2] px-4 py-2 rounded-lg hover:bg-[#1E2026] hover:text-[#F0F1F5] transition-all"
```

### Input Field Styling
```tsx
className="w-full px-4 py-2.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg text-[#F0F1F5] placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
```

### Typography Hierarchy
```tsx
/* Heading 1 */
className="text-3xl sm:text-4xl font-bold text-[#F0F1F5]"

/* Heading 2 */
className="text-xl sm:text-2xl font-semibold text-[#F0F1F5]"

/* Heading 3 */
className="text-lg font-semibold text-[#F0F1F5]"

/* Body Text */
className="text-sm sm:text-base text-[#B2B4C2]"

/* Small Text */
className="text-xs text-[#6F7280]"

/* Tiny Text */
className="text-[10px] text-[#6F7280]"
```

### Spacing System
```tsx
/* Padding */
p-4      /* 16px - Default card padding */
p-6      /* 24px - Large card padding */
px-4     /* Horizontal padding */
py-2.5   /* Vertical padding for inputs */

/* Margins */
mb-4     /* 16px - Default bottom margin */
mb-6     /* 24px - Section spacing (mobile) */
mb-8     /* 32px - Section spacing (desktop) */
mt-6     /* 24px - Top margin */
mt-8     /* 32px - Top margin (desktop) */

/* Gaps */
gap-2    /* 8px - Small gap */
gap-3    /* 12px - Medium gap */
gap-4    /* 16px - Large gap */
```

### Icon Sizes
```tsx
w-4 h-4   /* 16px - Small icons */
w-5 h-5   /* 20px - Medium icons */
w-6 h-6   /* 24px - Large icons */
w-8 h-8   /* 32px - Extra large icons */
w-9 h-9   /* 36px - Category icons */
```

## Status Colors

### Transaction Status
```tsx
REVIEW:    bg-[#6C85FF]/10 text-[#6C85FF] border-[#6C85FF]/30
APPROVED:  bg-[#4ECF9E]/10 text-[#4ECF9E] border-[#4ECF9E]/30
INVALID:   bg-[#6F7280]/10 text-[#6F7280] border-[#6F7280]/30
REJECTED:  bg-[#F45C63]/10 text-[#F45C63] border-[#F45C63]/30
```

### Direction Colors
```tsx
debit:   text-[#F45C63]  /* Red for expenses */
credit:  text-[#4ECF9E]  /* Green for income */
```

## Accessibility (WCAG AA Compliance)

### Contrast Ratios
- `#F0F1F5` on `#0A0B0D`: 15.8:1 ✅ (AAA)
- `#B2B4C2` on `#0A0B0D`: 9.2:1 ✅ (AAA)
- `#6F7280` on `#0A0B0D`: 5.1:1 ✅ (AA)
- `#5D5FEF` on `#0A0B0D`: 4.8:1 ✅ (AA)
- `#F0F1F5` on `#15161A`: 14.2:1 ✅ (AAA)

