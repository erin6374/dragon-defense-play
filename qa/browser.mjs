import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {groundWindWeight,groundWindStrength,hitVehicleWithWind,advanceVehicleWind} from '../src/simulation/ground-wind.js';
import {detectMilitaryCollateral,segmentSphereEntry,nearestSegmentSphereHit} from '../src/simulation/military-collateral.js';
import {slewSearchlightDirection} from '../src/simulation/military-searchlight.js';
import {disasterSkyIntensity} from '../src/rendering/cinematic-environment.js';
import {militaryWindImpulse} from '../src/simulation/military-wind.js';
import {PAULO_POSES,choosePauloPose,choosePauloBankDirection} from '../src/dragon/paulo-animation-intent.js';
import {createPauloPoseDriver} from '../src/dragon/paulo-pose-driver.js';
import {Script} from 'node:vm';

// Distant disaster glow must build gradually without exceeding a bounded
// shader uniform; this test is deterministic and does not claim GPU FPS.
assert.ok(disasterSkyIntensity(1,0)>=.1 && disasterSkyIntensity(1,0)<.2);
assert.ok(disasterSkyIntensity(10,.4)>disasterSkyIntensity(2,0));
assert.ok(disasterSkyIntensity(15,1)<=1);
assert.equal(disasterSkyIntensity(-100,-1),.12);
assert.equal(disasterSkyIntensity(NaN,Infinity),.12);

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8765/');
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const expected = JSON.parse(await readFile('build-info.json', 'utf8'));
const launchHtml = await readFile('index.html', 'utf8');
const launchCmd = await readFile('PLAY-PREVIEW.cmd', 'utf8');
const gameSource = await readFile('src/game.js', 'utf8');
// Fireball interception must select nearest swept 3D contact rather than
// whichever meteor happens to occur last in the live meteor array.
assert.match(gameSource,/const travelSq=path\.lengthSq\(\);let hitIndex=-1,hitT=Infinity/,
  'player fireballs track earliest swept meteor contact');
assert.match(gameSource,/if\(t<hitT\)\{hitT=t;hitIndex=mi;\}/,
  'player fireball chooses nearest valid collision time');

