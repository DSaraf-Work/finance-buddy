#!/usr/bin/env node

/**
 * Color Migration Script
 * Replaces hardcoded hex colors and Tailwind colors with CSS variables
 * 
 * Usage: node scripts/migrate-colors-to-css-vars.js <file-path>
 */

const fs = require('fs');
const path = require('path');

// Color mappings: hardcoded -> CSS variable
const colorMappings = {
  // Hex colors to CSS variables
  '#0F1624': 'var(--color-bg-app)',
  '#0f0a1a': 'var(--color-bg-app)',
  '#151E2E': 'var(--color-bg-primary)',
  '#1B2638': 'var(--color-bg-card)',
  '#1a1625': 'var(--color-bg-card)',
  '#22304A': 'var(--color-bg-elevated)',
  '#2E3C55': 'var(--color-border)',
  '#2d1b4e': 'var(--color-border)',
  '#E9EEF5': 'var(--color-text-primary)',
  '#f8fafc': 'var(--color-text-primary)',
  '#B8C4D6': 'var(--color-text-secondary)',
  '#cbd5e1': 'var(--color-text-secondary)',
  '#8C9BB0': 'var(--color-text-muted)',
  '#94a3b8': 'var(--color-text-muted)',
  '#64748B': 'var(--color-text-disabled)',
  '#5B8CFF': 'var(--color-accent-primary)',
  '#6b4ce6': 'var(--color-accent-primary)', // Old purple, map to accent
  '#6FA0FF': 'var(--color-accent-hover)',
  '#8b5cf6': 'var(--color-accent-hover)', // Old purple hover
  '#8FB6FF': 'var(--color-accent-highlight)',
  '#4FBF9A': 'var(--color-income)',
  '#10b981': 'var(--color-income)', // Green success
  '#E07A7A': 'var(--color-expense)',
  '#ef4444': 'var(--color-expense)', // Red error
  '#E1B15C': 'var(--color-warning)',
  '#6FB6D9': 'var(--color-info)',
  
  // Tailwind color classes to CSS variables
  'bg-gray-50': 'bg-[var(--color-bg-elevated)]',
  'bg-gray-100': 'bg-[var(--color-bg-elevated)]',
  'bg-gray-200': 'bg-[var(--color-border)]',
  'bg-gray-300': 'bg-[var(--color-border)]',
  'bg-gray-400': 'bg-[var(--color-text-muted)]',
  'bg-gray-500': 'bg-[var(--color-text-muted)]',
  'bg-gray-600': 'bg-[var(--color-text-disabled)]',
  'bg-gray-700': 'bg-[var(--color-text-disabled)]',
  'bg-gray-800': 'bg-[var(--color-bg-card)]',
  'bg-gray-900': 'bg-[var(--color-bg-app)]',
  
  'text-gray-50': 'text-[var(--color-text-primary)]',
  'text-gray-100': 'text-[var(--color-text-primary)]',
  'text-gray-200': 'text-[var(--color-text-secondary)]',
  'text-gray-300': 'text-[var(--color-text-secondary)]',
  'text-gray-400': 'text-[var(--color-text-muted)]',
  'text-gray-500': 'text-[var(--color-text-muted)]',
  'text-gray-600': 'text-[var(--color-text-muted)]',
  'text-gray-700': 'text-[var(--color-text-secondary)]',
  'text-gray-800': 'text-[var(--color-text-primary)]',
  'text-gray-900': 'text-[var(--color-text-primary)]',
  
  'border-gray-200': 'border-[var(--color-border)]',
  'border-gray-300': 'border-[var(--color-border)]',
  'border-gray-400': 'border-[var(--color-text-muted)]',
  
  'bg-blue-50': 'bg-[var(--color-info)]/10',
  'bg-blue-100': 'bg-[var(--color-info)]/20',
  'bg-blue-500': 'bg-[var(--color-accent-primary)]',
  'bg-blue-600': 'bg-[var(--color-accent-primary)]',
  'bg-blue-700': 'bg-[var(--color-accent-hover)]',
  'bg-blue-800': 'bg-[var(--color-accent-primary)]',
  
  'text-blue-500': 'text-[var(--color-accent-primary)]',
  'text-blue-600': 'text-[var(--color-accent-primary)]',
  'text-blue-700': 'text-[var(--color-accent-hover)]',
  'text-blue-800': 'text-[var(--color-accent-primary)]',
  'text-blue-900': 'text-[var(--color-accent-primary)]',
  
  'bg-red-600': 'bg-[var(--color-expense)]',
  'bg-red-700': 'bg-[var(--color-expense)]',
  'bg-green-600': 'bg-[var(--color-income)]',
  'bg-green-700': 'bg-[var(--color-income)]',
  'bg-purple-600': 'bg-[var(--color-accent-primary)]',
  'bg-purple-700': 'bg-[var(--color-accent-hover)]',
  
  'text-white': 'text-[var(--color-text-primary)]',
  'bg-white': 'bg-[var(--color-bg-card)]',
  'bg-black': 'bg-[var(--color-bg-app)]',
};

function migrateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace hex colors in brackets
  for (const [oldColor, newColor] of Object.entries(colorMappings)) {
    if (oldColor.startsWith('#')) {
      // Replace in brackets: bg-[#color], text-[#color], etc.
      const regex = new RegExp(`\\[${oldColor.replace('#', '#')}\\]`, 'gi');
      if (content.match(regex)) {
        content = content.replace(regex, `[${newColor}]`);
        changed = true;
      }
      
      // Replace standalone hex in className strings
      const regex2 = new RegExp(`(className="[^"]*?)${oldColor}([^"]*?")`, 'gi');
      if (content.match(regex2)) {
        content = content.replace(regex2, `$1${newColor}$2`);
        changed = true;
      }
    } else {
      // Replace Tailwind classes
      const regex = new RegExp(`\\b${oldColor}\\b`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, newColor);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes: ${filePath}`);
  }
}

// Main
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/migrate-colors-to-css-vars.js <file-path>');
  process.exit(1);
}

migrateFile(filePath);
