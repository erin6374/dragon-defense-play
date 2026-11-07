import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8765/');
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const expected = JSON.parse(await readFile('build-info.json', 'utf8'));
const report = {url: base.href, expected, errors: [], warnings: []};
await mkdir('qa-output', {recursive: true});
let browser, page;
const shot = name => page.screenshot({path: 'qa-output/' + name + '.png'});
try {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await fetch(new URL('build-info.json', base)).then(r => r.ok).catch(() => false)) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch({
    channel: process.env.QA_BROWSER_CHANNEL,
    executablePath: process.env.QA_BROWSER_EXECUTABLE,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage({viewport: {width: 1024, height: 576}, serviceWorkers: 'block'});
  page.setDefaultTimeout(90000);
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text());
    if (message.type() === 'warning') report.warnings.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) report.errors.push(response.status() + ' ' + response.url());
  });
  const snap = () => page.evaluate(() => window.__DD_QA.snap());
  await page.goto(new URL('?qa=1', base).href);
  await page.waitForFunction(() => window.__DD_QA?.snap().frameTimes.frames >= 2 &&
    window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady);
  report.startup = await snap();
  assert.equal(report.startup.version, expected.version);
  assert.equal(report.startup.build, expected.build);
  assert.ok(report.startup.scene.drawCalls > 0);
  await shot('01-startup');

  const views = await page.evaluate(() => window.__DD_QA.schoolComparison());
  assert.ok(views.ok, views.error);
  report.comparison = views.result.map(({name, metrics}) => ({name, metrics}));
  for (const {name, png} of views.result) {
    await writeFile('qa-output/school-' + name + '.png', Buffer.from(png.split(',')[1], 'base64'));
  }

  for (const view of ['front', 'corner', 'roof', 'left-side', 'right-side']) {
    const source = views.result.find(result => result.name === view + '-source-school').metrics;
    const game = views.result.find(result => result.name === view + '-game').metrics;
    assert.equal(game.triangles, source.triangles, view + ' source triangle count');
    assert.ok(game.drawCalls > 0 && game.drawCalls < source.drawCalls / 10, view + ' draw batching');
    for (const edge of ['min', 'max']) {
      for (let axis = 0; axis < 3; axis++) {
        assert.ok(Math.abs(game[edge][axis] - source[edge][axis]) < .001, view + ' source bounds');
      }
    }
  }
  assert.equal(report.startup.sourceSchool.visible, true);
  const exterior = await page.evaluate(() => window.__DD_QA.schoolExterior());
  assert.ok(exterior.ok, exterior.error);
  report.exterior = exterior.result;
  assert.deepEqual(report.exterior.slice(0, 4), Array(4).fill('school-brick'), 'outer masonry at former side gaps');
  assert.equal(report.exterior[4], null, 'rear stair opening remains clear');
  const damageViews = async label => {
    const capture = await page.evaluate(() => window.__DD_QA.schoolDamageView());
    assert.ok(capture.ok, capture.error);
    report[label] = capture.result.map(({name, metrics}) => ({name, metrics}));
    for (const {name, png} of capture.result) {
      await writeFile('qa-output/school-' + label + '-' + name + '.png', Buffer.from(png.split(',')[1], 'base64'));
    }
    return capture.result;
  };
  await page.locator('#graphics').selectOption('mobile');
  await page.locator('#start').click();
  await page.waitForFunction(() => window.__DD_QA.snap().active);
  await page.locator('#cinematic-skip').click();
  await page.locator('#cinematic-player').waitFor({state:'hidden'});
  await page.evaluate(() => window.__DD_QA.cinematicStage('quiet'));
  await shot('02-playing');
  await page.locator('canvas').first().screenshot({path:'qa-output/02-playing-scene.png'});
  report.browser = browser.version();
  const before = await snap();
  await page.keyboard.down('KeyD');
  try {
    await page.waitForFunction(x => window.__DD_QA.snap().dragon.x > x + 4, before.dragon.x);
  } finally {
    await page.keyboard.up('KeyD');
  }
  await page.waitForFunction(() => window.__DD_QA.snap().dragon.z > 12);
  await page.evaluate(() => window.__DD_QA.move(57, 12));
  await page.waitForFunction(() => window.__DD_QA.snap().camera.scroll > 15);
  const right = await snap();
  await shot('03-pan-right');
  await page.evaluate(() => window.__DD_QA.move(-57, 12));
  await page.waitForFunction(() => window.__DD_QA.snap().camera.scroll < -15);
  const left = await snap();
  await shot('04-pan-left');
  for (const {camera} of [right, left]) {
    assert.ok(Math.abs(camera.skylineOffset - camera.scroll * .62) < .01);
    assert.equal(camera.perspective, true);
    assert.ok(Math.abs(camera.foregroundOffset + camera.scroll * .035) < .01);
    assert.deepEqual(camera.streetOrigins, before.camera.streetOrigins, 'street and neighborhood stay anchored during pans');
  }
  report.movement = {before: before.dragon, right: right.camera, left: left.camera};
  await page.waitForFunction(n => window.__DD_QA.snap().frameTimes.frames >= n + 15, left.frameTimes.frames);
  report.performance = await page.evaluate(() => ({
    live: window.__DD_GAME_METRICS, frameHealth: window.__DD_FRAME_HEALTH.summary(),
    scene: window.__DD_QA.snap().scene,
  }));
  assert.ok(report.performance.live?.fps > 0);

  await page.evaluate(() => window.__DD_QA.move(0, 12));
  await page.waitForFunction(() => window.__DD_QA.snap().camera.scroll === 0);
  const intact = await damageViews('intact');
  const staged = await page.evaluate(() => window.__DD_QA.stageSchoolMeteor());
  assert.ok(staged.ok, staged.error);
  await page.waitForFunction(() => window.__DD_QA.snap().sourceSchool.strikes === 1);
  report.impact = await snap();
  assert.ok(report.impact.schoolDamage > 0);
  assert.ok(report.impact.schoolReconstruction.damaged > 0);
  assert.ok(report.impact.schoolReconstruction.detached > 0);
  assert.equal(report.impact.sourceSchool.visible, true);
  await shot('05-school-impact');
  const partial = await damageViews('partial');
  const visualChange = await page.evaluate(async ([before, after]) => {
    const canv = document.createElement('canvas');
    const ctx = canv.getContext('2d', {willReadFrequently: true});
    const decode = async png => {
      const img = new Image();
      img.src = png;
      await img.decode();
      canv.width = img.width;
      canv.height = img.height;
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, img.width, img.height).data;
    };
    const a = await decode(before), b = await decode(after);
    let changed = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]) > 30) changed++;
    }
    return changed / (a.length / 4);
  }, [intact[0].png, partial[0].png]);
  report.partialChangedFraction = visualChange;
  assert.ok(visualChange > .0003 && visualChange < .15, 'impact changes a localized visible area');
  assert.ok(report.impact.schoolReconstruction.attached > report.impact.schoolReconstruction.detached);
  assert.ok(report.impact.schoolReconstruction.byMaterial.glass > 0);
  assert.ok(report.impact.schoolReconstruction.byMaterial.facade > 0);
  const collapse = await page.evaluate(() => window.__DD_QA.hitSchool(100));
  assert.ok(collapse.ok, collapse.error);
  report.collapse = collapse.result;
  assert.equal(report.collapse.sourceSchool.visible, false);
  assert.equal(report.collapse.schoolReconstruction.collapsing, true);
  assert.equal(report.collapse.schoolDamage, 1);
  assert.equal(report.collapse.active, false);
  assert.equal(report.collapse.schoolReconstruction.attached, 0);
  // Exercise the production update loop at fixed simulation steps. CI software
  // rendering can take several wall-clock seconds to produce a single frame.
  const settle = await page.evaluate(() => {
    const qa = window.__DD_QA;
    for (let i = 0; i < 20; i++) {
      const step = qa.motionStep(.25);
      if (!step.ok) return step;
    }
    return {ok: true, result: qa.snap()};
  });
  assert.ok(settle.ok, settle.error);
  assert.equal(settle.result.schoolReconstruction.falling, 0, 'collapse settles within five simulation seconds');
  report.settled = await snap();
  assert.equal(report.settled.schoolReconstruction.rubble, report.settled.schoolReconstruction.parts);
  assert.ok(Object.values(report.settled.schoolReconstruction.byMaterial).every(count => count > 0));
  const rubble = await damageViews('total-collapse');
  for (const [index, {metrics}] of rubble.entries()) {
    assert.ok(intact[index].metrics.upperPixels > 100, 'intact silhouette visible');
    if (rubble[index].name !== 'corner-damage') {
      assert.equal(metrics.upperPixels, 0, 'no standing silhouette above mid-building');
    }
    assert.ok(metrics.max[1] > 0 && metrics.max[1] < 1, 'visible rubble is below one game unit');
    assert.ok(metrics.triangles > 0, 'rubble remains in the rendered scene');
  }
  await page.waitForFunction(frames => window.__DD_QA.snap().frameTimes.frames >= frames + 2,
    report.settled.frameTimes.frames);
  assert.equal((await snap()).schoolReconstruction.rubble, report.settled.schoolReconstruction.rubble);
  const reset = await page.evaluate(() => window.__DD_QA.start(1));
  assert.ok(reset.ok, reset.error);
  assert.deepEqual(reset.result.sourceSchool, {visible: true, strikes: 0});
  assert.equal(reset.result.schoolReconstruction.damaged, 0);
  const dusk = await page.evaluate(() => {
    const qa = window.__DD_QA;
    qa.start(4);
    qa.cinematicStage('quiet');
    qa.move(-29, 34);
    return qa.qaSettleAtmosphere();
  });
  assert.ok(dusk.ok, dusk.error);
  const duskFrames = (await snap()).frameTimes.frames;
  await page.waitForFunction(n => window.__DD_QA.snap().frameTimes.frames > n, duskFrames);
  report.dusk = dusk.result;
  await shot('06-north-broad-dusk');
  await page.locator('canvas').first().screenshot({path:'qa-output/06-dusk-scene.png'});
  const towerImpact = await page.evaluate(() => window.__DD_QA.stageSkylineStrike());
  assert.ok(towerImpact.ok, towerImpact.error);
  assert.equal(towerImpact.result.landmark, 'comcast-technology');
  assert.ok(towerImpact.result.afterDamage > towerImpact.result.beforeDamage, 'individual tower strike adds visual damage');
  assert.equal(towerImpact.result.flashVisible, true, 'landmark impact flash is displayed');
  assert.ok(towerImpact.result.flashOpacity > 0, 'landmark impact flash has positive opacity');
  assert.equal(towerImpact.result.smokeVisible,true,'landmark smoke remains visible after impact');
  assert.ok(towerImpact.result.smokeOpacity>0,'landmark smoke has positive opacity');
  assert.equal(towerImpact.result.scorchVisible,true,'meteor impact leaves a visible facade mark');
  assert.ok(towerImpact.result.scorchOpacity>0,'facade damage mark has positive opacity');
  assert.ok(towerImpact.result.worldPosition?.every(Number.isFinite), 'landmark impact position is finite');
  report.landmarkImpact = towerImpact.result;
  await shot('06-landmark-strike');
  const skylineCollapse=await page.evaluate(()=>window.__DD_QA.stageSkylineCollapse());
  assert.ok(skylineCollapse.ok,skylineCollapse.error);
  assert.ok(skylineCollapse.result.collapse>0,'skyscraper collapse advances');
  assert.equal(skylineCollapse.result.ruinVisible,true,'skyscraper rubble remains rendered');
  assert.equal(skylineCollapse.result.rubbleDetached,true,'rubble stays outside animated tower group');
  assert.equal(skylineCollapse.result.rubbleGroundY,0,'rubble stays grounded');
  assert.equal(skylineCollapse.result.slabs,3,'three persistent facade slabs per skyline tower');
  assert.ok(skylineCollapse.result.slabY.every(v=>v>=0),'fallen facade slabs stay above ground');
  assert.equal(skylineCollapse.result.fallActive,true,'facade fall simulation is triggered');
  for(let i=0;i<skylineCollapse.result.slabY.length;i++){
   assert.ok(Math.abs(skylineCollapse.result.slabY[i]-skylineCollapse.result.slabReleaseY[i])<.001,
    'facade section begins at its release height, not at the ground');
   assert.ok(skylineCollapse.result.slabY[i]>skylineCollapse.result.slabGroundY[i],
    'facade section has a positive falling distance');
  }
  const falling=await page.evaluate(()=>window.__DD_QA.advanceSkylineFall(.45));
  assert.ok(falling.ok,falling.error);
  assert.ok(falling.result.slabY.some((v,i)=>v>falling.result.groundY[i]+.01),'facade sections visibly pass through a falling state');
  const settledSkyline=await page.evaluate(()=>window.__DD_QA.advanceSkylineFall(4));
  assert.ok(settledSkyline.ok,settledSkyline.error);
  for(let i=0;i<settledSkyline.result.slabY.length;i++)
   assert.ok(Math.abs(settledSkyline.result.slabY[i]-settledSkyline.result.groundY[i])<.001,'facade section settles onto ground');
  report.skylineCollapse={...skylineCollapse.result,falling:falling.result,settled:settledSkyline.result};
  await shot('06-landmark-collapse');
  await page.evaluate(()=>{window.__DD_QA.start(7);window.__DD_QA.cinematicStage('quiet');return window.__DD_QA.qaSettleAtmosphere();});
  const skylineReset=await page.evaluate(()=>window.__DD_QA.skylineFallState());
  assert.ok(skylineReset.ok,skylineReset.error);
  assert.equal(skylineReset.result.fallActive,false,'restart resets skyline falling state');
  assert.equal(skylineReset.result.ruinVisible,false,'restart hides skyline rubble');
  report.skylineReset=skylineReset.result;
  const traffic=await page.evaluate(()=>window.__DD_QA.stageTrafficLighting());
  assert.ok(traffic.ok,traffic.error);
  assert.equal(traffic.result.dayVisible,false,'headlight road pool stays off during day');
  assert.equal(traffic.result.nightVisible,true,'headlight road pool lights at night');
  assert.ok(traffic.result.strength>0&&traffic.result.strength<=.24);
  report.vehicleLighting=traffic.result;
  const nightFrame=(await snap()).frameTimes.frames;
  await page.waitForFunction(n=>window.__DD_QA.snap().frameTimes.frames>n,nightFrame);
  await shot('07-vehicle-lighting');
  await page.locator('canvas').first().screenshot({path:'qa-output/07-night-scene.png'});
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = String(error.stack ?? error);
  await page?.screenshot({path: 'qa-output/failure.png', timeout: 10000}).catch(() => {});
  throw error;
} finally {
  await writeFile('qa-output/report.json', JSON.stringify(report, null, 2));
  await browser?.close();
}
