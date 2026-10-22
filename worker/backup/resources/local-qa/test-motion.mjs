import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''));
const temp = await mkdtemp(path.join(tmpdir(), 'frontstep-motion-'));
try {
  const run = spawnSync(process.execPath, [path.join(here, 'motion-audit.mjs'), path.join(here, 'fixtures', 'motion'), '--out', temp], { encoding: 'utf8', timeout: 60000 });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(await readFile(path.join(temp, 'motion-report.json'), 'utf8'));
  assert.equal(report.motion.totalEvents, 0, 'rAF fixture intentionally has no CSS animation events');
  assert.equal(report.signatureEvidence.hasMeaningfulChange, true);
  assert.ok(report.signatureEvidence.markedSignatureChanges.some(item => item.part === 'selo' && item.maxDelta.translationPx >= 12));
  assert.ok(report.signatureEvidence.markedSignatureChanges.some(item => item.part === 'linha' && item.maxDelta.strokeFraction >= 0.1));
  assert.ok(report.signatureEvidence.markedSignatureChanges.some(item => item.part === 'selo' && item.maxDelta.clipFraction >= 0.1));
  assert.equal(report.signatureScene.marked, true);
  assert.equal(report.signatureScene.positions.length, 3);
  assert.equal(report.entranceTimeline.captured, true);
  assert.equal(report.entranceTimeline.positions.length, 3);
  assert.ok(report.entranceTimeline.positions[0].elapsedMsBefore < report.entranceTimeline.positions[2].elapsedMsBefore);
  for (const frame of report.entranceTimeline.positions) assert.ok((await stat(frame.file)).size > 1000);
  assert.equal(report.mobileReducedMotion.hiddenMeaningful.length, 0);
  assert.ok((await stat(report.storyboard)).size > 1000);
  console.log(`motion: ${report.signatureEvidence.changedPropertyGroups} computed-change groups, ${report.motion.totalEvents} CSS/WAAPI events`);
} finally { await rm(temp, { recursive: true, force: true }); }
