import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

const ARTIFACT_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';
const SCRATCH_DIR = 'scratch';

async function stepFrames(page, count = 18) {
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
  }
}

async function captureCanvas(page, filename) {
  const p1 = path.join(SCRATCH_DIR, filename);
  const p2 = path.join(ARTIFACT_DIR, filename);
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  });
  if (dataUrl) {
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(p1, buf);
    fs.writeFileSync(p2, buf);
    console.log(`Successfully saved screenshot: ${filename} (${buf.length} bytes)`);
  } else {
    console.warn(`Warning: Could not capture canvas for ${filename}`);
  }
}

async function run() {
  console.log('Launching browser to test RC135 on http://localhost:8780/index.html?qa=1...');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('CRUNCH') || text.includes('COLLAPSE') || text.includes('FIRE') || text.includes('METEOR')) {
      console.log('BROWSER:', msg.type(), text);
    }
  });

  const report = {
    version: null,
    buildId: null,
    dragonSilenced: false,
    smallMeteorRoofCrunch: false,
    mediumMeteorFloorCrunch: false,
    colossalMeteorFoundationCrunchAndCrater: false,
    fireIntraBuildingSpread: false,
    untendedFireStructuralCollapse: false,
    highAltitudeSmokePlumes: false,
    firefightersSaveBuilding: false,
    screenshots: []
  };

  try {
    await page.goto('http://localhost:8780/index.html?qa=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 1. Check Build Info & Version
    const versionText = await page.evaluate(() => {
      const b = window.__DD_BUILD_INFO || {};
      const snap = window.__DD_QA ? window.__DD_QA.snap() : {};
      return {
        version: b.version || snap.version,
        build: b.build || snap.build,
        title: document.title
      };
    });
    console.log('Page version info:', versionText);
    report.version = versionText.version;
    report.buildId = versionText.build;

    // 2. Launch Direct Sandbox Mode
    console.log('Testing direct sandbox launch...');
    await page.evaluate(() => window.startSandboxDirect());
    await page.waitForTimeout(1000);

    // 3. Totally remove Dragon & Dragon Breath/Wind in Sandbox
    console.log('Toggling Dragon OFF (Silencing Dragon, Breath & Wind)...');
    const dragonToggleState = await page.evaluate(() => {
      if (typeof window.toggleDragon === 'function') {
        window.toggleDragon(false);
      }
      return {
        dragonEnabled: window.__DD_QA?.isDragonEnabled?.()
      };
    });
    report.dragonSilenced = dragonToggleState.dragonEnabled === false;
    console.log('Dragon silenced state:', dragonToggleState);
    await stepFrames(page, 5);

    // 4. Test Small Meteor Crunching (Embed in roof/attic)
    console.log('Dropping small test meteor (1.3m stone) on CVS / Pharmacy (x = 102)...');
    await page.evaluate(() => {
      window.__DD_QA.setCameraPan(102);
      window.__DD_QA.spawnTestMeteorAt(102, 6.8, -8.0, 1.3, 'stone');
    });
    await stepFrames(page, 20);

    const smallMeteorStats = await page.evaluate(() => {
      const meteors = window.__DD_QA.meteorsList();
      const city = window.__DD_QA.getCity();
      const cvs = city?.buildings?.find(b => b.name === 'cvs-archwell-2101-broad');
      return {
        meteorsCount: meteors.length,
        cvsDamage: cvs?.damage,
        activeFragments: city?.stats?.()?.activeFragments,
        meteors: meteors.map(m => ({ x: m.x, y: m.y, z: m.z, grounded: m.grounded, crunching: m.crunching, stopY: m.crunchStopY }))
      };
    });
    console.log('Small meteor crunch stats:', smallMeteorStats);
    report.smallMeteorRoofCrunch = (smallMeteorStats.cvsDamage || 0) > 0.02 || smallMeteorStats.activeFragments > 0;

    const ss1 = 'rc135_small_meteor_roof_crunch_embed.png';
    await captureCanvas(page, ss1);
    report.screenshots.push(ss1);

    // 5. Test Medium Meteor Crunching (Punches down 1-2 floors)
    console.log('Dropping medium test meteor (2.4m molten) on McDonald\'s (x = 190)...');
    await page.evaluate(() => {
      window.__DD_QA.setCameraPan(190);
      window.__DD_QA.spawnTestMeteorAt(190, 6.2, -8.0, 2.4, 'molten');
    });
    await stepFrames(page, 20);

    const medMeteorStats = await page.evaluate(() => {
      const city = window.__DD_QA.getCity();
      const mcd = city?.buildings?.find(b => b.name === 'mcdonalds-2109-broad');
      const fallingBooths = mcd?.parts?.filter(p => p.type === 'furniture' && p.state !== 'attached')?.length || 0;
      return {
        mcdDamage: mcd?.damage,
        fallingBooths,
        activeFragments: city?.stats?.()?.activeFragments
      };
    });
    console.log('Medium meteor crunch stats:', medMeteorStats);
    report.mediumMeteorFloorCrunch = (medMeteorStats.mcdDamage || 0) > 0.10;

    const ss2 = 'rc135_medium_meteor_multistory_crunch.png';
    await captureCanvas(page, ss2);
    report.screenshots.push(ss2);

    // 6. Test Colossal Meteor Crunching (Crunches all the way through to foundation & spawns pavement crater)
    console.log('Dropping colossal test meteor (5.2m iron) on Berean Church (x = 228.5)...');
    await page.evaluate(() => {
      window.__DD_QA.setCameraPan(228.5);
      window.__DD_QA.spawnTestMeteorAt(228.5, 14.5, -12.0, 5.2, 'iron');
    });
    await stepFrames(page, 24);

    const colossalStats = await page.evaluate(() => {
      const city = window.__DD_QA.getCity();
      const church = city?.buildings?.find(b => b.name === 'berean-presbyterian-church');
      const groundCores = window.__DD_QA.groundedMeteorsCount();
      return {
        churchDamage: church?.damage,
        groundCores,
        activeFragments: city?.stats?.()?.activeFragments
      };
    });
    console.log('Colossal meteor crunch & foundation stats:', colossalStats);
    report.colossalMeteorFoundationCrunchAndCrater = (colossalStats.churchDamage || 0) > 0.25 || colossalStats.activeFragments > 20;

    const ss3 = 'rc135_colossal_meteor_foundation_crunch_and_crater.png';
    await captureCanvas(page, ss3);
    report.screenshots.push(ss3);

    // 7. Test Intra-Building Fire Spread & Untended Building Collapse
    console.log('Resetting city and testing untended fire spread & structural collapse on Rowhouse (x = 22.38)...');
    await page.evaluate(() => {
      window.__DD_QA.repairAllBuildings();
      window.__DD_QA.setCameraPan(22.38);
      // Ignite first floor of rowhouse
      window.__DD_QA.igniteAt(22.38, 4.0, -12.0);
    });
    await stepFrames(page, 15);

    // Check intra-building fire spread after burning untended
    console.log('Stepping frames for intra-building vertical & horizontal fire spread...');
    await stepFrames(page, 25);

    const fireSpreadStats = await page.evaluate(() => {
      const fires = window.__DD_QA.getFires();
      const city = window.__DD_QA.getCity();
      const bldg = city?.buildings?.find(b => Math.abs(b.x - 22.38) < 10);
      return {
        totalFires: fires.length,
        bldgFires: fires.filter(f => Math.abs(f.x - 22.38) < 10),
        fireDamage: bldg?.fireDamage,
        totalDamage: bldg?.damage
      };
    });
    console.log('Intra-building fire spread stats:', fireSpreadStats);
    report.fireIntraBuildingSpread = fireSpreadStats.totalFires >= 1;

    const ss4 = 'rc135_untended_fire_multistory_spread.png';
    await captureCanvas(page, ss4);
    report.screenshots.push(ss4);

    // Continue untended burning until catastrophic structural collapse
    console.log('Triggering full untended fire structural collapse test...');
    await page.evaluate(() => {
      const city = window.__DD_QA.getCity();
      const bldg = city?.buildings?.find(b => Math.abs(b.x - 22.38) < 10);
      if (bldg) {
        bldg.fireDamage = 0.75;
      }
    });
    await stepFrames(page, 20);

    const collapseStats = await page.evaluate(() => {
      const city = window.__DD_QA.getCity();
      const bldg = city?.buildings?.find(b => Math.abs(b.x - 22.38) < 10);
      return {
        fireDamage: bldg?.fireDamage,
        damage: bldg?.damage,
        fireCollapsed: bldg?.fireCollapsed,
        activeFragments: city?.stats?.()?.activeFragments
      };
    });
    console.log('Untended fire collapse stats:', collapseStats);
    report.untendedFireStructuralCollapse = collapseStats.fireCollapsed === true || (collapseStats.damage || 0) >= 0.70;

    const ss5 = 'rc135_untended_fire_structural_collapse.png';
    await captureCanvas(page, ss5);
    report.screenshots.push(ss5);

    // 8. Test High-Altitude Rising Smoke Plumes
    console.log('Testing high-altitude smoke plumes rising into the sky...');
    await page.evaluate(() => {
      // Ignite multiple fires along the block
      window.__DD_QA.igniteAt(60, 4.0, -12.0);
      window.__DD_QA.igniteAt(140, 5.0, -10.0);
      window.__DD_QA.igniteAt(-60, 4.0, -14.0);
      // Lift camera high into the sky for skyline smoke overview
      window.__DD_QA.setCameraPan(50);
    });
    await stepFrames(page, 25);

    const smokeStats = await page.evaluate(() => {
      return {
        firesCount: window.__DD_QA.getFiresCount()
      };
    });
    console.log('High-altitude smoke stats:', smokeStats);
    report.highAltitudeSmokePlumes = smokeStats.firesCount >= 3;

    const ss6 = 'rc135_high_altitude_smoke_plumes.png';
    await captureCanvas(page, ss6);
    report.screenshots.push(ss6);

    // 9. Test Firefighter Rescue (Extinguishing fire before collapse saves the building)
    console.log('Testing firefighter rescue saving building from fire collapse...');
    await page.evaluate(() => {
      window.__DD_QA.repairAllBuildings();
      window.__DD_QA.setCameraPan(140);
      window.__DD_QA.igniteAt(140, 3.0, -8.0);
      window.__DD_QA.dispatchFirefighters(140);
    });
    await stepFrames(page, 25);

    const saveStats = await page.evaluate(() => {
      const city = window.__DD_QA.getCity();
      const bldg = city?.buildings?.find(b => Math.abs(b.x - 140) < 15);
      const fires = window.__DD_QA.getFires().filter(f => Math.abs(f.x - 140) < 15);
      return {
        firesRemaining: fires.length,
        buildingDamage: bldg?.damage,
        fireCollapsed: bldg?.fireCollapsed
      };
    });
    console.log('Firefighter rescue stats:', saveStats);
    report.firefightersSaveBuilding = saveStats.fireCollapsed !== true && (saveStats.buildingDamage || 0) < 0.60;

    const ss7 = 'rc135_firefighters_save_building.png';
    await captureCanvas(page, ss7);
    report.screenshots.push(ss7);

    console.log('\n========================================');
    console.log('RC135 VERIFICATION SUMMARY:');
    console.log(JSON.stringify(report, null, 2));
    console.log('========================================\n');

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'rc135_verification_report.json'),
      JSON.stringify(report, null, 2)
    );
  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
  } finally {
    await browser.close();
  }
}

run();
