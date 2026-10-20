#!/usr/bin/env node
// Observational motion audit. This script reports evidence; it is not a build gate.
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { captureViewport, composeStoryboard } from './storyboard.mjs';
import { sampleCanvas, assessCanvas } from './canvas-evidence.mjs';

if (!process.env.PLAYWRIGHT_BROWSERS_PATH && process.platform === 'win32') {
  const userBrowsers = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (existsSync(userBrowsers)) process.env.PLAYWRIGHT_BROWSERS_PATH = userBrowsers;
}
const { chromium } = await import('playwright');

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const rootArg = args.find(a => !a.startsWith('--') && ![flag('--scenario'), flag('--out')].includes(a));
if (!rootArg || !flag('--out')) {
  console.error('Usage: node motion-audit.mjs <public-dir> --out <evidence-dir> [--scenario scenario.json]');
  process.exit(2);
}
const root = path.resolve(rootArg);
const out = path.resolve(flag('--out'));
const scenario = flag('--scenario') ? JSON.parse(await readFile(path.resolve(flag('--scenario')), 'utf8')) : null;
const base = 'http://qa.frontstep.local/';

async function readStatic(url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  let file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return { status: 403, body: 'Forbidden' };
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) { file = path.join(file, 'index.html'); info = await stat(file).catch(() => null); }
  if (!info && !path.extname(file)) { file += '.html'; info = await stat(file).catch(() => null); }
  if (!info?.isFile()) return { status: 404, body: 'Not found' };
  const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2' };
  return { status: 200, body: await readFile(file), contentType: mime[path.extname(file).toLowerCase()] || 'application/octet-stream' };
}

async function attachStatic(context) {
  await context.route('http://qa.frontstep.local/**', async route => {
    try { await route.fulfill(await readStatic(route.request().url())); }
    catch (error) { await route.fulfill({ status: 500, body: String(error) }); }
  });
}

