import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

const ARTIFACT_DIRS = [
  'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a',
  'C:/Users/Tech-Erin/.gemini/antigravity/brain/f066953f-3531-4035-904e-8d5b87db900f'
];
const URL = 'http://localhost:8780/index.html?qa=1';

async function stepFrames(page, count = 12, label = 'Simulating') {
  for (let i = 0; i < count; i += 4) {
    const chunk = Math.min(4, count - i);
    await page.evaluate((c) => {
      window.__DD_QA?.stepFrame?.(c, 0.05);
    }, chunk);
    console.log(`[${label}] stepped ${i + chunk}/${count} frames`);
  }
}

async function captureCanvas(page, filename) {
  const pngBase64 = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    return canvas.toDataURL('image/png').split(',')[1];
  });
  if (!pngBase64) throw new Error(`Failed to capture canvas for ${filename}`);
  for (const dir of ARTIFACT_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const outPath = path.join(dir, filename);
    fs.writeFileSync(outPath, Buffer.from(pngBase64, 'base64'));
    console.log(`Successfully saved screenshot: ${filename} to ${dir} (${fs.statSync(outPath).size} bytes)`);
  }
}

async function run() {
  console.log(`Launching browser to test RC159 on ${URL}...`);
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DD-') || text.includes('PRESET') || text.includes('Error')) {
      console.log(`[Browser Console] ${text}`);
    }
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const ready = await page.evaluate(() => typeof window.__DD_QA !== 'undefined');
  if (!ready) throw new Error('window.__DD_QA not available');
  console.log('Window.__DD_QA is available!');

  // Launch Director Sandbox Direct
  await page.evaluate(() => {
    if (typeof window.startSandboxDirect === 'function') {
      window.startSandboxDirect();
    }
  });

  // Wait for initial sandbox load
  await stepFrames(page, 12, 'Sandbox Init');

  const report = {
    version: '5.5.0-rc.159',
    timestamp: new Date().toISOString(),
    checks: {},
    pancakeAudit: {},
    electricalArcAudit: {},
    basementDebrisAudit: {},
    perfAudit: {}
  };

  // CHECK 1: One-Click Floor Pancake Preset Trigger
  console.log('Testing Check 1: Internal Floor Pancake Preset...');
  await page.evaluate(() => {
    window.__DD_QA.runPresetFloorPancake();
  });
  await stepFrames(page, 12, 'Floor Pancake Simulation');

  const pancakeAudit = await page.evaluate(() => {
    const isBasementCam = window.__DD_QA.isBasementCamActive();
    const pieces = window.__DD_QA.getSchoolPieces();
    const fallingPieces = pieces.filter(p => p.falling);
    const fallingFloors = pieces.filter(p => p.falling && p.zone === 'floor');
    return {
      isBasementCam,
      totalPieces: pieces.length,
      fallingPiecesCount: fallingPieces.length,
      fallingFloorsCount: fallingFloors.length
    };
  });
  console.log('Floor Pancake audit:', pancakeAudit);
  report.checks.floorPancakeVerified = (pancakeAudit.isBasementCam && pancakeAudit.fallingPiecesCount > 0);
  report.pancakeAudit = pancakeAudit;
  await captureCanvas(page, 'rc159_tech_freire_internal_floor_pancake_collapse.png');

  // CHECK 2: Cascading Electrical Conduit Arcs
  console.log('Testing Check 2: Cascading Electrical Conduit Arcs...');
  await page.evaluate(() => {
    window.__DD_QA.triggerElectricalShort(0, 4.5, -15, 1.8);
  });
  await stepFrames(page, 4, 'Electrical Arc Step');

  const electricalArcAudit = await page.evaluate(() => {
    const activeArcs = window.__DD_QA.getActiveArcsCount();
    const totalShorts = window.__DD_QA.getElectricalShortsCount ? window.__DD_QA.getElectricalShortsCount() : 0;
    return {
      activeArcs,
      totalShorts
    };
  });
  console.log('Electrical Arcs audit:', electricalArcAudit);
  report.checks.electricalArcCascadeVerified = (electricalArcAudit.activeArcs > 0 || electricalArcAudit.totalShorts > 0);
  report.electricalArcAudit = electricalArcAudit;
  await captureCanvas(page, 'rc159_cascading_conduit_electrical_arcs.png');

  // CHECK 3: Basement Level Debris Impact Spalling
  console.log('Testing Check 3: Basement Debris Impact Spalling...');
  await stepFrames(page, 8, 'Basement Debris Settling');

  const basementDebrisAudit = await page.evaluate(() => {
    const basementDebris = window.__DD_QA.getBasementDebrisCount();
    const pieces = window.__DD_QA.getSchoolPieces();
    const subZeroPieces = pieces.filter(p => p.y < 0.0);
    return {
      basementDebris,
      subZeroPiecesCount: subZeroPieces.length
    };
  });
  console.log('Basement Debris audit:', basementDebrisAudit);
  report.checks.basementDebrisVerified = (basementDebrisAudit.basementDebris > 0 || basementDebrisAudit.subZeroPiecesCount > 0);
  report.basementDebrisAudit = basementDebrisAudit;
  await captureCanvas(page, 'rc159_basement_floor_slab_shatter_debris.png');

  // CHECK 4: Director Sandbox Multi-Disaster Performance Profiling
  console.log('Testing Check 4: Director Sandbox Engine Stability Profiling...');
  const perfAudit = await page.evaluate(async () => {
    const times = [];
    for (let i = 0; i < 15; i++) {
      const t0 = performance.now();
      window.__DD_QA.stepFrame(1, 0.05);
      times.push(performance.now() - t0);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    return {
      avgFrameMs: avg.toFixed(2),
      maxFrameMs: max.toFixed(2),
      samples: times.length,
      cinematicStats: window.__DD_QA.getSmokeStats ? window.__DD_QA.getSmokeStats() : null
    };
  });
  console.log('Performance audit under floor pancake load:', perfAudit);
  report.checks.performanceStabilityVerified = (parseFloat(perfAudit.avgFrameMs) < 200.0);
  report.perfAudit = perfAudit;
  await captureCanvas(page, 'rc159_director_sandbox_pancake_stability.png');

  // Write JSON report
  for (const dir of ARTIFACT_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const jsonReportPath = path.join(dir, 'rc159_verification_report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Saved JSON verification report to ${jsonReportPath}`);
  }

  await browser.close();
  console.log('RC159 Live Verification finished successfully!');
}

run().catch(err => {
  console.error('RC159 verification failed:', err);
  process.exit(1);
});
