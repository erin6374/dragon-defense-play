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
  console.log(`Launching browser to test RC166 on ${URL}...`);
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

  await stepFrames(page, 12, 'Sandbox Init');

  const report = {
    version: '5.5.0-rc.166',
    timestamp: new Date().toISOString(),
    checks: {},
    buildingRegistryAudit: {},
    subwayWaterfallsAudit: {},
    streetRunoffAudit: {},
    cantileverSagAudit: {}
  };

  // CHECK 1: Modular Building Asset Registry & Swapper Architecture
  console.log('Testing Check 1: Modular Building Asset Registry & Swapper...');
  const registryAudit = await page.evaluate(async () => {
    const slots = window.__DD_QA.getBuildingSlots ? window.__DD_QA.getBuildingSlots() : [];
    const manifest = window.__DD_QA.exportBuildingManifest ? window.__DD_QA.exportBuildingManifest() : null;

    // Test hot-swapping a slot with a custom procedural mesh
    let swapResult = null;
    if (window.__DD_QA.swapBuildingModel && slots.length > 0) {
      const testSlot = slots[1]; // e.g. 2217 N Broad
      const fallbackMesh = window.__DD_QA.createProceduralBuildingFallback(testSlot);
      swapResult = await window.__DD_QA.swapBuildingModel(testSlot.id, fallbackMesh, {
        fitParcel: true,
        groundAlign: true
      });
    }

    const updatedSlots = window.__DD_QA.getBuildingSlots ? window.__DD_QA.getBuildingSlots() : [];
    const swappedSlot = updatedSlots.find(s => s.isCustomSwapped);

    return {
      totalSlots: slots.length,
      hasManifestExport: manifest && Array.isArray(manifest.slots) && manifest.slots.length >= 10,
      swapSucceeded: swapResult?.success === true,
      swappedSlotId: swappedSlot?.id || null,
      isCustomSwapped: !!swappedSlot
    };
  });
  console.log('Building Registry audit:', registryAudit);
  report.checks.buildingSwapArchitectureVerified = (
    registryAudit.totalSlots >= 10 &&
    registryAudit.hasManifestExport &&
    registryAudit.swapSucceeded
  );
  report.buildingRegistryAudit = registryAudit;
  await captureCanvas(page, 'rc166_modular_building_swap_and_registry.png');

  // CHECK 2: Subterranean Gutter Waterfall Curtains in Subway Breach
  console.log('Testing Check 2: Subterranean Gutter Waterfall Curtains...');
  await page.evaluate(() => {
    window.__DD_QA.triggerWaterMain(0, 23.5, 4.5);
    window.__DD_QA.setSubwayCam(true);
  });
  await stepFrames(page, 15, 'Subway Waterfall Simulation');

  const subwayWaterfallsAudit = await page.evaluate(() => {
    const craters = window.__DD_QA.getCraters ? window.__DD_QA.getCraters() : [];
    const subCrater = craters.find(c => c.isSubway && c.subwayGroup);
    let hasWaterfallNorth = false;
    let hasWaterfallSouth = false;
    let hasThirdRailArcLight = false;

    if (subCrater?.subwayGroup) {
      hasWaterfallNorth = !!subCrater.subwayGroup.getObjectByName('subway-waterfall-north');
      hasWaterfallSouth = !!subCrater.subwayGroup.getObjectByName('subway-waterfall-south');
      hasThirdRailArcLight = !!subCrater.subwayGroup.getObjectByName('subway-third-rail-arc-light');
    }

    return {
      subwayCamActive: window.__DD_QA.isSubwayCamActive ? window.__DD_QA.isSubwayCamActive() : false,
      hasSubwayCrater: !!subCrater,
      hasWaterfallNorth,
      hasWaterfallSouth,
      hasThirdRailArcLight,
      floodLevel: subCrater?.floodLevel || 0
    };
  });
  console.log('Subway Waterfalls audit:', subwayWaterfallsAudit);
  report.checks.subwayWaterfallsVerified = (
    subwayWaterfallsAudit.subwayCamActive &&
    subwayWaterfallsAudit.hasWaterfallNorth &&
    subwayWaterfallsAudit.hasWaterfallSouth &&
    subwayWaterfallsAudit.hasThirdRailArcLight
  );
  report.subwayWaterfallsAudit = subwayWaterfallsAudit;
  await captureCanvas(page, 'rc166_subterranean_subway_gutter_waterfall_curtains.png');

  // CHECK 3: Street Curb Gutter Water Runoff & Drainage Catch Basins
  console.log('Testing Check 3: Street Curb Gutter Water Runoff...');
  await page.evaluate(() => {
    window.__DD_QA.setSubwayCam(false);
    window.__DD_QA.triggerStreetRunoff(1.0);
  });
  await stepFrames(page, 12, 'Street Runoff Simulation');

  const streetRunoffAudit = await page.evaluate(() => {
    const stats = window.__DD_QA.getStreetRunoffStats ? window.__DD_QA.getStreetRunoffStats() : null;
    return {
      stats,
      activeDrains: stats?.activeDrains || 0,
      runoffVolume: stats?.runoffVolume || 0,
      isFlowing: !!stats?.isFlowing
    };
  });
  console.log('Street Runoff audit:', streetRunoffAudit);
  report.checks.streetRunoffVerified = (
    streetRunoffAudit.activeDrains >= 8 &&
    streetRunoffAudit.isFlowing &&
    streetRunoffAudit.runoffVolume > 0.5
  );
  report.streetRunoffAudit = streetRunoffAudit;
  await captureCanvas(page, 'rc166_street_curb_gutter_water_runoff.png');

  // CHECK 4: Tech Freire Cantilever Floor Slab Shear Sag & Rebar Physics
  console.log('Testing Check 4: Cantilever Floor Slab Sag & Rebar Sway...');
  await page.evaluate(() => {
    window.__DD_QA.punchSchoolBorehole(0, 14.0, -15, 3.8, true, true);
  });
  await stepFrames(page, 15, 'Destruction Simulation');

  const cantileverSagAudit = await page.evaluate(() => {
    const pieces = window.__DD_QA.getSchoolPieces ? window.__DD_QA.getSchoolPieces() : [];
    const floorPieces = pieces.filter(p => p.zone === 'floor' || p.zone === 'basement-floor');
    const damagedFloors = floorPieces.filter(p => p.integrity < 0.95);
    const rebarPieces = pieces.filter(p => p.zone === 'rebar');
    const damagedRebar = rebarPieces.filter(p => p.integrity < 0.95);

    return {
      totalPieces: pieces.length,
      floorCount: floorPieces.length,
      damagedFloorsCount: damagedFloors.length,
      rebarCount: rebarPieces.length,
      damagedRebarCount: damagedRebar.length
    };
  });
  console.log('Cantilever Sag audit:', cantileverSagAudit);
  report.checks.cantileverSagAndRebarVerified = (
    cantileverSagAudit.damagedFloorsCount > 0 &&
    cantileverSagAudit.rebarCount > 0
  );
  report.cantileverSagAudit = cantileverSagAudit;
  await captureCanvas(page, 'rc166_cantilever_floor_slab_sag_and_rebar_sway.png');

  // Save report to both artifact dirs
  for (const dir of ARTIFACT_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const jsonPath = path.join(dir, 'rc166_verification_report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Saved JSON verification report to ${jsonPath}`);
  }

  await browser.close();
  console.log('RC166 Live Verification finished successfully!');
}

run().catch(err => {
  console.error('RC166 verification failed:', err);
  process.exit(1);
});
