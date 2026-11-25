// Thirty seconds of actual, fixed-step gameplay for cinematic building-fire review.
// This is an additional visual-evidence artifact, not a substitute for the five
// existing scenarios or for a human watching the full clip.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8765/');
const width=960, height=540, fps=20, frames=600, seed=20261110;
const output='qa-output/motion';
const temporary=await mkdtemp(join(tmpdir(),'dragon-long-fire-'));
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const report={sha,seed,width,height,fps,frames,durationSeconds:frames/fps,
  scenario:'skyline',source:'actual browser-rendered fixed-step game frames',
  observations:'Human review required; success does not establish cinematic quality',
  samples:[],errors:[]};
let browser,context;
try{
 assert.ok(!process.env.EXPECTED_HEAD_SHA||sha===process.env.EXPECTED_HEAD_SHA,'exact-head checkout');
 await mkdir(output,{recursive:true});
 browser=await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL,
  executablePath:process.env.QA_BROWSER_EXECUTABLE,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
 await context.addInitScript(initialSeed=>{
  let state=initialSeed;
  Math.random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 },seed);
 const page=await context.newPage();
 page.on('pageerror',error=>report.errors.push(String(error)));
 page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
 await page.goto(new URL('?qa=1&motion=1',base).href);
 await page.waitForFunction(()=>window.__DD_MOTION&&window.__DD_QA.snap().renderVisibility.actualSchoolOverlayReady,
  null,{timeout:90000});
 await page.locator('#graphics').selectOption('mobile');
 report.build=await page.evaluate(()=>window.__DD_MOTION.start('skyline'));
 let burningFrames=0,maxDrawCalls=0,multiTowerFrames=0;
 for(let index=0;index<frames;index++){
  const {state,png}=await page.evaluate(()=>window.__DD_MOTION.frame());
  if(state.tower?.fireVisible)burningFrames++;
  if((state.skylineFires?.length||0)>=2)multiTowerFrames++;
  maxDrawCalls=Math.max(maxDrawCalls,state.drawCalls);
  if(index%20===0||index===frames-1)report.samples.push({
   frame:index,seconds:+state.elapsed.toFixed(2),drawCalls:state.drawCalls,
   towerDamage:state.tower?.damage,fireVisible:state.tower?.fireVisible,
   smokeVisible:state.tower?.smokeVisible,combustionTime:state.tower?.combustionTime,
   burningTowerIds:state.skylineFires
  });
  const image=Buffer.from(png,'base64');
  await writeFile(join(temporary,'long-'+String(index).padStart(4,'0')+'.png'),image);
  if([0,60,120,240,360,480,599].includes(index))
   await writeFile(join(output,'skyline-long-'+index+'.png'),image);
 }
 report.burningFrames=burningFrames;
 report.multiTowerFrames=multiTowerFrames;
 report.maxDrawCalls=maxDrawCalls;
 assert.equal(report.samples.at(-1).frame,599);
 assert.ok(Math.abs(report.samples.at(-1).seconds-30)<.06,'capture covers 30 simulation seconds');
 assert.ok(burningFrames>100,'multi-window fires visible for a substantial part of the recording');
 assert.ok(multiTowerFrames>100,'30-second recording shows at least two concurrently burning skyline facades');
 execFileSync(process.env.QA_FFMPEG||'ffmpeg',[
  '-hide_banner','-loglevel','error','-y','-framerate',String(fps),
  '-i',join(temporary,'long-%04d.png'),'-frames:v',String(frames),
  '-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p',
  '-movflags','+faststart',join(output,'skyline-long.mp4')
 ],{stdio:'inherit'});
 await writeFile(join(output,'skyline-long-review.html'),
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>30-second facade fire review</title>'+
  '<body style="background:#151a22;color:#eee;font:16px system-ui;max-width:1100px;margin:auto">'+
  '<h1>30-second actual-gameplay skyline fire</h1><p>Exact SHA: '+sha+
  '. Watch at 1x and 0.25x; scrub 0–30 seconds to find repeated patterns, opacity pops, '+
  'flame and smoke anchoring, facade glow and distant LOD artifacts.</p>'+
  '<video controls preload="metadata" style="width:100%" src="skyline-long.mp4"></video></body></html>');
 assert.deepEqual(report.errors,[],'no browser console/page errors');
} catch(error){
 report.errors.push(String(error));
 throw error;
} finally{
 await mkdir(output,{recursive:true});
 await writeFile(join(output,'long-fire-report.json'),JSON.stringify(report,null,2));
 await context?.close();
 await browser?.close();
 await rm(temporary,{recursive:true,force:true});
}
