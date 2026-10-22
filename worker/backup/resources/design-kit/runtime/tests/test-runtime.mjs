import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

if (!process.env.PLAYWRIGHT_BROWSERS_PATH && process.platform === 'win32') {
  const browsers = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (existsSync(browsers)) process.env.PLAYWRIGHT_BROWSERS_PATH = browsers;
}
const { chromium } = await import('../../../../local-qa/node_modules/playwright/index.mjs');
const fixture = pathToFileURL(path.resolve('frontstep/local-factory/design-kit/runtime/tests/fixture.html')).href;
const browser = await chromium.launch({ headless: true });
const errors = [];
const close = async () => { await browser.close(); };

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, reducedMotion: 'no-preference' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(fixture);
  await page.waitForFunction(() => document.querySelectorAll('[data-motion-status="mounted"]').length === 9);
  assert.equal(await page.locator('[data-motion-signature]').count(), 9);
  assert.ok(await page.evaluate(() => ScrollTrigger.getAll().length >= 9), 'scenes create actual scroll triggers');
  assert.equal(await page.locator('.fs-motion-follower').count(), 1, 'fine pointer gets optional menu follower');
  const landscape = page.locator('[data-motion-part="landscape"]');
  const beforeScroll = await landscape.evaluate(el => getComputedStyle(el).transform);
  await landscape.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const afterScroll = await landscape.evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(afterScroll, beforeScroll, 'landscape scene changes rendered transform as page scrolls');
  await page.locator('[data-motion-field]').first().fill('Visitor');
  await page.waitForTimeout(360);
  const progress = await page.locator('[data-motion-part="progress"]').evaluate(el => getComputedStyle(el).transform);
  assert.match(progress, /matrix\(0\.5/, 'health progress responds to input');
  await page.evaluate(() => FrontstepMotion.destroyAll());
  assert.equal(await page.evaluate(() => ScrollTrigger.getAll().length), 0, 'all ScrollTriggers clean up');
  assert.equal(await page.locator('.fs-motion-follower').count(), 0, 'pointer follower cleans up');
  assert.equal(await page.locator('[data-motion-status="mounted"]').count(), 0, 'mount markers clean up');
  await page.close();

  const reduced = await browser.newPage({ viewport: { width: 1280, height: 850 }, reducedMotion: 'reduce' });
  reduced.on('pageerror', error => errors.push(error.message));
  await reduced.goto(fixture);
  await reduced.waitForFunction(() => document.querySelectorAll('[data-motion-status="reduced"]').length === 9);
  assert.equal(await reduced.evaluate(() => ScrollTrigger.getAll().length), 0, 'reduced motion skips animation');
  assert.equal(await reduced.locator('.fs-motion-follower').count(), 0);
  assert.equal(await reduced.locator('section:visible').count(), 9, 'content remains visible');
  await reduced.emulateMedia({ reducedMotion: 'no-preference' });
  await reduced.waitForFunction(() => document.querySelectorAll('[data-motion-status="mounted"]').length === 9);
  assert.ok(await reduced.evaluate(() => ScrollTrigger.getAll().length >= 9), 'changing preference mounts scenes');
  await reduced.emulateMedia({ reducedMotion: 'reduce' });
  await reduced.waitForFunction(() => document.querySelectorAll('[data-motion-status="reduced"]').length === 9);
  assert.equal(await reduced.evaluate(() => ScrollTrigger.getAll().length), 0, 'changing preference cleans scenes');
  await reduced.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(fixture);
  await mobile.waitForFunction(() => document.querySelectorAll('[data-motion-status="mounted"]').length === 9);
  assert.equal(await mobile.locator('.fs-motion-follower').count(), 0, 'mobile has no pointer follower');
  await mobile.close();

  const noJs = await browser.newPage({ viewport: { width: 1280, height: 850 }, javaScriptEnabled: false });
  await noJs.goto(fixture);
  assert.equal(await noJs.locator('section:visible').count(), 9, 'no-JS content remains visible');
  assert.equal(await noJs.locator('[data-motion-part="photo"] img').count(), 1);
  await noJs.close();

  assert.deepEqual(errors, [], 'no browser script errors');
  console.log('PASS nine signatures, scroll events, form interaction, cleanup, reduced motion, mobile, no JS');
} finally { await close(); }
