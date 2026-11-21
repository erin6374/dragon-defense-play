import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='qa-output/cinematic',report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),views:[],errors:[]};
await mkdir(out,{recursive:true});
let browser;
try{
 assert.ok(!process.env.EXPECTED_HEAD_SHA||report.sha===process.env.EXPECTED_HEAD_SHA);
 browser=await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL,executablePath:process.env.QA_BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.addInitScript(()=>{let seed=1221237;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});
 await page.goto('http://127.0.0.1:8765/?qa=1&motion=1&hud=cinematic');
 await page.waitForFunction(()=>window.__DD_CINEMATIC_REVIEW&&window.__DD_QA.snap().renderVisibility.actualSchoolOverlayReady,null,{timeout:90000});
 // Full material/shadow preset is intentional: the gameplay motion suite also
 // retains its separate mobile-preset performance/effect coverage.
 await page.locator('#graphics').selectOption('cinematic');
 for(const [name,wave,x] of [['day',1,0],['dusk',4,0],['night',7,0],['left',4,-75],['right',4,75]]){
  const state=await page.evaluate(([w,x])=>window.__DD_CINEMATIC_REVIEW.stage(w,x),[wave,x]);
  await page.evaluate(()=>window.__DD_CINEMATIC_REVIEW.frame());
  const {png,...metrics}=await page.evaluate(()=>window.__DD_CINEMATIC_REVIEW.frame());
  assert.ok(metrics.schoolReady&&metrics.lighting.materials>10);
  assert.equal(metrics.trees,6);assert.equal(metrics.lighting.extraFramePasses,0);
  const expectedStrength=.54*(1-state.darkness)+.16*state.darkness;
  assert.ok(metrics.lighting.strengthRange.every(v=>Math.abs(v-expectedStrength)<.001),'reflection intensity never compounds across rescans');
  await writeFile(`${out}/${name}.png`,Buffer.from(png,'base64'));
  report.views.push({name,...state,...metrics});
 }
 // QA-only impact fixture: stage the skyline landmark and apply deterministic
 // contact damage before A/B capture. This does not run during gameplay.
 // Record fixture details so weak smoke coverage cannot masquerade as art approval.
 const denseFixture=await page.evaluate(()=>{
  const stage=window.__DD_CINEMATIC_REVIEW.stage(7,0);
  const impacts=[];
  const landmarks=['comcast-technology','comcast-center','one-liberty-place','city-hall'];
  for(const landmark of landmarks){
   const impact=window.__DD_QA.stageSkylineStrike(landmark);
   if(!impact?.ok||!impact.result)throw Error('QA skyline impact fixture failed: '+JSON.stringify(impact));
   const hit=impact.result;
   if(hit.landmark!==landmark)throw Error('QA skyline target mismatch: '+landmark+' / '+hit.landmark);
   impacts.push({landmark:hit.landmark,beforeDamage:hit.beforeDamage,afterDamage:hit.afterDamage,smokeVisible:hit.smokeVisible,smokeVisibleImmediately:hit.smokeVisibleImmediately});
  }
  for(let i=0;i<8;i++)window.__DD_CINEMATIC_REVIEW.frame();
  return {stage,impacts,renderWarmupFrames:8,kind:'qa_only_skyline_impact',artApproved:false};
 });
 report.denseSmokeFixture=denseFixture;
 assert.equal(new Set(denseFixture.impacts.map(hit=>hit.landmark)).size,4,'Smoke fixture must strike four distinct landmarks');
 assert.ok(denseFixture.impacts.every(hit=>hit.smokeVisible),'Dense smoke fixture has inactive skyline smoke');
 // Freeze Playwright's page clock after staging, before both synchronous renders.
 // This pins Date/performance time and suspends rAF/timers across the A/B pair.
 await page.clock.pauseAt(new Date('2026-11-19T12:00:00.000Z'));
 let smoke;
 try{
 smoke=await page.evaluate(()=>{
  const vfx=window.__DD_FIRE_VFX;
  if(!vfx?.ready)throw Error('Licensed smoke atlas not ready for A/B capture');
  const original=vfx.smokeMirror;
  const pairs=[];
  try{
   for(const enabled of [false,true]){
    vfx.setSmokeMirror(enabled);
    // Render synchronously at the same frozen browser clock.
    const capture=window.__DD_CINEMATIC_REVIEW.frame();
    pairs.push({enabled,mode:vfx.smokeMode,mirror:vfx.smokeMirror,png:capture.png});
   }
  }finally{vfx.setSmokeMirror(original);}
  return {pairs,clock:{before:performance.now(),after:performance.now(),date:Date.now()}};
 });
 }finally{await page.clock.resume();}
 // Independent smoke OFF/ON comparison; mirror variation is not smoke coverage.
 // The opacity pair must redraw the existing scene, not advance the simulation.
 let opacityPair;
 await page.clock.pauseAt(new Date('2026-11-19T12:00:00.000Z'));
 try{
  opacityPair=await page.evaluate(()=>{
   const vfx=window.__DD_FIRE_VFX, captures=[];
   if(vfx.smokeQaOpacity!==1)throw Error('Smoke QA opacity default must be 1');
   const originalMirror=vfx.smokeMirror, originalMode=vfx.smokeMode;
   const before=performance.now();
   try{
    for(const opacity of [0,1]){
     vfx.setSmokeQaOpacity(opacity);
     const capture=window.__DD_CINEMATIC_REVIEW.renderOnly();
     const pools=window.__DD_COMBUSTION_QA;
     if(!Array.isArray(pools)||pools.length===0)throw Error('No combustion QA pools registered');
     captures.push({opacity,png:capture.png,clock:performance.now(),mode:vfx.smokeMode,mirror:vfx.smokeMirror,
      combustion:pools.map(pool=>pool.snapshot())});
    }
   }finally{vfx.setSmokeQaOpacity(1);}
   return {captures,restored:vfx.smokeQaOpacity,clock:{before,after:performance.now()},originalMirror,originalMode};
  });
 }finally{await page.clock.resume();}
 assert.equal(opacityPair.restored,1);
 assert.equal(opacityPair.clock.before,opacityPair.clock.after,'Smoke opacity A/B browser clock advanced');
 assert.ok(opacityPair.captures.every(c=>c.clock===opacityPair.clock.before),'Smoke opacity captures have unequal browser timestamps');
 assert.ok(opacityPair.captures.every(c=>c.mode===opacityPair.originalMode&&c.mirror===opacityPair.originalMirror),'Smoke opacity comparison changed plume mode or mirroring');
 assert.deepEqual(opacityPair.captures[0].combustion,opacityPair.captures[1].combustion,
  'Smoke opacity comparison advanced GPU clock, source buffers, pool counters or instance counts');
 assert.ok(opacityPair.captures[0].combustion.some(pool=>pool.activeCount>0),
  'Smoke opacity comparison lacks active combustion sources');
 report.smokeOpacityComparison={captures:[],controls:'QA-only smoke fragment alpha 0/1, verified identical browser timestamps, GPU clock, source buffers, pool counters, instance counts and plume mode/mirror; original opacity restored',limitation:'Read-only CPU-side GPU uniform and source-buffer snapshots match; actual GPU execution is not independently frozen. Pixel delta is not art approval or Windows FPS'};
 for(const c of opacityPair.captures){
  const filename='smoke-opacity-'+(c.opacity?'on':'off')+'.png',bytes=Buffer.from(c.png,'base64');
  await writeFile(`${out}/${filename}`,bytes);
  report.smokeOpacityComparison.captures.push({opacity:c.opacity,filename,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 assert.notEqual(report.smokeOpacityComparison.captures[0].sha256,report.smokeOpacityComparison.captures[1].sha256,'Smoke opacity images are identical');
 assert.equal(smoke.pairs.length,2);
 assert.equal(smoke.clock.before,smoke.clock.after,'A/B browser clock advanced');
 const smokeEvidence=[];
 for(const pair of smoke.pairs){
  assert.equal(pair.mirror,pair.enabled,'smoke mirror toggle did not apply');
  assert.equal(pair.mode,'plume','A/B must use licensed plume mode');
  const bytes=Buffer.from(pair.png,'base64');
  assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Smoke A/B capture is not a PNG');
  const filename=`smoke-mirror-${pair.enabled?'on':'off'}.png`;
  await writeFile(`${out}/${filename}`,bytes);
  smokeEvidence.push({enabled:pair.enabled,filename,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 report.smokeComparison={captures:smoke.pairs.map(({enabled,mode,mirror})=>({enabled,mode,mirror})),clock:smoke.clock,
  evidence:smokeEvidence,pngBytesIdentical:smokeEvidence[0].sha256===smokeEvidence[1].sha256,
  controls:'Same browser, seeded Math.random, QA-only wave-7 four-impact skyline fixture and camera; Playwright page clock paused for both synchronous renders; smoke uniform only toggled',
  limitation:'Browser clock is paused but renderer-internal counters may still change between sequential calls. Compare actual images; not art approval or physical FPS evidence.'};
 assert.notEqual(smokeEvidence[0].sha256,smokeEvidence[1].sha256,'Smoke A/B produced byte-identical PNGs; mirror toggle may be invisible or scene lacks smoke');
 // Decode both captures in the browser to quantify actual changed pixels, not merely PNG byte changes.
 // This is evidence of visible variation, NOT a smoke segmentation or art-approval metric.
 const comparePixels=async pairs=>page.evaluate(async pairs=>{
  const read=async base64=>{
   const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
   const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
   const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(bitmap,0,0);bitmap.close();
   return {width:canvas.width,height:canvas.height,pixels:ctx.getImageData(0,0,canvas.width,canvas.height).data};
  };
  const a=await read(pairs[0].png),b=await read(pairs[1].png);
  if(a.width!==b.width||a.height!==b.height)throw Error('Smoke A/B dimensions differ');
  let changed=0,channelDelta=0;
  let minX=a.width,minY=a.height,maxX=-1,maxY=-1;
  const tilesX=8,tilesY=6,changedByTile=Array(tilesX*tilesY).fill(0);
  for(let i=0;i<a.pixels.length;i+=4){
   const d0=Math.abs(a.pixels[i]-b.pixels[i]),d1=Math.abs(a.pixels[i+1]-b.pixels[i+1]),d2=Math.abs(a.pixels[i+2]-b.pixels[i+2]);
   if(d0||d1||d2||a.pixels[i+3]!==b.pixels[i+3]){
    changed++;const pixel=i/4,x=pixel%a.width,y=Math.floor(pixel/a.width);
    minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    changedByTile[Math.min(tilesY-1,Math.floor(y*tilesY/a.height))*tilesX+Math.min(tilesX-1,Math.floor(x*tilesX/a.width))]++;
   }
   channelDelta+=d0+d1+d2;
  }
  const total=a.width*a.height;
  return {width:a.width,height:a.height,totalPixels:total,changedPixels:changed,changedPixelFraction:changed/total,meanRgbChannelDelta:channelDelta/(total*3),changedBounds:changed?{minX,minY,maxX,maxY}:null,changedByTile:{columns:tilesX,rows:tilesY,counts:changedByTile}};
 },pairs.map(({png})=>({png})));
 const pixelComparison=await comparePixels(smoke.pairs);
 const opacityPixels=await comparePixels(opacityPair.captures);
 report.smokeOpacityComparison.pixelComparison=opacityPixels;
 assert.ok(opacityPixels.changedPixels>0,'Smoke opacity decoded pixels are identical');
 report.smokeComparison.pixelComparison=pixelComparison;
 report.smokeComparison.visualCoverageAssessment={status:pixelComparison.changedPixelFraction>=0.02?'comparison_has_material_change_not_art_approved':'insufficient_visible_ab_change_for_art_review',minimumProxyFraction:0.02,notes:'A/B pixel change is only a visibility proxy, NOT smoke segmentation; spatial tile counts and bounds help reviewers locate actual differences. Artistic acceptance remains manual.'};
 assert.ok(pixelComparison.changedPixels>0,'Smoke A/B has different PNG bytes but identical decoded pixels');
 const day=report.views.find(v=>v.name==='day'),night=report.views.find(v=>v.name==='night');
 assert.ok(night.sun<day.sun*.3&&night.ambient<day.ambient*.65,'night illumination is materially darker than daylight');
 assert.deepEqual(report.errors,[]);
}catch(error){report.errors.push(String(error));process.exitCode=1;}
finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();}
