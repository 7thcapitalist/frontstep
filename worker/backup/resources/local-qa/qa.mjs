#!/usr/bin/env node
import { readFile, mkdir, stat, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { revealByScrolling, captureViewport, composeStoryboard } from './storyboard.mjs';
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && process.platform === 'win32') {
  const userBrowsers = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (existsSync(userBrowsers)) process.env.PLAYWRIGHT_BROWSERS_PATH = userBrowsers;
}
const { chromium } = await import('playwright');

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const publicArg = args.find(a => !a.startsWith('--') && ![flag('--brief'), flag('--out'), flag('--scenario')].includes(a));
const outArg = flag('--out');
const result = { passed: false, checks: [], screenshots: {}, startedAt: new Date().toISOString() };
const add = (code, passed, detail, viewport) => result.checks.push({ code, passed, detail, ...(viewport ? { viewport } : {}) });
const fail = (code, detail, viewport) => add(code, false, detail, viewport);
const pass = (code, detail, viewport) => add(code, true, detail, viewport);
const comparable = (value, kind) => kind === 'text' ? String(value).replace(/[\s\u00a0]+/g, ' ').trim() : String(value);
const screenshotStyle = '.skip-link:not(:focus), .skip:not(:focus) { visibility: hidden !important; }';
let browser;

