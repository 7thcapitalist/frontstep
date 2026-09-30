#!/usr/bin/env node
// Frontstep QA gate. Reprova o build.
//
//   node scripts/qa-gate.mjs sites/<slug>/public [--brief brief.json] [--json]
//
// Sai com 0 se passou, 1 se reprovou. Erros de FAIL param o build.
// WARN aparece no relatorio mas nao reprova.

import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// playwright pode estar no skill, no projeto ou global. Se nao achar, o gate sai com 2,
// que o worker trata como "nao consegui rodar" e nao como reprovacao.
let chromium = null;
for (const mod of ["playwright", "playwright-core", "@playwright/test"]) {
  try { ({ chromium } = await import(mod)); break; } catch { /* tenta o proximo */ }
}
if (!chromium) {
  console.error("QA GATE: playwright nao encontrado (tentei playwright, playwright-core, @playwright/test).");
  console.error("Instale com: npm i -D playwright  ou  defina NODE_PATH para onde ele esta.");
  process.exit(2);
}

const args = process.argv.slice(2);
const root = path.resolve(args.find(a => !a.startsWith("--")) || "public");
const briefArg = (() => { const i = args.indexOf("--brief"); return i >= 0 ? args[i + 1] : null; })();
const asJson = args.includes("--json");

const WHATSAPP_GREENS = new Set(["rgb(37, 211, 102)", "rgb(29, 168, 81)", "rgb(18, 140, 126)", "rgb(7, 94, 84)"]);
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".ico": "image/x-icon" };

const results = [];
const fail = (code, msg, detail) => results.push({ level: "FAIL", code, msg, detail });
const warn = (code, msg, detail) => results.push({ level: "WARN", code, msg, detail });

// ---------------------------------------------------------------- servidor
function serve(dir) {
  return new Promise(resolve => {
    const srv = createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
        if (p.endsWith("/")) p += "index.html";
        let file = path.join(dir, p);
        if (!existsSync(file) && existsSync(file + ".html")) file = file + ".html";
        if (!existsSync(file)) { res.writeHead(404).end("nao encontrado"); return; }
        const s = await stat(file);
        if (s.isDirectory()) file = path.join(file, "index.html");
        const body = await readFile(file);
        res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
        res.end(body);
      } catch (e) { res.writeHead(500).end(String(e)); }
    });
    srv.listen(0, "127.0.0.1", () => resolve({ srv, port: srv.address().port }));
  });
}

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) await walk(f, out); else out.push(f);
  }
  return out;
}

