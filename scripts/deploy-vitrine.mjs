#!/usr/bin/env node
// Preview + QA + cartão de publicação da vitrine. Nunca promove para produção.
import { appendFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(repo, "site");
const issueId = process.env.PAPERCLIP_TASK_ID;
const scope = process.env.VITRINE_VERCEL_SCOPE || "7thcapitalist";
const project = process.env.VITRINE_VERCEL_PROJECT || "fs-frontstep-site-oficial";
const production = process.env.VITRINE_PRODUCTION_URL || "https://studiofrontstep.com";
const pc = process.env.PAPERCLIP_PC_SCRIPT || "/home/joao-vitor/dev/holding-hq/scripts/pc.mjs";
const guard = process.env.HOLDING_GUARD_SCRIPT || "/home/joao-vitor/dev/holding-hq/scripts/guard.mjs";
const skillDir = process.env.PAPERCLIP_SKILL_DIR || "/home/joao-vitor/.paperclip/instances/default/companies/205f72c1-3a4e-4603-bcd5-e8f4a34e2a5a/codex-home/skills/paperclip";
if (!issueId) throw new Error("PAPERCLIP_TASK_ID ausente");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd || repo, env: options.env || process.env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; if (options.echo) process.stdout.write(chunk); });
    child.stderr.on("data", chunk => { stderr += chunk; if (options.echo) process.stderr.write(chunk); });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} saiu ${code}: ${(stderr || stdout).slice(-1200)}`)));
  });
}
const asMb = bytes => `${(bytes / 1_000_000).toFixed(2)} MB`;
const asSec = ms => `${(ms / 1000).toFixed(2)} s`;
const tmp = await mkdtemp(path.join(os.tmpdir(), "frontstep-vitrine-"));
const qaDir = path.join(tmp, "qa");
const ledgerPath = path.join(repo, "ledger", "runs.jsonl");
let ledger = { at: new Date().toISOString(), kind: "deploy-vitrine", issueId, status: "failed" };

async function pcWrite(method, endpoint, payload) {
  const file = path.join(tmp, `pc-${crypto.randomUUID()}.json`);
  await writeFile(file, JSON.stringify(payload));
  return JSON.parse((await run(process.execPath, [pc, method, endpoint, `@${file}`])).stdout);
}
async function upload(file, title, summary) {
  const helper = path.join(skillDir, "scripts", "paperclip-upload-artifact.sh");
  const result = await run("bash", [helper, file, "--title", title, "--summary", summary]);
  const match = result.stdout.match(/- Attachment: \[[^\]]+\]\(([^)]+)\)/);
  if (!match) throw new Error(`upload sem link: ${result.stdout}`);
  return match[1];
}

try {
  const guardResult = JSON.parse((await run(process.execPath, [guard, "check", "website"])).stdout);
  if (guardResult.verdict !== "OK") throw new Error(`guard ${guardResult.verdict}: ${(guardResult.reasons || []).join("; ")}`);
  const sha = (await run("git", ["rev-parse", "HEAD"])).stdout.trim();
  ledger.sha = sha;

  await run("vercel", ["link", "--yes", "--project", project, "--scope", scope], { cwd: site, echo: true });
  const deployed = await run("vercel", ["deploy", "--yes", "--scope", scope], { cwd: site, echo: true });
  const preview = (deployed.stdout + deployed.stderr).match(/https:\/\/[^\s"]+\.vercel\.app/g)?.at(-1);
  if (!preview) throw new Error("URL de preview não encontrada na saída do Vercel");
  ledger.previewUrl = preview;

  const http = await run("vercel", ["curl", `${preview}/`, "--", "--silent", "--show-error", "--output", "/dev/null", "--write-out", "%{http_code}"], { cwd: site });
  if (!http.stdout.trim().endsWith("200")) throw new Error(`preview sem HTTP 200: ${http.stdout}`);
  await run("vercel", ["env", "run", "--", process.execPath, path.join(repo, "scripts", "vitrine-browser-qa.mjs"), preview, production, qaDir], { cwd: site, echo: true });
  const browser = JSON.parse(await readFile(path.join(qaDir, "browser-qa.json"), "utf8"));
  for (const device of ["mobile", "desktop"]) {
    if (browser[device].preview.status !== 200 || browser[device].preview.consoleErrors.length || browser[device].preview.pageErrors.length) throw new Error(`QA de navegador falhou em ${device}`);
  }

  const toolsDir = path.join(os.tmpdir(), "frontstep-deploy-vitrine-tools");
  const lighthouseCli = path.join(toolsDir, "node_modules", "lighthouse", "cli", "index.js");
  try { await readFile(lighthouseCli); } catch {
    await run("npm", ["install", "--no-save", "--prefix", toolsDir, "lighthouse@13.5.0"], { env: { PATH: process.env.PATH || "/usr/bin:/bin", HOME: os.tmpdir() }, echo: true });
  }
  await run("vercel", ["env", "run", "--", process.execPath, path.join(repo, "scripts", "vitrine-lighthouse.mjs"), preview, production, path.join(qaDir, "lighthouse"), lighthouseCli], { cwd: site, echo: true });
  const lighthouse = JSON.parse(await readFile(path.join(qaDir, "lighthouse", "summary.json"), "utf8"));
  ledger.metrics = { browser, lighthouse };
  const mobileArtifact = await upload(path.join(qaDir, "mobile-lado-a-lado.png"), "Vitrine antes/depois — mobile", "Primeira dobra: produção à esquerda e preview à direita.");
  const desktopArtifact = await upload(path.join(qaDir, "desktop-lado-a-lado.png"), "Vitrine antes/depois — desktop", "Primeira dobra: produção à esquerda e preview à direita.");
  ledger.artifacts = { mobileArtifact, desktopArtifact };

  const details = [
    `Preview: [abrir deployment](${preview})`,
    `Comparativos: [mobile](${mobileArtifact}) · [desktop](${desktopArtifact})`,
    "HTTP/console: 200 em mobile e desktop; zero erros de console/página.",
    `Mobile — produção ${lighthouse["producao-mobile"].performance}/100, LCP ${asSec(lighthouse["producao-mobile"].lcpMs)}, ${asMb(lighthouse["producao-mobile"].transferBytes)}; preview ${lighthouse["preview-mobile"].performance}/100, LCP ${asSec(lighthouse["preview-mobile"].lcpMs)}, ${asMb(lighthouse["preview-mobile"].transferBytes)}.`,
    `Desktop — produção ${lighthouse["producao-desktop"].performance}/100, LCP ${asSec(lighthouse["producao-desktop"].lcpMs)}, ${asMb(lighthouse["producao-desktop"].transferBytes)}; preview ${lighthouse["preview-desktop"].performance}/100, LCP ${asSec(lighthouse["preview-desktop"].lcpMs)}, ${asMb(lighthouse["preview-desktop"].transferBytes)}.`,
    "Ao aceitar, o deployment aprovado será promovido com `vercel promote`; este script nunca promove sozinho.",
  ].join("\n\n");
  const interaction = await pcWrite("POST", `issues/${issueId}/interactions`, {
    kind: "request_confirmation",
    idempotencyKey: `confirmation:${issueId}:publicar-vitrine:${sha}`,
    title: "Publicar a vitrine nova?",
    resolverPolicy: "human_only",
    continuationPolicy: "wake_assignee",
    payload: { version: 1, prompt: "Publicar a vitrine nova?", acceptLabel: "Sim, publicar", rejectLabel: "Ainda não", rejectRequiresReason: true, rejectReasonLabel: "O que precisa mudar?", detailsMarkdown: details, supersedeOnUserComment: true },
  });
  ledger.interactionId = interaction.id;
  await pcWrite("PATCH", `issues/${issueId}`, { status: "in_review", reviewInteractionId: interaction.id, comment: `## Preview pronto\n\n- Deployment: ${preview}\n- QA: HTTP 200, console limpo e Lighthouse mobile/desktop concluído.\n- Decisão: cartão **Publicar a vitrine nova?** aberto para o João.\n- Próximo passo: promover somente se o cartão for aceito.` });
  ledger.status = "ready_for_decision";
  console.log(JSON.stringify(ledger, null, 2));
} catch (error) {
  ledger.error = error.message;
  throw error;
} finally {
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  await appendFile(ledgerPath, JSON.stringify(ledger) + "\n");
}
