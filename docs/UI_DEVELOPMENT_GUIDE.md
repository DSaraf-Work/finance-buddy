# UI Development Guide

## Important: Always Use shadcn/ui MCP Server

**⚠️ MANDATORY: For any UI modifications, updates, or additions, you MUST use the shadcn-ui-server MCP to fetch the latest component code.**

### Why Use shadcn/ui MCP Server?

1. **Consistency**: Ensures all components follow the same patterns
2. **Latest Updates**: Always get the most recent component implementations
3. **Best Practices**: Components include accessibility and performance optimizations
4. **Theme Integration**: Components are designed to work with our theming system

### How to Use shadcn/ui Components

#### 1. Check Available Components
```typescript
// Use the MCP server to list all available components
mcp__shadcn-ui-server__list_components()
```

#### 2. Get Component Code
```typescript
// Fetch the component implementation
mcp__shadcn-ui-server__get_component(componentName: "button")
```

#### 3. Get Component Demo
```typescript
// See usage examples
mcp__shadcn-ui-server__get_component_demo(componentName: "button")
```

#### 4. Customize for Our Theme
- Components are placed in `/src/components/ui/`
- Modify to use our theme variables from `/src/styles/theme.css`
- Maintain consistent sizing (44px min height for interactive elements)

## Theme System

### Global Theme Configuration

All theme variables are centralized in `/src/styles/theme.css`. To change the app's appearance, modify the CSS variables in this file.

### Key Theme Variables

```css
/* Backgrounds */
--background: 9 9 11;           /* #09090B - App background */
--card: 10 10 10;              /* #0a0a0a - Card background */

/* Text Colors */
--foreground: 250 250 250;      /* #FAFAFA - Primary text */
--muted-foreground: 0 0 100 / 0.35;  /* Muted text */

/* Semantic Colors */
--success: 142 71 45;           /* #22C55E - Income/success */
--destructive: 0 73 67;         /* #F87171 - Expenses/errors */
--primary: 238 238 93;          /* #6366F1 - Primary actions */
```

### Using Theme Colors in Components

Always use Tailwind utility classes that reference theme variables:

```jsx
// ✅ GOOD - Uses theme variables
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>

// ❌ BAD - Hardcoded colors
<div style={{ background: '#09090B', color: '#FAFAFA' }}>
  <button style={{ background: '#6366F1' }}>
    Click me
  </button>
</div>
```

## Component Development Workflow

### 1. Check if Component Exists in shadcn/ui
```bash
# Use the MCP server
mcp__shadcn-ui-server__list_components()
```

### 2. Fetch and Customize Component
```bash
# Get the component
mcp__shadcn-ui-server__get_component(componentName: "dialog")

# Customize for our theme
- Adjust border radius to use our --radius variable
- Ensure min-height of 44px for interactive elements
- Use our color scheme variables
```

### 3. Create Component File
Place in `/src/components/ui/[component-name].tsx`

### 4. Test Component
- Visual testing with Playwright
- Cross-browser testing
- Mobile responsiveness
- Accessibility checks

### 5. Document Usage
Update component library documentation with usage examples

## Common Components Reference

| Component | shadcn/ui Name | Location | Notes |
|-----------|---------------|----------|-------|
| Button | button | /components/ui/button.tsx | Primary CTA component |
| Card | card | /components/ui/card.tsx | Container component |
| Input | input | /components/ui/input.tsx | Form input field |
| Select | select | /components/ui/select.tsx | Dropdown select |
| Dialog | dialog | /components/ui/dialog.tsx | Modal dialogs |
| Toast | sonner | /components/ui/sonner.tsx | Notifications |
| Badge | badge | /components/ui/badge.tsx | Status indicators |
| Skeleton | skeleton | /components/ui/skeleton.tsx | Loading states |
| Table | table | /components/ui/table.tsx | Data tables |
| Tabs | tabs | /components/ui/tabs.tsx | Tab navigation |

## Testing Requirements

### Visual Testing with Playwright

```javascript
// Take screenshots before changes
await page.goto('/transactions');
await page.screenshot({ path: 'before.png' });

// Make changes

// Take screenshots after changes
await page.screenshot({ path: 'after.png' });

// Compare for visual regression
```

### Accessibility Testing

All components must:
- Have proper ARIA labels
- Support keyboard navigation
- Meet WCAG 2.1 AA standards
- Have sufficient color contrast

## Deployment

### Vercel Preview Deployments

1. Create a branch for your changes
2. Push to GitHub
3. Vercel automatically creates a preview deployment
4. Test in the preview environment
5. Merge when approved

## Do's and Don'ts

### ✅ DO's
- Always use shadcn/ui MCP server for component code
- Use theme variables for all colors
- Maintain 44px minimum height for interactive elements
- Test on mobile devices (430px width)
- Create meaningful commits for each component
- Document component usage

### ❌ DON'Ts
- Don't hardcode colors
- Don't create custom components if shadcn/ui has one
- Don't skip accessibility testing
- Don't modify theme variables without team approval
- Don't use inline styles for theming
- Don't forget to test in dark mode

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Finance Buddy Design System](/docs/DESIGN_SYSTEM.md)
- [Component Library](/docs/COMPONENT_LIBRARY.md)