async function emit(exitCode) {
  result.passed = exitCode === 0;
  result.finishedAt = new Date().toISOString();
  result.exitCode = exitCode;
  if (outArg) {
    await mkdir(path.resolve(outArg), { recursive: true });
    await writeFile(path.join(path.resolve(outArg), 'qa-result.json'), JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = exitCode;
}

async function readStatic(root, url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const relative = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  let file = path.resolve(root, '.' + relative);
  if (file !== root && !file.startsWith(root + path.sep)) return { status: 403, body: 'Forbidden', contentType: 'text/plain' };
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) { file = path.join(file, 'index.html'); info = await stat(file).catch(() => null); }
  if (!info && !path.extname(file)) { file += '.html'; info = await stat(file).catch(() => null); }
  if (!info?.isFile()) return { status: 404, body: 'Not found', contentType: 'text/plain' };
  const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2' };
  return { status: 200, body: await readFile(file), contentType: mime[path.extname(file).toLowerCase()] || 'application/octet-stream' };
}

async function attachStatic(context, root) {
  await context.route('http://qa.frontstep.local/**', async route => {
    try { await route.fulfill(await readStatic(root, route.request().url())); }
    catch (error) { await route.fulfill({ status: 500, body: String(error) }); }
  });
}

async function previewUnsafePaths(root) {
  const findings = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { await visit(file); continue; }
      const ext = path.extname(file).toLowerCase();
      if (!['.html', '.css', '.js', '.mjs'].includes(ext)) continue;
      const source = await readFile(file, 'utf8');
      const patterns = ext === '.html'
        ? [/(?:src|href|poster|srcset)\s*=\s*["']\s*(\/(?!\/)[^"']*)/gi, /(?:import\s*(?:[^;]*?\sfrom\s*)?|import\s*\()\s*["'](\/(?!\/)[^"']*)/gi]
        : ext === '.css'
          ? [/url\(\s*["']?\s*(\/(?!\/)[^)"'\s]*)/gi, /@import\s*["'](\/(?!\/)[^"']*)/gi]
          : [/(?:import\s*(?:[^;]*?\sfrom\s*)?|import\s*\(|new\s+URL\s*\(|fetch\s*\()\s*["'](\/(?!\/)[^"']*)/gi];
      for (const pattern of patterns) for (const match of source.matchAll(pattern)) findings.push(`${path.relative(root, file)}: ${match[1]}`);
    }
  }
  await visit(root);
  return [...new Set(findings)].slice(0, 30);
}

async function settleImages(page) {
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const image of images) image.loading = 'eager';
    await Promise.all(images.map(image => image.decode().catch(() => {})));
  });
}

async function runScenario(page, scenario, viewport) {
  if (!scenario || !Array.isArray(scenario.steps) || !scenario.steps.length || !Array.isArray(scenario.assertions) || !scenario.assertions.length) {
    fail('FEATURE_SCENARIO_MISSING', 'Feature requires steps and assertions in --scenario', viewport);
    return;
  }
  try {
    for (const step of scenario.steps) {
      if (!step.selector || !['fill', 'click', 'check', 'select'].includes(step.action)) throw new Error('Invalid scenario step');
      const loc = page.locator(step.selector).first();
      if (step.action === 'fill') await loc.fill(String(step.value ?? ''));
      if (step.action === 'click') await loc.click();
      if (step.action === 'check') await loc.check();
      if (step.action === 'select') await loc.selectOption(String(step.value));
    }
    for (const item of scenario.assertions) {
      if (!item.selector || !['visible', 'text', 'attribute', 'value'].includes(item.kind)) throw new Error('Invalid scenario assertion');
      const loc = page.locator(item.selector).first();
      await loc.waitFor({ state: 'visible', timeout: 5000 });
      let actual;
      if (item.kind === 'visible') actual = 'visible';
      if (item.kind === 'text') actual = await loc.textContent();
      if (item.kind === 'attribute') actual = await loc.getAttribute(item.name);
      if (item.kind === 'value') actual = await loc.inputValue();
      if (item.includes != null && !comparable(actual, item.kind).includes(comparable(item.includes, item.kind))) throw new Error(`${item.selector}: expected ${JSON.stringify(item.includes)} in ${JSON.stringify(actual)}`);
      if (item.equals != null && comparable(actual, item.kind) !== comparable(item.equals, item.kind)) throw new Error(`${item.selector}: expected ${JSON.stringify(item.equals)}, got ${JSON.stringify(actual)}`);
    }
    pass('FEATURE_SCENARIO', `${scenario.steps.length} steps, ${scenario.assertions.length} assertions`, viewport);
  } catch (error) { fail('FEATURE_SCENARIO', String(error), viewport); }
}

async function main() {
  if (!publicArg || !outArg) throw new Error('Usage: node qa.mjs <public-dir> --out <evidence-dir> [--brief brief.json] [--scenario scenario.json]');
  const root = path.resolve(publicArg);
  const index = path.join(root, 'index.html');
  if (!existsSync(index)) throw new Error(`Missing ${index}`);
  const brief = flag('--brief') ? JSON.parse(await readFile(path.resolve(flag('--brief')), 'utf8')) : null;
  const scenario = flag('--scenario') ? JSON.parse(await readFile(path.resolve(flag('--scenario')), 'utf8')) : null;
  const feature = typeof brief?.premium_feature === 'string' ? brief.premium_feature : brief?.premium_feature?.id;
  const foodNiche = /restaurante|hamburguer|pizzaria|lanchonete|padaria|confeitaria|açaí|acai|bar\b|caf[eé]|marmita|food truck/i.test(brief?.business?.niche || '');
  await mkdir(path.resolve(outArg), { recursive: true });
  const unsafePaths = await previewUnsafePaths(root);
  add('PREVIEW_RELATIVE_PATHS', unsafePaths.length === 0, unsafePaths.length ? unsafePaths : 'Local assets and module paths are relative, safe for /preview/<id>/', 'source');
  const base = 'http://qa.frontstep.local/';
  browser = await chromium.launch({ headless: true });
  for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 844 }, smallMobile: { width: 360, height: 800 } })) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === 'http://qa.frontstep.local' ? route.continue() : route.abort());
    await context.addInitScript(() => { window.__qaOpened = []; window.open = (...args) => { window.__qaOpened.push(args[0]); return null; }; });
    await attachStatic(context, root);
    const page = await context.newPage();
    const errors = [], badResponses = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => badResponses.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400 && !/favicon\.ico$/.test(response.url())) badResponses.push(`${response.status()} ${response.url()}`); });
    try {
      await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
      await settleImages(page);
      const heroShot = path.join(path.resolve(outArg), `${name}-hero.png`);
      await captureViewport(page, heroShot);
      result.screenshots[`${name}Hero`] = heroShot;
      await revealByScrolling(page);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.38));
      await page.waitForTimeout(250);
      const sectionShot = path.join(path.resolve(outArg), `${name}-section.png`);
      await captureViewport(page, sectionShot);
      result.screenshots[`${name}Section`] = sectionShot;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(path.resolve(outArg), `${name}.png`), fullPage: true, style: screenshotStyle });
      result.screenshots[name] = path.join(path.resolve(outArg), `${name}.png`);
      const audit = await page.evaluate(() => {
        const vw = window.innerWidth;
        const links = [...document.querySelectorAll('a[href]')].filter(a => !a.hasAttribute('download'));
        const brokenAnchors = links.filter(a => a.hash && a.origin === location.origin && a.pathname === location.pathname && a.search === location.search).filter(a => { try { return !document.getElementById(decodeURIComponent(a.hash.slice(1))); } catch { return true; } }).map(a => a.getAttribute('href'));
        const crossDocumentAnchors = links.filter(a => a.hash && a.origin === location.origin && (a.pathname !== location.pathname || a.search !== location.search)).map(a => a.href);
        const unlabeled = [...document.querySelectorAll('input,select,textarea')].filter(el => el.type !== 'hidden' && !el.matches('[aria-label],[aria-labelledby]') && !el.labels?.length).map(el => el.outerHTML.slice(0, 120));
        const unnamedButtons = [...document.querySelectorAll('button')].filter(el => !el.textContent.trim() && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(el => el.outerHTML.slice(0, 120));
        const imagesWithoutAlt = [...document.querySelectorAll('img:not([alt])')].map(el => el.src);
        const imagesNotLoaded = [...document.querySelectorAll('img')].filter(el => !el.complete || !el.naturalWidth).map(el => el.src);
        const internalPaths = links.filter(a => a.origin === location.origin && (!a.hash || a.pathname !== location.pathname || a.search !== location.search) && !a.href.startsWith('javascript:')).map(a => a.href);
        const media = [...document.querySelectorAll('img')].filter(el => /^\/?media\//.test(el.getAttribute('src') || '')).map(el => {
          const rect = el.getBoundingClientRect();
          const visibleWidth = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
          const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
          const rendered = rect.width > 0 && rect.height > 0 && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
          return { src: el.getAttribute('src'), rendered, firstViewportFraction: rendered ? visibleWidth * visibleHeight / (vw * window.innerHeight) : 0 };
        });
        return { title: document.title.trim(), lang: document.documentElement.lang, h1: document.querySelectorAll('h1').length, overflow: document.documentElement.scrollWidth - vw, brokenAnchors, crossDocumentAnchors, unlabeled, unnamedButtons, imagesWithoutAlt, imagesNotLoaded, internalPaths: [...new Set(internalPaths)], visibleText: document.body.innerText, media };
      });
      for (const url of audit.crossDocumentAnchors) {
        const response = await readStatic(root, url);
        const found = response.status === 200 && await page.evaluate(({html, hash}) => {
          try { return !!new DOMParser().parseFromString(html, 'text/html').getElementById(decodeURIComponent(hash.slice(1))); }
          catch { return false; }
        }, {html: response.body.toString(), hash: new URL(url).hash});
        if (!found) audit.brokenAnchors.push(url);
      }
      for (const [code, ok, detail] of [
        ['TITLE', !!audit.title, audit.title || 'Missing title'],
        ['LANG', !!audit.lang, audit.lang || 'Missing html lang'],
        ['H1', audit.h1 === 1, `${audit.h1} h1 elements`],
        ['OVERFLOW', audit.overflow <= 2, `${audit.overflow}px horizontal overflow`],
        ['ANCHORS', !audit.brokenAnchors.length, audit.brokenAnchors],
        ['FORM_LABELS', !audit.unlabeled.length, audit.unlabeled],
        ['BUTTON_NAMES', !audit.unnamedButtons.length, audit.unnamedButtons],
        ['IMAGE_ALT', !audit.imagesWithoutAlt.length, audit.imagesWithoutAlt],
        ['IMAGES_LOAD', !audit.imagesNotLoaded.length, audit.imagesNotLoaded]
      ]) add(code, ok, detail, name);
      if (Array.isArray(brief?.business?.services) && brief.business.services.length) {
        const missing = brief.business.services.map(service => service.name).filter(name => name && !audit.visibleText.toLocaleLowerCase('pt-BR').includes(name.toLocaleLowerCase('pt-BR')));
        add('BRIEF_SERVICES', missing.length === 0, missing.length ? `Missing: ${missing.join(', ')}` : `${brief.business.services.length} service names visible`, name);
      }
      if (foodNiche) {
        add('FOOD_MEDIA_USED', audit.media.length > 0, audit.media.map(item => item.src), name);
        add('FOOD_MEDIA_FIRST_VIEWPORT', audit.media.some(item => item.firstViewportFraction >= 0.1), audit.media.map(item => ({ src: item.src, fraction: Number(item.firstViewportFraction.toFixed(3)) })), name);
        const distinct = new Set(audit.media.filter(item => item.rendered).map(item => item.src));
        const available = brief?.media?.photos?.length || 0;
        if (available >= 3) add('FOOD_IMAGE_RICHNESS', distinct.size >= 3, `${distinct.size} of ${available} supplied images used`, name);
      }
      const usedStock = (brief?.media?.photos || []).flatMap((photo, index) => {
        const output = `media/photo-${index + 1}${path.extname(photo.local_path || '').toLowerCase()}`;
        return photo.provenance === 'licensed_stock' && audit.media.some(item => item.src?.replace(/^\//, '') === output) ? [photo] : [];
      });
      if (usedStock.length) {
        const missingCredits = usedStock.filter(photo => !audit.visibleText.toLowerCase().includes(String(photo.credit || '').toLowerCase())).map(photo => photo.credit || photo.local_path);
        add('MEDIA_SOURCE_CREDITS', missingCredits.length === 0, missingCredits.length ? `Missing credits: ${missingCredits.join(', ')}` : `${usedStock.length} stock photo credits visible`, name);
      }
      for (const url of audit.internalPaths) {
        const response = await readStatic(root, url);
        add('INTERNAL_LINK', response.status === 200, `${response.status} ${url}`, name);
      }
      if (feature) {
        add('DEMO_DISCLOSURE', /fict[ií]ci[oa]|demonstra[cç][aã]o/i.test(audit.visibleText), 'Visible fictitious/demo disclosure', name);
        const count = await page.locator('[data-feature]').evaluateAll((els, id) => els.filter(el => el.getAttribute('data-feature') === id).length, feature);
        add('FEATURE_PRESENT', count > 0, `${feature}: ${count} matching regions`, name);
        if (count) {
          await runScenario(page, scenario, name);
          await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
          await page.waitForTimeout(120);
          const featureShot = path.join(path.resolve(outArg), `${name}-feature.png`);
          await settleImages(page);
          await page.screenshot({ path: featureShot, fullPage: true, style: screenshotStyle });
          result.screenshots[`${name}Feature`] = featureShot;
          await page.locator('[data-feature]').first().scrollIntoViewIfNeeded();
          await page.waitForTimeout(180);
          const featureViewport = path.join(path.resolve(outArg), `${name}-feature-viewport.png`);
          await captureViewport(page, featureViewport);
          result.screenshots[`${name}FeatureViewport`] = featureViewport;
          const checkpoints = scenario?.checkpoints || [];
          if (!Array.isArray(checkpoints) || checkpoints.length > 6) throw new Error('Scenario checkpoints must be an array of at most six states');
          for (const checkpoint of checkpoints) {
            if (!/^[a-z0-9-]{1,40}$/.test(checkpoint.name || '')) throw new Error('Invalid checkpoint name');
            await runScenario(page, checkpoint, `${name}:${checkpoint.name}`);
            const stateSelector = checkpoint.captureSelector || '[data-feature]';
            await page.locator(stateSelector).first().scrollIntoViewIfNeeded();
            await settleImages(page);
            await page.waitForTimeout(180);
            const stateShot = path.join(path.resolve(outArg), `${name}-state-${checkpoint.name}.png`);
            await captureViewport(page, stateShot);
            result.screenshots[`${name}State-${checkpoint.name}`] = stateShot;
            const width = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
            add('CHECKPOINT_OVERFLOW', width <= 2, `${checkpoint.name}: ${width}px horizontal overflow`, name);
          }

        }
      }
      const storyboard = path.join(path.resolve(outArg), `${name}-storyboard.png`);
      await composeStoryboard(browser, [
        { title: `${name}: abertura`, file: heroShot, width: viewport.width },
        { title: `${name}: seção`, file: sectionShot, width: viewport.width },
        { title: `${name}: feature`, file: result.screenshots[`${name}FeatureViewport`] || sectionShot, width: viewport.width }
      ], storyboard);
      result.screenshots[`${name}Storyboard`] = storyboard;
      add('CONSOLE_ERRORS', !errors.length, errors, name);
      add('HTTP_ERRORS', !badResponses.length, badResponses, name);
    } catch (error) { fail('BROWSER_RUN', String(error), name); }
    finally { await context.close(); }
    if (feature) {
      const noJs = await browser.newContext({ viewport, javaScriptEnabled: false, reducedMotion: 'reduce' });
      await attachStatic(noJs, root);
      try {
        const fallbackPage = await noJs.newPage();
        await fallbackPage.goto(base, { waitUntil: 'load', timeout: 30000 });
        const fallback = fallbackPage.locator('[data-feature-fallback]').first();
        const visible = await fallback.isVisible();
        const text = visible ? (await fallback.innerText()).trim() : '';
        add('FEATURE_NO_JS_FALLBACK', visible && text.length >= 12, text || 'Missing visible [data-feature-fallback] with useful text', name);
        const shot = path.join(path.resolve(outArg), `${name}-nojs.png`);
        await settleImages(fallbackPage);
        await fallbackPage.screenshot({ path: shot, fullPage: true, style: screenshotStyle });
        result.screenshots[`${name}NoJs`] = shot;
      } catch (error) { fail('FEATURE_NO_JS_FALLBACK', String(error), name); }
      finally { await noJs.close(); }
    }
  }
  return result.checks.some(c => !c.passed) ? 1 : 0;
}

let exitCode = 2;
try { exitCode = await main(); }
catch (error) { fail('INFRASTRUCTURE', String(error)); }
finally {
  if (browser) await browser.close().catch(() => {});
  await emit(exitCode);
}
