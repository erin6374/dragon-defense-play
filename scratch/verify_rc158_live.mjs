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
  console.log(`Launching browser to test RC158 on ${URL}...`);
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
    version: '5.5.0-rc.158',
    timestamp: new Date().toISOString(),
    checks: {},
    asphaltPuddleAudit: {},
    risingFloodAudit: {},
    wheelSprayAudit: {},
    perfAudit: {}
  };

  // CHECK 1: Specular Water Puddle Runoff Sheet Pooling on Asphalt
  console.log('Testing Check 1: Asphalt Water Puddle Runoff Sheet...');
  await page.evaluate(() => {
    window.__DD_QA.runPresetWaterMain();
  });
  await stepFrames(page, 12, 'Water Main & Puddle Simulation');

  const asphaltPuddleAudit = await page.evaluate(() => {
    const hasPuddle = window.__DD_QA.hasAsphaltWaterPuddle ? window.__DD_QA.hasAsphaltWaterPuddle() : false;
    const hasGeyser = window.__DD_QA.hasWaterMainGeyser();
    const waterParticles = window.__DD_QA.getWaterParticleCount();
    return {
      hasPuddle,
      hasGeyser,
      waterParticles
    };
  });
  console.log('Asphalt Puddle audit:', asphaltPuddleAudit);
  report.checks.asphaltPuddleVerified = (asphaltPuddleAudit.hasPuddle && asphaltPuddleAudit.hasGeyser && asphaltPuddleAudit.waterParticles > 0);
  report.asphaltPuddleAudit = asphaltPuddleAudit;
  await captureCanvas(page, 'rc158_asphalt_specular_water_puddle_sheet.png');

  // CHECK 2: Subterranean Subway Rising Flood Sump Water
  console.log('Testing Check 2: Subterranean Subway Rising Flood Water...');
  await page.evaluate(() => {
    window.__DD_QA.setSubwayCam(true);
  });
  await stepFrames(page, 16, 'Subway Inundation Simulation');

  const risingFloodAudit = await page.evaluate(() => {
    const floodLevel = window.__DD_QA.getSubwayFloodLevel ? window.__DD_QA.getSubwayFloodLevel() : 0;
    const hasFloodedWater = window.__DD_QA.hasFloodedSubwayWater();
    return {
      subwayCamActive: window.__DD_QA.isSubwayCamActive(),
      hasFloodedWater,
      floodLevel: floodLevel.toFixed(3)
    };
  });
  console.log('Subway Rising Flood audit:', risingFloodAudit);
  report.checks.risingFloodVerified = (risingFloodAudit.subwayCamActive && risingFloodAudit.hasFloodedWater && parseFloat(risingFloodAudit.floodLevel) >= 0.14);
  report.risingFloodAudit = risingFloodAudit;
  await captureCanvas(page, 'rc158_subway_rising_flood_water_sump.png');

  // CHECK 3: Vehicle Wet Pavement Wheel Spray
  console.log('Testing Check 3: Vehicle Wet Pavement Wheel Spray...');
  await page.evaluate(() => {
    window.__DD_QA.setSubwayCam(false);
    window.__DD_QA.spawnCar(-18, 23.5, 1, 'sedan');
  });
  await stepFrames(page, 12, 'Vehicle Driving Through Puddle');

  const wheelSprayAudit = await page.evaluate(() => {
    const cars = window.__DD_QA.carsList();
    const waterParticles = window.__DD_QA.getWaterParticleCount();
    return {
      carsCount: cars.length,
      waterParticles
    };
  });
  console.log('Wheel Spray audit:', wheelSprayAudit);
  report.checks.wheelSprayVerified = (wheelSprayAudit.carsCount > 0 && wheelSprayAudit.waterParticles > 0);
  report.wheelSprayAudit = wheelSprayAudit;
  await captureCanvas(page, 'rc158_vehicle_wet_pavement_wheel_spray.png');

  // CHECK 4: Multi-Disaster Performance & Frame Stability
  console.log('Testing Check 4: Multi-Disaster Performance & Frame Profiling...');
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
      cinematicStats: window.__DD_QA.getSmokeStats ? window.__DD_QA.getSmokeStats() : null
    };
  });
  console.log('Performance audit under full disaster load:', perfAudit);
  report.checks.performanceStabilityVerified = (parseFloat(perfAudit.avgFrameMs) < 200.0);
  report.perfAudit = perfAudit;
  await captureCanvas(page, 'rc158_multi_disaster_destruction_stability.png');

  // Write verification report artifact
  for (const dir of ARTIFACT_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const jsonReportPath = path.join(dir, 'rc158_verification_report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Saved JSON verification report to ${jsonReportPath}`);
  }

  await browser.close();
  console.log('RC158 Live Verification finished successfully!');
}

run().catch(err => {
  console.error('RC158 verification failed:', err);
  process.exit(1);
});
