#!/usr/bin/env node

/**
 * Convert SVG icons to PNG using Sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function convertSVGtoPNG(size) {
  const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
  const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    
    console.log(`✅ Converted icon-${size}x${size}.svg to PNG`);
  } catch (error) {
    console.error(`❌ Error converting icon-${size}x${size}.svg:`, error.message);
  }
}

async function convertAll() {
  console.log('🔄 Converting SVG icons to PNG...\n');
  
  for (const size of SIZES) {
    await convertSVGtoPNG(size);
  }
  
  console.log('\n✨ Conversion complete!');
}

convertAll();

