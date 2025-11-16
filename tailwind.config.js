import { colorSchemes, typography, spacing, borderRadius, shadows, breakpoints } from './src/styles/design-tokens.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colors - Use CSS variables for runtime theme switching
      colors: {
        // Background colors
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-hover': 'var(--color-bg-hover)',

        // Brand colors
        'brand-primary': 'var(--color-brand-primary)',
        'brand-hover': 'var(--color-brand-hover)',
        'brand-light': 'var(--color-brand-light)',
        'brand-dark': 'var(--color-brand-dark)',

        // Accent colors
        'accent-pink': 'var(--color-accent-pink)',
        'accent-cyan': 'var(--color-accent-cyan)',
        'accent-emerald': 'var(--color-accent-emerald)',
        'accent-amber': 'var(--color-accent-amber)',

        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',

        // State colors
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
        'info': 'var(--color-info)',

        // Border colors
        'border': 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
        'divider': 'var(--color-divider)',
      },

      // Typography
      fontFamily: {
        sans: typography.fontFamily.sans.split(',').map(f => f.trim()),
        mono: typography.fontFamily.mono.split(',').map(f => f.trim()),
      },

      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,

      // Spacing
      spacing: spacing,

      // Border Radius
      borderRadius: borderRadius,

      // Box Shadow
      boxShadow: shadows,

      // Transitions
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },

      // Breakpoints
      screens: breakpoints,
    },
  },
  plugins: [],
}
