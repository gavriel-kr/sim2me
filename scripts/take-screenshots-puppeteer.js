const puppeteer = require('puppeteer');
const path = require('path');

const outputDir = 'C:\\Users\\גבריאל\\.cursor\\projects\\c-sim2me\\assets';

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // Screenshot 1: Home
  console.log('Screenshot 1: Home...');
  await page.goto('https://www.sim2me.net/app', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(outputDir, 'real-ss-1-home.png') });
  console.log('Done 1');

  // Screenshot 2: Scroll down
  console.log('Screenshot 2: Scroll...');
  await page.evaluate(() => window.scrollBy(0, 400));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, 'real-ss-2-scroll.png') });
  console.log('Done 2');

  // Screenshot 3: Try clicking something
  console.log('Screenshot 3: Interaction...');
  try {
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('button, [role="button"], a')];
      const target = all.find(el => {
        const t = el.textContent.trim().toLowerCase();
        return t.includes('browse') || t.includes('shop') || t.includes('plan') || t.includes('esim');
      });
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {}
  await page.screenshot({ path: path.join(outputDir, 'real-ss-3-inner.png') });
  console.log('Done 3');

  // Screenshot 4: en locale
  console.log('Screenshot 4: English...');
  await page.goto('https://www.sim2me.net/en', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, 'real-ss-4-website.png') });
  console.log('Done 4');

  await browser.close();
  console.log('All screenshots saved to:', outputDir);
}

takeScreenshots().catch(e => { console.error('Error:', e.message); process.exit(1); });
