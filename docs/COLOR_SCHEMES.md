# Finance Buddy - Color Schemes Reference

## Overview

Finance Buddy includes **8 professionally designed color schemes** that can be switched at runtime. Each theme is carefully crafted with accessibility, aesthetics, and use-case in mind.

---

## 🎨 Available Color Schemes

### 1. Dark Purple (Default) 🌙

**Best For:** Finance apps, professional dashboards, modern interfaces

**Color Palette:**
```css
Background Primary:   #0f0a1a  /* Deep purple-black */
Background Secondary: #1a1625  /* Dark purple-gray */
Background Elevated:  #2d1b4e  /* Medium purple */
Brand Primary:        #6b4ce6  /* Vibrant purple */
Brand Hover:          #8b5cf6  /* Light purple */
```

**Use Cases:**
- Financial applications
- Professional dashboards
- Modern SaaS products
- Analytics platforms

---

### 2. Dark Blue 💼

**Best For:** Corporate apps, business tools, enterprise applications

**Color Palette:**
```css
Background Primary:   #0a0f1a  /* Deep navy */
Background Secondary: #16192e  /* Dark blue-gray */
Background Elevated:  #1b2d4e  /* Medium blue */
Brand Primary:        #3b82f6  /* Bright blue */
Brand Hover:          #60a5fa  /* Light blue */
```

**Use Cases:**
- Corporate dashboards
- Business intelligence tools
- Enterprise software
- Professional services

---

### 3. Light ☀️

**Best For:** Daytime use, accessibility, traditional interfaces

**Color Palette:**
```css
Background Primary:   #ffffff  /* Pure white */
Background Secondary: #f9fafb  /* Light gray */
Background Elevated:  #f3f4f6  /* Medium gray */
Brand Primary:        #6b4ce6  /* Vibrant purple */
Brand Hover:          #5b3cc4  /* Dark purple */
Text Primary:         #111827  /* Dark gray (inverted) */
```

**Use Cases:**
- Daytime work environments
- High accessibility requirements
- Traditional business apps
- Print-friendly interfaces

---

### 4. Dark Green 🌿

**Best For:** Nature-themed apps, eco-friendly brands, wellness applications

**Color Palette:**
```css
Background Primary:   #0a1a0f  /* Deep forest green */
Background Secondary: #162519  /* Dark green-gray */
Background Elevated:  #1b4e2d  /* Medium green */
Brand Primary:        #10b981  /* Emerald green */
Brand Hover:          #34d399  /* Light emerald */
Text Primary:         #f0fdf4  /* Mint white */
```

**Use Cases:**
- Environmental apps
- Health & wellness platforms
- Sustainability dashboards
- Nature-focused products

---

### 5. Light Blue ☁️

**Best For:** Cloud services, communication apps, sky-themed interfaces

**Color Palette:**
```css
Background Primary:   #0a1929  /* Deep ocean blue */
Background Secondary: #132f4c  /* Dark sky blue */
Background Elevated:  #1e4976  /* Medium sky blue */
Brand Primary:        #0ea5e9  /* Sky blue */
Brand Hover:          #38bdf8  /* Light sky blue */
Text Primary:         #e0f2fe  /* Cloud white */
```

**Use Cases:**
- Cloud platforms
- Communication tools
- Weather applications
- Aviation/travel apps

---

### 6. Yellow ⭐

**Best For:** Creative apps, warm aesthetics, inviting interfaces

**Color Palette:**
```css
Background Primary:   #1a1410  /* Deep amber-black */
Background Secondary: #2d2416  /* Dark amber-gray */
Background Elevated:  #4e3d1b  /* Medium amber */
Brand Primary:        #f59e0b  /* Golden amber */
Brand Hover:          #fbbf24  /* Light amber */
Text Primary:         #fef3c7  /* Cream white */
```

**Use Cases:**
- Creative tools
- Educational platforms
- Food & beverage apps
- Warm, inviting interfaces

---

### 7. Monotone ⚫

**Best For:** Minimal distraction, focus mode, grayscale aesthetics

**Color Palette:**
```css
Background Primary:   #0a0a0a  /* Pure black */
Background Secondary: #171717  /* Dark gray */
Background Elevated:  #262626  /* Medium gray */
Brand Primary:        #737373  /* Neutral gray */
Brand Hover:          #a3a3a3  /* Light gray */
Text Primary:         #fafafa  /* Off-white */
```

**Use Cases:**
- Focus/concentration modes
- Minimal distraction environments
- Grayscale photography apps
- Accessibility (color-blind friendly)

---

### 8. Matte Purple 💜

**Best For:** Sophisticated interfaces, elegant designs, calming aesthetics

**Color Palette:**
```css
Background Primary:   #1a1625  /* Deep matte purple-gray */
Background Secondary: #252033  /* Slightly lighter matte purple */
Background Elevated:  #332d47  /* Elevated matte purple */
Brand Primary:        #9d8ac7  /* Soft lavender */
Brand Hover:          #b5a3d9  /* Lighter lavender */
Text Primary:         #e8e4f0  /* Soft white with purple tint */
```

