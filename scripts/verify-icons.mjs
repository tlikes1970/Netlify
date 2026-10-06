#!/usr/bin/env node

import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('sharp');
import { statSync, readFileSync } from 'fs';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '..', 'apps', 'web', 'public');

const icons = [
  { name: 'favicon.png', expected: 64 },
  { name: 'icon-192.png', expected: 192 },
  { name: 'icon-512.png', expected: 512 },
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
      assert.ok(match, `Incorrect dimensions: ${name}`);
      const status = '✓';
      
      console.log(
        `  ${status} ${name.padEnd(20)} ${meta.width}x${meta.height} (${sizeKB} KB) ${match ? '' : `[Expected ${expected}x${expected}]`}`
      );
    } catch (error) {
      console.log(`  ✗ ${name.padEnd(20)} ERROR: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

async function verifyPlatformIcons() {
  const root = join(__dirname, '..');
  const master = await sharp(join(root, 'assets/branding/flicklet-icon-master.png')).metadata();
  assert.equal(master.hasAlpha, true, 'Master must preserve transparency');
  const play = join(root, 'assets/branding/flicklet-play-icon-512.png');
  const metadata = await sharp(play).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 512); assert.equal(metadata.height, 512);
  assert.equal(metadata.channels, 4); assert.ok(statSync(play).size <= 1024 * 1024);
  const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest.webmanifest')));
  for (const entry of manifest.icons) {
    const image = await sharp(join(PUBLIC_DIR, entry.src)).metadata();
    assert.equal(`${image.width}x${image.height}`, entry.sizes);
  }
  for (const [density, factor] of Object.entries({ mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 })) {
    for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
      const file = join(root, `android/app/src/main/res/mipmap-${density}/${name}.webp`);
      const image = await sharp(file).metadata();
      const size = (name.endsWith('foreground') ? 108 : 48) * factor;
      assert.equal(image.width, size); assert.equal(image.height, size);
      if (name.endsWith('foreground')) {
        const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          if (data[(y * info.width + x) * 4 + 3]) {
            assert.ok(Math.hypot(x - size / 2, y - size / 2) <= size * 33 / 108, `${density}: outside adaptive safe circle`);
          }
        }
      }
    }
  }
  console.log('✓ Play format, manifest paths, all 15 Android density assets and adaptive safe bounds');
}
Promise.all([verify(), verifyPlatformIcons()]).catch(error => { console.error(error); process.exitCode = 1; });



