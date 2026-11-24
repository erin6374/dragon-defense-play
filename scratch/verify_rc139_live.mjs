import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

const ARTIFACT_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';
const URL = 'http://localhost:8780/index.html?qa=1';

async function stepFrames(page, count = 18) {
  await page.evaluate((n) => {
    if (window.__DD_QA && window.__DD_QA.stepFrame) {
      window.__DD_QA.stepFrame(n, 0.05);
    }
  }, count);
  await page.waitForTimeout(count * 20);
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
  console.log(`Launching browser to test RC139 on ${URL}...`);
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

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🚇') || text.includes('🔥') || text.includes('SUBWAY') || text.includes('COLLAPSE') || text.includes('WATER')) {
      console.log('BROWSER LOG:', text);
    }
  });

  const report = {
    version: null,
    buildId: null,
    subwayTrainCarVerified: false,
    waterMainGeyserVerified: false,
    furnitureSpilloutVerified: false,
    fireConflagrationVerified: false,
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

    // Launch Sandbox Direct
    console.log('Testing direct sandbox launch...');
    await page.evaluate(() => {
      const btn = document.getElementById('start-sandbox-direct');
      if (btn) btn.click();
      else if (typeof window.startSandboxDirect === 'function') window.startSandboxDirect();
    });
    await page.waitForTimeout(1000);

    // Disable dragon for quiet testing
    await page.evaluate(() => {
      if (typeof window.toggleDragon === 'function') window.toggleDragon(false);
    });
    await stepFrames(page, 5);

    // 1. Test Broad Street Subway Breach with SEPTA Train Car & Water Main Geyser
    console.log('Testing 3D Broad Street subway breach & SEPTA B-IV train car...');
    // Drop Titanic (10.5m) meteor right in Broad Street roadway (x = 0, z = 24)
    await page.evaluate(() => {
      window.__DD_QA?.spawnTestMeteorAt?.(0, 0.5, 24.0, 10.5, 'molten');
    });
    await stepFrames(page, 55);

    const subwayAudit = await page.evaluate(() => {
      const scene = window.__DD_SCENE;
      const subwayBreach = scene?.children?.find(c => c.name === 'subway-cavern-group');
      const geyser = scene?.children?.find(c => c.name === 'water-main-geyser');

      let septaCarFound = false;
      let redStripeFound = false;
      let blueStripeFound = false;

      if (subwayBreach) {
        subwayBreach.traverse(o => {
          if (o.name === 'septa-b4-subway-car') septaCarFound = true;
          if (o.material?.color?.getHexString() === 'd9381e') redStripeFound = true;
          if (o.material?.color?.getHexString() === '144988') blueStripeFound = true;
        });
      }

      return {
        breachFound: !!subwayBreach,
        septaCarFound,
        redStripeFound,
        blueStripeFound,
        geyserFound: !!geyser
      };
    });
    console.log('Subway and Geyser audit:', subwayAudit);
    report.subwayTrainCarVerified = subwayAudit.breachFound && subwayAudit.septaCarFound;
    report.waterMainGeyserVerified = subwayAudit.geyserFound;

    // Position camera to capture subway cavern and SEPTA train car
    await page.evaluate(() => {
      window.__DD_QA?.setCameraPan?.(0);
    });
    await stepFrames(page, 5);
    await captureCanvas(page, 'rc139_subway_cavern_septa_train_car.png');
    report.screenshots.push('rc139_subway_cavern_septa_train_car.png');

    // Capture water main geyser eruption
    await stepFrames(page, 10);
    await captureCanvas(page, 'rc139_water_main_geyser_eruption.png');
    report.screenshots.push('rc139_water_main_geyser_eruption.png');

    // 2. Test Building Destructibility with Furniture Spillout & Foundation Slab
    console.log('Testing building destructibility with furniture spillout...');
    const furnitureAudit = await page.evaluate(() => {
      const city = window.__DD_QA?.getCity?.() || window.__DD_CITY;
      const nb = window.__DD_NORTH_BROAD;
      const targetBuilding = city?.buildings?.find(b => b.name === 'north-2217-brownstone');
      const nbEntry = nb?.entries?.find(e => e.def?.name?.includes('2217'));

      // Spawn colossal meteor (6.5m) directly over the building
      window.__DD_QA?.spawnTestMeteorAt?.(22.38, 14.0, -11.0, 6.5, 'molten');
      return {
        foundTarget: !!targetBuilding,
        foundNbEntry: !!nbEntry
      };
    });
    console.log('Spawned meteor over building:', furnitureAudit);
    await stepFrames(page, 32);

    const postCollapseFurniture = await page.evaluate(() => {
      const nb = window.__DD_NORTH_BROAD;
      const nbEntry = nb?.entries?.find(e => e.def?.name?.includes('2217'));
      let couchFound = false;
      let tableFound = false;
      let mattressFound = false;
      let pipeFound = false;

      if (nbEntry?.rubbleProxy) {
        nbEntry.rubbleProxy.traverse(o => {
          if (o.isMesh) {
            // Check furniture elements
            if (o.material?.color?.getHexString() === '852a32') couchFound = true; // red fabric
            if (o.material?.color?.getHexString() === '503522') tableFound = true; // furniture wood
            if (o.material?.color?.getHexString() === 'dedac8') mattressFound = true; // mattress
            if (o.material?.color?.getHexString() === 'b87333') pipeFound = true; // copper pipe
          }
        });
      }

      return {
        rubbleVisible: nbEntry?.rubbleProxy?.visible ?? false,
        couchFound,
        tableFound,
        mattressFound,
        pipeFound
      };
    });
    console.log('Post-collapse furniture audit:', postCollapseFurniture);
    report.furnitureSpilloutVerified = postCollapseFurniture.rubbleVisible && postCollapseFurniture.couchFound;

    await page.evaluate(() => {
      window.__DD_QA?.setCameraPan?.(22.38);
    });
    await stepFrames(page, 5);
    await captureCanvas(page, 'rc139_building_furniture_rubble_collapse.png');
    report.screenshots.push('rc139_building_furniture_rubble_collapse.png');

    // 3. Test Untended Neighborhood Fire Spread & Cascading Conflagration
    console.log('Testing untended fire spread & neighborhood conflagration...');
    await page.evaluate(() => {
      // Ignite building fire on rowhouse
      window.__DD_QA?.igniteAt?.(16.28, 4.0, -11.0);
    });
    await stepFrames(page, 45);

    const fireAudit = await page.evaluate(() => {
      const fires = window.__DD_QA?.getFires?.() || [];
      const city = window.__DD_QA?.getCity?.() || window.__DD_CITY;
      return {
        fireCount: fires.length,
        burningBuildings: city?.buildings?.filter(b => (b.damage || 0) > 0.1).length || 0
      };
    });
    console.log('Fire conflagration audit:', fireAudit);
    report.fireConflagrationVerified = fireAudit.fireCount > 0;

    await captureCanvas(page, 'rc139_neighborhood_conflagration_fire_spread.png');
    report.screenshots.push('rc139_neighborhood_conflagration_fire_spread.png');

    console.log('Verification finished. Writing report...');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc139_verification_report.json'), JSON.stringify(report, null, 2));
    console.log('Report successfully saved.');

  } catch (err) {
    console.error('Test run error:', err);
  } finally {
    await browser.close();
  }
}

run();
