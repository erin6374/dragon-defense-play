import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

const ARTIFACT_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';
const SCRATCH_DIR = 'scratch';

async function stepFrames(page, count = 18) {
  await page.evaluate((n) => {
    if (window.__DD_QA && window.__DD_QA.stepFrame) {
      window.__DD_QA.stepFrame(n, 0.05);
    } else if (window.renderFrame) {
      for (let i = 0; i < n; i++) window.renderFrame(null, 0.05);
    }
  }, count);
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
  console.log('Launching browser to test RC138 on http://localhost:8780/index.html?qa=1...');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('CRUNCH') || text.includes('COLLAPSE') || text.includes('SUBWAY') || text.includes('BREACH') || text.includes('METEOR') || text.includes('SCHOOL')) {
      console.log('BROWSER:', msg.type(), text);
    }
  });

  const report = {
    version: null,
    buildId: null,
    fullDestructibilityVerified: false,
    buildingCollapseInfo: null,
    subwayBreach3DVerified: false,
    subwayDetails: null,
    superColossalTiersVerified: false,
    techFreireProceduralVerified: false,
    schoolHits: [],
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

    // 2. Launch Direct Sandbox Mode and disable dragon
    console.log('Testing direct sandbox launch...');
    await page.evaluate(() => {
      const btn = document.getElementById('start-sandbox-direct');
      if (btn) btn.click();
      else if (typeof window.startSandboxDirect === 'function') window.startSandboxDirect();
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      if (typeof window.toggleDragon === 'function') window.toggleDragon(false);
    });
    await stepFrames(page, 5);

    // 3. Test Full Building Destructibility (Eliminate Indestructible Buildings)
    console.log('Testing full building destructibility on rowhouses / North Broad models...');
    const collapseTest = await page.evaluate(() => {
      const city = window.__DD_QA?.getCity?.() || window.__DD_CITY;
      const nb = window.__DD_NORTH_BROAD;
      // Target 2217 N Broad rowhouse (x = 22.38)
      const targetBuilding = city?.buildings?.find(b => b.name === 'north-2217-brownstone');
      const nbEntry = nb?.entries?.find(e => e.def?.name?.includes('2217'));
      const initialDmg = targetBuilding?.damage || 0;
      
      // Spawn colossal meteor (6.5m) directly over the building
      window.__DD_QA?.spawnTestMeteorAt?.(22.38, 14.0, -11.0, 6.5, 'molten');
      return {
        foundTarget: !!targetBuilding,
        foundNbEntry: !!nbEntry,
        initialDmg
      };
    });
    console.log('Initial building status:', collapseTest);

    // Step frames through the crunching descent and full collapse
    await stepFrames(page, 32);

    const postCollapse = await page.evaluate(() => {
      const city = window.__DD_QA?.getCity?.() || window.__DD_CITY;
      const nb = window.__DD_NORTH_BROAD;
      const targetBuilding = city?.buildings?.find(b => b.name === 'north-2217-brownstone');
      const nbEntry = nb?.entries?.find(e => e.def?.name?.includes('2217'));
      return {
        finalDmg: targetBuilding?.damage || 0,
        modelVisible: nbEntry?.model?.visible ?? null,
        rubbleProxyVisible: nbEntry?.rubbleProxy?.visible ?? null,
        collapsedStats: city?.stats?.()?.collapsed || 0
      };
    });
    console.log('Post-collapse building status:', postCollapse);
    report.buildingCollapseInfo = postCollapse;
    report.fullDestructibilityVerified = (postCollapse.finalDmg >= 0.95) && (postCollapse.modelVisible === false);

    // Position camera near rowhouse to capture full collapse rubble
    await page.evaluate(() => {
      const cam = window.__DD_CAMERA || (window.__DD_QA?.snap()?.camera);
      window.__DD_QA?.setCameraPan?.(22.38);
    });
    await stepFrames(page, 5);
    await captureCanvas(page, 'rc138_building_full_collapse_rubble.png');
    report.screenshots.push('rc138_building_full_collapse_rubble.png');

    // 4. Test True 3D Broad Street Craters & Subterranean Subway Breach
    console.log('Testing true 3D Broad Street craters & subterranean subway breach...');
    // Drop Titanic (10.5m) meteor right in Broad Street roadway (x = 0, z = 24)
    await page.evaluate(() => {
      window.__DD_QA?.spawnTestMeteorAt?.(0, 0.5, 24.0, 10.5, 'molten');
    });
    // Step frames to impact
    await stepFrames(page, 28);

    const subwayAudit = await page.evaluate(() => {
      const scene = window.__DD_SCENE;
      // Find crater
      const subwayBreach = scene?.children?.find(c => c.children?.some(ch => ch.isPointLight || ch.geometry?.parameters?.width > 8));
      const rimMesh = scene?.children?.find(c => c.geometry?.type === 'RingGeometry' && c.position.z >= 14 && c.position.z <= 32);
      let tracksFound = 0;
      let tilesFound = false;
      let rebarFound = false;
      let amberLightFound = false;
      let innerBlackCircleOccluding = false;

      // Check scene for any occluding inner disc
      scene?.traverse(o => {
        if (o.geometry?.type === 'CircleGeometry' && Math.abs(o.position.x) < 5 && Math.abs(o.position.y - 0.105) < 0.02) {
          innerBlackCircleOccluding = true;
        }
      });

      if (subwayBreach) {
        subwayBreach.traverse(o => {
          if (o.isMesh && o.geometry?.parameters?.width > 8) tracksFound++;
          if (o.material?.color?.getHexString() === 'edebe6') tilesFound = true;
          if (o.geometry?.type === 'CylinderGeometry') rebarFound = true;
          if (o.isPointLight) amberLightFound = true;
        });
      }

      return {
        breachFound: !!subwayBreach,
        rimFound: !!rimMesh,
        tracksFound,
        tilesFound,
        rebarFound,
        amberLightFound,
        innerBlackCircleOccluding
      };
    });
    console.log('Subway breach audit:', subwayAudit);
    report.subwayDetails = subwayAudit;
    report.subwayBreach3DVerified = subwayAudit.breachFound && subwayAudit.tracksFound > 0 && !subwayAudit.innerBlackCircleOccluding;

    // Position camera looking down into the open subway chasm
    await page.evaluate(() => {
      window.__DD_QA?.setCameraPan?.(0);
    });
    await stepFrames(page, 5);
    await captureCanvas(page, 'rc138_broad_street_subway_3d_cavern_breach.png');
    report.screenshots.push('rc138_broad_street_subway_3d_cavern_breach.png');

    // 5. Test Super-Colossal Meteor Tiers (Titanic & Extinction)
    console.log('Testing Super-Colossal Meteor Tiers (10.5m & 14.0m)...');
    const optionsCheck = await page.evaluate(() => {
      const sel = document.getElementById('dd-test-meteor-size');
      const tbSel = document.getElementById('dd-tb-meteor-size');
      const opts = Array.from(sel?.options || []).map(o => ({ value: o.value, text: o.text }));
      const tbOpts = Array.from(tbSel?.options || []).map(o => ({ value: o.value, text: o.text }));
      return {
        hasTitanic: opts.some(o => o.value === '10.5'),
        hasExtinction: opts.some(o => o.value === '14.0'),
        hasTbTitanic: tbOpts.some(o => o.value === '10.5'),
        hasTbExtinction: tbOpts.some(o => o.value === '14.0')
      };
    });
    console.log('Meteor size options check:', optionsCheck);
    report.superColossalTiersVerified = optionsCheck.hasTitanic && optionsCheck.hasExtinction;

    // Spawn 14.0m Extinction Megalith
    await page.evaluate(() => {
      window.__DD_QA?.spawnTestMeteorAt?.(-50.0, 0.5, 20.0, 14.0, 'flaming');
    });
    await stepFrames(page, 15);
    await page.evaluate(() => {
      window.__DD_QA?.setCameraPan?.(-50.0);
    });
    await stepFrames(page, 12);
    await captureCanvas(page, 'rc138_titanic_meteor_impact.png');
    report.screenshots.push('rc138_titanic_meteor_impact.png');

    // 6. Test Tech Freire Refined Procedural Destruction
    console.log('Testing Tech Freire refined procedural destruction...');
    // Repair all buildings
    await page.evaluate(() => {
      if (typeof window.repairAllBuildings === 'function') window.repairAllBuildings();
      else if (window.__DD_QA?.repairAllBuildings) window.__DD_QA.repairAllBuildings();
    });
    await stepFrames(page, 5);

    const initialSchool = await page.evaluate(() => ({
      hp: window.__DD_QA?.getSchoolHp?.() ?? 100,
      damage: window.__DD_QA?.getSchoolDamage?.() ?? 0
    }));
    console.log('Repaired school status:', initialSchool);

    // Drop first meteor on school roof
    await page.evaluate(() => {
      window.__DD_QA?.spawnTestMeteorAt?.(0, 15.0, 0, 3.6, 'molten');
    });
    await stepFrames(page, 30);

    const hit1 = await page.evaluate(() => ({
      hp: window.__DD_QA?.getSchoolHp?.() ?? 100,
      damage: window.__DD_QA?.getSchoolDamage?.() ?? 0
    }));
    console.log('School status after Meteor 1:', hit1);
    report.schoolHits.push(hit1);

    // Drop second meteor on school (offset bay x = -6)
    await page.evaluate(() => {
      window.__DD_QA?.spawnTestMeteorAt?.(-6.0, 15.0, 0, 3.6, 'flaming');
    });
    await stepFrames(page, 30);

    const hit2 = await page.evaluate(() => ({
      hp: window.__DD_QA?.getSchoolHp?.() ?? 100,
      damage: window.__DD_QA?.getSchoolDamage?.() ?? 0
    }));
    console.log('School status after Meteor 2:', hit2);
    report.schoolHits.push(hit2);

    // Verify gradual segmented damage (2 hits should NOT level the school! HP should be > 80%)
    report.techFreireProceduralVerified = (hit1.hp >= 90 && hit1.hp <= 98) && (hit2.hp >= 80 && hit2.hp <= 95);

    // Focus camera on Tech Freire
    await page.evaluate(() => {
      window.__DD_QA?.setCameraPan?.(0);
    });
    await stepFrames(page, 5);
    await captureCanvas(page, 'rc138_tech_freire_destruction.png');
    report.screenshots.push('rc138_tech_freire_destruction.png');

    console.log('Verification finished. Writing report...');
    fs.writeFileSync(path.join(SCRATCH_DIR, 'rc138_verification_report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc138_verification_report.json'), JSON.stringify(report, null, 2));
    console.log('Report successfully saved.');

  } catch (err) {
    console.error('Test run failed with error:', err);
  } finally {
    await browser.close();
  }
}

run();
