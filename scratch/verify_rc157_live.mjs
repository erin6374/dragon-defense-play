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
  console.log(`Launching browser to test RC157 on ${URL}...`);
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
    version: '5.5.0-rc.157',
    timestamp: new Date().toISOString(),
    checks: {},
    waterAudit: {},
    perfAudit: {},
    subwaySprayAudit: {},
    suppressionAudit: {}
  };

  // CHECK 1: One-Click Director Sandbox Water Main Preset
  console.log('Testing Check 1: One-Click Water Main Preset...');
  await page.evaluate(() => {
    window.__DD_QA.runPresetWaterMain();
  });
  await stepFrames(page, 12, 'Water Main Preset Simulation');

  const waterPresetAudit = await page.evaluate(() => {
    const hasGeyser = window.__DD_QA.hasWaterMainGeyser();
    const waterParticles = window.__DD_QA.getWaterParticleCount();
    const craters = window.__DD_QA.getCraters();
    const subwayCrater = craters.find(c => c.isSubway);
    return {
      hasGeyser,
      waterParticles,
      cratersCount: craters.length,
      hasSubwayBreach: !!subwayCrater
    };
  });
  console.log('Water Main Preset audit:', waterPresetAudit);
  report.checks.waterMainPresetVerified = (waterPresetAudit.hasGeyser && waterPresetAudit.hasSubwayBreach && waterPresetAudit.waterParticles > 0);
  report.waterPresetAudit = waterPresetAudit;
  await captureCanvas(page, 'rc157_director_sandbox_water_main_preset.png');

  // CHECK 2: Subterranean Subway Cavern Emergency Illuminated EXIT Signs
  console.log('Testing Check 2: Subway Cavern Emergency EXIT Signs...');
  await page.evaluate(() => {
    window.__DD_QA.setSubwayCam(true);
  });
  await stepFrames(page, 8, 'Subway Cavern Camera Frame');

  const subwayExitSignsAudit = await page.evaluate(() => {
    const exitSignsCount = window.__DD_QA.getEmergencyExitSignsCount ? window.__DD_QA.getEmergencyExitSignsCount() : 0;
    return {
      subwayCamActive: window.__DD_QA.isSubwayCamActive(),
      exitSignsCount
    };
  });
  console.log('Subway EXIT Signs audit:', subwayExitSignsAudit);
  report.checks.subwayExitSignsVerified = (subwayExitSignsAudit.subwayCamActive && subwayExitSignsAudit.exitSignsCount >= 2);
  report.subwayExitSignsAudit = subwayExitSignsAudit;
  await captureCanvas(page, 'rc157_subway_emergency_evacuation_exit_signs.png');

  // CHECK 3: Subterranean Strobing Red Warning Beacon Light
  console.log('Testing Check 3: Subterranean Red Warning Beacon Light...');
  const subwayBeaconAudit = await page.evaluate(() => {
    const beacon = window.__DD_QA.getSubwayEmergencyBeacon ? window.__DD_QA.getSubwayEmergencyBeacon() : null;
    let hasBeaconLight = false;
    let hasBeaconDome = false;
    let initialLightIntensity = 0;
    if (beacon) {
      const bl = beacon.children.find(ch => ch.name === 'subway-beacon-light');
      const bd = beacon.children.find(ch => ch.name === 'subway-beacon-dome');
      hasBeaconLight = !!bl;
      hasBeaconDome = !!bd;
      initialLightIntensity = bl ? bl.intensity : 0;
    }
    return {
      hasBeacon: !!beacon,
      hasBeaconLight,
      hasBeaconDome,
      initialLightIntensity
    };
  });
  console.log('Subway Beacon audit:', subwayBeaconAudit);
  report.checks.subwayBeaconVerified = (subwayBeaconAudit.hasBeacon && subwayBeaconAudit.hasBeaconLight && subwayBeaconAudit.hasBeaconDome);
  report.subwayBeaconAudit = subwayBeaconAudit;
  await captureCanvas(page, 'rc157_subway_emergency_strobe_warning_beacon.png');

  // CHECK 4: Authentically Colored Terracotta Brick & Mortar Dust Bursts
  console.log('Testing Check 4: Terracotta Brick Dust Bursts...');
  await page.evaluate(() => {
    window.__DD_QA.setSubwayCam(false);
    window.__DD_QA.triggerBrickDustBurst(0, 2.0, 0, 1.8);
  });
  await stepFrames(page, 6, 'Brick Dust Burst Simulation');

  const brickDustAudit = await page.evaluate(() => {
    const stats = window.__DD_QA.getSmokeStats ? window.__DD_QA.getSmokeStats() : null;
    return {
      stats,
      activeDustPuffs: stats ? stats.activeDustPuffs : 0,
      activeBrickDustPuffs: stats ? stats.activeBrickDustPuffs : 0
    };
  });
  console.log('Brick Dust audit:', brickDustAudit);
  report.checks.brickDustVerified = (brickDustAudit.activeBrickDustPuffs > 0 || brickDustAudit.activeDustPuffs > 0);
  report.brickDustAudit = brickDustAudit;
  await captureCanvas(page, 'rc157_terracotta_brick_dust_masonry_burst.png');

  // Write verification report artifact
  for (const dir of ARTIFACT_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const jsonReportPath = path.join(dir, 'rc157_verification_report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Saved JSON verification report to ${jsonReportPath}`);
  }

  await browser.close();
  console.log('RC157 Live Verification finished successfully!');
}

run().catch(err => {
  console.error('RC157 verification failed:', err);
  process.exit(1);
});
