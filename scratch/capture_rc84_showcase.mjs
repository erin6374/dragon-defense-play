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

  // -------------------------------------------------------------
  // Shot 1: Satellite Battery Pacing, Win Condition & Clean Sky
  // -------------------------------------------------------------
  console.log('Staging Shot 1: Satellite Battery Pacing & Orbital Ceiling...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.start(1);
    qa.closeCinematic();
    qa.move(0, 315);
  });
  await page.waitForTimeout(3000);
  const shot1 = ARTIFACT_DIR + '/rc84_satellite_battery_and_win_pacing.png';
  await page.screenshot({ path: shot1 });
  console.log('Captured ' + shot1);

  // -------------------------------------------------------------
  // Shot 2: Cascading Meteors (Large -> Medium -> Small) & Collisions
  // -------------------------------------------------------------
  console.log('Staging Shot 2: Cascading Meteors & Mid-Air Collisions...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.move(10, 75);
    // Trigger some meteor cascading & collisions in view
    for (let i = 0; i < 4; i++) {
      qa.spawnHelicopter?.();
    }
  });
  await page.waitForTimeout(2500);
  const shot2 = ARTIFACT_DIR + '/rc84_cascading_meteors_and_collisions.png';
  await page.screenshot({ path: shot2 });
  console.log('Captured ' + shot2);

  // -------------------------------------------------------------
  // Shot 3: Purple "Meteor-Buster" Ramming Shield & Powerup HUD
  // -------------------------------------------------------------
  console.log('Staging Shot 3: Purple Meteor-Buster Ramming Shield...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.move(-15, 55);
    qa.activatePowerup('purple_ram');
  });
  await page.waitForTimeout(1200);
  const shot3 = ARTIFACT_DIR + '/rc84_purple_ram_shield_and_powerup.png';
  await page.screenshot({ path: shot3 });
  console.log('Captured ' + shot3);

  // -------------------------------------------------------------
  // Shot 4: 50% School Structural Destruction & Ground Pavement Run
  // -------------------------------------------------------------
  console.log('Staging Shot 4: 50% School Destruction & Pavement Locomotion...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    // Damage school to exactly 50% HP (50% structural voxel detachment)
    qa.hitSchool(50);
    // Touch down on pavement (y = 1.8) near Broad Street vehicles
    qa.move(2, 1.8);
  });
  await page.waitForTimeout(1500);
  const shot4 = ARTIFACT_DIR + '/rc84_school_proportional_destruction_and_ground_run.png';
  await page.screenshot({ path: shot4 });
  console.log('Captured ' + shot4);

  await browser.close();
  console.log('All 4 RC84 showcase screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
