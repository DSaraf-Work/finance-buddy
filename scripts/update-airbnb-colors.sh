#!/bin/bash
# Batch color replacement script for Airbnb design migration
# This script helps update common color patterns across all files

echo "Updating color patterns to Airbnb design..."

# Common replacements
find src/pages src/components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/bg-\[#0A0B0D\]/bg-white/g' \
  -e 's/bg-\[#15161A\]/bg-white/g' \
  -e 's/bg-\[#1E2026\]/bg-white/g' \
  -e 's/bg-\[#0f0a1a\]/bg-white/g' \
  -e 's/bg-\[#1a1625\]/bg-white/g' \
  -e 's/text-\[#F0F1F5\]/text-airbnb-text-primary/g' \
  -e 's/text-\[#B2B4C2\]/text-airbnb-text-secondary/g' \
  -e 's/text-\[#6F7280\]/text-airbnb-text-tertiary/g' \
  -e 's/text-\[#f8fafc\]/text-airbnb-text-primary/g' \
  -e 's/text-\[#cbd5e1\]/text-airbnb-text-secondary/g' \
  -e 's/text-\[#94a3b8\]/text-airbnb-text-secondary/g' \
  -e 's/border-\[#2A2C35\]/border-airbnb-border-light/g' \
  -e 's/border-\[#2d1b4e\]/border-airbnb-border-light/g' \
  -e 's/border-\[#5D5FEF\]/border-airbnb-red/g' \
  -e 's/from-\[#5D5FEF\]/bg-airbnb-red/g' \
  -e 's/to-\[#888BFF\]/bg-airbnb-red/g' \
  -e 's/bg-gradient-to-r from-\[#5D5FEF\] to-\[#888BFF\]/bg-airbnb-red/g' \
  -e 's/bg-gradient-to-br from-\[#5D5FEF\] to-\[#888BFF\]/bg-airbnb-red/g' \
  {} \;

echo "Color updates complete!"
