import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8765/');
const allScenarios = {
  skyfall: 'Skyfall | Wide shot of falling, splitting meteors and the dragon',
  dragon: 'Dragon flight | Close-up wing strokes, direction reversal and turning posture',
  houses: 'Background houses | Three staged hits, structural debris, dust and fire (detail camera)',
  skyline: 'Skyline | Repeated Comcast Technology Center strikes, fires and smoke (detail camera)',
  traffic: 'Traffic | Night headlights, staged wind gust and live vehicle recovery',
};
// Optional focused evidence pass; default remains the complete five-clip suite.
const requested=process.env.QA_MOTION_SCENARIOS?.split(',').filter(Boolean)??Object.keys(allScenarios);
assert.ok(requested.length&&requested.every(name=>Object.hasOwn(allScenarios,name)), 'known motion scenarios only');
const scenarios=Object.fromEntries(requested.map(name=>[name,allScenarios[name]]));
const actionFrame = {skyfall: 30, dragon: 28, houses: 53, skyline: 48, traffic: 32};
const width = 960, height = 540, fps = 20, frames = 100, seed = 20261110;
const output = 'qa-output/motion';
const temporary = await mkdtemp(join(tmpdir(), 'dragon-motion-'));
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const report = {sha, seed, fps, frames, width, height, scenarios: {}, errors: [],
  reviewMethod:'Frame-by-frame deterministic replay. Automated counters verify events, but an observer must review morphology, pose, continuity and visual plausibility.'};
const ffmpeg = (...args) => execFileSync(process.env.QA_FFMPEG || 'ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', ...args,
], {stdio: 'inherit'});
const save = (name, data) => writeFile(join(output, name), data);

function checkMotion(name, samples) {
  const first = samples[0], last = samples.at(-1);
  assert.ok(Math.abs(last.elapsed - frames / fps) < 1e-6, 'simulation time matches video');
  if (name === 'skyfall') {
    assert.ok(samples[20].meteors[0].y < first.meteors[0].y - 10, 'parent visibly descends in world space');
    assert.ok(samples[26].meteors.filter(m => m.generation > 0).length >= 2, 'split creates moving fragments');
    assert.ok(samples[28].dragon[0] > first.dragon[0] + 15 && last.dragon[0] < samples[28].dragon[0] - 15,
      'dragon flies in both directions');
  } else if (name === 'dragon') {
    assert.ok(samples.every(s => s.flight?.model === 'paulo'),
      'close-up footage consistently uses the current Paulo dragon');
    assert.ok(Math.max(...samples.map(s => s.flight.x))-
      Math.min(...samples.map(s => s.flight.x))>10,
      'dragon traverses enough distance to review wing mechanics in motion');
    assert.ok(samples.every(s => Number.isFinite(s.flight.heading)),
      'turning pose retains a finite heading during both direction changes');
    assert.ok(samples.every(s => s.flight.wingJoints?.length === 2 &&
      s.flight.wingJoints.every(w => ['shoulder','elbow','wrist','spread'].every(k => Number.isFinite(w[k])))),
      'record actual, finite shoulder/elbow/wrist angles for both wing joints');
    const shoulderAngles=samples.map(s => Math.abs(s.flight.wingJoints[0].shoulder));
    assert.ok(Math.max(...shoulderAngles)-Math.min(...shoulderAngles)>.19,
      'visible primary wing beat spans a substantial range during recorded flight');
    assert.ok(samples.some(s => Math.abs(s.flight.wingJoints[0].shoulder -
      s.flight.wingJoints[0].elbow)>.08),
      'elbow beat lags shoulder instead of rotating as one rigid sail');
    assert.ok(samples.some(s => Math.abs(s.flight.wingJoints[0].wrist -
      s.flight.wingJoints[0].elbow)>.06),
      'distal wrist lags elbow for aerodynamic wing recovery');
    assert.ok(samples.filter(s => s.flight.pose === 'flight').some(s =>
      s.flight.tuckedLegs?.every(leg => leg.hip < -1.4 && leg.knee < -.85)),
      'feet fold backward toward the belly during extended forward flight');
  } else if (name === 'houses') {
    assert.equal(first.house.damage, 0);
    assert.equal(last.house.fall, 1);
    assert.ok(samples.some(({house}) => house.airborneCount > 0 && house.smallParticleCount > 0));
    assert.ok(last.house.burning && last.house.rubbleCount > 0);
  } else if (name === 'skyline') {
    assert.ok(last.tower.damage > first.tower.damage && last.tower.fireVisible && last.tower.smokeVisible);
    assert.ok(new Set(samples.slice(50).map(({tower}) => tower.combustionTime)).size > 5, 'GPU combustion time advances');
  } else {
    assert.ok(samples.some(({traffic}) => traffic.headlights && traffic.gust && traffic.hit));
    assert.ok(samples.some(({traffic}) => Math.abs(traffic.roll) > .02), 'tracked vehicle tilts');
    assert.ok(Math.abs(last.traffic.roll) < .05, 'tracked vehicle returns upright');
  }
}