// ------------------------------------------------------- checagens de fonte
async function checkSources(files) {
  const cssFiles = files.filter(f => f.endsWith(".css"));
  const jsFiles = files.filter(f => f.endsWith(".js") || f.endsWith(".mjs"));
  let css = "";
  for (const f of cssFiles) css += "\n" + await readFile(f, "utf8");
  let js = "";
  for (const f of jsFiles) js += "\n" + await readFile(f, "utf8");

  if (!css.trim()) { fail("CSS_VAZIO", "Nenhum CSS encontrado em public/."); return { css, js }; }

  // A1 tokens: hex fora do :root
  const rootBlocks = [...css.matchAll(/:root[^{]*\{([\s\S]*?)\}/g)].map(m => m[1]).join("\n");
  const cssSemRoot = css.replace(/:root[^{]*\{[\s\S]*?\}/g, "");
  const hexForaDoRoot = [...new Set((cssSemRoot.match(/#[0-9a-fA-F]{3,8}\b/g) || [])
    .filter(h => !/^#[0-9a-fA-F]{1,2}$/.test(h)))];
  if (hexForaDoRoot.length > 0) {
    fail("A1_COR_SEM_TOKEN",
      `${hexForaDoRoot.length} cor(es) escritas direto no CSS, fora do :root.`,
      hexForaDoRoot.slice(0, 12).join(", "));
  }
  const tokensDeCor = [...rootBlocks.matchAll(/--[\w-]+\s*:\s*(#[0-9a-fA-F]{3,8})/g)].map(m => m[1]);
  if (tokensDeCor.length < 4) {
    fail("A2_PALETA_POBRE", `So ${tokensDeCor.length} cor(es) em tokens. A paleta precisa de pelo menos 4.`);
  }

  // C1 material: textura, gradiente ou banda
  const temTextura = /background-image\s*:\s*url\(\s*["']?data:image\/svg/.test(css) || /feTurbulence|fractalNoise/.test(css);
  const temGradiente = /linear-gradient|radial-gradient|conic-gradient/.test(css);
  if (!temTextura && !temGradiente) {
    fail("C1_FUNDO_CHAPADO", "Nenhuma textura, grao ou gradiente no CSS. A pagina e branco chapado do inicio ao fim.");
  } else if (!temTextura) {
    warn("C1_SEM_TEXTURA", "Tem gradiente mas nenhuma textura ou grao. Considere uma camada de material.");
  }

  // E2 reduced motion
  if (!/@media[^{]*prefers-reduced-motion/.test(css)) {
    fail("E2_SEM_REDUCED_MOTION", "Falta o bloco @media (prefers-reduced-motion: reduce) no CSS.");
  }

  // E1 motor de scroll
  const temScroll = /IntersectionObserver/.test(js) || /ScrollTrigger/.test(js)
    || /animation-timeline\s*:\s*(view|scroll)/.test(css);
  if (!temScroll) {
    fail("E1_SEM_MOVIMENTO_DE_SCROLL",
      "Nenhum motor de entrada na rolagem. Sem IntersectionObserver, sem ScrollTrigger, sem animation-timeline.");
  }

  // easing proprio
  if (!/cubic-bezier/.test(css)) {
    warn("E4_EASING_PADRAO", "Nenhum cubic-bezier no CSS. Todo movimento esta na curva padrao do navegador.");
  }
  return { css, js };
}

// --------------------------------------------------------- checagens no DOM
async function checkDom(page, viewport) {
  return await page.evaluate((vp) => {
    const out = [];
    const push = (level, code, msg, detail) => out.push({ level, code, msg: `[${vp}] ${msg}`, detail });
    const vh = window.innerHeight, vw = window.innerWidth;

    // G4 overflow horizontal
    if (document.documentElement.scrollWidth > vw + 2) {
      const culpados = [...document.querySelectorAll("body *")]
        .filter(e => e.getBoundingClientRect().right > vw + 2)
        .slice(0, 5)
        .map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/)[0] : ""));
      push("FAIL", "G4_OVERFLOW", `Rolagem horizontal: pagina tem ${document.documentElement.scrollWidth}px em viewport de ${vw}px.`, culpados.join(", "));
    }

    const imgs = [...document.querySelectorAll("img")];

    // G1 width/height declarados
    const semDim = imgs.filter(i => !i.getAttribute("width") || !i.getAttribute("height"))
      .map(i => i.getAttribute("src") || "(sem src)");
    if (semDim.length) push("FAIL", "G1_IMG_SEM_DIMENSAO", `${semDim.length} imagem(ns) sem width e height no HTML.`, semDim.slice(0, 6).join(", "));

    // G2 altura maior que 60vh
    const altas = imgs.filter(i => i.getBoundingClientRect().height > vh * 0.6)
      .map(i => `${i.getAttribute("src")} (${Math.round(i.getBoundingClientRect().height)}px de ${vh}px)`);
    if (altas.length) push("FAIL", "G2_IMG_ALTA_DEMAIS", `${altas.length} imagem(ns) passando de 60vh de altura.`, altas.slice(0, 6).join(" | "));

    // G3 esticada
    const esticadas = [];
    for (const i of imgs) {
      const r = i.getBoundingClientRect();
      if (!i.naturalWidth || !i.naturalHeight || r.width < 8 || r.height < 8) continue;
      const fit = getComputedStyle(i).objectFit;
      if (fit === "cover" || fit === "contain" || fit === "none" || fit === "scale-down") continue;
      const natural = i.naturalWidth / i.naturalHeight;
      const render = r.width / r.height;
      if (Math.abs(render - natural) / natural > 0.03) {
        esticadas.push(`${i.getAttribute("src")} (natural ${natural.toFixed(2)} vs renderizada ${render.toFixed(2)}, object-fit: ${fit})`);
      }
    }
    if (esticadas.length) push("FAIL", "G3_IMG_ESTICADA", `${esticadas.length} imagem(ns) deformada(s).`, esticadas.slice(0, 6).join(" | "));

    // G6 slot sem proporcao fixa
    const semRatio = imgs.filter(i => {
      const pai = i.parentElement;
      if (!pai) return false;
      const cs = getComputedStyle(i), cp = getComputedStyle(pai);
      return getComputedStyle(i).objectFit === "cover" && cs.aspectRatio === "auto" && cp.aspectRatio === "auto";
    });
    if (semRatio.length) push("WARN", "G6_SLOT_SEM_RATIO", `${semRatio.length} imagem(ns) com object-fit: cover mas sem aspect-ratio no slot.`);

    // F1 sublinhado vazando em bloco clicavel.
    // A decoracao do <a> pinta os filhos mesmo com textDecorationLine "none" neles,
    // entao quem manda e o computed do proprio <a> quando ele envolve bloco.
    const vazando = [];
    for (const a of document.querySelectorAll("a")) {
      const blocos = a.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li");
      if (!blocos.length) continue;
      const td = getComputedStyle(a).textDecorationLine;
      if (td.includes("underline")) {
        vazando.push(`<a href="${(a.getAttribute("href") || "").slice(0, 30)}"> envolvendo ${blocos.length} bloco(s), primeiro: ${blocos[0].tagName.toLowerCase()}`);
      }
    }
    if (vazando.length) push("FAIL", "F1_SUBLINHADO_EM_CARD", `${vazando.length} bloco(s) com titulo ou paragrafo sublinhado dentro de link.`, vazando.slice(0, 6).join(" | "));

    // B1 escala tipografica
    const h1 = document.querySelector("h1");
    if (!h1) push("FAIL", "B0_SEM_H1", "A pagina nao tem h1.");
    else {
      const tam = parseFloat(getComputedStyle(h1).fontSize);
      const minimo = vw >= 1000 ? 40 : 28;
      if (tam < minimo) push("FAIL", "B1_H1_PEQUENO", `h1 com ${Math.round(tam)}px, abaixo do minimo de ${minimo}px. O titulo precisa ser a imagem da pagina.`);
      const corpo = parseFloat(getComputedStyle(document.body).fontSize);
      if (tam / corpo < 2.2) push("FAIL", "B2_ESCALA_FRACA", `h1 so ${(tam / corpo).toFixed(1)}x o corpo. Hierarquia fraca, precisa de pelo menos 2.2x.`);
    }

    // B3 duas familias
    const familias = new Set();
    for (const e of document.querySelectorAll("body, h1, h2, h3, p, a, button, li")) {
      familias.add(getComputedStyle(e).fontFamily.split(",")[0].trim().replace(/["']/g, ""));
    }
    if (familias.size < 2) push("WARN", "B3_UMA_FAMILIA", `So uma familia tipografica em uso: ${[...familias].join(", ")}.`);

    // A3 botao principal fora da paleta
    const verdes = ["rgb(37, 211, 102)", "rgb(29, 168, 81)", "rgb(18, 140, 126)", "rgb(7, 94, 84)"];
    const botoes = [...document.querySelectorAll("a,button")].filter(b => {
      const cs = getComputedStyle(b);
      if (cs.position === "fixed" || cs.position === "sticky") return false;
      const r = b.getBoundingClientRect();
      return r.width > 90 && r.height > 32 && cs.backgroundColor !== "rgba(0, 0, 0, 0)";
    });
    const verdeEmBotao = botoes.filter(b => verdes.includes(getComputedStyle(b).backgroundColor));
    if (verdeEmBotao.length) {
      push("FAIL", "A3_BOTAO_VERDE_WHATSAPP",
        `${verdeEmBotao.length} botao(oes) no verde do WhatsApp fora do botao flutuante. Verde do WhatsApp e cor de logo, nao de interface.`,
        verdeEmBotao.slice(0, 4).map(b => (b.textContent || "").trim().slice(0, 40)).join(" | "));
    }

    // D1 ritmo: secoes repetindo o mesmo desenho
    const secoes = [...document.querySelectorAll("section, main > div")].filter(s => s.getBoundingClientRect().height > 200);
    const assinaturas = secoes.map(s => {
      const cs = getComputedStyle(s);
      const grid = [...s.children].map(c => getComputedStyle(c).gridTemplateColumns).join("|");
      return `${cs.gridTemplateColumns}::${grid}::${s.children.length}`;
    });
    const contagem = {};
    for (const a of assinaturas) contagem[a] = (contagem[a] || 0) + 1;
    const repetida = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
    if (secoes.length >= 4 && repetida && repetida[1] >= 3) {
      push("FAIL", "D1_RITMO_REPETIDO", `${repetida[1]} secoes com exatamente o mesmo desenho de ${secoes.length}. A pagina esta repetindo um bloco em vez de desenhar cada secao.`);
    }
    if (secoes.length < 4) push("WARN", "D2_POUCAS_SECOES", `So ${secoes.length} secoes com altura relevante.`);

    // D3 tres cards iguais
    const grupos = {};
    for (const e of document.querySelectorAll("article, li, div")) {
      const cls = typeof e.className === "string" ? e.className.trim() : "";
      if (!cls || !e.parentElement) continue;
      const k = e.parentElement.tagName + "::" + cls;
      grupos[k] = (grupos[k] || 0) + 1;
    }
    const trincas = Object.entries(grupos).filter(([, n]) => n === 3);
    if (trincas.length >= 2) {
      push("WARN", "D3_TRINCAS", `${trincas.length} grupos de exatamente 3 cards identicos. Classico sinal de template.`);
    }

    // A4 contraste do corpo
    const parse = c => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const fundoDe = el => { let n = el; while (n && n !== document.documentElement) { const bg = getComputedStyle(n).backgroundColor; if (bg && !bg.startsWith("rgba(0, 0, 0, 0)")) return bg; n = n.parentElement; } return "rgb(255,255,255)"; };
    const ruins = [];
    for (const p of [...document.querySelectorAll("p, li")].slice(0, 60)) {
      if (!p.textContent.trim() || p.getBoundingClientRect().height < 6) continue;
      const cs = getComputedStyle(p);
      const l1 = lum(parse(cs.color)), l2 = lum(parse(fundoDe(p)));
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (ratio < 4.5) ruins.push(`${p.textContent.trim().slice(0, 30)} (${ratio.toFixed(1)}:1)`);
    }
    if (ruins.length) push("FAIL", "A4_CONTRASTE", `${ruins.length} bloco(s) de texto abaixo de 4.5:1 de contraste.`, ruins.slice(0, 4).join(" | "));

    return out;
  }, viewport);
}

// ------------------------------------------------- movimento em tempo real
async function checkMotion(page) {
  const mexeu = await page.evaluate(async () => {
    const alvos = [...document.querySelectorAll("section, article, h2, .reveal, [data-reveal]")].slice(0, 40);
    if (!alvos.length) return { ok: false, motivo: "nenhum alvo" };
    const antes = alvos.map(e => { const cs = getComputedStyle(e); return cs.opacity + "|" + cs.transform; });
    window.scrollTo(0, document.body.scrollHeight * 0.45);
    await new Promise(r => setTimeout(r, 1200));
    const depois = alvos.map(e => { const cs = getComputedStyle(e); return cs.opacity + "|" + cs.transform; });
    const mudou = antes.filter((v, i) => v !== depois[i]).length;
    return { ok: mudou > 0, mudou, total: alvos.length };
  });
  if (!mexeu.ok) {
    fail("E3_NADA_SE_MEXE", "Rolei a pagina e nenhum elemento mudou de opacidade ou transform. Na pratica a pagina esta parada.");
  } else if (mexeu.mudou < 3) {
    warn("E5_MOVIMENTO_RASO", `So ${mexeu.mudou} de ${mexeu.total} elementos reagiram a rolagem.`);
  }
}

// ---------------------------------------------------- checagens com o brief
async function checkBrief(page, brief) {
  if (!brief) { warn("Z0_SEM_BRIEF", "Rodei sem --brief. Retrato e feature premium nao foram checados."); return; }

  // G5 retrato de quem atende
  const nomeDono = (brief.owner && brief.owner.name) || (brief.business && brief.business.name) || "";
  const nicho = ((brief.business && brief.business.niche) || "").toLowerCase();
  const negocioDeUmaPessoa = /clinic|medic|geriatr|dermat|odont|dentist|advog|direito|psic|terap|nutri|contab|personal|arquitet|coach|consultor/.test(nicho)
    || /^(dr|dra|drª)\b/i.test(nomeDono);
  const fotos = ((brief.media && brief.media.photos) || []).length;
  if (negocioDeUmaPessoa && fotos > 0) {
    const temRetrato = await page.evaluate(nome => {
      const chaves = ["retrato", "portrait", "perfil", "headshot"].concat(
        nome.toLowerCase().split(/\s+/).filter(p => p.length > 3));
      return [...document.querySelectorAll("img")].some(i => {
        const s = ((i.getAttribute("src") || "") + " " + (i.getAttribute("alt") || "")).toLowerCase();
        return chaves.some(k => s.includes(k));
      });
    }, nomeDono);
    if (!temRetrato) {
      fail("G5_SEM_RETRATO", `Negocio de uma pessoa (${nicho}) sem retrato de quem atende na pagina. Esse negocio vende pela cara dela.`);
    }
  }

  // H1 feature premium
  const feature = brief.premium_feature;
  if (!feature) {
    warn("H0_SEM_FEATURE", "O brief nao declara premium_feature. O site vai ser bonito e sem nada que o cliente nao conseguiria fazer sozinho.");
  } else {
    const id = typeof feature === "string" ? feature : feature.id;
    const achou = await page.evaluate(f => !!document.querySelector(`[data-feature="${f}"]`), id);
    if (!achou) {
      fail("H1_FEATURE_AUSENTE", `O brief pede a feature premium "${id}" e ela nao esta na pagina. Marque o bloco com data-feature="${id}".`);
    }
  }

  // revisoes nao aplicadas: cores nomeadas
  const revs = brief.revisions || [];
  const pedeLilas = revs.some(r => /lil[aá]s|roxo|lavanda/i.test(r));
  if (pedeLilas) {
    const ehLilas = await page.evaluate(() => {
      const bot = [...document.querySelectorAll("a,button")].filter(b => {
        const cs = getComputedStyle(b);
        return cs.position !== "fixed" && b.getBoundingClientRect().width > 90 && cs.backgroundColor !== "rgba(0, 0, 0, 0)";
      });
      if (!bot.length) return false;
      return bot.some(b => {
        const [r, g, bl] = (getComputedStyle(b).backgroundColor.match(/[\d.]+/g) || []).map(Number);
        return bl > r && r > g && bl - g > 25;
      });
    });
    if (!ehLilas) fail("R1_REVISAO_DE_COR_NAO_APLICADA", "O cliente pediu lilas ou roxo e nenhum botao principal esta nessa faixa de cor.");
  }
}

// --------------------------------------------------------------------- main
const { srv, port } = await serve(root);
const base = `http://127.0.0.1:${port}/`;
let browser;
try {
  const exe = process.env.PW_CHROMIUM || undefined;   // fuga de emergencia se o binario nao bater
  browser = await chromium.launch(exe ? { executablePath: exe } : {});
  let brief = null;
  if (briefArg && existsSync(briefArg)) {
    try { brief = JSON.parse(await readFile(briefArg, "utf8")); }
    catch { warn("Z1_BRIEF_INVALIDO", `Nao consegui ler ${briefArg} como JSON.`); }
  }

  const files = await walk(root);
  await checkSources(files);

  for (const [nome, vp] of [["celular", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 900 }]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    const erros = [];
    const faltando = [];
    page.on("pageerror", e => erros.push(String(e)));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) erros.push(m.text()); });
    page.on("requestfailed", r => faltando.push(r.url()));
    page.on("response", r => { if (r.status() >= 400) faltando.push(`${r.status()} ${r.url()}`); });
    await page.goto(base, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(700);

    for (const r of await checkDom(page, nome)) results.push(r);
    if (erros.length) fail("X1_ERRO_DE_JS", `${erros.length} erro(s) de JavaScript em ${nome}.`, erros.slice(0, 3).join(" | "));
    const quebrados = faltando.filter(u => !/favicon|apple-touch-icon/i.test(u));
    if (quebrados.length) fail("X2_ARQUIVO_QUEBRADO", `${quebrados.length} arquivo(s) que a pagina pede e nao existem, em ${nome}.`, [...new Set(quebrados)].slice(0, 5).map(u => u.replace(/^.*?:\d+\//, "")).join(" | "));

    if (nome === "desktop") {
      await checkMotion(page);
      await checkBrief(page, brief);
    }
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  srv.close();
}

const fails = results.filter(r => r.level === "FAIL");
const warns = results.filter(r => r.level === "WARN");

if (asJson) {
  console.log(JSON.stringify({ passou: fails.length === 0, fails, warns }, null, 2));
} else {
  console.log("\n=== QA GATE FRONTSTEP ===\n");
  for (const r of [...fails, ...warns]) {
    console.log(`${r.level}  ${r.code}\n      ${r.msg}${r.detail ? `\n      -> ${r.detail}` : ""}\n`);
  }
  if (fails.length === 0 && warns.length === 0) console.log("Nenhum problema encontrado.\n");
  console.log(`${fails.length} reprovacao(oes), ${warns.length} aviso(s).`);
  console.log(fails.length ? "\nGATE: REPROVADO. Conserte tudo que esta como FAIL e rode de novo.\n"
                           : "\nGATE: APROVADO.\n");
}
process.exit(fails.length ? 1 : 0);
