// Visible, native paired performance acceptance. Requires Windows, Git,
// Node, and local Playwright + installed Edge or Chrome. No motion=1,
// forced dt, simulation acceleration, software rendering or remote machine.
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {summarizeNativeCase} from './park13-native-metrics.mjs';
import {evaluatePark13Release} from './park13-release-gate.mjs';
import {selectPark13NativeTargets} from './park13-native-targets.mjs';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const [expected,output='park13-integration-output']=process.argv.slice(2);
if(!/^[a-f0-9]{40}$/.test(expected??''))throw Error('Usage: node qa/park13-native-browser.mjs <exact-candidate-sha> [evidence-directory]');
const out=resolve(root,output);await mkdir(out,{recursive:true});
const report={source:expected,passed:false,renderer:null,preset:'Balanced',fpsCap:45,viewport:{width:1280,height:720},cases:[],errors:[],started:new Date().toISOString()};
const save=()=>writeFile(resolve(out,'native.json'),JSON.stringify(report,null,2)+'\n');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const mime={'.bin':'application/octet-stream','.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.wasm':'application/wasm','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=createServer(async(req,res)=>{
 try{
  const pathName=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=resolve(root,'.'+pathName);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  const info=await stat(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store'});
  createReadStream(file).pipe(res);
 }catch{res.writeHead(404).end();}
});
let browser,activePage;
const watchdog=setTimeout(()=>{report.errors.push('Native QA watchdog timeout');report.passed=false;save().finally(()=>process.exit(2));},20*60*1000);
try{
 check(process.platform==='win32','Native acceptance requires Windows target hardware');
 check(git(['rev-parse','HEAD'])===expected,'Checked out SHA differs from candidate');
 check(!git(['status','--porcelain','--untracked-files=no']),'Tracked source has local modifications');
 const modulePath=process.env.PLAYWRIGHT_MODULE;
 const playwright=modulePath?await import(pathToFileURL(resolve(modulePath)).href):await import('playwright');
 const channel=process.env.QA_BROWSER_CHANNEL||'msedge';
 check(['msedge','chrome'].includes(channel),'Use installed native Edge or Chrome');
 browser=await playwright.chromium.launch({headless:false,channel});
 report.browser=browser.version();
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 const base='http://127.0.0.1:'+server.address().port;
 // Matched bombardment targets are derived once from pinned GIS geometry,
 // not from the enabled page, so both configurations receive the same drops.
 const manifests=await Promise.all(['park13-GIS-precise-20261127.json','park13-southern-20261127.json'].map(async name=>JSON.parse(await readFile(resolve(root,'broad-street/park13-integration',name),'utf8'))));
 const targets=selectPark13NativeTargets(...manifests.map(m=>m.records));
 report.bombardmentTargets=targets;
 for(const expansion of [false,true]){
  const page=activePage=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1,serviceWorkers:'block'});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(/shader error|shader compilation|program not valid|GL_INVALID_OPERATION|WebGL context lost/i.test(m.text()))errors.push(m.text());});
  await page.goto(base+'/?qa=1&benchmark=1&park13='+(expansion?1:0),{waitUntil:'domcontentloaded',timeout:90000});
  await page.bringToFront();
  await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady&&window.__DD_BENCHMARK,undefined,{timeout:180000});
  const gpu=await page.evaluate(()=>{const gl=window.__DD_RENDERER.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {unmasked:!!ext,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};});
  check(gpu.unmasked&&/RTX\s*3060/i.test(gpu.renderer)&&!/swiftshader|llvmpipe|software|warp|microsoft basic render/i.test(gpu.renderer),'Target native RTX 3060 not verified: '+gpu.renderer);
  check(!report.renderer||report.renderer===gpu.renderer,'GPU backend changed between configurations');report.renderer=gpu.renderer;
  const setup=await page.evaluate(()=>{
   const q=window.__DD_QA,b=window.__DD_BENCHMARK;
   b.reseed(20261128);window.startSandboxDirect();q.toggleDragon(true);q.setSfxMuted?.(true);q.setMusicMuted?.(true);
   const select=document.getElementById('graphics');if(select){select.value='balanced';select.dispatchEvent(new Event('change'));}
   b.setCap(45);q.setTimeScale(1);return {settings:b.state(),expansion:q.park13ExpansionStats(),bounds:q.inspectionBounds()};
  });
  check(setup.settings.preset==='balanced'&&setup.settings.fpsCap===45,'Preset or cap not applied');
  check(expansion?setup.expansion?.buildings===165:setup.expansion===null,'Opt-in setting incorrect');
  await page.waitForFunction(()=>{const s=window.__DD_QA.snap();return s.active&&!s.paused&&s.campaign.freeFlightMode&&s.campaign.dragonEnabled;},undefined,{timeout:90000});
  await page.waitForTimeout(10000);
  const readState=()=>page.evaluate(()=>window.__DD_BENCHMARK.park13Probe());
  const trace=[];
  await page.evaluate(()=>window.__DD_BENCHMARK.start('traverse'));
  for(const [key,target,dir] of [['KeyD',setup.bounds.maxX-1,1],['KeyA',setup.bounds.minX+1,-1]]){
   const before=await readState();let v=before;trace.push({key,target,...v});
   await page.keyboard.down(key);
   try{for(let i=0;i<150&&dir*(v.x-target)<-.5;i++){
    const prior=v;await page.waitForTimeout(1000);v=await readState();trace.push({key,target,...v});
    check(v.active&&!v.paused&&v.free&&v.dragonEnabled&&v.focused&&!v.contextLost&&v.contextEvents===0,'Traversal interrupted, unfocused or context lost');
    check(v.frames>prior.frames&&v.elapsed>prior.elapsed,'Traversal animation stopped');
    check(dir*(v.x-prior.x)>=-2&&Math.abs(v.x-prior.x)<=22*(v.elapsed-prior.elapsed)+2,'Unexpected traversal position discontinuity');
   }}finally{await page.keyboard.up(key);}
   check(dir*(v.x-target)>=-.5,'Traversal failed to reach '+target+' at '+v.x);
  }
  const traversal=await page.evaluate(()=>window.__DD_BENCHMARK.stop());
  const traversalCase=summarizeNativeCase('traverse',expansion,traversal,true);
  report.cases.push(traversalCase);
  await writeFile(resolve(out,(expansion?'on':'off')+'-native-traverse.json'),JSON.stringify({source:expected,trace,raw:traversal},null,2));await save();
  await page.evaluate(()=>{const q=window.__DD_QA;q.repairAllBuildings();q.toggleDragon(false);window.__DD_BENCHMARK.reseed(20261128);});
  await page.waitForTimeout(10000);
  const drops=[];await page.evaluate(()=>window.__DD_BENCHMARK.start('bombardment'));
  for(const target of targets){
   const drop=await page.evaluate(t=>window.__DD_BENCHMARK.park13Drop(t.x,t.z,4),target);
   check(Math.abs(drop.x-target.x)<.01&&drop.spawned>0,'Bombardment target out of reach or drop failed');
   await page.waitForTimeout(2000);const probe=await readState();
   check(probe.active&&!probe.paused&&probe.free&&probe.focused&&!probe.contextLost&&probe.contextEvents===0,'Bombardment interrupted or unfocused');
   drops.push({target,drop,probe});
  }
  await page.waitForTimeout(6000);
  const bombardment=await page.evaluate(()=>({raw:window.__DD_BENCHMARK.stop(),expansion:window.__DD_QA.park13ExpansionStats(),probe:window.__DD_BENCHMARK.probe()}));
  const endProbe=await readState();
  const completed=drops.length===targets.length&&(!expansion||bombardment.expansion?.damaged>=targets.length)&&endProbe.testMeteors===0&&!endProbe.contextLost&&endProbe.contextEvents===0;
  report.cases.push(summarizeNativeCase('bombardment',expansion,bombardment.raw,completed));
  await writeFile(resolve(out,(expansion?'on':'off')+'-native-bombardment.json'),JSON.stringify({source:expected,targets,drops,endProbe,...bombardment},null,2));
  check(!errors.length,'Browser errors: '+errors.join('; '));await save();await page.close();activePage=null;
 }
 check(git(['rev-parse','HEAD'])===expected&&!git(['status','--porcelain','--untracked-files=no']),'Source changed during native run');
 report.passed=true;
 report.passed=evaluatePark13Release(expected,{native:report}).gates.find(g=>g.name==='native').passed;
}catch(e){report.errors.push(String(e));report.passed=false;}
finally{
 clearTimeout(watchdog);report.finished=new Date().toISOString();await save();
 if(activePage)await activePage.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});server.close();
 console.log('PARK13_NATIVE '+JSON.stringify(report));if(!report.passed)process.exitCode=1;
}
