/**
 * Finance Buddy - Global Design System
 * 
 * This file contains all design tokens (colors, typography, spacing, etc.)
 * Update values here to change the design system globally.
 */

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const colorSchemes = {
  // Dark Purple Theme (Default)
  darkPurple: {
    name: 'Dark Purple',
    colors: {
      // Background colors
      bgPrimary: '#0f0a1a',
      bgSecondary: '#1a1625',
      bgElevated: '#2d1b4e',
      bgHover: '#3d2b5e',
      
      // Brand colors
      brandPrimary: '#6b4ce6',
      brandHover: '#8b5cf6',
      brandLight: '#a78bfa',
      brandDark: '#5b3cc4',
      
      // Accent colors
      accentPink: '#ec4899',
      accentCyan: '#06b6d4',
      accentEmerald: '#10b981',
      accentAmber: '#f59e0b',
      
      // Text colors
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      textDisabled: '#64748b',
      
      // State colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      
      // Border colors
      border: '#2d1b4e',
      borderLight: '#3d2b5e',
      divider: '#1a1625',
    },
  },
  
  // Dark Blue Theme
  darkBlue: {
    name: 'Dark Blue',
    colors: {
      bgPrimary: '#0a0f1a',
      bgSecondary: '#16192e',
      bgElevated: '#1b2d4e',
      bgHover: '#2b3d5e',
      
      brandPrimary: '#3b82f6',
      brandHover: '#60a5fa',
      brandLight: '#93c5fd',
      brandDark: '#2563eb',
      
      accentPink: '#ec4899',
      accentCyan: '#06b6d4',
      accentEmerald: '#10b981',
      accentAmber: '#f59e0b',
      
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      textDisabled: '#64748b',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      
      border: '#1b2d4e',
      borderLight: '#2b3d5e',
      divider: '#16192e',
    },
  },
  
  // Light Theme
  light: {
    name: 'Light',
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgElevated: '#f3f4f6',
      bgHover: '#e5e7eb',

      brandPrimary: '#6b4ce6',
      brandHover: '#5b3cc4',
      brandLight: '#8b5cf6',
      brandDark: '#4b2ca4',

      accentPink: '#ec4899',
      accentCyan: '#06b6d4',
      accentEmerald: '#10b981',
      accentAmber: '#f59e0b',

      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      textDisabled: '#9ca3af',

      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',

      border: '#e5e7eb',
      borderLight: '#f3f4f6',
      divider: '#e5e7eb',
    },
  },

  // Dark Green Theme
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

      accentPink: '#ec4899',
      accentCyan: '#06b6d4',
      accentEmerald: '#10b981',
      accentAmber: '#f59e0b',

      textPrimary: '#f0fdf4',
      textSecondary: '#d1fae5',
      textMuted: '#a7f3d0',
      textDisabled: '#6ee7b7',

      success: '#10b981',
      warning: '#fbbf24',
      error: '#ef4444',
      info: '#06b6d4',

      border: '#1b4e2d',
      borderLight: '#2b5e3d',
      divider: '#162519',
    },
  },

  // Light Blue Theme
  lightBlue: {
    name: 'Light Blue',
    colors: {
      bgPrimary: '#0a1929',
      bgSecondary: '#132f4c',
      bgElevated: '#1e4976',
      bgHover: '#2e5984',

      brandPrimary: '#0ea5e9',
      brandHover: '#38bdf8',
      brandLight: '#7dd3fc',
      brandDark: '#0284c7',

      accentPink: '#ec4899',
      accentCyan: '#06b6d4',
      accentEmerald: '#10b981',
      accentAmber: '#f59e0b',

      textPrimary: '#e0f2fe',
      textSecondary: '#bae6fd',
      textMuted: '#7dd3fc',
      textDisabled: '#38bdf8',

      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0ea5e9',

      border: '#1e4976',
      borderLight: '#2e5984',
      divider: '#132f4c',
    },
  },

  // Yellow/Amber Theme
  yellow: {
    name: 'Yellow',
    colors: {
      bgPrimary: '#1a1410',
      bgSecondary: '#2d2416',
      bgElevated: '#4e3d1b',
      bgHover: '#5e4d2b',

      brandPrimary: '#f59e0b',
      brandHover: '#fbbf24',
      brandLight: '#fcd34d',
      brandDark: '#d97706',

      accentPink: '#ec4899',
      accentCyan: '#06b6d4',
      accentEmerald: '#10b981',
      accentAmber: '#f59e0b',

      textPrimary: '#fef3c7',
      textSecondary: '#fde68a',
      textMuted: '#fcd34d',
      textDisabled: '#fbbf24',

      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',

      border: '#4e3d1b',
      borderLight: '#5e4d2b',
      divider: '#2d2416',
    },
  },

  // Monotone/Grayscale Theme
  monotone: {
    name: 'Monotone',
    colors: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#171717',
      bgElevated: '#262626',
      bgHover: '#404040',

      brandPrimary: '#737373',
      brandHover: '#a3a3a3',
      brandLight: '#d4d4d4',
      brandDark: '#525252',

      accentPink: '#737373',
      accentCyan: '#a3a3a3',
      accentEmerald: '#d4d4d4',
      accentAmber: '#525252',

      textPrimary: '#fafafa',
      textSecondary: '#e5e5e5',
      textMuted: '#a3a3a3',
      textDisabled: '#737373',

      success: '#a3a3a3',
      warning: '#737373',
      error: '#525252',
      info: '#d4d4d4',

      border: '#262626',
      borderLight: '#404040',
      divider: '#171717',
    },
  },

  // Matte Purple Theme (Inspired by design/matte-purple-color-schema-inspiration.png)
  mattePurple: {
    name: 'Matte Purple',
    colors: {
      // Soft, desaturated purple backgrounds
      bgPrimary: '#1a1625',      // Deep matte purple-gray
      bgSecondary: '#252033',     // Slightly lighter matte purple
      bgElevated: '#332d47',      // Elevated matte purple
      bgHover: '#3d3751',         // Hover state with subtle lift

      // Muted purple brand colors (desaturated for matte effect)
      brandPrimary: '#9d8ac7',    // Soft lavender (main brand)
      brandHover: '#b5a3d9',      // Lighter lavender on hover
      brandLight: '#c9bce6',      // Very light lavender
      brandDark: '#8775b3',       // Darker muted purple

      // Soft complementary accents
      accentPink: '#d4a5c4',      // Muted dusty rose
      accentCyan: '#8fb4c9',      // Soft slate blue
      accentEmerald: '#a3c9b4',   // Muted sage green
      accentAmber: '#d4b896',     // Soft tan/beige

      // Text colors with good contrast on matte backgrounds
      textPrimary: '#e8e4f0',     // Soft white with purple tint
      textSecondary: '#c4bdd4',   // Muted lavender-gray
      textMuted: '#9a92a8',       // Desaturated purple-gray
      textDisabled: '#6e6780',    // Darker muted gray

      // State colors (muted to match matte aesthetic)
      success: '#a3c9b4',         // Soft sage green
      warning: '#d4b896',         // Soft amber/tan
      error: '#d4a5a5',           // Muted rose/pink
      info: '#8fb4c9',            // Soft slate blue

      // Borders with subtle purple tint
      border: '#332d47',          // Matches elevated bg
      borderLight: '#3d3751',     // Slightly lighter
      divider: '#252033',         // Matches secondary bg
    },
  },
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Courier New", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  purple: '0 0 20px rgba(107, 76, 230, 0.3)',
  blue: '0 0 20px rgba(59, 130, 246, 0.3)',
  emerald: '0 0 10px rgba(16, 185, 129, 0.2)',
  amber: '0 0 10px rgba(245, 158, 11, 0.2)',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// DEFAULT THEME
