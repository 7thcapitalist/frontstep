#!/usr/bin/env node
// Exporta os workflows do n8n para n8n/workflows/*.json, sem segredos.
//
//   N8N_API_KEY=... node scripts/export-n8n.mjs
//
// Opcional: N8N_URL (padrao https://jvcarvalho.app.n8n.cloud), N8N_FILTER (regex no nome,
// padrao "^(Frontstep|Holding)"). Cada export gasta 0 execucoes do plano (API publica).
// Crie a chave em n8n > Settings > n8n API. Nunca commite a chave.

import { mkdir, writeFile, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = (process.env.N8N_URL || "https://jvcarvalho.app.n8n.cloud").replace(/\/$/, "");
const KEY = process.env.N8N_API_KEY;
const FILTER = new RegExp(process.env.N8N_FILTER || "^(Frontstep|Holding)");
if (!KEY) { console.error("Defina N8N_API_KEY."); process.exit(1); }

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repo, "n8n", "workflows");

async function api(p) {
  const r = await fetch(BASE + "/api/v1" + p, { headers: { "X-N8N-API-KEY": KEY, accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${p}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// Mascara valores que parecem segredo em qualquer string do workflow.
const PADROES = [
  [/APP_USR-[\w-]{10,}/g, "APP_USR-REDACTED"],
  [/\b(sk-ant-[\w-]{10,}|sk-[\w-]{20,}|ghp_\w{20,}|github_pat_\w{20,}|xox[bp]-[\w-]{10,})/g, "REDACTED"],
  [/(Bearer\s+)[A-Za-z0-9._~+\/=-]{16,}/g, "$1REDACTED"],
  [/((?:secret|segredo|token|api[_-]?key|password|senha)\w*\s*[:=]\s*)(["'`])[^"'`\n]{8,}\2/gi, "$1$2REDACTED$2"],
];
function limpa(v) {
  if (typeof v === "string") { for (const [re, s] of PADROES) v = v.replace(re, s); return v; }
  if (Array.isArray(v)) return v.map(limpa);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      // valores de header de autenticacao escritos direto no no
      if (/^(value)$/i.test(k) && typeof x === "string" && /^[A-Za-z0-9._-]{24,}$/.test(x) && v.name && /auth|key|token|secret/i.test(v.name)) { o[k] = "REDACTED"; continue; }
      o[k] = limpa(x);
    }
    return o;
  }
  return v;
}

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

let cursor = null, todos = [];
do {
  const q = "/workflows?limit=100" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");
  const r = await api(q);
  todos = todos.concat(r.data);
  cursor = r.nextCursor;
} while (cursor);

const alvo = todos.filter(w => FILTER.test(w.name));
await mkdir(outDir, { recursive: true });
for (const f of await readdir(outDir)) if (f.endsWith(".json")) await unlink(path.join(outDir, f));

for (const w of alvo) {
  const full = await api("/workflows/" + w.id);
  const limpo = limpa({
    id: full.id, name: full.name, active: full.active,
    nodes: full.nodes, connections: full.connections, settings: full.settings,
    tags: (full.tags || []).map(t => t.name),
  });
  // pinData e staticData ficam de fora: dados reais de lead e estado interno.
  const arq = path.join(outDir, `${slug(full.name)}.${full.id}.json`);
  await writeFile(arq, JSON.stringify(limpo, null, 2) + "\n");
  console.log("ok ", full.name);
}
console.log(`\n${alvo.length} workflow(s) em n8n/workflows. Confira o git diff antes de commitar.`);