// Paulo must not be teleported back to the roof at each ordinary wave.
// Initial reset and chapter settlement retain their explicit perch behavior.
const waveSource=gameSource.slice(gameSource.indexOf('function newWave(){'),gameSource.indexOf('function reset(){'));
assert.ok(waveSource.startsWith('function newWave(){'),'wave transition function found');
assert.doesNotMatch(waveSource,/perchDragon\s*\(/,'ordinary waves preserve Paulo free-flight position');
assert.match(gameSource,/function reset\(\)[\s\S]*?perchDragon\(false\)/,'initial game reset still perches Paulo');

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
assert.ok(launchCmd.includes('python -c "import sys; assert sys.version_info[0] == 3"'),
  'Windows preview launcher must reject Python 2 when using the python PATH fallback');
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
const force=(x,z)=>groundWindStrength(x,1,z,0,1,20,1,0,0);
assert.equal(force(-10,20),0,'ground objects behind the dragon are unaffected');
assert.equal(force(65,20),0,'wind has finite reach');
assert.equal(force(15,60),0,'ground objects far outside the cone are unaffected');
assert.ok(force(15,20)>force(15,35),'gust is strongest near its center');

const makeGustCar=(flags={})=>({root:{position:{x:12,z:20},rotation:{x:0,y:0}},laneZ:20,dir:1,speed:8,...flags});
const windBike=makeGustCar({bike:true}),windSedan=makeGustCar(),windBus=makeGustCar({bus:true});
const windMiss=makeGustCar();windMiss.root.position.z=60;
assert.equal(hitVehicleWithWind(windMiss,5,0,20,1,0),false,'gust misses targets outside cone');
for(const v of [windBike,windSedan,windBus])assert.equal(hitVehicleWithWind(v,5,0,20,1,0),true);
assert.equal(hitVehicleWithWind(windSedan,5,0,20,1,0),false,'one impulse per target per gust');
for(let i=0;i<40;i++)for(const v of [windBike,windSedan,windBus])advanceVehicleWind(v,.05);
const windTravel=v=>v.root.position.x-12;
assert.ok(windTravel(windBike)>windTravel(windSedan),'bike skids farther than sedan');
assert.ok(windTravel(windSedan)>windTravel(windBus),'sedan skids farther than bus');
assert.ok(windTravel(windBus)>10,'heavy vehicles slide a visible distance');
assert.ok(Math.abs(windSedan.root.position.z-20)>.4,'car visibly skids sideways');
assert.ok(Math.abs(windBus.root.position.z-20)<Math.abs(windSedan.root.position.z-20),'bus resists lateral wind');
for(let i=0;i<200;i++)advanceVehicleWind(windSedan,.05);
assert.ok(Math.abs(windSedan.root.rotation.x)<.001,'vehicle roll eventually settles');
assert.ok(Number.isFinite(windSedan.root.position.x)&&Number.isFinite(windSedan.root.position.z),'wind positions remain finite');
// A 24-unit/s rocket can cross a small dragon or projectile in one slow frame.
// End-point-only tests would miss these hits; preserve first-contact coordinates.
const missileStart={x:-10,y:2,z:5},missileEnd={x:10,y:2,z:5};
const missileTarget={x:0,y:2,z:5};
assert.deepEqual(segmentSphereEntry(missileStart,missileEnd,missileTarget,2),
 {t:.4,x:-2,y:2,z:5},'fast rocket contacts target at swept entry face');
assert.equal(segmentSphereEntry(missileStart,missileEnd,{x:0,y:5,z:5},2),null,
 'swept sphere rejects a parallel near miss');
assert.deepEqual(segmentSphereEntry(missileTarget,missileEnd,missileTarget,2),
 {t:0,x:0,y:2,z:5},'rocket already inside target contacts immediately');
assert.equal(segmentSphereEntry(missileStart,missileStart,missileTarget,2),null,
 'stationary rocket outside target does not hit');
assert.equal(segmentSphereEntry(missileStart,missileEnd,missileTarget,-1),null,
 'invalid collision radius cannot create a hit');

// Within the same priority class, nearest physical contact wins regardless of
// candidate array order; ineligible player projectiles cannot intercept rockets.
const nearRocketTarget={id:'near',position:{x:-3,y:2,z:5},radius:1,active:true};
const farRocketTarget={id:'far',position:{x:6,y:2,z:5},radius:1,active:true};
const disabledRocketTarget={id:'disabled',position:{x:-8,y:2,z:5},radius:1,active:false};
const pickRocketTarget=items=>nearestSegmentSphereHit(missileStart,missileEnd,items,
 item=>item.position,item=>item.radius,item=>item.active);
assert.equal(pickRocketTarget([farRocketTarget,nearRocketTarget])?.target.id,'near',
 'nearest rocket intercept wins even when candidate order is reversed');
assert.equal(pickRocketTarget([disabledRocketTarget,farRocketTarget,nearRocketTarget])?.target.id,'near',
 'ineligible projectile does not block nearest active contact');
assert.equal(pickRocketTarget([farRocketTarget,nearRocketTarget])?.contact.x,-4,
 'nearest rocket intercept retains swept entry coordinate');
assert.equal(pickRocketTarget([{id:'miss',position:{x:0,y:8,z:5},radius:1,active:true}]),null,
 'no hit when every target misses the rocket path');

// Missed government missiles now cause bounded physical collateral damage.
const schoolCollider={name:'tech-freire-school',x:0,z:-8.6,w:27,d:18,h:28,damage:0};
const homeCollider={name:'rowhouse',x:24,z:-7.4,w:7,d:14.5,h:12,damage:0};
assert.equal(detectMilitaryCollateral({x:2,y:9,z:-2},.2,[schoolCollider]),null,'missile must clear launch area');
assert.equal(detectMilitaryCollateral({x:2,y:9,z:-2},.6,[schoolCollider])?.name,'tech-freire-school','missed missile hits school footprint');
assert.equal(detectMilitaryCollateral({x:23,y:7,z:-5},.7,[homeCollider])?.name,'rowhouse','missed missile hits neighbor');
assert.equal(detectMilitaryCollateral({x:14,y:.7,z:26},.7,[schoolCollider])?.type,'road','missed missile craters street');
assert.equal(detectMilitaryCollateral({x:14,y:20,z:26},.7,[schoolCollider]),null,'noncolliding flight path unaffected');
assert.equal(detectMilitaryCollateral({x:100,y:.6,z:26},.7,[]),null,'offscreen floor does not cause damage');
assert.equal(detectMilitaryCollateral({x:2,y:9,z:-2},.7,[{...schoolCollider,damage:1}]),null,'destroyed building not struck again');

const sweptSchool=detectMilitaryCollateral({x:2,y:9,z:5},.8,[schoolCollider],{x:2,y:9,z:-25});
assert.equal(sweptSchool?.type,'structure','long frame must not tunnel through school');
assert.ok(Math.abs(sweptSchool.z-(-8.6-18*.5-.45))<.001,'swept building hit occurs at entry face');
const sweptHome=detectMilitaryCollateral({x:24,y:7,z:6},.8,[homeCollider],{x:24,y:7,z:-23});
assert.equal(sweptHome?.name,'rowhouse','fast rocket cannot tunnel through narrow rowhouse');
const sweptRoad=detectMilitaryCollateral({x:14,y:-3,z:26},.8,[],{x:14,y:4,z:26});
assert.equal(sweptRoad?.type,'road','fast downward rocket cannot skip road plane');
assert.equal(sweptRoad?.y,.9,'road impact is clamped to visible road height');
assert.equal(detectMilitaryCollateral({x:50,y:9,z:5},.8,[schoolCollider],{x:50,y:9,z:-25}),null,
 'parallel missile outside building footprint remains clear');
assert.equal(detectMilitaryCollateral({x:14,y:-3,z:26},.2,[],{x:14,y:4,z:26}),null,
 'swept collision respects missile launch arming delay');

// Searchlights must approach Paulo smoothly without instantly snapping their aim.
const up={x:0,y:1,z:0},targetLight={x:.8,y:.5,z:.6};
const still=slewSearchlightDirection(up,targetLight,0);
assert.deepEqual(still,up,'zero-time searchlight update is unchanged');
const firstTrack=slewSearchlightDirection(up,targetLight,1/60);
assert.ok(firstTrack.x>0&&firstTrack.x<.2,'first searchlight movement is bounded');
assert.ok(Math.abs(Math.hypot(firstTrack.x,firstTrack.y,firstTrack.z)-1)<1e-8,'searchlight aim unit normalized');
let tracked=up;
for(let t=0;t<100;t++)tracked=slewSearchlightDirection(tracked,targetLight,1/60);
const normalizedTarget=Math.hypot(targetLight.x,targetLight.y,targetLight.z);
assert.ok((tracked.x*targetLight.x+tracked.y*targetLight.y+tracked.z*targetLight.z)/normalizedTarget>.96,
 'searchlight eventually points near the intended target');
const frozenTrack=slewSearchlightDirection(up,targetLight,Infinity);
assert.ok(Object.values(frozenTrack).every(Number.isFinite),'invalid timestep cannot produce NaNs');

// Dragon wind must genuinely change military missiles, not only its visuals.
const windOrigin={x:-3,y:13,z:15},windAim={x:1,y:0,z:0};
const rocketWind=militaryWindImpulse({x:12,y:13,z:15},windOrigin,windAim,.05);
assert.ok(rocketWind&&rocketWind.x>.7&&rocketWind.y>0,'in-cone rocket gains significant lateral velocity and lift');
assert.ok(rocketWind.disrupt>.6,'wind interrupts homing long enough for a visible evasive turn');
assert.equal(militaryWindImpulse({x:-5,y:13,z:15},windOrigin,windAim,.05),null,'rocket behind dragon unaffected');
assert.equal(militaryWindImpulse({x:12,y:13,z:70},windOrigin,windAim,.05),null,'outside-cone rocket unaffected');
assert.equal(militaryWindImpulse({x:12,y:13,z:15},windOrigin,windAim,0),null,'paused game does not deflect missiles');
const bounded=militaryWindImpulse({x:12,y:13,z:15},windOrigin,windAim,4);
assert.ok(bounded.x<rocketWind.x*1.3,'a stalled frame cannot launch a rocket with unbounded energy');
const expectedPauloPoses=['idle','hover','flight','glide','bank','inhale','wind','fire','gas','hit','land','takeoff'];
assert.deepEqual(PAULO_POSES,expectedPauloPoses);
for(const [signals,state] of [
 [{stunned:true,windGust:true},'hit'],
 [{recovering:true,windGust:true},'takeoff'],
 [{windGust:true,gasAttack:true},'wind'],
 [{gasAttack:true,windCharging:true},'gas'],
 [{windCharging:true,fireAttack:true},'inhale'],
 [{fireAttack:true,turning:true},'fire'],
 [{landing:true,turning:true},'land'],
 [{turning:true,moving:true},'bank'],
 [{gliding:true,moving:true},'glide'],
 [{perched:true},'idle'],
 [{active:false},'idle'],
 [{moving:true},'flight'],
 [{rising:true},'flight'],
 [{},'hover'],
]) assert.equal(choosePauloPose(signals),state);
assert.equal(choosePauloBankDirection({horizontal:-1,facing:1}),-1);
assert.equal(choosePauloBankDirection({horizontal:1,facing:-1}),1);
assert.equal(choosePauloBankDirection({facing:-1}),-1);
// The future game may choose attack poses, but must not transfer control of
// simulation, the frame clock or cooldowns into the rig renderer.
const poseCalls=[];
const poseDriver=createPauloPoseDriver({applyPose:(t,p,d,poseElapsed)=>poseCalls.push({t,p,d,poseElapsed})});
assert.deepEqual(poseDriver.snapshot(),
  {pose:'hover',poseTime:0,animationTime:0,bankDirection:1});
assert.equal(poseDriver.update(.016,{moving:true,horizontal:-1,facing:-1}),'flight');
const phaseBeforeAttack=poseDriver.snapshot().animationTime;
assert.equal(poseDriver.update(1,{windGust:true,horizontal:-1,facing:-1}),'wind');
const chargingFrame=poseDriver.snapshot();
assert.equal(chargingFrame.bankDirection,-1,'turning direction maps into rig orientation');
assert.equal(chargingFrame.poseTime,0,'new attack begins at pose time zero');
assert.ok(Math.abs(chargingFrame.animationTime-phaseBeforeAttack-.05)<1e-8,
  'long game frame advances the rig by no more than 50ms');
const callsBeforePause=poseCalls.length;
assert.equal(poseDriver.update(1,{paused:true,gasAttack:true}),'wind');
assert.equal(poseCalls.length,callsBeforePause,'pause does not touch rig transforms');
assert.deepEqual(poseDriver.snapshot(),chargingFrame,'pause freezes pose and continuous phase');
assert.equal(poseDriver.update(0,{stunned:true,facing:1}),'hit');
assert.equal(poseDriver.snapshot().animationTime,chargingFrame.animationTime,
  'zero-delta state transitions preserve continuous wingbeat phase');
assert.equal(poseCalls.at(-1).poseElapsed,0,'hit recoil gets a fresh local clock');
poseDriver.update(.05,{stunned:true,facing:1});
assert.ok(Math.abs(poseCalls.at(-1).poseElapsed-.05)<1e-8,
  'hit recoil damping advances by elapsed pose time');
assert.throws(()=>poseDriver.update(-1,{}),/delta/);
assert.throws(()=>poseDriver.update(Infinity,{}),/delta/);
assert.equal(poseDriver.reset('idle'),'idle');
assert.deepEqual(poseDriver.snapshot(),
  {pose:'idle',poseTime:0,animationTime:0,bankDirection:1});
assert.throws(()=>poseDriver.reset('unknown'),/state/);
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
  // Cinematic HUD removes only low-priority overlays; the game remains playable
  // and the player can restore the complete interface immediately.
  const cinematicBefore=await page.evaluate(()=>window.__DD_CINEMA_HUD?.snapshot());
  assert.equal(cinematicBefore?.enabled,false,'QA defaults to full HUD for existing legibility tests');
  assert.equal(cinematicBefore?.toggleVisible,true,'film/full toggle is available');
  await page.locator('#cinema-hud-toggle').click();
  const cinema=await page.evaluate(()=>{
   const visible=id=>{const e=document.getElementById(id);
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
   return {state:window.__DD_CINEMA_HUD.snapshot(),
    title:visible('hud-version'),chapter:visible('campaign-chapter-label'),
    build:visible('game-build'),instructions:getComputedStyle(document.querySelector('#bottom>div:first-child')).display,
    callBlock:visible('call-block'),pause:visible('pause'),cinemaButton:visible('cinema-hud-toggle'),
    gameCanvas:getComputedStyle(document.querySelector('canvas')).display!=='none'};
  });
  assert.equal(cinema.state.enabled,true,'film HUD activates');
  assert.equal(cinema.title,false,'redundant build/title hidden during cinematic play');
  assert.equal(cinema.chapter,false,'redundant chapter plaque hidden during cinematic play');
  assert.equal(cinema.build,false,'developer version hidden during cinematic play');
  assert.equal(cinema.instructions,'none','permanent help panel hidden during cinematic play');
  assert.ok(cinema.callBlock&&cinema.pause&&cinema.cinemaButton,'critical controls remain reachable');
  const radarClearance=await page.evaluate(()=>{
   const radar=document.getElementById('incoming-radar').getBoundingClientRect();
   const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   const buttons=Array.from(document.querySelectorAll('#bottom button')).filter(e=>{
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
   }).map(e=>{const r=e.getBoundingClientRect();
    return {id:e.id||e.textContent?.slice(0,28),left:r.left,right:r.right,top:r.top,bottom:r.bottom,
      overlapsRadar:overlaps(r,radar)}});
   const meter=document.getElementById('wind-meter').getBoundingClientRect();
   return {radar:{left:radar.left,right:radar.right,top:radar.top,bottom:radar.bottom},
    meter:{left:meter.left,right:meter.right,top:meter.top,bottom:meter.bottom},
    buttons,windOverlaps:buttons.some(b=>overlaps(b,meter))};
  });
  assert.ok(radarClearance.buttons.length>=4,'cinematic interface retains essential buttons');
  assert.ok(radarClearance.buttons.every(b=>!b.overlapsRadar),
    'all cinematic HUD controls must clear the right-side incoming radar: '+JSON.stringify(radarClearance));
  assert.equal(radarClearance.windOverlaps,false,
    'cinematic controls must also clear the left-side breath charge meter');
  report.cinematicHud={...cinema,radarClearance};
  await shot('02c-cinematic-hud');
  await page.keyboard.press('h');
  assert.equal(await page.evaluate(()=>window.__DD_CINEMA_HUD.snapshot().enabled),false,
   'H shortcut restores full HUD without restarting game');
  await page.keyboard.press('h');
  assert.equal(await page.evaluate(()=>window.__DD_CINEMA_HUD.snapshot().enabled),true,
   'H shortcut can re-enter cinematic mode');
  await page.locator('#cinema-hud-toggle').click();
  assert.equal(await page.evaluate(()=>window.__DD_CINEMA_HUD.snapshot().enabled),false,
   'on-screen toggle restores full HUD');
  const fullRadarClearance=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const radar=rect(document.getElementById('incoming-radar'));
    const hud=rect(document.getElementById('hud'));
    const buttons=Array.from(document.querySelectorAll('#bottom button')).filter(e=>{
      const s=getComputedStyle(e),r=e.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
    }).map(e=>({id:e.id,rect:rect(e)}));
    return {radar,hud,overlaps:buttons.filter(e=>overlap(e.rect,radar)).map(e=>e.id)};
  });
  assert.ok(fullRadarClearance.radar.top>=fullRadarClearance.hud.bottom+8,
    '1024x576 full radar must clear health HUD: '+JSON.stringify(fullRadarClearance));
  assert.deepEqual(fullRadarClearance.overlaps,[],
    '1024x576 full radar must clear buttons: '+JSON.stringify(fullRadarClearance));
  report.fullRadarClearance=fullRadarClearance;
  await shot('02d-full-hud-radar');
  // Real 1024x576 screenshot: status must clear HUD health/lives, then wave clears status.
  const desktopAlerts = await page.evaluate(() => {
    const bounds = id => { const r = document.getElementById(id).getBoundingClientRect();
      return {left:r.left,top:r.top,right:r.right,bottom:r.bottom}; };
    return {hud:bounds('hud'),power:bounds('power-status'),wave:bounds('toast')};
  });
  assert.ok(desktopAlerts.power.top >= desktopAlerts.hud.bottom+4,
    '1024x576 interception status must clear the health/lives HUD: '+JSON.stringify(desktopAlerts));
  assert.ok(desktopAlerts.wave.top >= desktopAlerts.power.bottom+8,
    '1024x576 wave announcement must clear interception status: '+JSON.stringify(desktopAlerts));
  report.desktopAlerts={viewport:'1024x576',...desktopAlerts};
  await page.locator('canvas').first().screenshot({path:'qa-output/02-playing-scene.png'});

  // Reproduce the observed compact landscape HUD overlap at 848x480.
  // The wave announcement is synthetic DOM text for layout verification only;
  // it does not assert that wave 15 gameplay was reached.
  await page.setViewportSize({width:848,height:480});
  const compactAlertPrevious = await page.evaluate(() => {
    const toast = document.getElementById('toast');
    const warning = document.getElementById('hunter-warning');
    const previous = {toast:toast.textContent, warning:warning.textContent,
      opacity:warning.style.opacity, transition:warning.style.transition};
    toast.textContent = 'WAVE 15 · METEOR STORM';
    warning.textContent = 'HOSTILE AIRCRAFT';
    warning.style.transition = 'none';
    warning.style.opacity = '1';
    return previous;
  });
  try {
    const compactHud = await page.evaluate(() => {
      const ids = ['hud','power-status','model-status','campaign-chapter-label','toast','hunter-warning'];
      const boxes = Object.fromEntries(ids.map(id => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return [id, {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom}];
      }));
      const cards = Array.from(document.querySelectorAll('#hud > div'), element => {
        const rect = element.getBoundingClientRect();
        return {left:rect.left,right:rect.right,width:rect.width};
      });
      const bottomButtons = Array.from(document.querySelectorAll('#bottom button'))
        .filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0;
        }).map(element => {
          const rect = element.getBoundingClientRect();
          return {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom};
        });
      const rect=e=>{const r=e.getBoundingClientRect();
        return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
      const radar=rect(document.getElementById('incoming-radar'));
      const touchButtons=Array.from(document.querySelectorAll('#mobile-actions button'))
        .filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();
          return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}).map(rect);
      return {boxes,cards,bottomButtons,radar,touchButtons};
    });
    const separated = (a,b) => a.bottom <= b.top+1 || b.bottom <= a.top+1 ||
      a.right <= b.left+1 || b.right <= a.left+1;
    for(const [a,b] of [
      ['hud','power-status'],['power-status','model-status'],
      ['model-status','campaign-chapter-label'],
      ['campaign-chapter-label','toast'],['toast','hunter-warning']
    ]) {
      assert.ok(separated(compactHud.boxes[a],compactHud.boxes[b]),
        '848x480 HUD overlap: '+a+' / '+b+' '+JSON.stringify(compactHud.boxes));
    }
    assert.ok(compactHud.bottomButtons.every(button => separated(compactHud.boxes['hunter-warning'],button)),
      '848x480 hostile-aircraft warning must not overlap visible menu buttons: '+JSON.stringify(compactHud));
    assert.ok(compactHud.cards.every(card => card.width>15 && card.left>=0 && card.right<=848),
      '848x480 top HUD cards must remain on-screen');
    assert.ok(compactHud.radar.top>=compactHud.boxes.hud.bottom+8 && compactHud.radar.right<=848,
      '848x480 radar must clear health HUD and remain on screen: '+JSON.stringify(compactHud));
    assert.ok([...compactHud.bottomButtons,...compactHud.touchButtons].every(b=>separated(b,compactHud.radar)),
      '848x480 full radar must clear menu and FIRE/GAS buttons: '+JSON.stringify(compactHud));
    report.compactHud={viewport:'848x480',syntheticAlert:true,...compactHud};
    await shot('02b-compact-hud-synthetic-alerts');
    await page.locator('#cinema-hud-toggle').click();
    try {
      const compactCinema=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();
          return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
        const radar=rect(document.getElementById('incoming-radar'));
        const controls=Array.from(document.querySelectorAll('#bottom button,#mobile-actions button'))
          .filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();
            return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;})
          .map(e=>({id:e.id,rect:rect(e)}));
        return {enabled:window.__DD_CINEMA_HUD.snapshot().enabled,radar,controls};
      });
      assert.equal(compactCinema.enabled,true,'compact cinematic toggle activates');
      assert.ok(compactCinema.controls.every(e=>separated(e.rect,compactCinema.radar)),
        '848x480 cinematic radar must clear touch/menu controls: '+JSON.stringify(compactCinema));
      report.compactCinematicRadar={viewport:'848x480',syntheticAlert:true,...compactCinema};
      await shot('02e-compact-cinematic-synthetic-alerts');
    } finally {
      await page.locator('#cinema-hud-toggle').click();
    }
  } finally {
    await page.evaluate(previous => {
      const toast = document.getElementById('toast');
      const warning = document.getElementById('hunter-warning');
      toast.textContent = previous.toast;
      warning.textContent = previous.warning;
      warning.style.opacity = previous.opacity;
      warning.style.transition = previous.transition;
    },compactAlertPrevious);
    await page.setViewportSize({width:1024,height:576});
  }

  report.browser = browser.version();
  // End-to-end ordinary-wave regression: Paulo must retain his world-space
  // position rather than silently returning to the school roof.
  const wavePosition=await page.evaluate(()=>{
    const qa=window.__DD_QA,initial=qa.start(2);
    if(!initial.ok)return initial;
    const moved=qa.move(31,23);
    if(!moved.ok)return moved;
    return qa.advanceOrdinaryWave();
  });
  assert.ok(wavePosition.ok,wavePosition.error);
  assert.equal(wavePosition.result.before.wave,2);
  assert.equal(wavePosition.result.after.wave,3);
  for(const axis of ['x','y','z'])assert.ok(
    Math.abs(wavePosition.result.after.dragon[axis]-wavePosition.result.before.dragon[axis])<.00001,
    'ordinary wave preserves Paulo '+axis+' world coordinate');
  report.ordinaryWaveDragonPosition=wavePosition.result;
  const restoredWave=await page.evaluate(()=>window.__DD_QA.start(1));
  assert.ok(restoredWave.ok,restoredWave.error);
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
  // High-wave disaster glow capture: a real rendered frame, not a shader
  // intensity-only assertion. Restore wave 7 before collision QA resumes.
  const highWaveGlow=await page.evaluate(()=>{
    const qa=window.__DD_QA, started=qa.start(15);
    if(!started.ok)return started;
    // Wave 15 opens a chapter cinematic. Explicitly dismiss it so the
    // screenshot captures the actual game sky rather than a cutscene overlay.
    const closed=qa.closeCinematic();
    if(!closed.ok)return closed;
    const settled=qa.qaSettleAtmosphere();
    if(!settled.ok)return settled;
    return {ok:true,result:{...settled.result,
      cinematicHidden:document.getElementById('cinematic-player').hidden,
      paused:qa.snap().paused}};
  });
  assert.ok(highWaveGlow.ok,highWaveGlow.error);
  assert.equal(highWaveGlow.result.wave,15,'disaster-glow capture uses final wave');
  assert.equal(highWaveGlow.result.cinematicHidden,true,'high-wave screenshot must not show chapter cutscene');
  assert.equal(highWaveGlow.result.paused,false,'high-wave gameplay resumes after dismissing chapter cinematic');
  const highWaveFrames=(await snap()).frameTimes.frames;
  await page.waitForFunction(n=>window.__DD_QA.snap().frameTimes.frames>n,highWaveFrames);
  report.highWaveDisasterGlow=highWaveGlow.result;
  assert.equal(await page.locator('#cinematic-player').isHidden(),true,
    'high-wave screenshot captures gameplay, not an overlay');
  // qaSettleAtmosphere advances the visual state without necessarily advancing
  // the gameplay timer that expires the 1.8s chapter toast. Waiting on that
  // timer timed out in exact-head QA #308. Clear only the screenshot's DOM
  // announcement after recording its text; never modify game timer/state.
  report.highWaveDisasterGlow.toastBeforeWait=(await page.locator('#toast').textContent())?.trim()||'';
  await page.evaluate(()=>{document.getElementById('toast').textContent='';});
  assert.equal((await page.locator('#toast').textContent())?.trim(),'',
    'wave-15 disaster-glow screenshot must have no chapter announcement');
  report.highWaveDisasterGlow.toastCleared=true;
  await shot('06b-high-wave-disaster-glow');
  await page.locator('canvas').first().screenshot({path:'qa-output/06b-high-wave-disaster-glow-scene.png'});
  const restoreAfterGlow=await page.evaluate(()=>{
    const qa=window.__DD_QA,started=qa.start(7);
    if(!started.ok)return started;
    return qa.qaSettleAtmosphere();
  });
  assert.ok(restoreAfterGlow.ok,restoreAfterGlow.error);
  assert.equal(restoreAfterGlow.result.wave,7);
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
  const militaryCredit=await page.evaluate(()=>window.__DD_QA.labStageMilitaryInterception());
  assert.ok(militaryCredit.ok,militaryCredit.error);
  assert.equal(militaryCredit.result.handled,true,'real military meteor callback removes its target');
  assert.equal(militaryCredit.result.removed,true,'military-destroyed meteor is removed');
  assert.equal(militaryCredit.result.after.military,militaryCredit.result.before.military+1,
    'military kills have a separate telemetry counter');
  for(const field of ['score','playerIntercepts','streak','powerups','rapidFireUntil','schoolShieldUntil']){
   assert.equal(militaryCredit.result.after[field],militaryCredit.result.before[field],
    'military intercept cannot grant Paulo player reward '+field);
  }
  assert.equal(militaryCredit.result.after.meteors,militaryCredit.result.before.meteors,
    'only the newly staged meteor is destroyed without harming unrelated meteors');
  report.militaryInterceptionCredit=militaryCredit.result;
  const windMissileStage=await page.evaluate(()=>window.__DD_QA.labStageMilitaryWind());
  assert.ok(windMissileStage.ok,windMissileStage.error);
  assert.equal(windMissileStage.result.before.length,1,'stage creates one real enemy homing rocket');
  assert.equal(windMissileStage.result.after.length,1,'rocket survives as deflected threat');
  assert.ok(windMissileStage.result.after[0].velocity[0]>windMissileStage.result.before[0].velocity[0]+.7,
    'Paulo gust visibly alters the live enemy rocket trajectory');
  assert.ok(windMissileStage.result.after[0].velocity[1]>.1,
    'Paulo gust lifts the rocket vertically');
  assert.ok(windMissileStage.result.after[0].disruptTime>.5,
    'homing reacquisition is delayed after wind impact');
  report.militaryWindDeflection=windMissileStage.result;
  const batteryStage=await page.evaluate(()=>window.__DD_QA.labStageMilitarySearchlights());
  assert.ok(batteryStage.ok,batteryStage.error);
  assert.ok(batteryStage.result.states.length>=2&&batteryStage.result.states.length<=3,
   'Chapter 3 uses at most three shared military searchlight beams');
  assert.equal(batteryStage.result.counts.searchlights,batteryStage.result.states.length,
   'every active military battery visibly tracks Paulo');
  for(const beam of batteryStage.result.states){
   assert.equal(beam.visible,true,'active searchlight cone visible');
   assert.ok(beam.length>10&&beam.length<70,'searchlight scales to rooftop height');
   assert.ok(beam.targetDot>.94,'searchlight direction converges toward Paulo');
   assert.ok(beam.direction.every(Number.isFinite),'tracking does not create invalid transforms');
  }
  report.militarySearchlights=batteryStage.result.states;
  const stageNight=await page.evaluate(()=>window.__DD_QA.qaSettleAtmosphere());
  assert.ok(stageNight.ok,stageNight.error);
  await page.screenshot({path:'qa-output/07-military-searchlights.png'});
  const restoreStage=await page.evaluate(()=>window.__DD_QA.start(7));
  assert.ok(restoreStage.ok,restoreStage.error);
  await page.evaluate(()=>window.__DD_QA.cinematicStage('quiet'));
  const groundWind=await page.evaluate(()=>window.__DD_QA.stageGroundWind());
  assert.ok(groundWind.ok,groundWind.error);
  assert.ok(groundWind.result.busX>19&&groundWind.result.truckX>20,
    'oncoming heavy vehicles slide backward by multiple world units');
  assert.ok(groundWind.result.carTilt>1,'sedan rocks onto its side');
  assert.ok(groundWind.result.personX>20&&groundWind.result.personTilt>1.2,
    'pedestrian falls and skids across the pavement');
  assert.ok(groundWind.result.foliageBend>.25,'plants bend into the gust');
  assert.ok(groundWind.result.carRecovered&&groundWind.result.personRecovered,
    'wind reactions return to upright');
  assert.ok(groundWind.result.statePreserved,'wind knockdown preserves score, health and wave');
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
  // Public model switch must be discoverable without a ?paulo=1 URL flag.
  // Exercise the actual button in addition to the existing QA-only rig hook.
  const pauloToggle=page.locator('#paulo-toggle');
  assert.equal(await pauloToggle.getAttribute('hidden'),null,
    'model comparison button is available to ordinary players');
  if(await page.evaluate(()=>document.body.classList.contains('cinematic-hud')))
    await page.locator('#cinema-hud-toggle').click();
  assert.equal(await pauloToggle.isVisible(),true,
    'model comparison button is visible in full HUD');
  await pauloToggle.click();
  assert.equal(await pauloToggle.getAttribute('aria-pressed'),'true',
    'visible button activates the new procedural Paulo preview');
  assert.equal(await page.evaluate(()=>window.__DD_PAULO_PREVIEW.snapshot().enabled),true);
  await pauloToggle.click();
  assert.equal(await pauloToggle.getAttribute('aria-pressed'),'false',
    'visible button restores the original dragon');
  assert.equal(await page.evaluate(()=>window.__DD_PAULO_PREVIEW.snapshot().enabled),false);
  // Visual-only model preview must mount Paulo without moving the
  // authoritative dragon entity or altering score, health, wave or cooldowns.
  const pauloPreviewStart=await page.evaluate(()=>{
    const visual=window.__DD_PAULO_PREVIEW;
    if(!visual)throw new Error('Paulo QA preview controller not initialized');
    return visual.snapshot();
  });
  assert.equal(pauloPreviewStart.enabled,false,'original dragon is the default model');
  assert.equal(pauloPreviewStart.legacyVisible,true,'original dragon is initially visible');
  assert.ok(pauloPreviewStart.visualCount>5,'legacy dragon is fully captured as visual objects');
  const pauloGameplayOn=await page.evaluate(()=>{
    const visual=window.__DD_PAULO_PREVIEW,qa=window.__DD_QA;
    const before=qa.snap();
    const enabled=visual.setEnabled(true);
    return {enabled,now:visual.snapshot(),before,after:qa.snap()};
  });
  assert.equal(pauloGameplayOn.enabled,true,'development preview switches to Paulo');
  assert.equal(pauloGameplayOn.now.rigMounted,true,'Paulo mounts beneath the legacy gameplay root');
  assert.equal(pauloGameplayOn.now.visualScale,.68,
    'Paulo visual rig has readable in-game scale without changing gameplay root');
  assert.equal(pauloGameplayOn.now.legacyHidden,true,'only old dragon artwork is hidden');
  assert.ok(pauloGameplayOn.now.pose?.pose,'new model has an active animation driver');
  assert.deepEqual(pauloGameplayOn.now.position,pauloPreviewStart.position,
    'switching artwork does not reposition gameplay dragon');
  assert.deepEqual(pauloGameplayOn.now.scale,pauloPreviewStart.scale,
    'switching artwork does not rescale the collision/movement root');
  for(const key of ['score','hp','wave','dragon']){
    assert.deepEqual(pauloGameplayOn.after[key],pauloGameplayOn.before[key],
      'preview toggle preserves current game '+key);
  }
  await page.screenshot({path:'qa-output/07b-paulo-gameplay-preview.png'});
  // The regular street camera renders the rooftop dragon at a few pixels.
  // Capture the actual game scene again through a dedicated inspection lens,
  // without introducing a second renderer or changing any game camera.
  const pauloClose=await page.evaluate(()=>{
    const move=window.__DD_QA.move(0,27);
    if(!move.ok)return move;
    return window.__DD_QA.captureDragonDetail();
  });
  assert.ok(pauloClose.ok,pauloClose.error);
  assert.equal(pauloClose.result.model,'paulo','close-up shows the new in-game rig');
  assert.ok(pauloClose.result.png.startsWith('data:image/png;base64,'),
    'Paulo close-up contains actual renderer output');
  await writeFile('qa-output/07d-paulo-gameplay-closeup.png',
    Buffer.from(pauloClose.result.png.split(',')[1],'base64'));
  const pauloGameplayOff=await page.evaluate(()=>{
    const visual=window.__DD_PAULO_PREVIEW,qa=window.__DD_QA;
    const before=qa.snap();
    const enabled=visual.setEnabled(false);
    return {enabled,now:visual.snapshot(),before,after:qa.snap()};
  });
  assert.equal(pauloGameplayOff.enabled,false,'preview switches back to original');
  assert.equal(pauloGameplayOff.now.legacyVisible,true,'original dragon visibility is restored');
  assert.equal(pauloGameplayOff.now.rigMounted,false,'Paulo visual root is detached');
  assert.equal(pauloGameplayOff.now.visualScale,null,'fallback releases the scaled visual-only rig');
  assert.equal(pauloGameplayOff.now.pose,null,'fallback releases Paulo animation controller');
  for(const key of ['score','hp','wave','dragon']){
    assert.deepEqual(pauloGameplayOff.after[key],pauloGameplayOff.before[key],
      'legacy fallback preserves current game '+key);
  }
  await page.screenshot({path:'qa-output/07c-legacy-fallback.png'});
  const legacyClose=await page.evaluate(()=>{
    // Reuse the exact same staging coordinates even if the live simulation
    // advanced while switching the visual asset back to the original.
    const move=window.__DD_QA.move(0,27);
    return move.ok?window.__DD_QA.captureDragonDetail():move;
  });
  assert.ok(legacyClose.ok,legacyClose.error);
  assert.equal(legacyClose.result.model,'legacy','fallback close-up uses the original dragon');
  assert.deepEqual(legacyClose.result.dragon,pauloClose.result.dragon,
    'both close-up reference views use the same unchanged gameplay position');
  await writeFile('qa-output/07e-legacy-gameplay-closeup.png',
    Buffer.from(legacyClose.result.png.split(',')[1],'base64'));
  report.pauloGameplayPreview={
    legacyObjects:pauloPreviewStart.visualCount,
    activePose:pauloGameplayOn.now.pose?.pose,
    roundTrip:true,previewOnly:true
  };
  assert.deepEqual(report.errors,[],'Paulo preview introduced no gameplay errors');
  assert.deepEqual(report.warnings,[],'Paulo preview introduced no WebGL warnings');
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
    assert.equal(membrane.panels,12,'two wings each have proximal, middle and four outer membrane panels');
    assert.deepEqual(await lab.evaluate(()=>window.__PAULO_LAB_QA.membraneRegions),
      {proximal:2,outer:8,middle:2},
      'each wing has a proximal patagium attached to the shoulder pivot');
    // Exercise the same rig independently of the standalone lab scene/camera.
    // This is the integration contract: gameplay can mount the new dragon as
    // a visual-only child without adopting lab UI or its renderer.
    const reusableRig=await lab.evaluate(async()=>{
      const [{createPauloRig},THREE]=await Promise.all([
        import('../src/dragon/paulo-rig.js'),import('three')
      ]);
      const rig=createPauloRig(THREE);
      const states=window.__PAULO_LAB_QA.states;
      const visits=states.map(name=>{
        rig.applyPose(.75,name,1);
        return {name,jaw:rig.jaw.rotation.z,chest:rig.chest.scale.y};
      });
      rig.applyPose(.75,'bank',1);
      const right={roll:rig.root.rotation.x,yaw:rig.root.rotation.y,
        pitch:rig.root.rotation.z,headYaw:rig.head.rotation.y,
        wings:rig.wings.map(w=>w.shoulder.rotation.x)};
      rig.applyPose(.75,'bank',-1);
      const left={roll:rig.root.rotation.x,yaw:rig.root.rotation.y,
        pitch:rig.root.rotation.z,headYaw:rig.head.rotation.y,
        wings:rig.wings.map(w=>w.shoulder.rotation.x)};
      const sampleWings=()=>rig.wings.map(({shoulder,elbow,wrist})=>({
        shoulderSweep:shoulder.rotation.y,elbowLift:elbow.rotation.x,wristSweep:wrist.rotation.y
      }));
      const sampleLegs=()=>rig.legs.map(({hip,knee,foot})=>({
        hip:hip.rotation.z,knee:knee.rotation.z,foot:foot.rotation.z
      }));
      rig.applyPose(.75,'idle',1);
      const idleLegs=sampleLegs();
      rig.applyPose(.75,'hover',1);
      const hoverLegs=sampleLegs();
      rig.applyPose(.75,'flight',1);
      const flightLegs=sampleLegs();
      rig.applyPose(.75,'takeoff',1,0);
      const takeoffStart=sampleLegs();
      rig.applyPose(.75,'takeoff',1,.75);
      const takeoffEnd=sampleLegs();
      rig.applyPose(.75,'land',1,0);
      const landingStart=sampleLegs(),landingWingStart=sampleWings();
      rig.applyPose(.75,'land',1,.75);
      const landingEnd=sampleLegs(),landingWingEnd=sampleWings();
      // A late-game hit must recoil exactly as visibly as an early hit;
      // global wingbeat time is intentionally much larger in the first call.
      rig.applyPose(120,'hit',1,.10);
      const lateHitRecoil=rig.root.rotation.z;
      rig.applyPose(.10,'hit',1,.10);
      const earlyHitRecoil=rig.root.rotation.z;
      const mounted=!!rig.root.parent;
      const holder=new THREE.Group();holder.add(rig.root);
      const cleanup=rig.dispose();
      const detached=rig.root.parent===null;
      const jawAfterDispose=rig.jaw.rotation.z;
      rig.applyPose(.25,'fire',1);
      const writesGuarded=rig.jaw.rotation.z===jawAfterDispose;
      const secondCleanup=rig.dispose();
      const membraneSample=rig.membranePanels[0].mesh.geometry;
      const tint=membraneSample.getAttribute('color');
      const tintRoot=tint?.getX(0),tintEdge=tint?.getX(6*13+6);
      const tintCoverage=rig.membranePanels.every(p=>
        p.mesh.material.vertexColors&&
        p.mesh.geometry.getAttribute('color')?.count===
        p.mesh.geometry.getAttribute('position').count);
      return {mounted,panels:rig.membranePanels.length,
        tintRoot,tintEdge,tintCoverage,
        joints:rig.rigMarkers.length,tail:rig.tailProfile.length,
        toothCount:[rig.upperTeeth.count,rig.lowerTeeth.count],
        breath:rig.breathPreview.snapshot(),visits,right,left,
        idleLegs,hoverLegs,flightLegs,takeoffStart,takeoffEnd,landingStart,landingEnd,
        landingWingStart,landingWingEnd,
        lateHitRecoil,earlyHitRecoil,
        cleanup,detached,writesGuarded,secondCleanup};
    });
    assert.equal(reusableRig.mounted,false,'shared Paulo rig is not scene-bound');
    assert.ok(Math.abs(reusableRig.earlyHitRecoil)>.05,
      'fresh hit pose creates perceptible physical recoil');
    assert.ok(Math.abs(reusableRig.lateHitRecoil-reusableRig.earlyHitRecoil)<1e-8,
      'recoil amplitude remains unchanged after 120 seconds of wingbeat time');
    assert.equal(reusableRig.detached,true,'disposal removes the rig from its scene parent');
    assert.equal(reusableRig.writesGuarded,true,'disposed rig no longer writes to released buffers');
    assert.ok(reusableRig.cleanup.geometries>5&&reusableRig.cleanup.materials>5,
      'disposal releases the factory-owned geometry and material resources');
    assert.deepEqual(reusableRig.secondCleanup,{geometries:0,materials:0},
      'repeated cleanup is a no-op and cannot dispose resources twice');
    assert.equal(reusableRig.panels,12,'shared geometry retains every membrane');
    assert.equal(reusableRig.tintCoverage,true,
      'every Paulo membrane panel has a GPU vertex color for each position vertex');
    assert.ok(reusableRig.tintEdge>reusableRig.tintRoot+.15,
      'outer wing membranes are visibly brighter than the wing roots');
    assert.equal(reusableRig.tail,7,'shared geometry retains seven tail joints');
    assert.deepEqual(reusableRig.toothCount,[12,12],'shared geometry retains animated teeth');
    assert.equal(reusableRig.visits.length,12,'independent factory supports all animation states');
    assert.ok(reusableRig.visits.every(p=>Number.isFinite(p.jaw)&&Number.isFinite(p.chest)),
      'standalone rig produces finite jaw and chest transforms');
    assert.equal(reusableRig.breath.visibleEmitters,0,
      'gameplay factory does not instantiate laboratory-only breath particles');
    assert.equal(reusableRig.flightLegs.length,4,'all four dragon legs are articulated');
    assert.ok(reusableRig.flightLegs.every((leg,i)=>
      leg.hip<reusableRig.idleLegs[i].hip-.9 &&
      leg.knee<reusableRig.idleLegs[i].knee-.4 && leg.foot>.4),
      'forward flight tucks all four legs rearward and folds the claws');
    assert.ok(reusableRig.hoverLegs.every((leg,i)=>
      leg.hip>reusableRig.flightLegs[i].hip &&
      leg.hip<reusableRig.idleLegs[i].hip),
      'hover retains a partial leg tuck between flight and planted poses');
    assert.ok(reusableRig.takeoffStart.every((leg,i)=>
      Math.abs(leg.hip-reusableRig.idleLegs[i].hip)<1e-8) &&
      reusableRig.takeoffEnd.every((leg,i)=>
      Math.abs(leg.hip-reusableRig.flightLegs[i].hip)<1e-8),
      'takeoff folds legs over the first 0.6 seconds');
    assert.ok(reusableRig.landingStart.every((leg,i)=>
      Math.abs(leg.hip-reusableRig.flightLegs[i].hip)<1e-8) &&
      reusableRig.landingEnd.every((leg,i)=>
      Math.abs(leg.hip-reusableRig.idleLegs[i].hip)<1e-8),
      'landing extends legs before touchdown');
    assert.ok(reusableRig.landingWingStart.every((wing,i)=>
      Math.abs(wing.shoulderSweep)>Math.abs(reusableRig.landingWingEnd[i].shoulderSweep)+.2 &&
      Math.abs(wing.wristSweep)>Math.abs(reusableRig.landingWingEnd[i].wristSweep)+.1 &&
      Math.abs(wing.elbowLift-reusableRig.landingWingEnd[i].elbowLift)>.15),
      'landing flares both wing shoulders, elbows and wingtips before settling');
    assert.ok(Math.abs(reusableRig.right.roll+reusableRig.left.roll)<.000001,
      'standalone rig mirrors longitudinal bank rotation');
    assert.ok(Math.abs(reusableRig.right.wings[0]+reusableRig.left.wings[1])<.000001,
      'standalone rig mirrors opposite shoulder angles');
    assert.ok(reusableRig.right.yaw>.12&&reusableRig.left.yaw<-.12 &&
      Math.abs(reusableRig.right.yaw+reusableRig.left.yaw)<1e-8,
      'eagle-inspired turn yaws into the selected bank direction');
    assert.ok(reusableRig.right.headYaw>.08&&reusableRig.left.headYaw<-.08 &&
      Math.abs(reusableRig.right.headYaw+reusableRig.left.headYaw)<1e-8,
      'head looks into each turn and mirrors across directions');
    assert.ok(reusableRig.right.pitch<-.05&&
      Math.abs(reusableRig.right.pitch-reusableRig.left.pitch)<1e-8,
      'both banking directions use a shallow nose-down steering pitch');
    report.pauloReusableRig={panels:reusableRig.panels,joints:reusableRig.joints,
      tail:reusableRig.tail,poses:reusableRig.visits.length};
    assert.equal(await lab.evaluate(()=>window.__PAULO_LAB_QA.armorPlateCount),66,
      'dragon dorsal scales share one preallocated instanced armor batch');
    assert.deepEqual(await lab.evaluate(()=>window.__PAULO_LAB_QA.fangCounts),[12,12],
      'upper and articulated lower jaws each use one preallocated 12-fang batch');
    const tailProfile=await lab.evaluate(()=>window.__PAULO_LAB_QA.tailProfile);
    assert.equal(tailProfile.length,7,'tail retains all seven articulated links');
    assert.ok(tailProfile.every(link=>link.length>.61&&link.tipRadius>0),
      'tail frustums overlap the next pivot without thin gaps');
    assert.ok(tailProfile.every((link,i)=>i===0||link.baseRadius<tailProfile[i-1].baseRadius),
      'tail smoothly tapers toward the tip');
    assert.ok(membrane.vertices>=1092,
      'all twelve curved membrane panels retain their tessellated geometry');
    await lab.evaluate(()=>window.__PAULO_LAB_QA.setState('hover'));
    await lab.waitForTimeout(150);
    const deform=await lab.evaluate(()=>window.__PAULO_LAB_QA.membraneDeformation());
    assert.ok(Number.isFinite(deform.current)&&Math.abs(deform.current-deform.rest)>.005,
      'animated wing membranes deform an interior vertex while retaining the rest buffer');
    const poses=await lab.evaluate(()=>window.__PAULO_LAB_QA.states);
    assert.deepEqual(poses,PAULO_POSES,'lab and game adapter use identical state names');
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
    assert.ok(rightBank.rootPitch<-.05&&leftBank.rootPitch<-.05&&
      Math.abs(rightBank.rootPitch-leftBank.rootPitch)<.00001,
      'bank keeps a symmetric shallow nose-down pitch; longitudinal X remains the roll axis');
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
    // A matched top-down pair makes the newly filled upper wing easy to
    // inspect in both bank directions without perspective distortion.
    report.pauloBankReference={};
    for(const direction of ['right','left']){
      await lab.evaluate(dir=>{
        window.__PAULO_LAB_QA.setState('bank');
        const timeline=document.querySelector('#timeline');
        timeline.value='0.75';
        timeline.dispatchEvent(new Event('input',{bubbles:true}));
        const bankSelector=document.querySelector('#bank-direction');
        bankSelector.value=dir;
        bankSelector.dispatchEvent(new Event('change',{bubbles:true}));
        const viewSelector=document.querySelector('#view');
        viewSelector.value='top';
        viewSelector.dispatchEvent(new Event('change',{bubbles:true}));
      },direction);
      const bankFrame=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
      assert.equal(bankFrame.cameraType,'orthographic','bank anatomy uses top orthographic camera');
      assert.ok(Math.abs(bankFrame.time-.75)<.0001,'bank reference uses fixed 0.75-second pose time');
      assert.ok(bankFrame.referenceFrame?.maxX<.90&&bankFrame.referenceFrame?.maxY<.90,
        direction+' bank wings fit the reference camera');
      report.pauloBankReference[direction]={roll:bankFrame.rootRoll,frame:bankFrame.referenceFrame};
      await lab.screenshot({path:'qa-output/13-paulo-bank-'+direction+'.png'});
      // Top-down references show membrane coverage, but body roll projects
      // poorly from above. Matched front frames expose actual banking
      // silhouette/wing asymmetry for human visual review.
      await lab.evaluate(()=>{
        const selector=document.querySelector('#view');
        selector.value='front';
        selector.dispatchEvent(new Event('change',{bubbles:true}));
      });
      const bankFront=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
      assert.equal(bankFront.cameraType,'orthographic','front bank uses orthographic camera');
      assert.equal(bankFront.bankDirection,direction==='right'?1:-1,
        direction+' front bank retains selected turn direction');
      assert.ok(Math.abs(bankFront.time-.75)<.0001,
        direction+' front bank uses the matched pose time');
      assert.ok(bankFront.referenceFrame?.maxX<.90&&bankFront.referenceFrame?.maxY<.90,
        direction+' front bank silhouette fits the camera');
      report.pauloBankReference[direction].frontFrame=bankFront.referenceFrame;
      await lab.screenshot({path:'qa-output/14-paulo-bank-front-'+direction+'.png'});
    }
    // Preserve comparable front-view silhouette evidence in both directions.
    // Matched screenshots should not accidentally zoom or clip one bank more
    // than the other when the orthographic camera fitting code changes.
    const bankRightFrame=report.pauloBankReference.right.frontFrame;
    const bankLeftFrame=report.pauloBankReference.left.frontFrame;
    assert.ok(Math.abs(bankRightFrame.maxX-bankLeftFrame.maxX)<.025 &&
      Math.abs(bankRightFrame.maxY-bankLeftFrame.maxY)<.04,
      'matched front-bank reference framing must remain comparable');
    // A deterministic side-view frame lets reviewers judge the tucked feet,
    // not merely pass joint-angle assertions.
    await lab.evaluate(()=>{
      window.__PAULO_LAB_QA.setState('flight');
      const timeline=document.querySelector('#timeline');
      timeline.value='0.75';timeline.dispatchEvent(new Event('input',{bubbles:true}));
      const view=document.querySelector('#view');
      view.value='side';view.dispatchEvent(new Event('change',{bubbles:true}));
    });
    const tuckedFrame=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
    assert.equal(tuckedFrame.cameraType,'orthographic','flight tuck reference uses side orthographic view');
    assert.ok(tuckedFrame.referenceFrame?.maxX<.90&&tuckedFrame.referenceFrame?.maxY<.90,
      'flight tuck silhouette fits the side reference frame');
    await lab.screenshot({path:'qa-output/15-paulo-flight-tucked-side.png'});
    report.pauloFlightTuckReference=tuckedFrame.referenceFrame;
    // Matched deterministic landing pose captures the temporary wing flare.
    await lab.evaluate(()=>{
      window.__PAULO_LAB_QA.setState('land');
      const timeline=document.querySelector('#timeline');
      timeline.value='0.12';timeline.dispatchEvent(new Event('input',{bubbles:true}));
    });
    const landingFrame=await lab.evaluate(()=>window.__PAULO_LAB_QA.snapshot());
    assert.equal(landingFrame.state,'land','landing airbrake screenshot uses landing pose');
    assert.equal(landingFrame.cameraType,'orthographic','landing reference uses side orthographic view');
    await lab.screenshot({path:'qa-output/16-paulo-landing-airbrake-side.png'});
    report.pauloLandingAirbrakeReference=landingFrame.referenceFrame;
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
