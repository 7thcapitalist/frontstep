import { readFile } from 'node:fs/promises';

export async function revealByScrolling(page) {
  const height = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  const step = Math.max(500, (page.viewportSize()?.height || 900) * 0.8);
  for (let y = 0; y < height; y += step) {
    await page.evaluate(value => window.scrollTo(0, value), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

export async function captureViewport(page, file, { disableAnimations = true } = {}) {
  await page.screenshot({ path: file, fullPage: false, ...(disableAnimations ? { animations: 'disabled' } : {}) });
  return file;
}

// Compose real browser screenshots as an image in a second Playwright page.
export async function composeStoryboard(browser, frames, outFile) {
  const rows = Array.isArray(frames[0]) ? frames : [frames];
  const flat = rows.flat();
  const cards = [];
  for (const frame of flat) {
    const data = await readFile(frame.file);
    cards.push({ title: frame.title, image: `data:image/png;base64,${data.toString('base64')}` });
  }
  const width = Math.min(600, Math.max(320, flat[0]?.width || 600));
  const columns = Math.max(...rows.map(row => row.length));
  const board = await browser.newPage({ viewport: { width: width * columns + 36 * (columns + 1), height: 200 }, deviceScaleFactor: 1 });
  const html = `<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;background:#ecebe7;color:#222;font:600 18px Arial;padding:36px}.grid{display:grid;grid-template-columns:repeat(${columns},${width}px);gap:36px}.card{min-width:0}.card h2{margin:0 0 14px;font-size:16px}.card img{width:${width}px;height:auto;display:block;box-shadow:0 5px 20px #0002}</style></head><body><div class="grid">${cards.map(card => `<div class="card"><h2>${card.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</h2><img src="${card.image}"></div>`).join('')}</div></body></html>`;
  await board.setContent(html, { waitUntil: 'load' });
  await board.screenshot({ path: outFile, fullPage: true });
  await board.close();
  return outFile;
}
