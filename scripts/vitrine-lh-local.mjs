#!/usr/bin/env node
// Lighthouse mobile local (site/ servido por http estático), N rodadas, mediana.
// uso: node scripts/vitrine-lh-local.mjs <lighthouse/cli/index.js> <outDir> [rodadas=3] [url]
import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [cli, outDir, n = "3", remote] = process.argv.slice(2);
if (!cli || !outDir) throw new Error("uso: <lighthouse cli> <outDir> [rodadas] [url]");
const site = process.env.SITE_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
const delay = Number(process.env.LATENCY_MS || 0); // simula RTT do CDN: localhost termina tudo antes do 1o paint e distorce o LCP simulado
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".avif": "image/avif", ".mp4": "video/mp4", ".json": "application/json", ".woff2": "font/woff2" };
await mkdir(outDir, { recursive: true });
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try {
    const data = await readFile(path.join(site, p));
    if (delay) await new Promise(r => setTimeout(r, delay));
    res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream", "cache-control": "public, max-age=0" });
    res.end(data);
  } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(43160, "127.0.0.1", r));
const url = remote || "http://127.0.0.1:43160/";
const run = i => new Promise((resolve, reject) => {
  const c = spawn(process.execPath, [cli, url, "--quiet", "--only-categories=performance", "--output=json", `--output-path=${outDir}/run${i}.json`, "--chrome-flags=--headless --no-sandbox"], { stdio: "inherit", env: { PATH: process.env.PATH, CHROME_PATH: process.env.CHROME_PATH || "/home/joao-vitor/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome" } });
  c.on("exit", code => code === 0 ? resolve() : reject(new Error(`lh ${code}`)));
});
const rows = [];
try {
  for (let i = 1; i <= Number(n); i++) {
    await run(i);
    const r = JSON.parse(await readFile(`${outDir}/run${i}.json`, "utf8"));
    const lcpEl = r.audits["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet;
    rows.push({ perf: Math.round(r.categories.performance.score * 100), lcpMs: Math.round(r.audits["largest-contentful-paint"].numericValue), fcpMs: Math.round(r.audits["first-contentful-paint"].numericValue), tbtMs: Math.round(r.audits["total-blocking-time"].numericValue), bytes: Math.round(r.audits["total-byte-weight"].numericValue), lcpEl });
  }
} finally { server.close(); }
const med = k => [...rows].map(x => x[k]).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
const summary = { rows, median: { perf: med("perf"), lcpMs: med("lcpMs"), fcpMs: med("fcpMs"), tbtMs: med("tbtMs"), bytes: med("bytes") } };
await writeFile(`${outDir}/summary.json`, JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 1));
