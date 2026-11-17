import { pathToFileURL } from 'node:url';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const ARTIFACT_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';
const URL = 'http://127.0.0.1:8769/?qa=1';
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  console.log('Navigating to ' + URL + '...');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Double-Row Starlink Satellite Constellation in Upper Orbit
  console.log('Staging Shot 1: Double-Row Satellite Constellation...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.start(1);
    qa.closeCinematic();
    qa.move(0, 325);
  });
  await page.waitForTimeout(3000);
  const shot1 = ARTIFACT_DIR + '/rc85_double_row_satellite_constellation.png';
  await page.screenshot({ path: shot1 });
  console.log('Captured ' + shot1);

  // 2. Dragon Resting Pose Facing Camera (+10% Larger Sizing)
  console.log('Staging Shot 2: Camera-Facing Resting Dragon...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.move(0, 24);
  });
  await page.waitForTimeout(1500);
  const shot2 = ARTIFACT_DIR + '/rc85_resting_camera_facing_dragon.png';
  await page.screenshot({ path: shot2 });
  console.log('Captured ' + shot2);

  // 3. Helicopter Crash Cockpit Debris & Surviving Pilot Escape
  console.log('Staging Shot 3: Helicopter Crash Debris & Surviving Pilot...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.move(0, 14);
    qa.triggerHelicopterCrash(1);
  });
  await page.waitForTimeout(1200);
  const shot3 = ARTIFACT_DIR + '/rc85_surviving_pilot_helicopter_crash.png';
  await page.screenshot({ path: shot3 });
  console.log('Captured ' + shot3);

  // 4. Continuous Flamethrower Fire Stream & Building Facade Fire
  console.log('Staging Shot 4: Flamethrower Stream & Building Fires...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.move(0, 18);
    qa.activatePowerup('fire_stream');
    for (let k = 0; k < 12; k++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    }
  });
  await page.waitForTimeout(1000);
  const shot4 = ARTIFACT_DIR + '/rc85_flamethrower_building_and_vehicle_fire.png';
  await page.screenshot({ path: shot4 });
  console.log('Captured ' + shot4);

  await browser.close();
  console.log('All 4 RC85 showcase screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
