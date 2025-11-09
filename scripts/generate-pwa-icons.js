#!/usr/bin/env node

/**
 * Generate PWA icons for Finance Buddy
 * This script creates simple placeholder icons in various sizes
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate SVG icon template
function generateSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.15}"/>
  
  <!-- Dollar sign icon -->
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <!-- Vertical line -->
    <rect x="${-size * 0.04}" y="${-size * 0.35}" width="${size * 0.08}" height="${size * 0.7}" fill="white" rx="${size * 0.02}"/>
    
    <!-- Top curve -->
    <path d="M ${-size * 0.15} ${-size * 0.15} Q ${-size * 0.15} ${-size * 0.25} ${0} ${-size * 0.25} Q ${size * 0.15} ${-size * 0.25} ${size * 0.15} ${-size * 0.15} Q ${size * 0.15} ${-size * 0.05} ${0} ${-size * 0.05}" 
          fill="none" stroke="white" stroke-width="${size * 0.08}" stroke-linecap="round"/>
    
    <!-- Bottom curve -->
    <path d="M ${size * 0.15} ${size * 0.15} Q ${size * 0.15} ${size * 0.25} ${0} ${size * 0.25} Q ${-size * 0.15} ${size * 0.25} ${-size * 0.15} ${size * 0.15} Q ${-size * 0.15} ${size * 0.05} ${0} ${size * 0.05}" 
          fill="none" stroke="white" stroke-width="${size * 0.08}" stroke-linecap="round"/>
  </g>
</svg>`;
}

// Generate icons for all sizes
console.log('🎨 Generating PWA icons...\n');

SIZES.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgPath = path.join(ICONS_DIR, svgFilename);
  
  // Save SVG file
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Generated ${svgFilename}`);
});

console.log('\n✨ Icon generation complete!');
console.log('\n📝 Note: SVG files have been created. For production, convert these to PNG using:');
console.log('   - Online tools like https://cloudconvert.com/svg-to-png');
console.log('   - Or use ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png');
console.log('\n   For now, we\'ll use the SVG files as fallbacks.');