**Design Philosophy:**
- **Matte Finish**: Desaturated colors for a soft, non-glossy appearance
- **Sophisticated**: Elegant lavender tones instead of vibrant purple
- **Calming**: Muted palette reduces visual stress
- **Professional**: Perfect balance between personality and professionalism

**Use Cases:**
- Premium/luxury applications
- Design-focused products
- Wellness and meditation apps
- Creative professional tools
- Portfolio and showcase sites
- Fashion and lifestyle apps

**Inspired By:** `design/matte-purple-color-schema-inspiration.png`

---

## 🔄 Switching Themes

### Via UI
1. Click the **Theme** button in the navigation bar
2. Select your desired color scheme from the dropdown
3. Theme changes instantly across the entire app

### Programmatically
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { colorScheme, setColorScheme } = useTheme();
  
  // Switch to a specific theme
  setColorScheme('darkGreen');
  
  // Get current theme
  console.log(colorScheme); // 'darkPurple'
}
```

### Default Theme
Set the default theme in `src/pages/_app.tsx`:
```tsx
<ThemeProvider defaultScheme="darkPurple">
  {/* Your app */}
</ThemeProvider>
```

---

## 🎯 Theme Selection Guide

| Use Case | Recommended Theme |
|----------|-------------------|
| Finance/Banking | Dark Purple, Dark Blue |
| Corporate/Enterprise | Dark Blue, Light |
| Health/Wellness | Dark Green, Matte Purple |
| Cloud/SaaS | Light Blue, Dark Blue |
| Creative/Design | Yellow, Matte Purple |
| Focus/Productivity | Monotone, Light |
| Accessibility | Light, Monotone |
| Eco/Sustainability | Dark Green |
| Luxury/Premium | Matte Purple |
| Portfolio/Showcase | Matte Purple, Dark Purple |

---

## 🌈 Color Accessibility

All themes are designed with **WCAG AA** compliance in mind:

- **Contrast Ratios**: Minimum 4.5:1 for normal text
- **Focus Indicators**: Always visible and high contrast
- **State Colors**: Distinct success, warning, error states
- **Monotone Theme**: Fully color-blind friendly

---

## 🛠️ Customization

### Modify Existing Theme
Edit `src/styles/design-tokens.ts`:
```typescript
export const colorSchemes = {
  darkPurple: {
    colors: {
      brandPrimary: '#YOUR_COLOR', // Change this
      // ...
    },
  },
}
```

### Add New Theme
1. Add to `colorSchemes` in `src/styles/design-tokens.ts`
2. Update `availableSchemes` in `src/contexts/ThemeContext.tsx`
3. Add icon and color in `src/components/ThemeSwitcher.tsx`

---

## 📊 Theme Comparison

| Theme | Brightness | Contrast | Best Time | Energy | Saturation |
|-------|-----------|----------|-----------|--------|------------|
| Dark Purple | Low | High | Night | Professional | High |
| Dark Blue | Low | High | Night | Corporate | High |
| Light | High | Medium | Day | Clean | Medium |
| Dark Green | Low | High | Night | Calm | Medium |
| Light Blue | Medium | High | Any | Fresh | High |
| Yellow | Medium | Medium | Day | Warm | High |
| Monotone | Low | High | Any | Focused | None |
| Matte Purple | Low | Medium | Any | Sophisticated | Low |

---

## 🎨 Design Philosophy

Each theme follows these principles:

1. **Consistency**: All themes use the same design token structure
2. **Accessibility**: WCAG AA compliant contrast ratios
3. **Purpose**: Each theme serves specific use cases
4. **Harmony**: Colors are carefully balanced
5. **Flexibility**: Easy to customize and extend

---

## 🎨 Matte Purple - Design Details

The **Matte Purple** theme was inspired by `design/matte-purple-color-schema-inspiration.png` and features:

### Key Characteristics
1. **Desaturated Colors**: All colors are intentionally muted for a soft, matte appearance
2. **Lavender Base**: Uses soft lavender (#9d8ac7) instead of vibrant purple
3. **Low Contrast**: Gentler on the eyes for extended use
4. **Sophisticated Palette**: Dusty rose, slate blue, sage green accents
5. **Purple-Tinted Neutrals**: Even grays have subtle purple undertones

### Color Psychology
- **Calming**: Muted tones reduce visual stress
- **Elegant**: Sophisticated without being flashy
- **Creative**: Inspires creativity while maintaining professionalism
- **Premium**: Conveys quality and attention to detail

### Best Paired With
- Minimalist designs
- Large whitespace
- Subtle animations
- Soft shadows
- Rounded corners

---

**Last Updated**: 2025-11-16
**Total Themes**: 8
**Default Theme**: Dark Purple
**Newest Theme**: Matte Purple 💜