// ============================================================================

export type ColorScheme = keyof typeof colorSchemes;
export const defaultColorScheme: ColorScheme = 'darkPurple';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a color scheme by name
 */
export function getColorScheme(scheme: ColorScheme = defaultColorScheme) {
  return colorSchemes[scheme];
}

/**
 * Generate CSS variables from a color scheme
 */
export function generateCSSVariables(scheme: ColorScheme = defaultColorScheme) {
  const colors = colorSchemes[scheme].colors;

  return `
    /* Background Colors */
    --color-bg-primary: ${colors.bgPrimary};
    --color-bg-secondary: ${colors.bgSecondary};
    --color-bg-elevated: ${colors.bgElevated};
    --color-bg-hover: ${colors.bgHover};

    /* Brand Colors */
    --color-brand-primary: ${colors.brandPrimary};
    --color-brand-hover: ${colors.brandHover};
    --color-brand-light: ${colors.brandLight};
    --color-brand-dark: ${colors.brandDark};

    /* Accent Colors */
    --color-accent-pink: ${colors.accentPink};
    --color-accent-cyan: ${colors.accentCyan};
    --color-accent-emerald: ${colors.accentEmerald};
    --color-accent-amber: ${colors.accentAmber};

    /* Text Colors */
    --color-text-primary: ${colors.textPrimary};
    --color-text-secondary: ${colors.textSecondary};
    --color-text-muted: ${colors.textMuted};
    --color-text-disabled: ${colors.textDisabled};

    /* State Colors */
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --color-info: ${colors.info};

    /* Border Colors */
    --color-border: ${colors.border};
    --color-border-light: ${colors.borderLight};
    --color-divider: ${colors.divider};

    /* Typography */
    --font-sans: ${typography.fontFamily.sans};
    --font-mono: ${typography.fontFamily.mono};

    /* Spacing */
    --space-1: ${spacing[1]};
    --space-2: ${spacing[2]};
    --space-3: ${spacing[3]};
    --space-4: ${spacing[4]};
    --space-6: ${spacing[6]};
    --space-8: ${spacing[8]};

    /* Border Radius */
    --radius-sm: ${borderRadius.sm};
    --radius-md: ${borderRadius.md};
    --radius-lg: ${borderRadius.lg};
    --radius-xl: ${borderRadius.xl};

    /* Shadows */
    --shadow-sm: ${shadows.sm};
    --shadow-md: ${shadows.md};
    --shadow-lg: ${shadows.lg};
    --shadow-xl: ${shadows.xl};

    /* Transitions */
    --transition-fast: ${transitions.fast};
    --transition-base: ${transitions.base};
    --transition-slow: ${transitions.slow};
  `;
}

