const { execSync } = require('child_process');
const path = require('path');

// Use puppeteer via npx
const script = `
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const outputDir = path.join('C:\\\\Users\\\\גבריאל\\\\.cursor\\\\projects\\\\c-sim2me\\\\assets');

async function takeScreenshots() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  
  const screens = [
    { url: 'https://www.sim2me.net/app', name: 'real-screenshot-1-home.png', wait: 3000 },
    { url: 'https://www.sim2me.net/app', name: 'real-screenshot-2-browse.png', wait: 3000, action: 'browse' },
  ];

  // Screenshot 1: Home
  console.log('Taking screenshot 1: Home screen...');
  await page.goto('https://www.sim2me.net/app', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(outputDir, 'real-screenshot-1-home.png'), fullPage: false });
  console.log('Screenshot 1 saved.');

  // Screenshot 2: Scroll down a bit
  console.log('Taking screenshot 2...');
  await page.evaluate(() => window.scrollBy(0, 300));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, 'real-screenshot-2-scroll.png'), fullPage: false });
  console.log('Screenshot 2 saved.');

  // Screenshot 3: Try clicking first country/plan
  console.log('Taking screenshot 3: Plan details...');
  try {
    // Try to find and click a country card or plan
    const clicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a[href*="plan"], a[href*="country"], [role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent.toLowerCase();
        if (text.includes('buy') || text.includes('view') || text.includes('browse') || text.includes('shop')) {
          btn.click();
          return btn.textContent.trim();
        }
      }
      return null;
    });
    console.log('Clicked:', clicked);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, 'real-screenshot-3-detail.png'), fullPage: false });
    console.log('Screenshot 3 saved.');
  } catch(e) {
    console.log('Could not click, taking current state screenshot');
    await page.screenshot({ path: path.join(outputDir, 'real-screenshot-3-detail.png'), fullPage: false });
  }

  // Screenshot 4: Full page
  console.log('Taking screenshot 4: Full page...');
  await page.goto('https://www.sim2me.net/app', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, 'real-screenshot-4-full.png'), fullPage: true });
  console.log('Screenshot 4 saved.');

  await browser.close();
  console.log('All screenshots saved to:', outputDir);
}

takeScreenshots().catch(console.error);
`;

require('fs').writeFileSync('/tmp/ss-script.js', script);
