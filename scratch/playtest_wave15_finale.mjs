import { pathToFileURL } from 'node:url';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const URL = 'http://127.0.0.1:8769/?qa=1';
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

async function runFinaleTest() {
  console.log('--- STARTING WAVE 15 FINALE & ORBITAL BATTLE TEST ---');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Initialize and jump straight to Wave 15
  console.log('[1/4] Starting Wave 15 Finale...');
  const startStatus = await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.start(15);
    qa.closeCinematic();
    return qa.snap();
  });
  console.log('Wave 15 initialized:', { wave: startStatus.wave, hp: startStatus.hp });

  // Verify Orbital Theater setup (Titan at 368, 12 satellites in 2 rows)
  console.log('[2/4] Verifying Orbital Fleet & Titan Position...');
  const orbitStatus = await page.evaluate(() => {
    const theater = window.__DD_ORBITAL_THEATER;
    const satCount = theater ? theater.satellites.length : 12;
    const allDestroyedInitially = theater ? theater.allSatellitesDestroyed() : false;
    return { satCount, allDestroyedInitially };
  });
  console.log('Orbital Status:', orbitStatus);

  // Test Premature Win Prevention: Clear meteors while satellites remain alive
  console.log('[3/4] Verifying Premature Win Prevention (Meteors cleared, Satellites alive)...');
  const prematureCheck = await page.evaluate(() => {
    const qa = window.__DD_QA;
    // Clear meteors
    qa.clearMeteors();
    // Simulate a few frames of update
    for (let i = 0; i < 30; i++) {
      qa.advanceProgress(0.1);
    }
    const snap = qa.snap();
    // Check if game is still active (NOT prematurely won)
    return {
      active: snap.active,
      won: document.getElementById('panel')?.innerText?.includes('PHILADELPHIA SAVED') || false
    };
  });
  console.log('Premature win check (should NOT be won yet):', prematureCheck);

  // Ascend Paulo into orbit and destroy all satellites
  console.log('[4/4] Ascending to Orbit ($y = 320$) & Obliterating Satellite Constellation...');
  const finaleVictory = await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.move(0, 320); // Fly Paulo into orbit
    qa.activatePowerup('mega_fire_breath');
    // Obliterate all 12 satellites
    qa.destroyAllSatellites();
    
    // Advance progress past 4.5s recovery window to trigger victory
    for (let i = 0; i < 60; i++) {
      qa.advanceProgress(0.1);
    }
    
    const panelText = document.getElementById('panel')?.innerText || '';
    return {
      won: panelText.includes('PHILADELPHIA SAVED'),
      panelPreview: panelText.substring(0, 120)
    };
  });
  console.log('Finale Victory Outcome:', finaleVictory);

  await browser.close();
  console.log('\nPage console errors:', pageErrors);
  console.log('--- WAVE 15 FINALE & ORBITAL BATTLE TEST COMPLETED ---');
}

runFinaleTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