const instrument = () => {
  window.__motionEvents = [];
  window.__motionPhase = 'load';
  const describe = el => {
    if (!(el instanceof Element)) return String(el);
    return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : '');
  };
  const record = (kind, el, detail) => {
    if (window.__motionEvents.length < 1000) window.__motionEvents.push({ kind, target: describe(el), detail, phase: window.__motionPhase, ms: Math.round(performance.now()) });
  };
  document.addEventListener('animationstart', e => record('animationstart', e.target, e.animationName), true);
  document.addEventListener('transitionrun', e => record('transitionrun', e.target, e.propertyName), true);
  const original = Element.prototype.animate;
  Element.prototype.animate = function (...params) {
    record('Element.animate', this, JSON.stringify(params[1] ?? {}).slice(0, 180));
    return original.apply(this, params);
  };
  const identities = new WeakMap();
  const previous = new WeakMap();
  const changes = new Map();
  let nextId = 1;
  let targets = [];
  let frame = 0;
  const emptyDelta = () => ({ opacity: 0, translationPx: 0, scalePercent: 0, rotationDegrees: 0, strokeFraction: 0, clipFraction: 0 });
  const clipValues = (value, el) => {
    if (value === 'none') return [0];
    const size = Math.max(el.getBoundingClientRect().width, el.getBoundingClientRect().height, 1);
    return [...value.matchAll(/(-?\d*\.?\d+)(%|px)?/g)].map(match => Number(match[1]) / (match[2] === '%' ? 100 : match[2] === 'px' ? size : 1));
  };
  const magnitude = (property, from, to, el) => {
    const delta = emptyDelta();
    if (property === 'opacity') { delta.opacity = Math.abs(Number(to) - Number(from)); return delta; }
    if (property === 'clipPath') {
      const a = clipValues(from, el), b = clipValues(to, el);
      delta.clipFraction = Math.max(...Array.from({ length: Math.max(a.length, b.length) }, (_, i) => Math.abs((b[i] || 0) - (a[i] || 0))), 0);
      return delta;
    }
    if (property === 'strokeDashoffset' || property === 'strokeDasharray') {
      let length = 0;
      try { length = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 0; } catch { /* SVG type without path length */ }
      if (!(length > 0)) length = Math.max(el.getBoundingClientRect().width, el.getBoundingClientRect().height, 1);
      const numbers = value => value === 'none' ? [0] : [...String(value).matchAll(/-?\d*\.?\d+/g)].map(match => Number(match[0]));
      const a = numbers(from), b = numbers(to);
      delta.strokeFraction = Math.max(...Array.from({ length: Math.max(a.length, b.length) }, (_, i) => Math.abs((b[i] || 0) - (a[i] || 0)) / length), 0);
      return delta;
    }
    try {
      const a = new DOMMatrixReadOnly(from === 'none' ? undefined : from);
      const b = new DOMMatrixReadOnly(to === 'none' ? undefined : to);
      delta.translationPx = Math.hypot(b.m41 - a.m41, b.m42 - a.m42);
      delta.scalePercent = Math.max(Math.abs(b.m11 - a.m11), Math.abs(b.m22 - a.m22)) * 100;
      delta.rotationDegrees = Math.abs(Math.atan2(b.m12, b.m11) - Math.atan2(a.m12, a.m11)) * 180 / Math.PI;
      return delta;
    } catch { return delta; }
  };
  function sample() {
    frame++;
    if (frame % 12 === 1) targets = [...document.querySelectorAll('main *, header *, [data-feature]')].slice(0, 450);
    for (const el of targets) {
      const cs = getComputedStyle(el);
      const now = { transform: cs.transform, opacity: cs.opacity, clipPath: cs.clipPath, strokeDashoffset: cs.strokeDashoffset, strokeDasharray: cs.strokeDasharray };
      const before = previous.get(el);
      if (before) {
        for (const property of ['transform', 'opacity', 'clipPath', 'strokeDashoffset', 'strokeDasharray']) {
          if (before[property] === now[property]) continue;
          if (!identities.has(el)) identities.set(el, nextId++);
          const id = identities.get(el);
          const phase = window.__motionPhase;
          const key = `${id}|${property}|${phase}`;
          if (!changes.has(key) && changes.size < 400) {
            const region = el.closest('[data-feature],section,header,main');
            const signatureRoot = el.closest('[data-motion-signature]');
            changes.set(key, { target: `${describe(el)} [${id}]`, region: describe(region), interactive: !!el.closest('a,button,input,select,textarea'), markedSignature: !!signatureRoot, signature: signatureRoot?.getAttribute('data-motion-signature') || null, purpose: signatureRoot?.getAttribute('data-motion-purpose') || null, part: el.closest('[data-motion-part]')?.getAttribute('data-motion-part') || null, property, phase, from: before[property], to: now[property], changedFrames: 0, maxDelta: emptyDelta(), samples: [] });
          }
          const entry = changes.get(key);
          if (entry) {
            entry.to = now[property];
            entry.changedFrames++;
            const delta = magnitude(property, entry.from, now[property], el);
            for (const metric of Object.keys(entry.maxDelta)) entry.maxDelta[metric] = Math.max(entry.maxDelta[metric], delta[metric]);
            if (entry.samples.length < 3) entry.samples.push({ from: before[property], to: now[property], ms: Math.round(performance.now()) });
          }
        }
      }
      previous.set(el, now);
    }
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
  window.__computedMotion = () => [...changes.values()];
};

async function setPhase(page, phase) { await page.evaluate(value => { window.__motionPhase = value; }, phase); }
async function runScenario(page, notes) {
  if (!scenario?.steps?.length) { notes.push('No scenario provided'); return; }
  for (const [index, step] of scenario.steps.entries()) {
    try {
      await setPhase(page, `scenario-${index + 1}-${step.action}`);
      const loc = page.locator(step.selector).first();
      if (step.action === 'fill') await loc.fill(String(step.value ?? ''));
      else if (step.action === 'click') await loc.click();
      else if (step.action === 'check') await loc.check();
      else if (step.action === 'select') await loc.selectOption(String(step.value));
      else throw new Error(`Unsupported action ${step.action}`);
      await page.waitForTimeout(350);
    } catch (error) { notes.push(`Scenario step ${index + 1}: ${String(error)}`); break; }
  }
}

