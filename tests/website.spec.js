import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const ready = async page => {
  await page.goto('./');
  await expect(page.locator('#reference-state')).toHaveText('OpenCV reference data ready');
  await expect(page.locator('#surf-status')).toContainText('69 matches');
  await expect(page.locator('#upright-status')).toContainText('Completed');
};
test('all handout modules render on a GitHub Pages subpath without broken assets or console errors', async ({ page }) => {
  const errors = [], missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
  await ready(page);
  await expect(page.locator('#metric-surf')).toHaveText('69');
  await expect(page.locator('#compare-table tbody tr')).toHaveCount(3);
  await expect(page.locator('#questions details')).toHaveCount(3);
  await expect(page.locator('#python-code')).toContainText('SURF_create');
  expect(errors).toEqual([]); expect(missing).toEqual([]);
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
  await page.screenshot({ path: 'artifacts/desktop-hero.png' });
});
test('threshold, descriptor inspector, ratio, rotation, and exports use real data', async ({ page }) => {
  await ready(page);
  await page.selectOption('#surf-threshold', '2000'); await page.click('#run-surf');
  await expect(page.locator('#surf-stats')).toContainText('21 / 55');
  await page.fill('#point-index', '4'); await expect(page.locator('#point-info')).toContainText('Point 4');
  await expect(page.locator('#descriptor-grid>div')).toHaveCount(16);
  await page.selectOption('#compare-angle', '90'); await page.click('#run-compare');
  await expect(page.locator('#metric-surf')).toHaveText('92');
  await page.selectOption('#upright-angle', '90'); await page.click('#run-upright');
  await expect(page.locator('#upright-observation')).toContainText('At 90°');
  const exportPromise = page.waitForEvent('download'); await page.click('#download-comparison');
  expect((await exportPromise).suggestedFilename()).toBe('lab4-detector-comparison.csv');
  const pngPromise = page.waitForEvent('download'); await page.locator('[data-canvas="surf-matches"]').click();
  expect((await pngPromise).suggestedFilename()).toBe('surf-matches.png');
});
test('live ORB actually processes pixels, handles blank images, and rejects invalid uploads', async ({ page }) => {
  await ready(page);
  await page.click('#run-orb'); await expect(page.locator('#orb-status')).toContainText('Live ORB completed', { timeout: 60000 });
  await expect(page.locator('#orb-output')).toBeVisible();
  await expect(page.locator('#orb-stats')).not.toContainText('0 / 0');
  await page.locator('#image-upload').setInputFiles({ name: 'wrong.txt', mimeType: 'text/plain', buffer: Buffer.from('Not an image') });
  await expect(page.locator('#orb-error')).toContainText('Choose a JPEG');
  const blank = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 180; const x = c.getContext('2d'); x.fillStyle = 'white'; x.fillRect(0, 0, 180, 180); return c.toDataURL().split(',')[1]; });
  await page.locator('#image-upload').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: Buffer.from(blank, 'base64') });
  await page.click('#run-orb'); await expect(page.locator('#orb-status')).toContainText('no accepted matches', { timeout: 30000 });
  await expect(page.locator('#orb-stats')).toContainText('0 / 0');
  await expect(page.locator('#metric-surf')).toHaveText('69');
});
test('link configuration validates and persists and notes can be saved', async ({ page }) => {
  await ready(page); await page.locator('.compilation-nav').click(); await expect(page.locator('#link-dialog')).toBeVisible();
  await page.fill('#compilation-url', 'https://example.com/compilation'); await page.fill('#repository-url', 'https://github.com/example/lab4');
  const configPromise = page.waitForEvent('download'); await page.click('#download-config'); expect((await configPromise).suggestedFilename()).toBe('site-config.js');
  await page.locator('#link-form button[type=submit]').click(); await expect(page.locator('#link-dialog')).not.toBeVisible();
  await page.fill('#observation-notes', 'Higher thresholds retained fewer features.');
  await page.reload(); await expect(page.locator('#observation-notes')).toHaveValue('Higher thresholds retained fewer features.');
  await page.click('#open-settings'); await expect(page.locator('#compilation-url')).toHaveValue('https://example.com/compilation');
});
test('desktop and mobile accessibility, navigation, and layout', async ({ page }) => {
  await ready(page);
  const desktop = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(desktop.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => scrollTo(0, 0));
  await page.click('#menu-toggle'); await expect(page.locator('#main-nav')).toBeVisible(); await page.locator('#main-nav a[href="#experiments"]').click();
  await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const mobile = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(mobile.violations).toEqual([]);
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 760 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
