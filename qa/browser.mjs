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

  for (const view of ['front', 'corner', 'roof']) {
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
  await page.locator('#graphics').selectOption('mobile');
  await page.locator('#start').click();
  await page.waitForFunction(() => window.__DD_QA.snap().active);
  await page.evaluate(() => window.__DD_QA.cinematicStage('quiet'));
  await shot('02-playing');
  report.browser = browser.version();
  const before = await snap();
  await page.keyboard.down('KeyD');
  try {
    await page.waitForFunction(x => window.__DD_QA.snap().dragon.x > x + 4, before.dragon.x);
  } finally {
    await page.keyboard.up('KeyD');
  }
  await page.evaluate(() => window.__DD_QA.move(57, 12));
  await page.waitForFunction(() => window.__DD_QA.snap().camera.scroll > 15);
  const right = await snap();
  await shot('03-pan-right');
  await page.evaluate(() => window.__DD_QA.move(-57, 12));
  await page.waitForFunction(() => window.__DD_QA.snap().camera.scroll < -15);
  const left = await snap();
  await shot('04-pan-left');
  for (const {camera} of [right, left]) {
    assert.ok(Math.abs(camera.skylineOffset - camera.scroll * .94) < .01);
    assert.ok(Math.abs(camera.foregroundOffset + camera.scroll * .035) < .01);
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
  const staged = await page.evaluate(() => window.__DD_QA.stageSchoolMeteor());
  assert.ok(staged.ok, staged.error);
  await page.waitForFunction(() => window.__DD_QA.snap().sourceSchool.strikes === 1);
  report.impact = await snap();
  assert.ok(report.impact.schoolDamage > 0);
  assert.ok(report.impact.schoolReconstruction.damaged > 0);
  assert.ok(report.impact.schoolReconstruction.detached > 0);
  assert.equal(report.impact.sourceSchool.visible, true);
  await shot('05-school-impact');
  const collapse = await page.evaluate(() => window.__DD_QA.hitSchool(100));
  assert.ok(collapse.ok, collapse.error);
  report.collapse = collapse.result;
  assert.equal(report.collapse.sourceSchool.visible, false);
  assert.equal(report.collapse.schoolReconstruction.collapsing, true);
  const reset = await page.evaluate(() => window.__DD_QA.start(1));
  assert.ok(reset.ok, reset.error);
  assert.deepEqual(reset.result.sourceSchool, {visible: true, strikes: 0});
  assert.equal(reset.result.schoolReconstruction.damaged, 0);
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = String(error.stack ?? error);
  await page?.screenshot({path: 'qa-output/failure.png', timeout: 10000}).catch(() => {});
  throw error;
} finally {
  await writeFile('qa-output/report.json', JSON.stringify(report, null, 2));
  await browser?.close();
}