await mkdir(out, { recursive: true });
let browser;
const report = { site: root, scenario: flag('--scenario') || null, startedAt: new Date().toISOString(), viewport: { width: 1365, height: 900 }, notes: [] };
try {
  if (!existsSync(path.join(root, 'index.html'))) throw new Error('Missing index.html');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: report.viewport, reducedMotion: 'no-preference' });
  await attachStatic(context);
  await context.addInitScript(instrument);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(700);
  const heroFrame = path.join(out, 'motion-hero.png');
  await captureViewport(page, heroFrame, { disableAnimations: false });
  let sectionFrame = null;
  for (const [index, fraction] of [0.25, 0.5, 0.75, 1].entries()) {
    await setPhase(page, `scroll-${index + 1}`);
    await page.evaluate(value => window.scrollTo(0, document.documentElement.scrollHeight * value), fraction);
    await page.waitForTimeout(600);
    if (index === 1) {
      sectionFrame = path.join(out, 'motion-section.png');
      await captureViewport(page, sectionFrame, { disableAnimations: false });
    }
  }
  await runScenario(page, report.notes);
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  if (await page.locator('[data-feature]').count()) await page.locator('[data-feature]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(220);
  const featureFrame = path.join(out, 'motion-feature.png');
  await captureViewport(page, featureFrame, { disableAnimations: false });
  // Hover is relevant for visual interaction; avoid clicking external links.
  const hoverTargets = await page.locator('main button, main a, header a').count();
  for (let index = 0; index < Math.min(hoverTargets, 4); index++) {
    try {
      await setPhase(page, `hover-${index + 1}`);
      await page.locator('main button, main a, header a').nth(index).hover({ timeout: 3000 });
      await page.waitForTimeout(250);
    } catch { /* hidden or off-screen target */ }
  }
  const events = await page.evaluate(() => window.__motionEvents);
  const computed = await page.evaluate(() => window.__computedMotion());
  const activeAnimations = await page.evaluate(() => document.getAnimations().map(a => ({ name: a.animationName || a.effect?.target?.className || '', playState: a.playState })).slice(0, 30));
  report.motion = { totalEvents: events.length, counts: Object.fromEntries(['animationstart', 'transitionrun', 'Element.animate'].map(kind => [kind, events.filter(e => e.kind === kind).length])), phases: Object.fromEntries([...new Set(events.map(e => e.phase))].map(phase => [phase, events.filter(e => e.phase === phase).length])), samples: events.slice(0, 40), activeAnimations };
  const nonHover = computed.filter(item => !item.phase.startsWith('hover') && !item.interactive);
  const hover = computed.filter(item => item.phase.startsWith('hover'));
  const substantial = item => item.changedFrames >= 2 && (item.maxDelta.opacity >= 0.18 || item.maxDelta.translationPx >= 12 || item.maxDelta.scalePercent >= 5 || item.maxDelta.rotationDegrees >= 8 || item.maxDelta.strokeFraction >= 0.1 || item.maxDelta.clipFraction >= 0.1);
  const marked = nonHover.filter(item => item.markedSignature && substantial(item));
  const legacy = nonHover.filter(item => !item.markedSignature && substantial(item) && /(?:^|[.# ])(?:hero|photo|visual|image|scene|feature|sticker|accent|artwork)(?:[.# \[-]|$)/i.test(`${item.target} ${item.region}`));
  report.signatureEvidence = {
    measurement: 'Actual computed transform/opacity/clip-path/SVG stroke changes sampled on animation frames; candidates require non-hover, non-control changes. Visual judgment still required.',
    hasMeaningfulChange: marked.length > 0 || legacy.length > 0,
    criteria: 'At least 2 changed frames and max opacity delta >= 0.18, translation >= 12 px, scale >= 5%, rotation >= 8 degrees, SVG stroke >= 10% of path length, or clip path >= 10% of region. Hover and controls excluded. Explicit data-motion-signature regions count; legacy examples require a visual/hero/feature target or region.',
    changedPropertyGroups: computed.length,
    changedFrames: computed.reduce((sum, item) => sum + item.changedFrames, 0),
    contentMotionCandidates: nonHover.length,
    genericHoverGroups: hover.length,
    markedSignatureChanges: marked.slice(0, 25),
    legacySceneChanges: legacy.slice(0, 25),
    byPhase: Object.fromEntries([...new Set(computed.map(item => item.phase))].map(phase => [phase, computed.filter(item => item.phase === phase).length])),
    contentSamples: nonHover.slice(0, 25),
    hoverSamples: hover.slice(0, 8)
  };
  const storyboardRows = [[
    { title: 'Abertura', file: heroFrame, width: report.viewport.width },
    { title: 'Seção após rolagem', file: sectionFrame || heroFrame, width: report.viewport.width },
    { title: 'Feature após cenário', file: featureFrame, width: report.viewport.width }
  ]];
  const markedScene = await page.locator('[data-motion-signature]').count();
  const markedSpatial=await page.locator('[data-motion-signature]:has([data-spatial-canvas])').count();
  const sceneSelector = markedSpatial?'[data-motion-signature]:has([data-spatial-canvas])':markedScene ? '[data-motion-signature]' : 'section.hero, .hero';
  if (markedScene) {
    const entrance = await context.newPage();
    await entrance.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const firstSignature = entrance.locator('[data-motion-signature]').first();
    const initialVisibility = await firstSignature.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const intersection = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
      return { visible: el.checkVisibility({ checkVisibilityCSS: true }) && rect.width > 0 && intersection >= Math.min(rect.height, innerHeight) * 0.15, fraction: rect.height ? intersection / Math.min(rect.height, innerHeight) : 0, marker: el.getAttribute('data-motion-signature'), purpose: el.getAttribute('data-motion-purpose') };
    });
    if (initialVisibility.visible) {
      const positions = [];
      const frames = [];
      for (const [label, targetMs] of [['early', 0], ['mid', 250], ['settled', 1000]]) {
        const elapsed = await entrance.evaluate(() => performance.now());
        if (targetMs > elapsed) await entrance.waitForTimeout(targetMs - elapsed);
        const before = await entrance.evaluate(() => performance.now());
        const file = path.join(out, `entrance-${label}.png`);
        await captureViewport(entrance, file, { disableAnimations: false });
        const after = await entrance.evaluate(() => performance.now());
        positions.push({ label, targetMs, elapsedMsBefore: Math.round(before), elapsedMsAfter: Math.round(after), file });
        frames.push({ title: `Entrada ${label}: ${Math.round(before)} ms`, file, width: report.viewport.width });
      }
      report.entranceTimeline = { captured: true, marker: initialVisibility.marker, purpose: initialVisibility.purpose, initialViewportFraction: Number(initialVisibility.fraction.toFixed(3)), positions };
      storyboardRows.push(frames);
    } else {
      report.entranceTimeline = { captured: false, reason: 'Marked signature is outside or hidden in the initial viewport', initialViewportFraction: Number(initialVisibility.fraction.toFixed(3)) };
    }
    await entrance.close();
  } else {
    report.entranceTimeline = { captured: false, reason: 'No data-motion-signature marker' };
  }
  if (await page.locator(sceneSelector).count()) {
    const sequence = await context.newPage();
    await sequence.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
    await sequence.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const scene = sequence.locator(sceneSelector).first();
    const geometry = await scene.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const partRect = el.querySelector('[data-motion-part]')?.getBoundingClientRect();
      return { top: rect.top + scrollY, height: rect.height, marker: el.getAttribute('data-motion-signature'), purpose: el.getAttribute('data-motion-purpose'), spatialCanvas:!!el.querySelector('[data-spatial-canvas]'), partTop: partRect ? partRect.top + scrollY : null, partBottom: partRect ? partRect.bottom + scrollY : null };
    });
    const vh = report.viewport.height;
    const rawTargets = geometry.spatialCanvas
      ? [geometry.top,geometry.top+Math.max(0,geometry.height-vh)*.5,geometry.top+Math.max(0,geometry.height-vh)]
      : [Math.max(0, geometry.top - 0.75 * vh), Math.max(0, geometry.top + geometry.height * 0.5 - 0.5 * vh), Math.max(0, geometry.top + geometry.height - 0.25 * vh)];
    const targets = rawTargets.map(y => geometry.spatialCanvas||geometry.partTop == null ? y : Math.max(Math.max(0, geometry.partTop - 0.8 * vh), Math.min(y, Math.max(0, geometry.partBottom - 0.2 * vh))));
    const frames = [];
    const positions = [];
    const canvasSamples=[];let idleCanvas;
    const started = Date.now();
    for (const [index, label] of ['start', 'mid', 'end'].entries()) {
      await sequence.evaluate(y => window.scrollTo(0, y), targets[index]);
      await sequence.waitForTimeout(geometry.spatialCanvas?1200:index === 0 ? 100 : 300);
      if(geometry.spatialCanvas){
        canvasSamples.push(await sampleCanvas(sequence));
        if(index===0){await sequence.waitForTimeout(200);idleCanvas=await sampleCanvas(sequence);}
      }
      const file = path.join(out, `signature-${label}.png`);
      await captureViewport(sequence, file, { disableAnimations: false });
      const position = await sequence.evaluate(() => ({ scrollY, rect: (() => { const r = document.querySelector('[data-motion-signature], section.hero, .hero')?.getBoundingClientRect(); return r ? { top: Math.round(r.top), bottom: Math.round(r.bottom) } : null; })() }));
      positions.push({ label, requestedScrollY: Math.round(targets[index]), actualScrollY: Math.round(position.scrollY), sceneRect: position.rect, elapsedMs: Date.now() - started, file });
      frames.push({ title: `${geometry.marker || 'Cena visual'}: ${label}`, file, width: report.viewport.width });
    }
    report.signatureScene = { marked: !!markedScene, selector: sceneSelector, marker: geometry.marker, purpose: geometry.purpose, positions };
    if(geometry.spatialCanvas){
      report.canvasEvidence=assessCanvas(canvasSamples,idleCanvas);
      report.signatureEvidence.hasMeaningfulChange ||= report.canvasEvidence.hasRenderedChange;
    }
    storyboardRows.push(frames);
    await sequence.close();
  } else {
    report.signatureScene = { marked: false, selector: null, positions: [], note: 'No marked signature or legacy hero scene found' };
  }

  // Observe real scenario interaction instead of mistaking a full-page marker for a hero animation.
  const interactionRows = [];
  report.interactionTimeline = [];
  const explicitMotion = scenario?.motionSteps !== undefined;
  const observedSteps = explicitMotion ? scenario.motionSteps : scenario?.steps;
  if (explicitMotion && (!Array.isArray(observedSteps) || !observedSteps.length || observedSteps.length > 8 || observedSteps.some(step => !step?.selector || !['click','fill','select','check'].includes(step.action) || (step.capture !== undefined && typeof step.capture !== 'boolean')) || observedSteps.filter(step => step.action === 'click' && step.capture !== false).length > 3 || !observedSteps.some(step => step.action === 'click' && step.capture !== false))) throw new Error('motionSteps needs 1-8 local actions and 1-3 captured clicks');
  if (observedSteps?.some(step => step.action === 'click')) {
    for (const [label, viewport] of Object.entries({ desktop: report.viewport, mobile: { width: 390, height: 844 } })) {
      const observed = await browser.newContext({ viewport, reducedMotion: 'no-preference', ...(label === 'mobile' ? { isMobile: true, hasTouch: true } : {}) });
      await observed.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
      await observed.addInitScript(() => { window.__auditOpened = []; window.open = (...args) => { window.__auditOpened.push(args[0]); return null; }; });
      await attachStatic(observed);
      const timeline = await observed.newPage();
      try {
        await timeline.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
        await timeline.evaluate(() => document.fonts.ready);
        let captured = false;
        for (const [index, step] of observedSteps.entries()) {
          const control = timeline.locator(step.selector).first();
          if (step.action === 'click' && (explicitMotion ? step.capture !== false : !captured)) {
            const frames = [], positions = [], prefix = explicitMotion ? `interaction-${label}-step${index+1}` : `interaction-${label}`;
            await control.scrollIntoViewIfNeeded();
            const beforeFile = path.join(out, `${prefix}-before.png`);
            await captureViewport(timeline, beforeFile, { disableAnimations: false });
            frames.push({ title: `${label}: before actual action`, file: beforeFile, width: viewport.width });
            const start = await timeline.evaluate(() => performance.now());
            if (label === 'mobile') await control.tap(); else await control.click();
            for (const [frame, requestedMs] of [['early', 0], ['landing', 320], ['settled', 600]]) {
              const now = await timeline.evaluate(() => performance.now());
              if (now - start < requestedMs) await timeline.waitForTimeout(requestedMs - (now - start));
              const actualBefore = await timeline.evaluate(() => performance.now());
              const file = path.join(out, `${prefix}-${frame}.png`);
              await captureViewport(timeline, file, { disableAnimations: false });
              const actualAfter = await timeline.evaluate(() => performance.now());
              positions.push({ frame, requestedMs, actualBeforeMs: Math.round(actualBefore-start), actualAfterMs: Math.round(actualAfter-start), file });
              frames.push({ title: `${label}: ${frame}, ${Math.round(actualBefore-start)}ms`, file, width: viewport.width });
            }
            report.interactionTimeline.push({ viewport: label, action: step.action, selector: step.selector, step: index+1, positions, limitation: 'Real screenshots taken without slowing or freezing motion. Timings are observed capture intervals; this does not establish smoothness or every rapid-input transition.' });
            interactionRows.push(frames);
            captured = true;
          } else {
            if (step.action === 'fill') await control.fill(String(step.value ?? ''));
            else if (step.action === 'select') await control.selectOption(String(step.value));
            else if (step.action === 'check') await control.check();
            else if (step.action === 'click') { if (label === 'mobile') await control.tap(); else await control.click(); }
          }
        }
      } catch (error) { if (explicitMotion) throw error; report.notes.push(`${label} interaction timeline: ${String(error)}`); }
      finally { await observed.close(); }
    }
  }
  if (interactionRows.length) report.interactionStoryboard = await composeStoryboard(browser, interactionRows, path.join(out, 'interaction-storyboard.png'));

  report.storyboard = await composeStoryboard(browser, storyboardRows, path.join(out, 'storyboard.png'));
  report.pageErrors = errors;
  await context.close();

  for (const [label, viewport] of Object.entries({ desktop: report.viewport, mobile: { width: 390, height: 844 } })) {
    const reduced = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    await attachStatic(reduced);
    const reducedPage = await reduced.newPage();
    await reducedPage.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
    await reducedPage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await reducedPage.waitForTimeout(250);
    const evidence = await reducedPage.evaluate(() => {
      const allMeaningful = [...document.querySelectorAll('main h1, main h2, main h3, main section, [data-feature]')];
      const intentionalHidden = allMeaningful.filter(el => el.closest('[hidden],[aria-hidden="true"],[inert]'));
      const meaningful = allMeaningful.filter(el => !el.closest('[hidden],[aria-hidden="true"],[inert]'));
      const hidden = meaningful.filter(el => {
        for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
          const cs = getComputedStyle(ancestor);
          if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return true;
        }
        return false;
      });
      return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, textLength: document.body.innerText.trim().length, meaningfulElements: meaningful.length, intentionallyHidden: intentionalHidden.length, hiddenMeaningful: hidden.map(el => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className ? `.${String(el.className).trim().split(/\s+/)[0]}` : '')).slice(0, 20) };
    });
    const reducedShot = path.join(out, label === 'desktop' ? 'reduced-motion.png' : 'reduced-motion-mobile.png');
    await reducedPage.screenshot({ path: reducedShot, fullPage: true });
    evidence.screenshot = reducedShot;
    if (label === 'desktop') report.reducedMotion = evidence; else report.mobileReducedMotion = evidence;
    await reduced.close();
  }
  report.completed = true;
} catch (error) { report.completed = false; report.error = String(error); process.exitCode = 2; }
finally {
  if (browser) await browser.close().catch(() => {});
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(out, 'motion-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
