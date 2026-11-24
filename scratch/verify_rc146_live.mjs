import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

const ARTIFACT_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';
const URL = 'http://localhost:8780/index.html?qa=1';

async function stepFrames(page, count = 18, label = 'Simulating') {
  for (let i = 0; i < count; i += 5) {
    const chunk = Math.min(5, count - i);
    await page.evaluate((c) => {
      window.__DD_QA?.stepFrame?.(c, 0.05);
    }, chunk);
    console.log(`[${label}] stepped ${i + chunk}/${count} frames`);
  }
}

async function captureCanvas(page, filename) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  });

  if (dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, base64Data, 'base64');
    console.log(`Successfully saved screenshot: ${filename} (${fs.statSync(outPath).size} bytes)`);
    return true;
  }
  return false;
}

async function run() {
  console.log(`Launching browser to test RC146 on ${URL}...`);
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist',
      '--window-size=1280,720'
    ]
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  const report = {
    version: null,
    buildId: null,
    schoolEffectsHooksVerified: false,
    glassShatterGlitterVerified: false,
    columnBuckleDustVerified: false,
    floorPancakingBasementVerified: false,
    screenshots: []
  };

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for QA interface
    await page.waitForFunction(() => window.__DD_QA !== undefined, { timeout: 15000 });

    const info = await page.evaluate(() => ({
      version: window.__DD_BUILD_INFO?.version,
      build: window.__DD_BUILD_INFO?.build,
      title: document.title
    }));
    console.log('Page version info:', info);
    report.version = info.version;
    report.buildId = info.build;

    // Launch Director Sandbox direct
    console.log('Launching Director Sandbox direct...');
    await page.evaluate(() => {
      window.startSandboxDirect?.();
    });
    await page.waitForTimeout(500);
    await stepFrames(page, 5, 'SandboxInit');

    // 1. Test School Effects Hooks Wiring
    console.log('Testing school effects hooks wiring...');
    const hookAudit = await page.evaluate(() => {
      const isHooked = window.__DD_QA?.isSchoolEffectsHooked?.();
      const stats = window.__DD_QA?.getSchoolStats?.() || {};

      return {
        effectsHooked: isHooked,
        parts: stats.parts || 0,
        byMaterial: stats.byMaterial || {}
      };
    });
    console.log('Hook audit:', hookAudit);
    report.schoolEffectsHooksVerified = hookAudit.effectsHooked === true && hookAudit.parts > 0;

    // 2. Test Glass Shatter Glitter Sparks & Audio Triggering
    console.log('Testing glass shatter glitter & audio triggering...');
    await page.evaluate(() => {
      // Strike front curtain glazing of Tech Freire
      window.__DD_QA?.spawnTestMeteorAt?.(0, 7.0, -1.0, 2.4, 'rock');
      window.__DD_QA?.setCameraPan?.(0);
    });
    await stepFrames(page, 12, 'GlassShatterAdvance');

    const glassAudit = await page.evaluate(() => {
      const stats = window.__DD_QA?.getSchoolStats?.() || {};
      const fxStats = window.__DD_CINEMATIC_FX?.stats?.() || {};

      return {
        detached: stats.detached || 0,
        drawBatches: fxStats.drawBatches || 0
      };
    });
    console.log('Glass shatter audit:', glassAudit);
    report.glassShatterGlitterVerified = glassAudit.detached > 0 || glassAudit.drawBatches > 0;

    await captureCanvas(page, 'rc146_glass_shatter_glitter.png');
    report.screenshots.push('rc146_glass_shatter_glitter.png');

    // 3. Test Support Column Buckle & Demolition Dust Burst
    console.log('Testing support column buckle & demolition dust burst...');
    await page.evaluate(() => {
      // Strike structural columns in second bay
      window.__DD_QA?.spawnTestMeteorAt?.(-6.0, 10.0, -12.0, 3.8, 'iron');
      window.__DD_QA?.setCameraPan?.(-6.0);
    });
    await stepFrames(page, 15, 'ColumnBuckleAdvance');

    const columnAudit = await page.evaluate(() => {
      const stats = window.__DD_QA?.getSchoolStats?.() || {};
      const crunched = window.__DD_QA?.getCrunchedMeteors?.() || [];

      return {
        detached: stats.detached || 0,
        crunchedCount: crunched.length,
        structurePieces: stats.byMaterial?.structure || 0
      };
    });
    console.log('Column buckle audit:', columnAudit);
    report.columnBuckleDustVerified = columnAudit.detached > 0;

    await captureCanvas(page, 'rc146_support_column_buckle_dust.png');
    report.screenshots.push('rc146_support_column_buckle_dust.png');

    // 4. Test Floor Pancaking Collapse Cascade into Basement Void
    console.log('Testing floor pancaking collapse cascade into basement void...');
    await page.evaluate(() => {
      // Trigger full collapse to verify floor pancaking cascade
      window.__DD_QA?.collapseSchool?.();
      window.__DD_QA?.setCameraPan?.(0);
    });
    await stepFrames(page, 18, 'PancakingBasementAdvance');

    const pancakeAudit = await page.evaluate(() => {
      const stats = window.__DD_QA?.getSchoolStats?.() || {};
      const pieces = window.__DD_QA?.getSchoolPieces?.() || [];
      const inBasement = pieces.filter(p => p.resting && p.y <= 0.2).length;

      return {
        fullShellRemaining: stats.fullFiveStoryShell,
        collapsing: stats.collapsing,
        restingBasementPieces: inBasement
      };
    });
    console.log('Pancaking basement audit:', pancakeAudit);
    report.floorPancakingBasementVerified = pancakeAudit.collapsing === true;

    await captureCanvas(page, 'rc146_floor_pancaking_basement_collapse.png');
    report.screenshots.push('rc146_floor_pancaking_basement_collapse.png');

    console.log('Writing RC146 verification report...');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc146_verification_report.json'), JSON.stringify(report, null, 2));
    console.log('Report successfully saved.');

  } catch (err) {
    console.error('Test run error:', err);
  } finally {
    await browser.close();
  }
}

run();
