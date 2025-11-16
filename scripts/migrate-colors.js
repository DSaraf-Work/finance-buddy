#!/usr/bin/env node

/**
 * Finance Buddy - Color Migration Script
 * Replaces hardcoded colors with design system tokens
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Starting color migration...\n');

// Color mappings
const colorMappings = [
  // Background colors
  { from: /bg-\[#0f0a1a\]/g, to: 'bg-bg-primary' },
  { from: /bg-\[#1a1625\]/g, to: 'bg-bg-secondary' },
  { from: /bg-\[#2d1b4e\]/g, to: 'bg-bg-elevated' },
  { from: /bg-\[#3d2b5e\]/g, to: 'bg-bg-hover' },
  { from: /bg-\[#332d47\]/g, to: 'bg-bg-elevated' },
  
  // Brand colors
  { from: /bg-\[#6b4ce6\]/g, to: 'bg-brand-primary' },
  { from: /bg-\[#8b5cf6\]/g, to: 'bg-brand-hover' },
  { from: /bg-\[#a78bfa\]/g, to: 'bg-brand-light' },
  { from: /bg-\[#5b3cc4\]/g, to: 'bg-brand-dark' },
  
  // Text colors
  { from: /text-\[#f8fafc\]/g, to: 'text-text-primary' },
  { from: /text-\[#cbd5e1\]/g, to: 'text-text-secondary' },
  { from: /text-\[#94a3b8\]/g, to: 'text-text-muted' },
  { from: /text-\[#64748b\]/g, to: 'text-text-disabled' },
  { from: /text-\[#e8e4f0\]/g, to: 'text-text-primary' },
  
  // Border colors
  { from: /border-\[#2d1b4e\]/g, to: 'border-border' },
  { from: /border-\[#3d2b5e\]/g, to: 'border-border-light' },
  { from: /border-\[#1a1625\]/g, to: 'border-divider' },
  { from: /border-\[#332d47\]/g, to: 'border-border' },
  
  // State/Accent colors
  { from: /bg-\[#10b981\]/g, to: 'bg-accent-emerald' },
  { from: /bg-\[#f59e0b\]/g, to: 'bg-accent-amber' },
  { from: /bg-\[#ef4444\]/g, to: 'bg-error' },
  { from: /bg-\[#06b6d4\]/g, to: 'bg-accent-cyan' },
  { from: /bg-\[#ec4899\]/g, to: 'bg-accent-pink' },
  
  { from: /text-\[#10b981\]/g, to: 'text-accent-emerald' },
  { from: /text-\[#f59e0b\]/g, to: 'text-accent-amber' },
  { from: /text-\[#ef4444\]/g, to: 'text-error' },
  { from: /text-\[#06b6d4\]/g, to: 'text-accent-cyan' },
  
  // Ring/Focus colors
  { from: /ring-\[#6b4ce6\]/g, to: 'ring-brand-primary' },
  { from: /focus:ring-\[#6b4ce6\]/g, to: 'focus:ring-brand-primary' },
  { from: /focus:border-\[#6b4ce6\]/g, to: 'focus:border-brand-primary' },
  { from: /hover:border-\[#6b4ce6\]/g, to: 'hover:border-brand-primary' },
  { from: /hover:bg-\[#8b5cf6\]/g, to: 'hover:bg-brand-hover' },
  { from: /hover:text-\[#a78bfa\]/g, to: 'hover:text-brand-light' },
  { from: /hover:text-\[#f8fafc\]/g, to: 'hover:text-text-primary' },
  { from: /hover:bg-\[#2d1b4e\]/g, to: 'hover:bg-bg-elevated' },
  
  // Gradient colors
  { from: /from-\[#6b4ce6\]/g, to: 'from-brand-primary' },
  { from: /to-\[#8b5cf6\]/g, to: 'to-brand-hover' },
  
  // Ring offset colors
  { from: /ring-offset-\[#1a1625\]/g, to: 'ring-offset-bg-secondary' },
  { from: /ring-offset-\[#0f0a1a\]/g, to: 'ring-offset-bg-primary' },
  
  // Placeholder colors
  { from: /placeholder-\[#94a3b8\]/g, to: 'placeholder-text-muted' },
];

// Find all TypeScript/TSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Process files
const srcDir = path.join(__dirname, '..', 'src');
const files = [
  ...findFiles(path.join(srcDir, 'components')),
  ...findFiles(path.join(srcDir, 'pages')),
];

let updatedCount = 0;
let totalReplacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;
  
  colorMappings.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      fileReplacements += matches.length;
    }
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated: ${path.relative(process.cwd(), file)} (${fileReplacements} replacements)`);
    updatedCount++;
    totalReplacements += fileReplacements;
  }
});

console.log('\n🎉 Migration complete!');
console.log(`📊 Updated ${updatedCount} files`);
console.log(`🔄 Made ${totalReplacements} total replacements\n`);
console.log('⚠️  Note: Some patterns may need manual review:');
console.log('   - Shadow colors with rgba()');
console.log('   - Opacity modifiers like /10, /20, /30');
console.log('   - Complex color expressions\n');
console.log('🔍 Run "npm run build" to check for any issues');

