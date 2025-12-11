#!/usr/bin/env node

/**
 * Icon Resizing Script
 * 
 * Resizes PWA/iOS icons from the master icon-512.png to the correct dimensions.
 * Creates a maskable icon with proper safe zone for platform masking.
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '..', 'apps', 'web', 'public');
const SOURCE_ICON = join(PUBLIC_DIR, 'icon-512.png');

// Icon sizes to generate
const ICON_SIZES = [
  { name: 'icon-120.png', size: 120 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-384.png', size: 384 },
];

/**
 * Verify an image file's actual dimensions
 */
async function verifyImageSize(filePath, expectedSize) {
  try {
    const metadata = await sharp(filePath).metadata();
    const actualWidth = metadata.width;
    const actualHeight = metadata.height;
    
    if (actualWidth !== expectedSize || actualHeight !== expectedSize) {
      throw new Error(
        `Size mismatch: Expected ${expectedSize}x${expectedSize}, got ${actualWidth}x${actualHeight}`
      );
    }
    
    return { width: actualWidth, height: actualHeight };
  } catch (error) {
    throw new Error(`Failed to verify ${filePath}: ${error.message}`);
  }
}

/**
 * Create a maskable icon with safe zone
 * 
 * Maskable icons need important content within the inner 80% safe zone
 * so that when platforms apply circular/squircle masks, content isn't chopped.
 */
async function createMaskableIcon(sourcePath, outputPath) {
  const source = sharp(sourcePath);
  const metadata = await source.metadata();
  
  const size = 512;
  const safeZone = size * 0.8; // 80% safe zone = 409.6px
  const padding = (size - safeZone) / 2; // ~51.2px padding on each side
  
  // Create a new image with the source scaled down to fit the safe zone
  // and centered on a 512x512 canvas
  const resized = await source
    .resize(Math.round(safeZone), Math.round(safeZone), {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
    })
    .toBuffer();
  
  // Composite the resized image onto a 512x512 canvas with padding
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      {
        input: resized,
        left: Math.round(padding),
        top: Math.round(padding)
      }
    ])
    .png()
    .toFile(outputPath);
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Icon Resizing Script\n');
  
  // Check if source icon exists
  try {
    await sharp(SOURCE_ICON).metadata();
    console.log(`✓ Found source icon: ${SOURCE_ICON}\n`);
  } catch (error) {
    console.error(`✗ Source icon not found: ${SOURCE_ICON}`);
    process.exit(1);
  }
  
  const results = [];
  
  // Resize regular icons
  console.log('Resizing regular icons...');
  for (const { name, size } of ICON_SIZES) {
    const outputPath = join(PUBLIC_DIR, name);
    
    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);
      
      const verified = await verifyImageSize(outputPath, size);
      results.push({ name, ...verified, status: '✓' });
      console.log(`  ${results[results.length - 1].status} ${name} → ${size}x${size}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${name}: ${error.message}`);
      results.push({ name, status: '✗', error: error.message });
    }
  }
  
  // Create maskable icon
  console.log('\nCreating maskable icon...');
  const maskablePath = join(PUBLIC_DIR, 'icon-maskable.png');
  try {
    await createMaskableIcon(SOURCE_ICON, maskablePath);
    const verified = await verifyImageSize(maskablePath, 512);
    results.push({ name: 'icon-maskable.png', ...verified, status: '✓' });
    console.log(`  ${results[results.length - 1].status} icon-maskable.png → 512x512 (with safe zone)`);
  } catch (error) {
    console.error(`  ✗ Failed to create maskable icon: ${error.message}`);
    results.push({ name: 'icon-maskable.png', status: '✗', error: error.message });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Source: icon-512.png`);
  console.log(`\nFinal icon dimensions:`);
  
  results.forEach(({ name, width, height, status }) => {
    if (status === '✓') {
      console.log(`  ${status} ${name.padEnd(20)} → ${width}x${height} px`);
    } else {
      console.log(`  ${status} ${name.padEnd(20)} → FAILED`);
    }
  });
  
  const successCount = results.filter(r => r.status === '✓').length;
  const totalCount = results.length;
  
  console.log(`\n${successCount}/${totalCount} icons generated successfully`);
  
  if (successCount === totalCount) {
    console.log('\n✓ All icons resized correctly!');
    console.log('✓ Manifest and HTML files were NOT modified (as requested)');
    console.log('✓ Existing filenames and paths remain identical');
  } else {
    console.log('\n⚠ Some icons failed to generate. Please check errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



