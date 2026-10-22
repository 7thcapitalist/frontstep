// Local deterministic probe. Imported only for a FUTURE explicitly supervised
// QA run. It never starts HTTP servers, installs packages or invokes a model.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, readdir, realpath, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif', '.woff2':'font/woff2'};
export async function attachLocalRoutes(context, root, blocked) {
  await context.routeWebSocket('**/*', ws=>{blocked.push('websocket'); ws.close();});
  await context.route('**/*', async route=>{
    try {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://frontstep.invalid') {blocked.push('external'); return route.abort();}
      const relative = decodeURIComponent(url.pathname).replace(/^\//,'') || 'index.html';
      const file = await realpath(path.resolve(root, relative));
      if (!file.startsWith(root + path.sep) || !(await lstat(file)).isFile()) throw new Error('invalid path');
      await route.fulfill({status:200, contentType:types[path.extname(file)] || 'application/octet-stream', body:await readFile(file)});
    } catch {blocked.push('missing or unsafe file'); await route.abort();}
  });
}

export async function runScenario(page, scenario) {
  if (!scenario || !Array.isArray(scenario.steps) || !Array.isArray(scenario.assertions) ||
      scenario.steps.length>20 || scenario.assertions.length>20) return false;
  for (const step of scenario.steps) {
    if (typeof step.selector!=='string' || step.selector.length>500) return false;
    const target=page.locator(step.selector).first();
    if (step.action==='click') await target.click({timeout:3000});
    else if(step.action==='fill' && typeof step.value==='string') await target.fill(step.value,{timeout:3000});
    else if(step.action==='check') await target.check({timeout:3000});
    else if(step.action==='select' && typeof step.value==='string') await target.selectOption(step.value,{timeout:3000});
    else return false;
  }
  for (const assertion of scenario.assertions) {
    if(typeof assertion.selector!=='string' || assertion.selector.length>500) return false;
    const target=page.locator(assertion.selector).first();
    if(assertion.kind==='visible') {if(!await target.isVisible()) return false; continue;}
    let value;
    if(assertion.kind==='text') value=await target.innerText({timeout:3000});
    else if(assertion.kind==='value') value=await target.inputValue({timeout:3000});
    else if(assertion.kind==='attribute' && typeof assertion.name==='string') value=await target.getAttribute(assertion.name,{timeout:3000});
    else return false;
    if(typeof value!=='string') return false;
    if(assertion.equals!==undefined && value!==assertion.equals) return false;
    if(assertion.includes!==undefined && !value.includes(assertion.includes)) return false;
  }
  return scenario.assertions.length>0;
}
export async function digest(root) {
  const records = [];
  async function walk(folder) {
    for (const entry of (await readdir(folder, {withFileTypes:true})).sort((a,b)=>a.name < b.name ? -1 : 1)) {
      const file = path.join(folder, entry.name);
      if ((await lstat(file)).isSymbolicLink()) throw new Error('site_links_forbidden');
      if (entry.isDirectory()) await walk(file);
      else records.push([path.relative(root, file).split(path.sep).join('/'), hash(await readFile(file))]);
    }
  }
  await walk(root);
  records.sort((a,b)=>a[0] < b[0] ? -1 : 1);
  return hash(Buffer.from(JSON.stringify(records)));
}

export async function probe(input, chromium) {
  const root = await realpath(input.root);
  const out = path.resolve(input.out);
  if(out===root || out.startsWith(root+path.sep)) throw new Error('qa_output_must_not_modify_public_files');
  await mkdir(out, {recursive:false});
  const report = {completed:false, digest:await digest(root), checks:[], screenshots:{}};
  const check = (code, passed) => report.checks.push({code, passed:passed === true});
  const feature = typeof input.brief.premium_feature === 'string' ? input.brief.premium_feature : input.brief.premium_feature?.id;
  const browser = await chromium.launch({headless:true, args:['--disable-background-networking','--disable-extensions','--disable-sync','--force-webrtc-ip-handling-policy=disable_non_proxied_udp']});
  try {
    for (const [name,width,height] of [['desktop',1280,900],['mobile',390,844]]) {
      const errors = [], blocked = [];
      const context = await browser.newContext({viewport:{width,height}, serviceWorkers:'block', acceptDownloads:false, permissions:[]});
      try {
        await attachLocalRoutes(context,root,blocked);
        const page = await context.newPage();
        context.on('page', popup=>{if(popup !== page) popup.close().catch(()=>{});});
        page.on('pageerror', error=>errors.push(String(error)));
        page.on('console', message=>{if(message.type()==='error') errors.push(message.text());});
        await page.goto('http://frontstep.invalid/index.html', {waitUntil:'load', timeout:15000});
        for (const ratio of [0,0.5,1]) {
          await page.evaluate(r=>scrollTo(0, (document.documentElement.scrollHeight-innerHeight)*r),ratio);
          await page.waitForTimeout(120);
        }
        await page.evaluate(()=>scrollTo(0,0));
        const data = await page.evaluate(({feature,lang})=>{
          const headings = [...document.querySelectorAll('h1')];
          const images = [...document.images];
          const buttons = [...document.querySelectorAll('button')];
          const forms = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')];
          const hero = headings[0];
          return {
            document:!!document.title.trim() && document.documentElement.lang.startsWith(lang.split('-')[0]) && headings.length===1,
            layout:document.documentElement.scrollWidth<=innerWidth+1,
            photos:images.every(i=>i.complete && i.naturalWidth>0 && i.hasAttribute('alt') && i.hasAttribute('width') && i.hasAttribute('height') && i.height<=innerHeight*.6+1),
            accessibility:buttons.every(b=>b.textContent.trim() || b.getAttribute('aria-label')) && forms.every(e=>e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby')),
            feature:!feature || [...document.querySelectorAll('[data-feature]')].some(e=>e.dataset.feature===feature),
            typography:!!hero && parseFloat(getComputedStyle(hero).fontSize)>=32,
            links:[...document.querySelectorAll('a[href*="wa.me"]')].every(e=>/^https:\/\/wa\.me\/\d{10,15}(\?|$)/.test(e.href)),
            slots:!document.querySelector('[data-slot]')
          };
        },{feature,lang:input.brief.language || 'pt-BR'});
        for (const key of ['document','layout','photos','accessibility','feature','typography','links']) check(`${name}:${key}`,data[key]);
        if(input.brief.fase==='final') check(`${name}:final_slots`,data.slots);
        check(`${name}:js_errors`,!errors.length);
        check(`${name}:local_assets`,!blocked.length);
        if(feature) {
          let functional=false;
          try {functional=await runScenario(page,input.brief.qa_scenario);} catch {}
          check(`${name}:feature_scenario`,functional);
          check(`${name}:interaction_js_errors`,!errors.length);
          check(`${name}:interaction_local_assets`,!blocked.length);
        }
        const shot = `${name}.png`;
        await page.screenshot({path:path.join(out,shot), fullPage:true});
        report.screenshots[name] = {path:shot, sha256:hash(await readFile(path.join(out,shot)))};
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.reload({waitUntil:'load'});
        check(`${name}:reduced_motion`,await page.locator('h1').isVisible());
      } finally {await context.close();}
      if(feature) {
        const noJsBlocked=[];
        const noJs=await browser.newContext({viewport:{width,height}, javaScriptEnabled:false,
                                             serviceWorkers:'block', acceptDownloads:false, permissions:[]});
        try {
          await attachLocalRoutes(noJs,root,noJsBlocked);
          const page=await noJs.newPage();
          await page.goto('http://frontstep.invalid/index.html',{waitUntil:'load',timeout:15000});
          check(`${name}:feature_fallback`,await page.locator('[data-feature-fallback]').first().isVisible());
          check(`${name}:nojs_local_assets`,!noJsBlocked.length);
          const shot=`${name}-nojs.png`;
          await page.screenshot({path:path.join(out,shot),fullPage:true});
          report.screenshots[`${name}NoJs`]={path:shot,sha256:hash(await readFile(path.join(out,shot)))};
        } finally {await noJs.close();}
      }
    }
    report.completed = true;
  } finally {await browser.close();}
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    let raw = '';
    for await (const chunk of process.stdin) {raw += chunk; if(raw.length>100000) throw new Error('input_too_large');}
    const input = JSON.parse(raw);
    const require = createRequire(new URL('./resources/local-qa/package.json', import.meta.url));
    const {chromium} = require('playwright'); // Existing dependency only; no download/install.
    process.stdout.write(JSON.stringify(await probe(input,chromium)));
  } catch {process.stdout.write(JSON.stringify({completed:false,error:'local_qa_unavailable'})); process.exitCode=2;}
}
