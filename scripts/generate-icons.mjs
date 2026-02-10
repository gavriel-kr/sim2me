import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(__dirname, '..', 'public', 'icons', 'icon-512.png');
const OUT = join(__dirname, '..', 'public', 'icons');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-192.png', size: 192 },
  { name: 'icon-maskable-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generate() {
  console.log('Reading source icon...');
  const source = sharp(SOURCE);
  const meta = await source.metadata();
  console.log(`Source: ${meta.width}x${meta.height}, ${meta.format}`);

  for (const { name, size } of sizes) {
    const out = join(OUT, name);
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(out + '.tmp');
    
    // Replace original
    const { rename } = await import('fs/promises');
    await rename(out + '.tmp', out);
    
    const { stat } = await import('fs/promises');
    const info = await stat(out);
    console.log(`  ${name}: ${size}x${size} → ${(info.size / 1024).toFixed(1)} KB`);
  }

  console.log('Done!');
}

generate().catch(console.error);
