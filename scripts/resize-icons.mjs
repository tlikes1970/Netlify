import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile as write, rename } from 'node:fs/promises';
async function writeFile(path, data) {
  await write(path + '.tmp', data);
  await rename(path + '.tmp', path);
}
const sharp = createRequire(import.meta.url)('sharp');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'assets/branding/flicklet-icon-master.png');
const publicDir = join(root, 'apps/web/public');
const res = join(root, 'android/app/src/main/res');
const art = await sharp(source).trim().png().toBuffer();
const { data, info } = await sharp(art).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let radius = 0;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  if (data[(y * info.width + x) * 4 + 3]) radius = Math.max(radius, Math.hypot(x - info.width / 2, y - info.height / 2));
}
async function icon(size, { background = 'transparent', safeRadius, fraction = 0.88 } = {}) {
  const scale = safeRadius ? size * safeRadius / radius : size * fraction / Math.max(info.width, info.height);
  const width = Math.max(1, Math.floor(info.width * scale));
  const height = Math.max(1, Math.floor(info.height * scale));
  const input = await sharp(art).resize(width, height).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input, left: Math.floor((size - width) / 2), top: Math.floor((size - height) / 2) }]).png().toBuffer();
}
for (const size of [120, 152, 180, 192, 384, 512]) await writeFile(join(publicDir, `icon-${size}.png`), await icon(size));
await writeFile(join(publicDir, 'favicon.png'), await icon(64));
await writeFile(join(publicDir, 'icon-maskable.png'), await icon(512, { background: '#FFFFFF', safeRadius: 0.39 }));
await writeFile(join(root, 'assets/branding/flicklet-play-icon-512.png'), await icon(512, { background: '#FFFFFF' }));
await writeFile(join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'), await icon(1024, { background: '#FFFFFF' }));
for (const [density, factor] of Object.entries({ mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 })) {
  const dir = join(res, `mipmap-${density}`);
  const foreground = await icon(108 * factor, { safeRadius: 31 / 108 });
  await writeFile(join(dir, 'ic_launcher_foreground.webp'), await sharp(foreground).webp({ lossless: true }).toBuffer());
  const launcher = await icon(48 * factor, { background: '#FFFFFF', safeRadius: 0.45 });
  await writeFile(join(dir, 'ic_launcher.webp'), await sharp(launcher).webp({ lossless: true }).toBuffer());
  const size = 48 * factor;
  const circle = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`);
  await writeFile(join(dir, 'ic_launcher_round.webp'), await sharp(launcher).composite([{ input: circle, blend: 'dest-in' }]).webp({ lossless: true }).toBuffer());
}
// Optional previews stay outside release assets: node scripts/resize-icons.mjs <preview-directory>.
if (process.argv[2]) {
  const dir = process.argv[2]; await mkdir(dir, { recursive: true });
  const fg = await icon(432, { safeRadius: 31 / 108 });
  const viewport = await sharp(fg).extract({ left: 72, top: 72, width: 288, height: 288 }).flatten({ background: '#FFFFFF' }).png().toBuffer();
  for (const [name, shape] of Object.entries({ circle: '<circle cx="144" cy="144" r="144" fill="white"/>', rounded: '<rect width="288" height="288" rx="58" fill="white"/>', squircle: '<path d="M144 0 C260 0 288 28 288 144 C288 260 260 288 144 288 C28 288 0 260 0 144 C0 28 28 0 144 0Z" fill="white"/>' })) {
    await sharp(viewport).composite([{ input: Buffer.from(`<svg width="288" height="288">${shape}</svg>`), blend: 'dest-in' }]).png().toFile(join(dir, `${name}.png`));
  }
  for (const size of [48, 64]) await sharp(viewport).resize(size, size).png().toFile(join(dir, `launcher-${size}.png`));
}
console.log('Generated Android launcher/adaptive, web/PWA, favicon and Play icons from the TV-only master.');

