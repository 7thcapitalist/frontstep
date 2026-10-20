// QA for a Frontstep site folder: node scripts/qa.mjs sites/<slug>
// Serves the folder, screenshots mobile + desktop at several scroll depths,
// and checks overflow, console errors, WhatsApp links, weight and images.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || ".");
const out = path.join(dir, "..", `_qa-${path.basename(dir)}`);
fs.mkdirSync(out, { recursive: true });

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(dir, p);
  if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://localhost:${server.address().port}/`;

// total weight
let bytes = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name)) : (bytes += fs.statSync(path.join(d, e.name)).size));
walk(dir);

const report = { url, totalKB: Math.round(bytes / 1024), viewports: {} };
const browser = await chromium.launch();
for (const [name, width, height] of [["mobile", 390, 844], ["desktop", 1440, 900]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => m.type() === "error" && errors.push(m.text()));
  page.on("requestfailed", r => errors.push("request failed: " + r.url()));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const checks = await page.evaluate(() => {
    const wa = [...document.querySelectorAll('a[href*="wa.me"]')].map(a => a.href);
    const imgs = [...document.images].filter(i => !i.getAttribute("width") || !i.getAttribute("alt"));
    return {
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      whatsappLinks: wa.length,
      whatsappBad: wa.filter(h => !/wa\.me\/\d{12,13}/.test(h)).length,
      imagesMissingSizeOrAlt: imgs.length,
      h1Count: document.querySelectorAll("h1").length,
      hasJsonLd: !!document.querySelector('script[type="application/ld+json"]'),
      scrollHeight: document.documentElement.scrollHeight
    };
  });
  const stops = [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
  for (let i = 0; i < stops.length; i++) {
    await page.evaluate(y => scrollTo(0, y), Math.round(stops[i] * (checks.scrollHeight - height)));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(out, `${name}-${String(i).padStart(2, "0")}.png`) });
  }
  report.viewports[name] = { ...checks, errors };
  await page.close();
}
await browser.close();
server.close();
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`Screenshots in ${out}`);
