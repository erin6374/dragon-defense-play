import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const URL = 'http://127.0.0.1:8769/?qa=1';
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';

async function captureShowcase() {
  console.log('--- CAPTURING RC86 SHOWCASE SCREENSHOTS ---');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. High-Altitude Atmospheric Ascent
  console.log('Capturing Shot 1: High-Altitude Atmospheric Ascent Perspective...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.start(1);
    qa.closeCinematic();
    qa.move(12, 185); // High altitude ascent
  });
  await page.waitForTimeout(1000);
  const shot1 = await page.screenshot();
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc86_atmospheric_ascent_perspective.png'), shot1);

  // 2. Wave 15 Orbital Dogfight with Double-Row Satellite Constellation
  console.log('Capturing Shot 2: Wave 15 Orbital Satellite Fleet Dogfight...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.start(15);
    qa.closeCinematic();
    qa.move(0, 318); // Orbital ceiling
    qa.activatePowerup('mega_fire_breath');
  });
  await page.waitForTimeout(1000);
  const shot2 = await page.screenshot();
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc86_wave15_orbital_fleet_battle.png'), shot2);

  // 3. Ground Pavement Run & Vehicle Shove
  console.log('Capturing Shot 3: Broad Street Pavement Touchdown & Vehicle Shove...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.start(2);
    qa.closeCinematic();
    qa.move(5, 1.8); // On pavement
  });
  await page.waitForTimeout(1000);
  const shot3 = await page.screenshot();
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc86_broad_street_pavement_locomotion.png'), shot3);

  // 4. Purple Ramming Shield in Orbit
  console.log('Capturing Shot 4: Purple Meteor-Buster Ramming Shield in Orbit...');
  await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.move(-10, 310);
    qa.activatePowerup('purple_ram');
  });
  await page.waitForTimeout(1000);
  const shot4 = await page.screenshot();
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc86_purple_ram_shield_orbital_strike.png'), shot4);

  await browser.close();
  console.log('All 4 showcase screenshots saved successfully to artifact directory!');
}

captureShowcase().catch(err => {
  console.error('Showcase error:', err);
  process.exit(1);
});
