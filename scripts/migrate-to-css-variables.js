#!/usr/bin/env node

/**
 * Migration Script: Convert Hardcoded Colors to CSS Variables
 * 
 * This script helps migrate components from hardcoded hex colors
 * to CSS variables for easy theme switching.
 * 
 * Usage: node scripts/migrate-to-css-variables.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color mappings: hex -> CSS variable
const colorMappings = {
  // Base Surfaces
  '#0F1624': 'var(--color-bg-app)',
  '#0A0B0D': 'var(--color-bg-app)',
  '#151E2E': 'var(--color-bg-primary)',
  '#15161A': 'var(--color-bg-primary)',
  '#1B2638': 'var(--color-bg-card)',
  '#1E2026': 'var(--color-bg-card)',
  '#22304A': 'var(--color-bg-elevated)',
  '#2E3C55': 'var(--color-border)',
  '#2A2C35': 'var(--color-border)',
  
  // Text Colors
  '#E9EEF5': 'var(--color-text-primary)',
  '#F0F1F5': 'var(--color-text-primary)',
  '#B8C4D6': 'var(--color-text-secondary)',
  '#B2B4C2': 'var(--color-text-secondary)',
  '#8C9BB0': 'var(--color-text-muted)',
  '#6F7280': 'var(--color-text-muted)',
  '#64748B': 'var(--color-text-disabled)',
  
  // Accent Blues
  '#5B8CFF': 'var(--color-accent-primary)',
  '#5D5FEF': 'var(--color-accent-primary)',
  '#6FA0FF': 'var(--color-accent-hover)',
  '#888BFF': 'var(--color-accent-hover)',
  '#8FB6FF': 'var(--color-accent-highlight)',
  
  // Finance Semantic
  '#4FBF9A': 'var(--color-income)',
  '#4ECF9E': 'var(--color-income)',
  '#10B981': 'var(--color-income)',
  '#E07A7A': 'var(--color-expense)',
  '#F45C63': 'var(--color-expense)',
  '#E1B15C': 'var(--color-warning)',
  '#f59e0b': 'var(--color-warning)',
  '#6FB6D9': 'var(--color-info)',
  '#6C85FF': 'var(--color-info)',
};

// Border radius mappings
const radiusMappings = {
  'rounded-lg': 'rounded-[var(--radius-md)]',
  'rounded-xl': 'rounded-[var(--radius-lg)]',
  'rounded-2xl': 'rounded-[var(--radius-lg)]',
  'rounded-md': 'rounded-[var(--radius-md)]',
  'rounded-sm': 'rounded-[var(--radius-sm)]',
};

// Shadow mappings
const shadowMappings = {
  'shadow-sm': 'shadow-[var(--shadow-sm)]',
  'shadow-md': 'shadow-[var(--shadow-md)]',
  'shadow-lg': 'shadow-[var(--shadow-lg)]',
  'shadow-xl': 'shadow-[var(--shadow-xl)]',
  'shadow-2xl': 'shadow-[var(--shadow-xl)]',
};

function findTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
      files.push(...findTsxFiles(fullPath));
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Replace hardcoded hex colors with CSS variables
  for (const [hex, cssVar] of Object.entries(colorMappings)) {
    const patterns = [
      // bg-[#HEX]
      new RegExp(`bg-\\[${hex.replace('#', '\\#')}\\]`, 'g'),
      // text-[#HEX]
      new RegExp(`text-\\[${hex.replace('#', '\\#')}\\]`, 'g'),
      // border-[#HEX]
      new RegExp(`border-\\[${hex.replace('#', '\\#')}\\]`, 'g'),
      // border-[#HEX]/XX
      new RegExp(`border-\\[${hex.replace('#', '\\#')}\\]/\\d+`, 'g'),
    ];
    
    patterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        if (index === 3) {
          // Handle opacity variants
          content = content.replace(pattern, (match) => {
            return match.replace(hex, cssVar);
          });
        } else {
          content = content.replace(pattern, match => {
            return match.replace(hex, cssVar);
          });
        }
        changed = true;
      }
    });
  }
  
  // Replace border radius
  for (const [oldRadius, newRadius] of Object.entries(radiusMappings)) {
    if (content.includes(oldRadius)) {
      content = content.replace(new RegExp(oldRadius, 'g'), newRadius);
      changed = true;
    }
  }
  
  // Replace shadows
  for (const [oldShadow, newShadow] of Object.entries(shadowMappings)) {
    if (content.includes(oldShadow)) {
      content = content.replace(new RegExp(oldShadow, 'g'), newShadow);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔄 Starting CSS Variables Migration...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findTsxFiles(srcDir);
  
  console.log(`Found ${files.length} .tsx files\n`);
  
  let migrated = 0;
  for (const file of files) {
    if (migrateFile(file)) {
      migrated++;
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Migrated: ${migrated}/${files.length} files`);
  console.log(`\n⚠️  Please review changes and test before committing.`);
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, colorMappings, radiusMappings, shadowMappings };
