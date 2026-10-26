#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [previewUrl, productionUrl, outDir] = process.argv.slice(2);
const token = process.env.VERCEL_OIDC_TOKEN;
if (!previewUrl || !productionUrl || !outDir || !token) throw new Error("preview, produção, saída e VERCEL_OIDC_TOKEN são obrigatórios");
const playwrightPath = process.env.PLAYWRIGHT_CORE_PATH || "/home/joao-vitor/dev/habblaud/node_modules/playwright-core/index.js";
const chromePath = process.env.CHROME_PATH || "/home/joao-vitor/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const playwright = (await import(pathToFileURL(playwrightPath))).default;
const browser = await playwright.chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox"],
  env: { HOME: os.tmpdir(), PATH: process.env.PATH || "/usr/bin:/bin" },
});
const viewports = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const results = {};
await mkdir(outDir, { recursive: true });

async function capture(label, url, viewportName, auth = false) {
  const viewport = viewports[viewportName];
  const headers = auth ? { "x-vercel-trusted-oidc-idp-token": token } : {};
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, extraHTTPHeaders: headers });
  const page = await context.newPage();
  if (auth) {
    const origin = new URL(url).origin;
    await page.route("**/*", route => {
      const requestHeaders = { ...route.request().headers() };
      if (new URL(route.request().url()).origin !== origin) delete requestHeaders["x-vercel-trusted-oidc-idp-token"];
      return route.continue({ headers: requestHeaders });
    });
  }
  const consoleErrors = [], pageErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => pageErrors.push(error.message));
  const response = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(outDir, `${viewportName}-${label}.png`) });
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    return {
      transferBytes: Math.round(resources.reduce((sum, item) => sum + (item.transferSize || 0), nav?.transferSize || 0)),
      decodedBytes: Math.round(resources.reduce((sum, item) => sum + (item.decodedBodySize || 0), nav?.decodedBodySize || 0)),
      resourceCount: resources.length,
    };
  });
  await context.close();
  return { status: response?.status() ?? null, consoleErrors, pageErrors, ...perf };
}

for (const viewportName of Object.keys(viewports)) {
  results[viewportName] = { production: await capture("antes", productionUrl, viewportName), preview: await capture("depois", previewUrl, viewportName, true) };
  const before = (await readFile(path.join(outDir, `${viewportName}-antes.png`))).toString("base64");
  const after = (await readFile(path.join(outDir, `${viewportName}-depois.png`))).toString("base64");
  const compare = await browser.newPage({ viewport: { width: viewports[viewportName].width * 2 + 48, height: viewports[viewportName].height + 72 } });
  await compare.setContent(`<!doctype html><style>body{margin:0;background:#111;color:#fff;font:600 18px system-ui;display:flex;gap:16px;padding:16px}.p{width:${viewports[viewportName].width}px}.t{height:32px}img{display:block;width:100%;height:${viewports[viewportName].height}px;object-fit:cover;object-position:top}</style><div class=p><div class=t>ANTES · studiofrontstep.com</div><img src="data:image/png;base64,${before}"></div><div class=p><div class=t>DEPOIS · preview da main</div><img src="data:image/png;base64,${after}"></div>`);
  await compare.screenshot({ path: path.join(outDir, `${viewportName}-lado-a-lado.png`), fullPage: true });
  await compare.close();
}
await browser.close();
await writeFile(path.join(outDir, "browser-qa.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results));
