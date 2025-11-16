import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ColorScheme, defaultColorScheme, generateCSSVariables } from '@/styles/design-tokens';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  availableSchemes: ColorScheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultScheme?: ColorScheme;
}

export function ThemeProvider({ children, defaultScheme = defaultColorScheme }: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(defaultScheme);

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedScheme = localStorage.getItem('fb-color-scheme') as ColorScheme;
    const validSchemes = ['darkPurple', 'darkBlue', 'light', 'darkGreen', 'lightBlue', 'yellow', 'monotone', 'mattePurple'];
    if (savedScheme && validSchemes.includes(savedScheme)) {
      setColorSchemeState(savedScheme);
    }
  }, []);

  // Apply CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = generateCSSVariables(colorScheme);
    
    // Parse and apply CSS variables
    const lines = cssVars.split('\n').filter(line => line.trim() && !line.includes('/*'));
    lines.forEach(line => {
      const match = line.match(/--([^:]+):\s*([^;]+);/);
      if (match) {
        const [, property, value] = match;
        root.style.setProperty(`--${property.trim()}`, value.trim());
      }
    });
  }, [colorScheme]);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem('fb-color-scheme', scheme);
  };

  const availableSchemes: ColorScheme[] = [
    'darkPurple',
    'darkBlue',
    'light',
    'darkGreen',
    'lightBlue',
    'yellow',
    'monotone',
    'mattePurple'
  ];

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, availableSchemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

