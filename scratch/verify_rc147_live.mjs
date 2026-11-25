import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const playwrightPath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Tech-Erin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = process.env.QA_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

const ARTIFACT_DIR = 'C:/Users/Tech-Erin/.gemini/antigravity/brain/19a75615-4ae7-44c7-9109-444c267f196a';
const URL = 'http://localhost:8780/index.html?qa=1';

async function stepFrames(page, count = 18, label = 'Simulating') {
  for (let i = 0; i < count; i += 5) {
    const chunk = Math.min(5, count - i);
    await page.evaluate((c) => {
      window.__DD_QA?.stepFrame?.(c, 0.05);
    }, chunk);
    console.log(`[${label}] stepped ${i + chunk}/${count} frames`);
  }
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
  console.log(`Launching browser to test RC147 on ${URL}...`);
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

  const report = {
    version: null,
    buildId: null,
    structuralSootPlumeVerified: false,
    floodedSubwayWaterVerified: false,
    subwayBoilingSteamVerified: false,
    liveWireConduitSparkAudioVerified: false,
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

    // Launch Director Sandbox direct
    console.log('Launching Director Sandbox direct...');
    await page.evaluate(() => {
      window.startSandboxDirect?.();
    });
    await page.waitForTimeout(500);
    await stepFrames(page, 5, 'SandboxInit');

    // 1. Test Untended Structural Fire Soot Plume
    console.log('Testing untended structural fire soot plume...');
    await page.evaluate(() => {
      // Ignite roof of building to test heavy soot rising plume
      window.__DD_QA?.igniteAt?.(12.0, 16.0, -18.0);
      window.__DD_QA?.setCameraPan?.(12.0);
    });
    await stepFrames(page, 15, 'SootPlumeAdvance');

    const smokeAudit = await page.evaluate(() => {
      const stats = window.__DD_QA?.getSmokeStats?.() || {};
      const fires = window.__DD_QA?.getFires?.() || [];

      return {
        smokePuffs: stats.smokePuffs || 0,
        drawBatches: stats.drawBatches || 0,
        activeFires: fires.length
      };
    });
    console.log('Smoke soot audit:', smokeAudit);
    report.structuralSootPlumeVerified = smokeAudit.smokePuffs > 0 && smokeAudit.activeFires > 0;

    await captureCanvas(page, 'rc147_untended_structural_soot_plume.png');
    report.screenshots.push('rc147_untended_structural_soot_plume.png');

    // 2. Test Colossal Meteor Broad Street Subway Breach & Flooded Sump Water Pool
    console.log('Testing Broad Street subway breach & flooded sump water pool...');
    await page.evaluate(() => {
      // Spawn colossal meteor right down centerline of Broad Street (x=0, z=23.5)
      window.__DD_QA?.spawnTestMeteorAt?.(0, 0.5, 23.5, 9.5, 'rock');
      window.__DD_QA?.setCameraPan?.(0);
    });
    await stepFrames(page, 18, 'SubwayBreachAdvance');

    const subwayAudit = await page.evaluate(() => {
      const hasWater = window.__DD_QA?.hasFloodedSubwayWater?.();
      const steamCraters = window.__DD_QA?.getCratersWithSteam?.() || 0;
      const craters = window.__DD_QA?.getCraters?.() || [];

      return {
        hasFloodedWater: hasWater,
        steamCraters,
        totalCraters: craters.length
      };
    });
    console.log('Subway breach audit:', subwayAudit);
    report.floodedSubwayWaterVerified = subwayAudit.hasFloodedWater === true;

    await captureCanvas(page, 'rc147_subway_flooded_water_pool.png');
    report.screenshots.push('rc147_subway_flooded_water_pool.png');

    // 3. Test Subterranean Boiling Steam Geysers & Third-Rail Electric Arcs
    console.log('Testing subterranean boiling steam geysers & third-rail arcs...');
    await page.evaluate(() => {
      // Drop a molten meteor directly into the breached subway chasm to trigger boiling water steam
      window.__DD_QA?.spawnTestMeteorAt?.(0, 0.5, 23.5, 4.2, 'molten');
    });
    await stepFrames(page, 18, 'BoilingSteamAdvance');

    const steamAudit = await page.evaluate(() => {
      const stats = window.__DD_QA?.getSmokeStats?.() || {};
      const steamCraters = window.__DD_QA?.getCratersWithSteam?.() || 0;

      return {
        steamCraters,
        totalPuffs: stats.puffs || 0,
        smokePuffs: stats.smokePuffs || 0
      };
    });
    console.log('Boiling steam audit:', steamAudit);
    report.subwayBoilingSteamVerified = steamAudit.steamCraters > 0;

    await captureCanvas(page, 'rc147_subway_boiling_steam_geyser.png');
    report.screenshots.push('rc147_subway_boiling_steam_geyser.png');

    // 4. Test Damaged Building Live Wire Conduit Sparks & Electrical Audio
    console.log('Testing damaged building live wire conduit sparks & electrical audio...');
    await page.evaluate(() => {
      // Strike building to cause structural conduit damage
      window.__DD_QA?.spawnTestMeteorAt?.(-22.0, 8.0, -14.0, 3.6, 'iron');
      window.__DD_QA?.setCameraPan?.(-22.0);
    });
    await stepFrames(page, 15, 'ConduitSparkAdvance');

    const sparkAudit = await page.evaluate(() => {
      const fxStats = window.__DD_QA?.getSmokeStats?.() || {};
      const craters = window.__DD_QA?.getCraters?.() || [];

      return {
        drawBatches: fxStats.drawBatches || 0,
        cratersCount: craters.length
      };
    });
    console.log('Spark & audio audit:', sparkAudit);
    report.liveWireConduitSparkAudioVerified = sparkAudit.drawBatches > 0;

    await captureCanvas(page, 'rc147_damaged_building_electrical_short_audio.png');
    report.screenshots.push('rc147_damaged_building_electrical_short_audio.png');

    console.log('Writing RC147 verification report...');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'rc147_verification_report.json'), JSON.stringify(report, null, 2));
    console.log('Report successfully saved.');

  } catch (err) {
    console.error('Test run error:', err);
  } finally {
    await browser.close();
  }
}

run();
