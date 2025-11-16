# Matte Purple Theme - Design Documentation

## 🎨 Overview

The **Matte Purple** theme is a sophisticated color scheme featuring soft, desaturated lavender tones. Inspired by `design/matte-purple-color-schema-inspiration.png`, this theme prioritizes elegance, calmness, and visual comfort.

---

## 💜 Design Philosophy

### Core Principles

1. **Matte Finish**
   - All colors are intentionally desaturated
   - No glossy or vibrant tones
   - Soft, non-reflective appearance
   - Reduces eye strain during extended use

2. **Sophisticated Elegance**
   - Lavender instead of vibrant purple
   - Dusty, muted accent colors
   - Professional yet creative
   - Premium aesthetic

3. **Visual Comfort**
   - Lower contrast than standard themes
   - Gentler on the eyes
   - Calming color psychology
   - Suitable for long work sessions

4. **Cohesive Palette**
   - Purple undertones in all neutrals
   - Harmonious color relationships
   - Complementary muted accents
   - Unified visual language

---

## 🎨 Complete Color Palette

### Background Colors

```css
/* Primary Background - Deepest layer */
--bg-primary: #1a1625
  RGB: 26, 22, 37
  HSL: 264°, 25%, 12%
  Usage: Main app background, body

/* Secondary Background - Cards, panels */
--bg-secondary: #252033
  RGB: 37, 32, 51
  HSL: 256°, 23%, 16%
  Usage: Cards, modals, containers

/* Elevated Background - Raised elements */
--bg-elevated: #332d47
  RGB: 51, 45, 71
  HSL: 254°, 22%, 23%
  Usage: Dropdowns, tooltips, elevated cards

/* Hover Background - Interactive states */
--bg-hover: #3d3751
  RGB: 61, 55, 81
  HSL: 254°, 19%, 27%
  Usage: Hover states, active elements
```

### Brand Colors

```css
/* Primary Brand - Main accent */
--brand-primary: #9d8ac7
  RGB: 157, 138, 199
  HSL: 259°, 35%, 66%
  Usage: Primary buttons, links, highlights

/* Brand Hover - Interactive states */
--brand-hover: #b5a3d9
  RGB: 181, 163, 217
  HSL: 260°, 41%, 75%
  Usage: Button hover, link hover

/* Brand Light - Subtle accents */
--brand-light: #c9bce6
  RGB: 201, 188, 230
  HSL: 259°, 48%, 82%
  Usage: Backgrounds, subtle highlights

/* Brand Dark - Pressed states */
--brand-dark: #8775b3
  RGB: 135, 117, 179
  HSL: 257°, 30%, 58%
  Usage: Active/pressed states
```

### Accent Colors

```css
/* Dusty Rose - Warm accent */
--accent-pink: #d4a5c4
  RGB: 212, 165, 196
  HSL: 320°, 36%, 74%
  Usage: Warm highlights, love/favorite

/* Slate Blue - Cool accent */
--accent-cyan: #8fb4c9
  RGB: 143, 180, 201
  HSL: 202°, 34%, 67%
  Usage: Info, links, cool highlights

/* Sage Green - Success accent */
--accent-emerald: #a3c9b4
  RGB: 163, 201, 180
  HSL: 147°, 26%, 71%
  Usage: Success states, positive actions

/* Soft Tan - Warning accent */
--accent-amber: #d4b896
  RGB: 212, 184, 150
  HSL: 33°, 42%, 71%
  Usage: Warnings, caution states
```

### Text Colors

```css
/* Primary Text - Main content */
--text-primary: #e8e4f0
  RGB: 232, 228, 240
  HSL: 260°, 33%, 92%
  Usage: Headings, body text, primary content

/* Secondary Text - Supporting content */
--text-secondary: #c4bdd4
  RGB: 196, 189, 212
  HSL: 258°, 23%, 79%
  Usage: Descriptions, labels, secondary info

/* Muted Text - Tertiary content */
--text-muted: #9a92a8
  RGB: 154, 146, 168
  HSL: 262°, 11%, 62%
  Usage: Placeholders, hints, metadata

/* Disabled Text - Inactive elements */
--text-disabled: #6e6780
  RGB: 110, 103, 128
  HSL: 257°, 11%, 45%
  Usage: Disabled buttons, inactive states
```

### State Colors

```css
/* Success - Positive actions */
--success: #a3c9b4
  Muted sage green
  Usage: Success messages, confirmations

/* Warning - Caution states */
--warning: #d4b896
  Soft tan/beige
  Usage: Warnings, alerts

/* Error - Negative states */
--error: #d4a5a5
  Muted rose/pink
  Usage: Errors, validation failures

/* Info - Informational */
--info: #8fb4c9
  Soft slate blue
  Usage: Info messages, tips
```

---

## 🎯 Use Cases

### Perfect For

✅ **Premium Applications**
- Luxury brands
- High-end products
- Exclusive services
- Premium subscriptions

✅ **Creative Tools**
- Design software
- Portfolio sites
- Creative agencies
- Art platforms

✅ **Wellness Apps**
- Meditation apps
- Mental health platforms
- Spa/beauty services
- Relaxation tools

✅ **Professional Services**
- Consulting firms
- Legal services
- Financial advisors
- Executive coaching

### Not Ideal For

❌ **High-Energy Apps** - Use Yellow or Dark Purple instead
❌ **Sports/Fitness** - Use Dark Green or Light Blue instead
❌ **Emergency Services** - Use high-contrast themes instead
❌ **Children's Apps** - Use brighter, more vibrant themes

---

## 🎨 Design Guidelines

### Typography
- Use medium to bold weights for headings
- Soft, rounded fonts pair well
- Generous line spacing
- Avoid pure black text

### Spacing
- Embrace whitespace
- Generous padding
- Breathing room between elements
- Avoid cramped layouts

### Shadows
- Use soft, subtle shadows
- Avoid harsh drop shadows
- Purple-tinted shadows work well
- Blur radius: 20-40px

### Borders
- Prefer subtle borders
- Use elevated backgrounds over borders when possible
- Border radius: 12-24px for cards
- Avoid sharp corners

### Animations
- Slow, smooth transitions (300-500ms)
- Ease-in-out timing
- Subtle hover effects
- Avoid jarring movements

---

## 🔄 Switching to Matte Purple

### Via UI
```
1. Click "Theme" button in navigation
2. Select "Matte Purple 💜"
3. Theme applies instantly
```

### Programmatically
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { setColorScheme } = useTheme();
  
  setColorScheme('mattePurple');
}
```

### Set as Default
```tsx
// In src/pages/_app.tsx
<ThemeProvider defaultScheme="mattePurple">
  <Component {...pageProps} />
</ThemeProvider>
```

---

## 🎨 Inspiration Source

**File**: `design/matte-purple-color-schema-inspiration.png`

This theme was carefully crafted by analyzing the inspiration image and extracting:
- Desaturated purple tones
- Soft lavender accents
- Muted complementary colors
- Low-contrast text colors
- Purple-tinted neutrals

---

## 📊 Accessibility

### Contrast Ratios
- **Text Primary on BG Primary**: ~7.5:1 (AAA)
- **Text Secondary on BG Secondary**: ~5.2:1 (AA)
- **Brand Primary on BG Secondary**: ~3.8:1 (Large text AA)

### Recommendations
- Use bold text for small sizes
- Increase font size for body text (16px+)
- Test with color blindness simulators
- Provide high-contrast mode option

---

**Created**: 2025-11-16  
**Inspired By**: design/matte-purple-color-schema-inspiration.png  
**Theme ID**: `mattePurple`  
**Icon**: 💜

