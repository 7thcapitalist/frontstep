#!/usr/bin/env node
import http from "node:http";
import https from "node:https";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const [previewOrigin, productionOrigin, outDir, lighthouseCli] = process.argv.slice(2);
const token = process.env.VERCEL_OIDC_TOKEN;
if (!previewOrigin || !productionOrigin || !outDir || !lighthouseCli || !token) throw new Error("argumentos ou VERCEL_OIDC_TOKEN ausentes");
await mkdir(outDir, { recursive: true });
const server = http.createServer((req, res) => {
  const target = new URL(req.url || "/", previewOrigin);
  const headers = { ...req.headers, host: target.host, "x-vercel-trusted-oidc-idp-token": token };
  const upstream = https.request(target, { method: req.method, headers }, source => {
    const responseHeaders = { ...source.headers };
    if (responseHeaders.location?.startsWith(previewOrigin)) responseHeaders.location = responseHeaders.location.replace(previewOrigin, "http://127.0.0.1:43159");
    res.writeHead(source.statusCode || 502, responseHeaders);
    source.pipe(res);
  });
  upstream.on("error", error => { res.writeHead(502); res.end(error.message); });
  req.pipe(upstream);
});
await new Promise((resolve, reject) => server.listen(43159, "127.0.0.1", error => error ? reject(error) : resolve()));

function lighthouse(url, name, desktop) {
  const args = [lighthouseCli, url, "--quiet", "--only-categories=performance", "--output=json", `--output-path=${outDir}/${name}.json`, "--chrome-flags=--headless --no-sandbox"];
  if (desktop) args.push("--preset=desktop");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: { PATH: process.env.PATH || "/usr/bin:/bin", CHROME_PATH: process.env.CHROME_PATH || "/home/joao-vitor/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome" },
    });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Lighthouse ${name} saiu ${code}`)));
  });
}

const RUNS = Number(process.env.LIGHTHOUSE_RUNS || 3);
const cases = [["producao-mobile", productionOrigin, false], ["preview-mobile", "http://127.0.0.1:43159", false], ["producao-desktop", productionOrigin, true], ["preview-desktop", "http://127.0.0.1:43159", true]];
try {
  for (let i = 1; i <= RUNS; i++) for (const [name, url, desktop] of cases) await lighthouse(url, `${name}-${i}`, desktop);
} finally { await new Promise(resolve => server.close(resolve)); }

const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = {};
for (const [name] of cases) {
  const runs = [];
  for (let i = 1; i <= RUNS; i++) {
    const report = JSON.parse(await readFile(`${outDir}/${name}-${i}.json`, "utf8"));
    runs.push({
      performance: Math.round(report.categories.performance.score * 100),
      lcpMs: Math.round(report.audits["largest-contentful-paint"].numericValue),
      transferBytes: Math.round(report.audits["total-byte-weight"].numericValue),
      cls: Number(report.audits["cumulative-layout-shift"].numericValue.toFixed(3)),
    });
  }
  // mediana por métrica; `runs` guarda as rodadas para auditoria
  summary[name] = { performance: median(runs.map(r => r.performance)), lcpMs: median(runs.map(r => r.lcpMs)), transferBytes: median(runs.map(r => r.transferBytes)), cls: median(runs.map(r => r.cls)), runs };
}
await writeFile(`${outDir}/summary.json`, JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary));
