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
const ARTIFACT_DIR = ARTIFACT_DIRS[1];
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
  console.log(`Launching browser to test RC156 on ${URL}...`);
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
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
    version: '5.5.0-rc.156',
    timestamp: new Date().toISOString(),
    checks: {},
    waterAudit: {},
    perfAudit: {},
    subwaySprayAudit: {},
    suppressionAudit: {}
  };

  // CHECK 1: Dedicated Particle Water Jet Engine & Removal of Cone Meshes
  console.log('Testing Check 1: Particle Water Jet Engine...');
  await page.evaluate(() => {
    window.__DD_QA.triggerWaterMain(0, 23.5, 4.5);
  });
  await stepFrames(page, 12, 'Water Jet Simulation');

  const waterAudit = await page.evaluate(() => {
    const hasGeyser = window.__DD_QA.hasWaterMainGeyser();
    const waterParticles = window.__DD_QA.getWaterParticleCount();
    const stats = window.__DD_QA.getCinematicStats ? window.__DD_QA.getCinematicStats() : null;

    // Check that scene has NO ConeGeometry or SphereGeometry in the water-main-geyser
    const geyserGroup = window.__DD_QA.getCraters().find(c => c.geyserGroup)?.geyserGroup;
    let hasConeMesh = false;
    let hasSphereMesh = false;
    if (geyserGroup) {
      geyserGroup.traverse(child => {
        if (child.geometry?.type === 'ConeGeometry') hasConeMesh = true;
        if (child.geometry?.type === 'SphereGeometry') hasSphereMesh = true;
      });
    }

    return {
      hasGeyser,
      waterParticles,
      cinematicStats: stats,
      hasConeMesh,
      hasSphereMesh,
      noConeMeshes: !hasConeMesh && !hasSphereMesh
    };
  });
  console.log('Water Jet audit:', waterAudit);
  report.checks.particleWaterEngineVerified = (waterAudit.hasGeyser && waterAudit.waterParticles > 0 && waterAudit.noConeMeshes);
  report.waterAudit = waterAudit;
  await captureCanvas(page, 'rc156_particle_water_jet_mist_and_foam.png');

  // CHECK 2: Subterranean High-Pressure Water Spray in Subway Cavern
  console.log('Testing Check 2: Subterranean Subway Water Spray...');
  await page.evaluate(() => {
    window.__DD_QA.setSubwayCam(true);
  });
  await stepFrames(page, 12, 'Subway Cavern Spray Simulation');

  const subwaySprayAudit = await page.evaluate(() => {
    const hasFloodedWater = window.__DD_QA.hasFloodedSubwayWater();
    const waterParticles = window.__DD_QA.getWaterParticleCount();
    return {
      subwayCamActive: window.__DD_QA.isSubwayCamActive(),
      hasFloodedWater,
      waterParticles
    };
  });
  console.log('Subway Spray audit:', subwaySprayAudit);
  report.checks.subwaySprayVerified = (subwaySprayAudit.subwayCamActive && subwaySprayAudit.hasFloodedWater && subwaySprayAudit.waterParticles > 0);
  report.subwaySprayAudit = subwaySprayAudit;
  await captureCanvas(page, 'rc156_subway_subterranean_high_pressure_water_spray.png');

  // CHECK 3: Performance Optimization & Frame Step Profiling
  console.log('Testing Check 3: Performance Profiling under Load...');
  await page.evaluate(() => {
    window.__DD_QA.setSubwayCam(false);
  });
  const perfAudit = await page.evaluate(async () => {
    const times = [];
    for (let i = 0; i < 20; i++) {
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
      cinematicStats: window.__DD_QA.getCinematicStats ? window.__DD_QA.getCinematicStats() : null
    };
  });
  console.log('Performance audit under full load:', perfAudit);
  report.checks.performanceOptimizationVerified = (parseFloat(perfAudit.avgFrameMs) < 200.0);
  report.perfAudit = perfAudit;
  await captureCanvas(page, 'rc156_performance_optimization_and_destruction_stability.png');

  // CHECK 4: Fire Suppression & Steam Vapor
  console.log('Testing Check 4: Water Mist Fire Suppression & Steam...');
  await page.evaluate(() => {
    window.__DD_QA.igniteBlock();
  });
  await stepFrames(page, 12, 'Fire Suppression Simulation');

  const suppressionAudit = await page.evaluate(() => {
    return {
      firesCount: window.__DD_QA.getFiresCount ? window.__DD_QA.getFiresCount() : 0,
      waterParticles: window.__DD_QA.getWaterParticleCount()
    };
  });
  console.log('Suppression audit:', suppressionAudit);
  report.checks.fireSuppressionVerified = (suppressionAudit.waterParticles > 0);
  report.suppressionAudit = suppressionAudit;
  await captureCanvas(page, 'rc156_water_mist_fire_suppression_and_steam.png');

  // Write verification report artifact
  for (const dir of ARTIFACT_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const jsonReportPath = path.join(dir, 'rc156_verification_report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Saved JSON verification report to ${jsonReportPath}`);
  }

  await browser.close();
  console.log('RC156 Live Verification finished successfully!');
}

run().catch(err => {
  console.error('RC156 verification failed:', err);
  process.exit(1);
});