await mkdir(output, {recursive: true});
let browser;
try {
  assert.ok(!process.env.EXPECTED_HEAD_SHA || sha === process.env.EXPECTED_HEAD_SHA, 'exact head checkout');
  browser = await chromium.launch({
    channel: process.env.QA_BROWSER_CHANNEL,
    executablePath: process.env.QA_BROWSER_EXECUTABLE,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  for (const name of Object.keys(scenarios)) {
    const context = await browser.newContext({viewport: {width, height}, serviceWorkers: 'block'});
    try {
      await context.addInitScript(initialSeed => {
        let state = initialSeed;
        Math.random = () => {
          state = (Math.imul(1664525, state) + 1013904223) >>> 0;
          return state / 4294967296;
        };
      }, seed);
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push({name, error: String(error)}));
      page.on('console', message => {if(message.type()==='error')report.errors.push({name,error:message.text()});});
      await page.goto(new URL('?qa=1&motion=1', base).href);
      await page.waitForFunction(() => window.__DD_MOTION && window.__DD_QA.snap().renderVisibility.actualSchoolOverlayReady,
        null, {timeout: 90000});
      await page.locator('#graphics').selectOption('mobile');
      const build = await page.evaluate(name => window.__DD_MOTION.start(name), name);
      const samples = [];
      report.scenarios[name] = {build, samples};
      for (let index = 0; index < frames; index++) {
        const {state, png} = await page.evaluate(() => window.__DD_MOTION.frame());
        samples.push(state);
        const image = Buffer.from(png, 'base64');
        await writeFile(join(temporary, `frame-${String(index).padStart(3, '0')}.png`), image);
        if (index === 0 || index === actionFrame[name] || index === frames - 1) {
          await save(`${name}-${index}.png`, image);
        }
      }
      ffmpeg('-framerate', String(fps), '-i', join(temporary, 'frame-%03d.png'), '-frames:v', String(frames),
        '-vf', `scale=${width}:${height}`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '21',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(output, `${name}.mp4`));
      checkMotion(name, samples);
      console.log(`${name}: encoded ${frames} frames and verified scenario metrics`);
    } catch (error) {
      report.errors.push({name, error: String(error)});
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(report.errors, [], 'all motion scenarios must pass');
} finally {
  await save('report.json', JSON.stringify(report, null, 2));
  await save('review-guide.md', `# Dragon Defense — motion visual review

Commit: ${sha} · ${fps} FPS · ${frames} frames per scenario · seeded ${seed}

The selected videos (${Object.keys(scenarios).join(", ")}) are **rendered gameplay**, not motion mockups. Browser QA
exercises the real update/render path at three simulation steps per recorded
frame, independent of hardware FPS.

| Clip | What to inspect closely |
| --- | --- |
| skyfall.mp4 | Meteor spawn and fragment continuity, smoke length and direction, dragon readability in wide composition |
| dragon.mp4 | Wing tuck/banking, feet while flying, believable direction reversal, frame-to-frame pose continuity |
| houses.mp4 | Staged impacts at 0.60, 1.35 and 2.10 seconds; fire/smoke anchoring, airborne masonry speed, dust and settled rubble |
| skyline.mp4 | First tower strike at 0.75 seconds, second at 2.10 seconds; fire intensity, rising soot, standing facade and repeated impact continuity |
| traffic.mp4 | Gust at 1.25 seconds, vehicle tilt/sliding, recovery, headlamp positioning and roadside dust |

A passing automated motion test proves **event sequencing and playable video
capture**, not photorealistic quality or real-time GPU performance. Visual
observations should cite clip and time interval, distinguish defects from
artistic choices, and be checked again after graphics revisions.
`);
  // Ship a self-contained offline visual player, with ¼× playback and
  // single-frame stepping; there are no CDN/runtime network dependencies.
  const playerTemplate=await readFile(new URL('./motion-reviewer.html',import.meta.url),'utf8');
  const videoCards=Object.entries(scenarios).map(([name,title])=>
    `<article data-clip="${name}"><h2>${title}</h2><video controls preload="metadata" src="${name}.mp4"></video>
    <p>Scrub this clip or select it for 20 FPS frame stepping. <a href="${name}-0.png">First frame</a> ·
    <a href="${name}-${actionFrame[name]}.png">Event frame</a> ·
    <a href="${name}-${frames-1}.png">Last frame</a></p></article>`).join('\n');
  await save('index.html',playerTemplate.replaceAll('@@SHA@@',sha).replace('@@VIDEO_CARDS@@',videoCards));
  await browser?.close();
  await rm(temporary, {recursive: true, force: true});
}
