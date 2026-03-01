const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../mobile/dist');
const dest = path.join(__dirname, '../public/app');

if (!fs.existsSync(src)) {
  console.error('mobile/dist not found. Run: cd mobile && npx expo export -p web');
  process.exit(1);
}

function copyDir(s, d) {
  fs.mkdirSync(d, { recursive: true });
  for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
    const srcPath = path.join(s, entry.name);
    const destPath = path.join(d, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });
copyDir(src, dest);

// Fix paths for /app subpath
const indexPath = path.join(dest, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace('href="/manifest.json"', 'href="/app/manifest.json"');
fs.writeFileSync(indexPath, html);

const manifestPath = path.join(dest, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.start_url = '/app/';
manifest.icons = (manifest.icons || []).map((i) => ({
  ...i,
  src: i.src.startsWith('/') ? '/app' + i.src : i.src,
}));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('Copied mobile/dist to public/app');
