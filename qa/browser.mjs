import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {groundWindWeight,groundWindStep} from '../src/simulation/ground-wind.js';
import {Script} from 'node:vm';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8765/');
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const expected = JSON.parse(await readFile('build-info.json', 'utf8'));
const launchHtml = await readFile('index.html', 'utf8');
const launchCmd = await readFile('PLAY-PREVIEW.cmd', 'utf8');
const gameSource = await readFile('src/game.js', 'utf8');
// Touch drags already reach the universal pointermove listener. A second
// touch-specific listener used to raycast the same event twice.
assert.equal((gameSource.match(/renderer\.domElement\.addEventListener\('pointermove'/g) ?? []).length, 1,
  'only one pointermove listener should aim the dragon');
// Fast fail for malformed inline startup scripts, before expensive WebGL QA.
// A stray literal \\n between JavaScript statements previously reached the
// end of a multi-minute browser run before its SyntaxError was reported.
for(const [index, script] of Array.from(launchHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)).entries()){
 const attrs=script[1];
 if(/\bsrc\s*=|\btype\s*=\s*["'](?:importmap|application\/json)/i.test(attrs))continue;
 if(!script[2].trim())continue;
 try { new Script(script[2],{filename:'index.html:inline-script-'+index}); }
 catch(error){throw new Error('Inline startup script has invalid JavaScript: '+error.message,{cause:error});}
}
// Guard against the common Windows file:// launch failure and stale startup
// guidance. Browser QA still uses HTTP to exercise actual module loading.
assert.match(launchHtml, /"three":"\.\/vendor\/three\/build\/three\.module\.js"/);
assert.ok(!launchHtml.includes('Check the browser console (F12), internet access to cdn.jsdelivr.net'),
  'startup message must not point to an obsolete external CDN');
assert.ok(launchHtml.includes("location.protocol==='file:'"),
  'startup message must explain direct-file CORS failures');
assert.ok(launchCmd.includes('python') && launchCmd.includes('8769') && launchCmd.includes('http.server'),
  'Windows preview launcher must start the expected HTTP server');
// Deterministic ground-target wind checks. These exercise the same pure
// response functions used by the live vehicle/pedestrian wind loops.
const pushWeights={
 bike:groundWindWeight({bike:true}),
 sedan:groundWindWeight({}),
 van:groundWindWeight({van:true}),
 truck:groundWindWeight({truck:true}),
 bus:groundWindWeight({bus:true}),
 fireTruck:groundWindWeight({fireTruck:true})
};
assert.ok(pushWeights.bike>pushWeights.sedan&&pushWeights.sedan>pushWeights.van
 &&pushWeights.van>pushWeights.truck&&pushWeights.truck>pushWeights.bus,
 'wind pushes smaller ground vehicles further than heavier vehicles');
assert.ok(pushWeights.fireTruck<=pushWeights.bus,
 'emergency fire trucks resist wind like other large vehicles');
const push=(x,z,weight)=>groundWindStep(x,1,z,0,1,20,1,0,0,weight,.05);
assert.ok(push(15,20,1.2)>push(15,20,pushWeights.bike)
 &&push(15,20,pushWeights.bike)>push(15,20,pushWeights.bus),
 'pedestrians shift more than bikes, and buses shift least');
assert.equal(push(-10,20,1.2),0,'ground objects behind the dragon are not pushed');
assert.equal(push(55,20,1.2),0,'wind has finite reach');
assert.equal(push(15,60,1.2),0,'ground objects far outside the cone are unaffected');
assert.ok(push(15,20,1.2)>.001,'a nearby pedestrian receives a visible gentle push');
const report = {url: base.href, expected, errors: [], warnings: []};
await mkdir('qa-output', {recursive: true});
let browser, page;
const shot = name => page.screenshot({path: 'qa-output/' + name + '.png'});
// Capture the geometry-based skyline unobstructed by playable foreground or HUD.
// These are actual renderer pixels, not synthetic screenshots.
const skylineShot = async (name, detail=false) => {
  const capture = await page.evaluate(close => window.__DD_QA.captureSkyline(close),detail);
  assert.ok(capture.ok, capture.error);
  const png = capture.result.png;
  assert.ok(png.startsWith('data:image/png;base64,'), 'Skyline capture is a rendered PNG');
  await writeFile('qa-output/' + name + '.png', Buffer.from(png.split(',')[1], 'base64'));
  return capture.result.camera;
};
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
  // Exercise actual touch-pointer dispatch, not just a source-code assertion.
  const touchAim = await page.evaluate(() => {
    const canvas=document.querySelector('canvas');
    const rect=canvas.getBoundingClientRect();
    const move=at => {
      canvas.dispatchEvent(new PointerEvent('pointermove', {
        bubbles:true,pointerType:'touch',buttons:1,
        clientX:rect.left+rect.width*at,clientY:rect.top+rect.height*.5
      }));
      return {...window.__DD_QA.snap().aim};
    };
    return {left:move(.15),right:move(.85)};
  });
  assert.ok(Number.isFinite(touchAim.left.x)&&Number.isFinite(touchAim.right.x),
    'touch pointer raycast must yield finite coordinates');
  assert.ok(touchAim.left.x<touchAim.right.x,'touch drag must move the aim point horizontally');
  assert.ok([touchAim.left,touchAim.right].every(p=>p.x>=-94&&p.x<=94&&p.y>=2&&p.y<=64&&p.z===0),
    'touch aim must remain in the gameplay clamp bounds');
  report.touchAim=touchAim;

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
  report.skylineCamera=await skylineShot('06-skyline-intact');
  const intactEmission=await page.evaluate(()=>window.__DD_QA.sampleSkylineEmissive());
  assert.ok(intactEmission.ok,intactEmission.error);
  assert.equal(intactEmission.result.collapse,0,'intact skyline tower has no structural collapse');
  const intactValues=intactEmission.result.samples.map(s=>s.emissive);
  assert.ok(intactValues.every(Number.isFinite),'intact skyline emission is finite');
  assert.ok(intactValues[0]>0,'dusk skyline has nonzero emissive windows');
  assert.ok(Math.max(...intactValues)-Math.min(...intactValues)<1e-10,
   'intact tower emissive windows stay steady across animation times');
  report.intactSkylineEmission=intactEmission.result;
  const towerImpact = await page.evaluate(() => window.__DD_QA.stageSkylineStrike());
  assert.ok(towerImpact.ok, towerImpact.error);
  assert.equal(towerImpact.result.landmark, 'comcast-technology');
  assert.ok(towerImpact.result.afterDamage > towerImpact.result.beforeDamage, 'individual tower strike adds visual damage');
  assert.equal(towerImpact.result.flashVisible, true, 'landmark impact flash is displayed');
  assert.equal(towerImpact.result.flashParentStable,true,
   'impact flash is independent of shrinking tower');
  assert.ok(towerImpact.result.flashWorldPosition.every(Number.isFinite),
   'impact flash has a finite world-space contact position');
  assert.ok(Math.hypot(...towerImpact.result.flashWorldPosition.map((v,i)=>v-towerImpact.result.worldPosition[i]))<1e-4,
   'impact flash appears exactly at the reported meteor contact position');
  assert.ok(towerImpact.result.flashOpacity > 0, 'landmark impact flash has positive opacity');
  assert.equal(towerImpact.result.smokeVisibleImmediately,true,
   'landmark smoke is visible during the impact event, before the next animation update');
  assert.equal(towerImpact.result.smokeVisible,true,'landmark smoke remains visible after impact');
  assert.ok(towerImpact.result.smokeOpacity>0,'landmark smoke has positive opacity');
  assert.equal(towerImpact.result.smokeParentStable,true,'meteor smoke is independent of shrinking tower');
  assert.ok(towerImpact.result.smokeWorldScale.every(v=>v>0),'intact smoke has nonzero world scale');
  assert.equal(towerImpact.result.scorchVisible,true,'meteor impact leaves a visible facade mark');
  assert.ok(towerImpact.result.scorchOpacity>0,'facade damage mark has positive opacity');
  assert.ok(towerImpact.result.worldPosition?.every(Number.isFinite), 'landmark impact position is finite');
  report.landmarkImpact = towerImpact.result;
  await shot('06-landmark-strike');
  await skylineShot('06-skyline-strike');
  const skylineCollapse=await page.evaluate(()=>window.__DD_QA.stageSkylineCollapse());
  assert.ok(skylineCollapse.ok,skylineCollapse.error);
  assert.ok(skylineCollapse.result.collapse>0,'skyscraper collapse advances');
  assert.equal(skylineCollapse.result.smokeParentStable,true,'smoke remains outside collapse transform');
  assert.equal(skylineCollapse.result.flashParentStable,true,
   'meteor flash stays outside collapse transform');
  for(let i=0;i<3;i++){
   assert.ok(Number.isFinite(skylineCollapse.result.flashWorldBefore[i])&&
     Number.isFinite(skylineCollapse.result.flashWorldAfter[i]),
     'meteor flash world position remains finite across structural collapse');
   assert.ok(Math.abs(skylineCollapse.result.flashWorldAfter[i]-
     skylineCollapse.result.flashWorldBefore[i])<1e-5,
     'meteor flash remains fixed at the contact point while tower shrinks');
  }
  assert.equal(skylineCollapse.result.smokeVisible,true,'smoke persists during structural collapse');
  for(let i=0;i<3;i++){
   assert.ok(Number.isFinite(skylineCollapse.result.smokeWorldBefore[i])&&
     Number.isFinite(skylineCollapse.result.smokeWorldAfter[i]),
     'smoke world position remains finite across structural collapse');
   assert.ok(Math.abs(skylineCollapse.result.smokeWorldAfter[i]-
     skylineCollapse.result.smokeWorldBefore[i])<1e-5,
     'smoke stays anchored in skyline world space during tower shrink');
  }
  for(let i=0;i<3;i++)assert.ok(Math.abs(skylineCollapse.result.smokeWorldScale[i]-towerImpact.result.smokeWorldScale[i])<.001,'smoke world scale does not shrink with tower');
  const damagedEmission=await page.evaluate(()=>window.__DD_QA.sampleSkylineEmissive());
  assert.ok(damagedEmission.ok,damagedEmission.error);
  assert.ok(damagedEmission.result.collapse>0,'damaged skyline tower has structural collapse');
  const damagedValues=damagedEmission.result.samples.map(s=>s.emissive);
  assert.ok(damagedValues.every(Number.isFinite),'damaged skyline emission stays finite');
  assert.ok(Math.max(...damagedValues)-Math.min(...damagedValues)>.002,
   'damaged tower retains irregular electrical flicker');
  report.damagedSkylineEmission=damagedEmission.result;
  assert.equal(skylineCollapse.result.ruinVisible,true,'skyscraper rubble remains rendered');
  assert.equal(skylineCollapse.result.rubbleDetached,true,'rubble stays outside animated tower group');
  assert.equal(skylineCollapse.result.rubbleGroundY,0,'rubble stays grounded');
  assert.equal(skylineCollapse.result.slabs,3,'three persistent facade slabs per skyline tower');
  assert.deepEqual(skylineCollapse.result.slabMaterialGroups,[2,2,2],'one opaque side group and one textured front group per slab');
  assert.deepEqual(skylineCollapse.result.slabFaceMaterialCounts,[2,2,2],'facade fragment material array uses two finishes');
  assert.deepEqual(skylineCollapse.result.slabIndexCounts,[36,36,36],'optimized geometry retains all six faces');
  assert.ok(skylineCollapse.result.slabY.every(v=>v>=0),'fallen facade slabs stay above ground');
  assert.equal(skylineCollapse.result.fallActive,true,'facade fall simulation is triggered');
  for(let i=0;i<skylineCollapse.result.slabY.length;i++){
   assert.ok(Math.abs(skylineCollapse.result.slabY[i]-skylineCollapse.result.slabReleaseY[i])<.001,
    'facade section begins at its release height, not at the ground');
   assert.ok(skylineCollapse.result.slabY[i]>skylineCollapse.result.slabGroundY[i],
    'facade section has a positive falling distance');
  }
  await skylineShot('06-skyline-release');
  const falling=await page.evaluate(()=>window.__DD_QA.advanceSkylineFall(.45));
  assert.ok(falling.ok,falling.error);
  assert.ok(falling.result.slabY.some((v,i)=>v>falling.result.groundY[i]+.01),'facade sections visibly pass through a falling state');
  await skylineShot('06-skyline-falling');
  const settledSkyline=await page.evaluate(()=>window.__DD_QA.advanceSkylineFall(4));
  assert.ok(settledSkyline.ok,settledSkyline.error);
  for(let i=0;i<settledSkyline.result.slabY.length;i++)
   assert.ok(Math.abs(settledSkyline.result.slabY[i]-settledSkyline.result.groundY[i])<.001,'facade section settles onto ground');
  const smokeBeforeIdle=await page.evaluate(()=>window.__DD_QA.skylineFallState());
  assert.ok(smokeBeforeIdle.ok,smokeBeforeIdle.error);
  assert.ok(smokeBeforeIdle.result.smokeWorldPosition.every(Number.isFinite),
   'persistent smoke has a finite world position after debris settles');
  await skylineShot('06-skyline-rubble');
  // Once all slabs reach their supported ground poses, subsequent frames
  // should not continue recomputing transforms for motionless rubble.
  const idleSkyline=await page.evaluate(()=>window.__DD_QA.advanceSkylineFall(2));
  assert.ok(idleSkyline.ok,idleSkyline.error);
  assert.equal(idleSkyline.result.fallElapsed,settledSkyline.result.fallElapsed,
   'settled skyline fall simulation stops advancing elapsed time');
  assert.deepEqual(idleSkyline.result.slabY,settledSkyline.result.slabY,
   'settled skyline rubble remains fixed on the ground');
  // A short impact flash should be gone after the simulated collapse,
  // but persistent smoke, scorch and rubble should still be visible.
  const aftermath=await page.evaluate(()=>window.__DD_QA.skylineFallState());
  assert.ok(aftermath.ok,aftermath.error);
  assert.equal(aftermath.result.impactVisible,false,
   'short-lived skyline flash expires after several seconds');
  assert.equal(aftermath.result.smokeVisible,true,
   'impact smoke persists after the flash expires');
  assert.ok(aftermath.result.smokeWorldPosition.every(Number.isFinite),
   'persistent smoke position remains finite over time');
  const smokeMotion=Math.hypot(...aftermath.result.smokeWorldPosition.map((v,i)=>
   v-smokeBeforeIdle.result.smokeWorldPosition[i]));
  assert.ok(smokeMotion>.001&&smokeMotion<4,
   'smoke drifts gently but does not teleport after the flash expires');
  assert.equal(aftermath.result.scorchVisible,true,
   'facade scorch persists after the flash expires');
  assert.equal(aftermath.result.ruinVisible,true,
   'collapsed skyscraper rubble persists after the flash expires');
  report.skylineAftermath=aftermath.result;
  report.skylineCollapse={...skylineCollapse.result,falling:falling.result,settled:settledSkyline.result,idle:idleSkyline.result};
  await skylineShot('06-skyline-smoke-aftermath');
  report.skylineDetailCamera=await skylineShot('06-skyline-close-aftermath',true);
  await shot('06-landmark-collapse');
  await page.evaluate(()=>{window.__DD_QA.start(7);window.__DD_QA.cinematicStage('quiet');return window.__DD_QA.qaSettleAtmosphere();});
  const skylineReset=await page.evaluate(()=>window.__DD_QA.skylineFallState());
  assert.ok(skylineReset.ok,skylineReset.error);
  assert.equal(skylineReset.result.fallActive,false,'restart resets skyline falling state');
  assert.equal(skylineReset.result.ruinVisible,false,'restart hides skyline rubble');
  report.skylineReset=skylineReset.result;
  // A series of background meteor hits must be able to damage the distant
  // city independently; foreground school/neighborhood health is unaffected.
  const impactCascade=await page.evaluate(()=>{
    const qa=window.__DD_QA, hpBefore=qa.snap().hp;
    let hit;
    const smokeSamples=[],impactSamples=[];
    for(let i=0;i<6;i++){
      hit=qa.stageSkylineStrike();
      if(!hit.ok)return hit;
      smokeSamples.push({opacity:hit.result.smokeOpacity,scale:hit.result.smokeWorldScale[0]});
      impactSamples.push({world:hit.result.worldPosition,
        flash:hit.result.flashWorldPosition,
        flashParentStable:hit.result.flashParentStable,
        flashVisible:hit.result.flashVisible,
        flashScaleImmediately:hit.result.flashScaleImmediately,
        expectedPre:hit.result.expectedPreDamageWorld,
        post:hit.result.postDamageImpactWorld});
    }
    const state=qa.skylineFallState();
    if(!state.ok)return state;
    return {ok:true,result:{hits:6,strikeDamage:hit.result.afterDamage,
      fallActive:state.result.fallActive,ruinVisible:state.result.ruinVisible,
      smokeSamples,impactSamples,hpBefore,hpAfter:qa.snap().hp}};
  });
  assert.ok(impactCascade.ok,impactCascade.error);
  assert.ok(impactCascade.result.strikeDamage>=.40,'repeated skyline hits accumulate independent tower damage');
  assert.equal(impactCascade.result.smokeSamples.length,6,'each distant strike captures smoke state');
  // An impact can itself trigger collapse. Its explosion must stay at the
  // pre-damage contact point, not follow the newly shrunken facade.
  const impacts=impactCascade.result.impactSamples;
  assert.equal(impacts.length,6,'all distant strikes capture world-space impact positions');
  // Check every strike, not only the first. Late hits can trigger a
  // facade shrink, so the visible sprite must still match the returned burst.
  const distance=(a,b)=>Math.hypot(...a.map((v,j)=>v-b[j]));
  for(let i=0;i<impacts.length;i++){
   const hit=impacts[i];
   assert.equal(hit.flashParentStable,true,'meteor flash remains outside tower transform on strike '+(i+1));
   assert.equal(hit.flashVisible,true,'meteor flash remains visible on strike '+(i+1));
   assert.ok(Math.abs(hit.flashScaleImmediately-5)<1e-6,
    'each new meteor flash resets to its initial radius before animation on strike '+(i+1));
   assert.ok(hit.flash&&hit.world&&hit.flash.every(Number.isFinite),
    'meteor flash and explosion coordinates are finite on strike '+(i+1));
   assert.ok(distance(hit.flash,hit.world)<1e-4,
    'visible meteor flash matches returned contact position on strike '+(i+1));
  }
  let movedFacade=false;
  for(let i=1;i<impacts.length;i++){
   const hit=impacts[i];
   assert.ok(hit.expectedPre&&hit.world&&hit.post,'subsequent strikes expose contact positions');
   assert.ok(distance(hit.world,hit.expectedPre)<1e-4,
    'cinematic explosion remains anchored to pre-collapse contact point on strike '+(i+1));
   if(distance(hit.post,hit.expectedPre)>.1)movedFacade=true;
  }
  assert.equal(movedFacade,true,'cascade includes a facade transform that would displace a late explosion');
  for(let i=1;i<impactCascade.result.smokeSamples.length;i++){
   const before=impactCascade.result.smokeSamples[i-1];
   const after=impactCascade.result.smokeSamples[i];
   assert.ok(after.opacity>=before.opacity-1e-6,'smoke opacity increases only when damage grows');
   assert.ok(after.scale>=before.scale-1e-6,'smoke width increases only when damage grows');
  }
  assert.ok(impactCascade.result.smokeSamples[1].scale>impactCascade.result.smokeSamples[0].scale,
   'additional impact visibly thickens plume');
  assert.equal(impactCascade.result.fallActive,true,'repeated skyline hits start tower breakup');
  assert.equal(impactCascade.result.ruinVisible,true,'repeated skyline hits reveal persistent debris');
  assert.equal(impactCascade.result.hpAfter,impactCascade.result.hpBefore,'background strikes do not harm player block');
  report.skylineImpactCascade=impactCascade.result;
  await skylineShot('06-skyline-impact-cascade');
  // Restart after the independent six-hit collapse: no old fire/smoke, impact
  // flash, scorch or rubble may leak into a new level. This is deliberately
  // after the prior fall assertions so the staged scenarios cannot interfere.
  const afterCascadeRestart=await page.evaluate(()=>{
    const qa=window.__DD_QA, restarted=qa.start(7);
    if(!restarted.ok)return restarted;
    qa.cinematicStage('quiet');
    return qa.skylineFallState();
  });
  assert.ok(afterCascadeRestart.ok,afterCascadeRestart.error);
  assert.equal(afterCascadeRestart.result.strikeDamage,0,'restart clears accumulated distant strikes');
  assert.equal(afterCascadeRestart.result.collapse,0,'restart restores skyline structural state');
  assert.equal(afterCascadeRestart.result.towerScaleY,1,'restart restores intact tower height');
  assert.equal(afterCascadeRestart.result.fallActive,false,'restart stops tower fall animation');
  assert.equal(afterCascadeRestart.result.ruinVisible,false,'restart removes tower rubble');
  assert.equal(afterCascadeRestart.result.impactVisible,false,'restart clears meteor flash');
  assert.equal(afterCascadeRestart.result.smokeVisible,false,'restart clears persistent impact smoke');
  assert.equal(afterCascadeRestart.result.scorchVisible,false,'restart clears facade scorch');
  report.skylineAfterCascadeRestart=afterCascadeRestart.result;
  await skylineShot('06-skyline-after-restart');
  // Long sessions previously let the westbound skyline helicopter leave its
  // patrol because JavaScript's % returns negative remainders after ~5 min.
  const heliPatrol=await page.evaluate(()=>window.__DD_QA.sampleDistantHelicopters());
  assert.ok(heliPatrol.ok,heliPatrol.error);
  assert.deepEqual(heliPatrol.result.map(s=>s.seconds),[0,300,600,1200]);
  for(const sample of heliPatrol.result){
   assert.equal(sample.helicopters.length,3,'all distant helicopters remain present');
   for(const h of sample.helicopters){
    const baseX=-82+h.index*55;
    assert.ok(Number.isFinite(h.x)&&Number.isFinite(h.y),'helicopter position stays finite');
    assert.ok(h.x>=baseX-82-1e-6&&h.x<=baseX+88+1e-6,
     'distant helicopter '+h.index+' remains within its 170-unit patrol at '+sample.seconds+' seconds');
   }
  }
  report.distantHelicopterPatrol=heliPatrol.result;
  const groundWind=await page.evaluate(()=>window.__DD_QA.stageGroundWind());
  assert.ok(groundWind.ok,groundWind.error);
  assert.ok(groundWind.result.personX>groundWind.result.bikeX,
   'pedestrian is pushed more than a lightweight bike');
  assert.ok(groundWind.result.bikeX>groundWind.result.busX,
   'lightweight bike is pushed more than a large bus');
  assert.ok(groundWind.result.busX>12,'large vehicle receives only a small nudge');
  assert.ok(groundWind.result.personX<12.5,'pedestrian gust shift remains gentle');
  assert.ok(groundWind.result.dustInstances>0&&groundWind.result.dustInstances<=44,
   'visible bounded dust batch responds to the dragon gust');
  assert.ok(groundWind.result.litterInstances>0&&groundWind.result.litterInstances<=16,
   'small ground debris particles move with the gust');
  assert.ok(groundWind.result.smokeWindStrength>0,
   'building smoke receives gust-driven lean and fade');
  assert.ok(groundWind.result.puffX>12,
   'street-level smoke puffs visibly shift downwind');
  assert.ok(groundWind.result.puffOpacity>0&&groundWind.result.puffOpacity<.58,
   'wind disperses and slightly reduces smoke density');
  report.groundWind=groundWind.result;
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
  assert.deepEqual(report.warnings, [], 'preview must not produce WebGL/material console warnings');
  // The main game runs a perpetual WebGL animation loop. Release its software
  // renderer before starting Paulo Lab to keep the two QA scenes independent.
  await page.close();
  // Separate design lab: do not alter the playable dragon or simulation.
  const lab=await browser.newPage({viewport:{width:1280,height:800}});
  const labErrors=[];
  lab.on('pageerror',e=>labErrors.push(String(e)));
  try{
    const labUrl=new URL('dragon-lab/',base).href;
    // Software WebGL can saturate the CI runner: navigation must not depend on
    // DOMContentLoaded while the module initializes its procedural rig.
    const response=await lab.goto(labUrl,{waitUntil:'commit',timeout:30000});
    assert.equal(response.status(),200,'standalone dragon design lab responds');
    await lab.waitForFunction(()=>!!window.__PAULO_LAB_QA?.snapshot,
      null,{timeout:90000,polling:500});
    const initial=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
    assert.ok(initial.visible,'lab renderer is visible');
    assert.ok(initial.wingAngles.length===2,'dragon has two articulated wing assemblies');
    const membrane=await lab.evaluate(()=>({panels:window.__PAULO_LAB_QA.membranePanels,
      vertices:window.__PAULO_LAB_QA.membraneVertices}));
    assert.equal(membrane.panels,10,'two wings each have five membrane panels');
    assert.equal(await lab.evaluate(()=>window.__PAULO_LAB_QA.armorPlateCount),66,
      'dragon dorsal scales share one preallocated instanced armor batch');
    assert.deepEqual(await lab.evaluate(()=>window.__PAULO_LAB_QA.fangCounts),[12,12],
      'upper and articulated lower jaws each use one preallocated 12-fang batch');
    assert.ok(membrane.vertices>=900,
      'curved membrane panels are tessellated rather than single triangles');
    await lab.evaluate(()=>window.__PAULO_LAB_QA.setState('hover'));
    await lab.waitForTimeout(150);
    const deform=await lab.evaluate(()=>window.__PAULO_LAB_QA.membraneDeformation());
    assert.ok(Number.isFinite(deform.current)&&Math.abs(deform.current-deform.rest)>.005,
      'animated wing membranes deform an interior vertex while retaining the rest buffer');
    const poses=await lab.evaluate(()=>window.__PAULO_LAB_QA.states);
    assert.ok(poses.length>=12,'dragon has twelve animation reference poses');
    const fire=await lab.evaluate(()=>{window.__PAULO_LAB_QA.setState('fire');return window.__PAULO_LAB_QA.snapshot();});
    assert.ok(fire.jawAngle<-.2,'fire animation opens the jaw');
    assert.deepEqual(fire.breath,{active:'fire',poolSize:24,drawnInstances:24,visibleEmitters:1},
      'fire pose displays one pooled breath emitter');
    const wind=await lab.evaluate(()=>{window.__PAULO_LAB_QA.setState('wind');return window.__PAULO_LAB_QA.snapshot();});
    assert.ok(wind.jawAngle<-.2,'wind breath opens the jaw');
    assert.deepEqual(wind.breath,{active:'wind',poolSize:24,drawnInstances:9,visibleEmitters:1},
      'wind pose displays a distinct pooled emitter');
    const gas=await lab.evaluate(()=>{window.__PAULO_LAB_QA.setState('gas');return window.__PAULO_LAB_QA.snapshot();});
    assert.deepEqual(gas.breath,{active:'gas',poolSize:24,drawnInstances:24,visibleEmitters:1},
      'gas pose displays its own pooled emitter');
    const inhale=await lab.evaluate(()=>{window.__PAULO_LAB_QA.setState('inhale');return window.__PAULO_LAB_QA.snapshot();});
    assert.ok(inhale.chestHeight>initial.chestHeight+.1,
      'wind inhale visibly expands the dragon chest');
    assert.notDeepEqual(wind.wingFold,fire.wingFold,
      'wind bracing and fire wing-fold animations are distinct');
    const bank=await lab.evaluate(()=>{window.__PAULO_LAB_QA.setState('bank');return window.__PAULO_LAB_QA.snapshot();});
    assert.ok(Math.abs(bank.wingAngles[0])!==Math.abs(bank.wingAngles[1]),
      'bank pose is asymmetric across the two wings');
    assert.equal(bank.breath.visibleEmitters,0,'flight banking hides attack emitters');
    assert.ok(Number.isFinite(bank.drawCalls)&&bank.drawCalls>0,
      'dragon lab reports actual renderer draw calls');
    // Pausing must freeze pose time even when the browser pumps animation frames.
    const frozen=await lab.evaluate(()=>{
      document.querySelector('#play-toggle').click();
      return window.__PAULO_LAB_QA.snapshot();
    });
    assert.equal(frozen.paused,true,'pause button freezes dragon timeline');
    await lab.waitForTimeout(140);
    const still=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
    assert.equal(still.time,frozen.time,'paused timeline does not advance');
    const stepped=await lab.evaluate(()=>{
      document.querySelector('#step-frame').click();
      return window.__PAULO_LAB_QA.snapshot();
    });
    assert.ok(Math.abs(stepped.time-frozen.time-1/60)<.0001,
      'frame stepping advances exactly one 60Hz animation frame');
    const scrubbed=await lab.evaluate(()=>{
      const slider=document.querySelector('#timeline');
      slider.value='1.25';slider.dispatchEvent(new Event('input',{bubbles:true}));
      return window.__PAULO_LAB_QA.snapshot();
    });
    assert.equal(scrubbed.paused,true,'scrubbing keeps preview paused');
    assert.ok(Math.abs(scrubbed.time-1.25)<.0001,
      'scrubber sets deterministic pose time');
    // Match both bank directions at exactly the same timeline position.
    const rightBank=await lab.evaluate(()=>{
      window.__PAULO_LAB_QA.setState('bank');
      const timeline=document.querySelector('#timeline');
      timeline.value='0.75';timeline.dispatchEvent(new Event('input',{bubbles:true}));
      const direction=document.querySelector('#bank-direction');
      direction.value='right';direction.dispatchEvent(new Event('change',{bubbles:true}));
      return window.__PAULO_LAB_QA.snapshot();
    });
    const leftBank=await lab.evaluate(()=>{
      const direction=document.querySelector('#bank-direction');
      direction.value='left';direction.dispatchEvent(new Event('change',{bubbles:true}));
      return window.__PAULO_LAB_QA.snapshot();
    });
    assert.equal(rightBank.bankDirection,1,'right bank is the default orientation');
    assert.equal(leftBank.bankDirection,-1,'left bank reverses the direction');
    assert.equal(rightBank.time,leftBank.time,'bank comparison uses the identical animation time');
    assert.ok(Math.abs(rightBank.rootRoll)>.05,'bank pose produces visible body roll');
    assert.ok(Math.abs(rightBank.rootRoll+leftBank.rootRoll)<.00001,
      'body roll reverses symmetrically for left/right bank');
    assert.ok(Math.abs(rightBank.wingAngles[0]+leftBank.wingAngles[1])<.00001&&
      Math.abs(rightBank.wingAngles[1]+leftBank.wingAngles[0])<.00001,
      'left and right wing shoulder poses mirror across banking directions');
    await lab.evaluate(()=>window.__PAULO_LAB_QA.setState('wind'));
    await lab.screenshot({path:'qa-output/08-paulo-dragon-lab.png'});
    // Repeatable orthographic inspection frames expose wing and leg silhouette
    // problems that can hide in a single three-quarter camera.
    await lab.evaluate(()=>{
      document.querySelector('#view').value='front';
      document.querySelector('#view').dispatchEvent(new Event('change'));
      window.__PAULO_LAB_QA.setState('hover');
    });
    const frontFrame=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
    assert.equal(frontFrame.cameraType,'orthographic','front reference uses true orthographic projection');
    assert.ok(frontFrame.referenceFrame?.maxX<.90&&frontFrame.referenceFrame?.maxY<.90,
      'full front-view dragon anatomy including wing tips fits the frame');
    await lab.screenshot({path:'qa-output/09-paulo-front-reference.png'});
    await lab.evaluate(()=>{
      document.querySelector('#view').value='side';
      document.querySelector('#view').dispatchEvent(new Event('change'));
    });
    const sideFrame=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
    assert.equal(sideFrame.cameraType,'orthographic','side reference uses true orthographic projection');
    assert.ok(sideFrame.referenceFrame?.maxX<.90&&sideFrame.referenceFrame?.maxY<.90,
      'full side-view dragon anatomy fits the frame');
    report.pauloReferenceViews={front:frontFrame.referenceFrame,side:sideFrame.referenceFrame};
    await lab.screenshot({path:'qa-output/10-paulo-side-reference.png'});
    for(const [name,file] of [
      ['top','11-paulo-top-reference.png'],
      ['rear','12-paulo-rear-reference.png']
    ]){
      await lab.evaluate(viewName=>{
        const selector=document.querySelector('#view');
        selector.value=viewName;
        selector.dispatchEvent(new Event('change'));
      },name);
      const reference=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
      assert.equal(reference.cameraType,'orthographic',name+' view uses true orthographic projection');
      assert.ok(reference.referenceFrame?.maxX<.90&&reference.referenceFrame?.maxY<.90,
        name+' view fits complete dragon geometry');
      report.pauloReferenceViews[name]=reference.referenceFrame;
      await lab.screenshot({path:'qa-output/'+file});
    }
    assert.deepEqual(labErrors,[],'dragon lab has no JavaScript exceptions');
    report.pauloLab={jointCount:await lab.evaluate(()=>window.__PAULO_LAB_QA.jointCount),
      poses,initial,fire,wind,gas,errors:labErrors};
  }finally{await lab.close();}

} catch (error) {
  report.failure = String(error.stack ?? error);
  await page?.screenshot({path: 'qa-output/failure.png', timeout: 10000}).catch(() => {});
  throw error;
} finally {
  await writeFile('qa-output/report.json', JSON.stringify(report, null, 2));
  await browser?.close();
}
