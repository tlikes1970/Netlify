#!/usr/bin/env node

import sharp from 'sharp';
import { statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '..', 'apps', 'web', 'public');

const icons = [
  { name: 'icon-120.png', expected: 120 },
  { name: 'icon-152.png', expected: 152 },
  { name: 'icon-180.png', expected: 180 },
  { name: 'icon-384.png', expected: 384 },
  { name: 'icon-maskable.png', expected: 512 },
];

async function verify() {
  console.log('Verification Results:\n');
  
  for (const { name, expected } of icons) {
    const filePath = join(PUBLIC_DIR, name);
    try {
      const meta = await sharp(filePath).metadata();
      const stats = statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      
      const match = meta.width === expected && meta.height === expected;
      const status = match ? '✓' : '✗';
      
      console.log(
        `  ${status} ${name.padEnd(20)} ${meta.width}x${meta.height} (${sizeKB} KB) ${match ? '' : `[Expected ${expected}x${expected}]`}`
      );
    } catch (error) {
      console.log(`  ✗ ${name.padEnd(20)} ERROR: ${error.message}`);
    }
  }
}

verify().catch(console.error);



