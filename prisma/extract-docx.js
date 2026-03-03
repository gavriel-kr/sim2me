const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docxPath = process.argv[2] || 'c:\\Users\\גבריאל\\Downloads\\sim2me_75_articles.docx';

if (!fs.existsSync(docxPath)) {
  console.error('Docx not found:', docxPath);
  process.exit(1);
}
const outPath = path.join(__dirname, 'extracted-75-utf8.html');
const cmd = `npx --yes mammoth "${docxPath.replace(/"/g, '\\"')}"`;
const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
fs.writeFileSync(outPath, html, 'utf8');
console.log('Wrote', outPath);
