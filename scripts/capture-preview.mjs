import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4176/lab-04/');
  await page.locator('#upright-status').filter({ hasText: 'Completed' }).waitFor();
  await page.screenshot({ path: 'artifacts/mobile-hero.png' });
  await page.locator('#task1').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/mobile-experiment.png' });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => scrollTo(0, 0));
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Tablet horizontal overflow');
  await page.screenshot({ path: 'artifacts/tablet-hero.png' });
  console.log('Mobile and tablet viewport screenshots captured; tablet overflow check passed.');
} finally { await browser.close(); }
