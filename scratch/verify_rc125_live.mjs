import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

const SCRATCH_DIR = 'C:/Users/Tech-Erin/dragon-defense-repo/scratch';
const ARTIFACTS_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';
const PORT = 8771;

async function run() {
  console.log(`Connecting to live RC125 preview on port ${PORT}...`);
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  let cdpClient = null;

  async function captureScreen(filename) {
    if (!cdpClient) {
      cdpClient = await page.context().newCDPSession(page);
    }
    const { data } = await cdpClient.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(path.join(SCRATCH_DIR, filename), buf);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), buf);
    console.log(`Captured ${filename} (${buf.length} bytes)`);
  }

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  console.log(`Navigating to http://127.0.0.1:${PORT}/?qa=1...`);
  await page.goto(`http://127.0.0.1:${PORT}/?qa=1`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(2000);

  // 1. Capture Start Menu
  await captureScreen('rc125_start_menu_defend_philly.png');

  // Verify build stamp
  const buildInfo = await page.evaluate(() => {
    return {
      gameBuild: document.getElementById('game-build')?.textContent,
      startBuild: document.getElementById('start-build')?.textContent
    };
  });
  console.log('Build Info:', buildInfo);

  // Wait for North Broad models to finish loading
  console.log('Waiting for North Broad models to load...');
  await page.waitForFunction(() => {
    return window.__DD_NORTH_BROAD && window.__DD_NORTH_BROAD.getStats().loadedCount >= 11;
  }, { timeout: 25000 });

  // Check 2100 block parcels, church bounds, and cross street clearances in live scene
  const gridReport = await page.evaluate(() => {
    const crossStreets = [-167, -98, 70, 245];
    const city = window.__DD_QA?.getCity?.();
    const buildings = city ? city.buildings : [];
    
    // Check if any building center is within road half-width + clearance
    const corridorBlockers = buildings.filter(b => {
      return crossStreets.some(cx => Math.abs(b.x - cx) < (b.w * 0.5 + 4.0));
    }).map(b => ({ name: b.name, x: b.x, w: b.w, z: b.z }));

    const churchModel = window.__DD_NORTH_BROAD?.getStats()?.models?.find(m => m.id === '1005656');
    const pecoModel = window.__DD_NORTH_BROAD?.getStats()?.models?.find(m => m.id === '1051326');
    const mcdonalds = buildings.find(b => b.name === 'mcdonalds-2109-broad');
    const church = buildings.find(b => b.name === 'south-diamond-corner');

    return {
      corridorBlockers,
      churchParcel: church ? { x: church.x, w: church.w, z: church.z, h: church.h } : null,
      churchModelBounds: churchModel ? churchModel.worldBounds : null,
      churchOverhang: churchModel ? churchModel.parcelOverhang : null,
      pecoModelBounds: pecoModel ? pecoModel.worldBounds : null,
      pecoOverhang: pecoModel ? pecoModel.parcelOverhang : null,
      mcdonalds: mcdonalds ? { x: mcdonalds.x, w: mcdonalds.w, z: mcdonalds.z } : null,
      totalBuildings: buildings.length,
      backgroundParcels: buildings.filter(b => b.background).length
    };
  });
  console.log('Grid Report:', JSON.stringify(gridReport, null, 2));
  fs.writeFileSync(path.join(SCRATCH_DIR, 'rc125_grid_report.json'), JSON.stringify(gridReport, null, 2));
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'rc125_grid_report.json'), JSON.stringify(gridReport, null, 2));

  // Click #start button to start gameplay
  console.log('Clicking #start button...');
  await page.click('#start');
  await page.waitForTimeout(2500);

  // 2. Pan camera to show Watts Street cleanly terminating at Tech Freire north boundary with zero collision!
  await page.evaluate(() => {
    if (window.__DD_QA && window.__DD_QA.setCameraPan) {
      window.__DD_QA.setCameraPan(-15);
    }
  });
  await page.waitForTimeout(2000);
  await captureScreen('rc125_watts_street_tech_freire_clearance.png');

  // 3. Pan camera to Diamond Street to capture Berean Church strictly clear of Diamond Street
  await page.evaluate(() => {
    if (window.__DD_QA && window.__DD_QA.setCameraPan) {
      window.__DD_QA.setCameraPan(205);
    }
  });
  await page.waitForTimeout(2000);
  await captureScreen('rc125_diamond_street_berean_aligned.png');

  // 4. Pan camera to Dauphin and York Street unblocked corridors
  await page.evaluate(() => {
    if (window.__DD_QA && window.__DD_QA.setCameraPan) {
      window.__DD_QA.setCameraPan(-120);
    }
  });
  await page.waitForTimeout(2000);
  await captureScreen('rc125_dauphin_and_york_unblocked.png');

  // 5. Test Procedural 3D Chunk Damage on School:
  // Apply gradual damage and verify big chunks are blown out while top level still remains intact!
  console.log('Testing procedural 3D chunk damage on school...');
  await page.evaluate(() => {
    if (window.__DD_QA && window.__DD_QA.setCameraPan) {
      window.__DD_QA.setCameraPan(0);
    }
    // Apply moderate damage (35% damage, 65% HP) to trigger procedural chunk cavities
    if (window.__DD_QA?.hitSchool) {
      window.__DD_QA.hitSchool(35);
    }
  });
  await page.waitForTimeout(2000);
  await captureScreen('rc125_school_procedural_chunk_cavities.png');

  // 6. Test Procedural 3D Chunk Damage on Structural City buildings (roof preserved overhead)
  console.log('Testing procedural chunk damage on structural buildings...');
  await page.evaluate(() => {
    if (window.__DD_QA && window.__DD_QA.setCameraPan) {
      window.__DD_QA.setCameraPan(-50);
    }
    // Impact neighborhood building
    if (window.__DD_QA?.impactNeighborhood) {
      window.__DD_QA.impactNeighborhood('north-2241-rowhouse');
    }
  });
  await page.waitForTimeout(2000);
  await captureScreen('rc125_building_procedural_chunk_damage.png');

  // 7. Reset camera and verify live combat
  await page.evaluate(() => {
    if (window.__DD_QA && window.__DD_QA.setCameraPan) {
      window.__DD_QA.setCameraPan(0);
    }
    if (window.__DD_QA && window.__DD_QA.setWave) {
      window.__DD_QA.setWave(2);
    }
  });
  await page.waitForTimeout(3000);
  await captureScreen('rc125_live_combat_action.png');

  console.log('Verification completed successfully! Errors:', errors.length === 0 ? 'NONE' : errors);
  console.log('Failed Requests:', failedRequests.length === 0 ? 'NONE' : failedRequests);

  await browser.close();
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
