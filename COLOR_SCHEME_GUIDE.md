# Purple + Slate Gray Color Scheme Guide

## Color Palette

### Background Colors
```css
--bg-main: #0A0B0D        /* Main background */
--bg-card: #15161A        /* Card surface */
--bg-panel: #1E2026       /* Header/Panel */
--border: #2A2C35         /* Borders */
```

### Text Colors
```css
--text-primary: #F0F1F5   /* Primary text */
--text-secondary: #B2B4C2 /* Secondary text */
--text-disabled: #6F7280  /* Disabled text */
```

### Accent Colors
```css
--purple-primary: #5D5FEF /* Primary purple */
--purple-accent: #888BFF  /* Accent purple */
--green-positive: #4ECF9E /* Success/Credit */
--red-negative: #F45C63   /* Error/Debit */
--blue-neutral: #6C85FF   /* Info/Neutral */
```

## Tailwind CSS Classes

### Backgrounds
- `bg-[#0A0B0D]` - Main background
- `bg-[#15161A]` - Card surface
- `bg-[#1E2026]` - Panel/Header
- `border-[#2A2C35]` - Borders

### Text
- `text-[#F0F1F5]` - Primary text
- `text-[#B2B4C2]` - Secondary text
- `text-[#6F7280]` - Disabled text

### Accents
- `bg-gradient-to-r from-[#5D5FEF] to-[#888BFF]` - Purple gradient
- `text-[#4ECF9E]` - Positive/Success
- `text-[#F45C63]` - Negative/Error
- `text-[#6C85FF]` - Neutral/Info

## Component Patterns

### Cards
```tsx
className="bg-[#15161A] rounded-2xl p-6 border border-[#2A2C35] hover:shadow-2xl hover:shadow-[#5D5FEF]/10"
```

### Buttons (Primary)
```tsx
className="px-6 py-3 bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] text-white rounded-xl hover:shadow-xl hover:shadow-[#5D5FEF]/30"
```

### Buttons (Secondary)
```tsx
className="px-6 py-3 bg-[#1E2026] text-[#B2B4C2] border border-[#2A2C35] rounded-xl hover:border-[#5D5FEF] hover:text-[#888BFF]"
```

### Input Fields
```tsx
className="w-full px-4 py-2.5 bg-[#1E2026] border border-[#2A2C35] rounded-xl focus:border-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/20 text-[#F0F1F5]"
```

### Status Badges
- **Review**: `bg-[#6C85FF]/10 text-[#6C85FF] border border-[#6C85FF]/30`
- **Approved**: `bg-[#4ECF9E]/10 text-[#4ECF9E] border border-[#4ECF9E]/30`
- **Rejected**: `bg-[#F45C63]/10 text-[#F45C63] border border-[#F45C63]/30`
- **Invalid**: `bg-[#6F7280]/10 text-[#6F7280] border border-[#6F7280]/30`

## Components Updated

✅ **Transactions Page** (`src/pages/transactions.tsx`)
✅ **TransactionCard** (`src/components/TransactionCard.tsx`)
✅ **TransactionStats** (`src/components/TransactionStats.tsx`)
✅ **TransactionFilters** (`src/components/TransactionFilters.tsx`)
✅ **TransactionEmptyState** (`src/components/TransactionEmptyState.tsx`)
✅ **TransactionSkeleton** (`src/components/TransactionSkeleton.tsx`)
⏳ **Layout** (`src/components/Layout.tsx`) - In Progress

## Components Pending

- Main Pages (index, emails, settings, admin, etc.)
- Auth Pages
- Review Components
- Manager Components
- Gmail Components
- Modals and Forms
- Notification Components

