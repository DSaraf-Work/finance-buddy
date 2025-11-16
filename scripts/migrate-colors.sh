#!/bin/bash

# Finance Buddy - Color Migration Script
# This script replaces hardcoded colors with design system tokens

echo "🎨 Starting color migration..."

# Define color mappings
declare -A color_map=(
  # Background colors
  ["bg-\[#0f0a1a\]"]="bg-bg-primary"
  ["bg-\[#1a1625\]"]="bg-bg-secondary"
  ["bg-\[#2d1b4e\]"]="bg-bg-elevated"
  ["bg-\[#3d2b5e\]"]="bg-bg-hover"
  
  # Brand colors
  ["bg-\[#6b4ce6\]"]="bg-brand-primary"
  ["bg-\[#8b5cf6\]"]="bg-brand-hover"
  ["bg-\[#a78bfa\]"]="bg-brand-light"
  ["bg-\[#5b3cc4\]"]="bg-brand-dark"
  
  # Text colors
  ["text-\[#f8fafc\]"]="text-text-primary"
  ["text-\[#cbd5e1\]"]="text-text-secondary"
  ["text-\[#94a3b8\]"]="text-text-muted"
  ["text-\[#64748b\]"]="text-text-disabled"
  
  # Border colors
  ["border-\[#2d1b4e\]"]="border-border"
  ["border-\[#3d2b5e\]"]="border-border-light"
  ["border-\[#1a1625\]"]="border-divider"
  
  # State colors
  ["bg-\[#10b981\]"]="bg-accent-emerald"
  ["bg-\[#f59e0b\]"]="bg-accent-amber"
  ["bg-\[#ef4444\]"]="bg-error"
  ["bg-\[#06b6d4\]"]="bg-accent-cyan"
  ["bg-\[#ec4899\]"]="bg-accent-pink"
  
  ["text-\[#10b981\]"]="text-accent-emerald"
  ["text-\[#f59e0b\]"]="text-accent-amber"
  ["text-\[#ef4444\]"]="text-error"
  ["text-\[#06b6d4\]"]="text-accent-cyan"
  
  # Ring/focus colors
  ["ring-\[#6b4ce6\]"]="ring-brand-primary"
  ["focus:ring-\[#6b4ce6\]"]="focus:ring-brand-primary"
  ["focus:border-\[#6b4ce6\]"]="focus:border-brand-primary"
  ["hover:border-\[#6b4ce6\]"]="hover:border-brand-primary"
  ["hover:bg-\[#8b5cf6\]"]="hover:bg-brand-hover"
  ["hover:text-\[#a78bfa\]"]="hover:text-brand-light"
  ["hover:text-\[#f8fafc\]"]="hover:text-text-primary"
  
  # Gradient colors
  ["from-\[#6b4ce6\]"]="from-brand-primary"
  ["to-\[#8b5cf6\]"]="to-brand-hover"
  
  # Ring offset colors
  ["ring-offset-\[#1a1625\]"]="ring-offset-bg-secondary"
  ["ring-offset-\[#0f0a1a\]"]="ring-offset-bg-primary"
)

# Files to process
files=$(find src/components src/pages -name "*.tsx" -o -name "*.ts")

# Counter
count=0

# Process each file
for file in $files; do
  modified=false
  
  for old_color in "${!color_map[@]}"; do
    new_color="${color_map[$old_color]}"
    
    # Check if file contains the old color
    if grep -q "$old_color" "$file"; then
      # Replace the color
      sed -i '' "s/$old_color/$new_color/g" "$file"
      modified=true
    fi
  done
  
  if [ "$modified" = true ]; then
    echo "✅ Updated: $file"
    ((count++))
  fi
done

echo ""
echo "🎉 Migration complete!"
echo "📊 Updated $count files"
echo ""
echo "⚠️  Note: Some complex color patterns may need manual review:"
echo "   - Shadow colors with rgba()"
echo "   - Opacity modifiers like /10, /20, /30"
echo "   - Placeholder colors"
echo ""
echo "🔍 Run 'npm run build' to check for any issues"

