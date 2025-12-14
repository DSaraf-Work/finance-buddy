/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Airbnb Color Palette
      colors: {
        // Primary Colors
        'airbnb-red': '#FF5A5F',
        'airbnb-teal': '#00A699',
        'airbnb-teal-dark': '#008489',
        
        // Neutral Colors
        'airbnb-white': '#FFFFFF',
        'airbnb-gray-light': '#F7F7F7',
        'airbnb-gray-hover': '#F0F0F0',
        'airbnb-text-primary': '#222222',
        'airbnb-text-secondary': '#717171',
        'airbnb-text-tertiary': '#B0B0B0',
        'airbnb-border-light': '#DDDDDD',
        'airbnb-border-medium': '#C4C4C4',
        
        // Semantic Colors
        'airbnb-success': '#00A699',
        'airbnb-error': '#FF5A5F',
        'airbnb-warning': '#FFB400',
        'airbnb-info': '#00A699',
      },
      
      // Typography
      fontFamily: {
        'airbnb': ['Circular', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'sans': ['Circular', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      
      fontSize: {
        'display-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-md': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-lg': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-md': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      
      // Spacing (8px base - already default in Tailwind)
      spacing: {
        // Additional spacing if needed
      },
      
      // Border Radius
      borderRadius: {
        'airbnb-sm': '4px',
        'airbnb-md': '8px',
        'airbnb-lg': '12px',
        'airbnb-xl': '16px',
      },
      
      // Box Shadows
      boxShadow: {
        'airbnb-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'airbnb-md': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'airbnb-lg': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'airbnb-xl': '0 8px 16px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
