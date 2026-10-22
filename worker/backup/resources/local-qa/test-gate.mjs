import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''));
const temp = await mkdtemp(path.join(tmpdir(), 'frontstep-qa-'));
try {
  for (const [fixture, expected] of [['positive', 0], ['negative', 1]]) {
    const out = path.join(temp, fixture);
    const run = spawnSync(process.execPath, [path.join(here, 'qa.mjs'), path.join(here, 'fixtures', fixture), '--brief', path.join(here, 'fixtures', 'brief.json'), '--scenario', path.join(here, 'fixtures', 'scenario.json'), '--out', out], { encoding: 'utf8', timeout: 60000 });
    assert.equal(run.status, expected, `${fixture}: ${run.stderr}\n${run.stdout}`);
    const report = JSON.parse(await readFile(path.join(out, 'qa-result.json'), 'utf8'));
    assert.equal(report.passed, expected === 0);
    assert.ok(report.screenshots.desktop && report.screenshots.mobile);
    console.log(`${fixture}: exit ${run.status}, ${report.checks.filter(c => !c.passed).length} failures`);
  }
  const previewOut = path.join(temp, 'preview-unsafe');
  const preview = spawnSync(process.execPath, [path.join(here, 'qa.mjs'), path.join(here, 'fixtures', 'preview-unsafe'), '--out', previewOut], { encoding: 'utf8', timeout: 60000 });
  assert.equal(preview.status, 1, preview.stderr || preview.stdout);
  const previewReport = JSON.parse(await readFile(path.join(previewOut, 'qa-result.json'), 'utf8'));
  const paths = previewReport.checks.find(check => check.code === 'PREVIEW_RELATIVE_PATHS');
  assert.equal(paths.passed, false);
  for (const name of ['/style.css', '/media/photo.png', '/module.mjs']) assert.ok(paths.detail.some(item => item.includes(name)), name);
  console.log('preview-unsafe: blocked root-relative HTML/CSS/module paths');
} finally { await rm(temp, { recursive: true, force: true }); }
