// Independent integrated architecture audit. Model provenance, fit and
// typology evidence are distinct from real-world photographic accuracy.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-architecture-output';await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={scope:'actual integrated browser geometry and provenance; typology approximations outside source school; not a survey or full photo validation',checks:[],errors:[]};
let browser,page;
async function check(name,fn){
 try{const result=await fn();report.checks.push({name,pass:true,result});console.log('PASS '+name);return result;}
 catch(e){report.checks.push({name,pass:false,error:String(e)});console.error('FAIL '+name,e);return null;}
}
async function capture(name,args){
 const png=await page.evaluate(({x,y,z,w,h,d,mode,cut})=>{
  const q=window.__DD_QA,T=window.__DD_THREE,r=window.__DD_RENDERER;
  const span=Math.max(w,h,d,8),c=new T.PerspectiveCamera(45,16/9,.1,600);
  if(mode==='roof'){c.position.set(x,y+span*1.9,z);c.up.set(0,0,-1);}
  else if(mode==='rear')c.position.set(x-span*.45,y+span*.48,z-d/2-span*1.35);
  else c.position.set(x+span*.36,y+span*.48,z+d/2+span*1.35);
  c.lookAt(x,y,z);
  // QA-only clipping, always restored; no geometry is modified.
  const old=r.clippingPlanes;
  try{
   if(Number.isFinite(cut))r.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),cut)];
   q.renderFrame(c,0);
   return r.domElement.toDataURL('image/png').split(',')[1];
  }finally{r.clippingPlanes=old;}
 },args);
 await writeFile(out+'/'+name+'.png',Buffer.from(png,'base64'));
}
try{
 const build=JSON.parse(await readFile(new URL('../build-info.json',import.meta.url),'utf8'));
 const sha=async path=>createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex');
 const provenance=await check('Original FBX and packaged school binary match declared SHA256',async()=>{
  const source=await sha(build.sources.schoolFBX.path),packaged=await sha(build.sources.schoolPlayMesh.path);
  assert.equal(source,build.sources.schoolFBX.sha256);
  assert.equal(packaged,build.sources.schoolPlayMesh.sha256);
  return {source,packaged};
 });
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(/shader error|shader compilation|WebGL context lost/i.test(m.text()))report.errors.push(m.text());});
 await page.goto(new URL('?qa=1&motion=1',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await page.evaluate(()=>{const q=window.__DD_QA;q.start(1);q.toggleFreeFlight(true);q.clearMeteors();q.repairAllBuildings();q.setMusicMuted(true);q.setSfxMuted(true);q.move(60,35);});
 const inventory=await page.evaluate(()=>{
  const q=window.__DD_QA,T=window.__DD_THREE,city=q.getCity(),s=city.buildings.find(b=>b.school);
  const model=window.__DD_SCENE.getObjectByName('ACTUAL-TECH-FREIRE-SCHOOL');
  const box=new T.Box3().setFromObject(model,true);
  const slots=q.getBuildingSlots(),models=q.northBroadModels().result.models;
  const rows=city.buildings.filter(b=>b.viewerParcel&&!b.school).map(b=>{
   const counts={};let upperSlabs=0,interiorFitting=0,interiorRejected=0;
   for(const p of b.parts){
    counts[p.type]=(counts[p.type]||0)+1;
    if(p.type==='slab'&&p.floor>0)upperSlabs++;
    if(['slab','column','partition','furniture'].includes(p.type)){if(p.interiorFits)interiorFitting++;else interiorRejected++;}
   }
   return {id:b.id,name:b.name,x:b.x,z:b.z,w:b.w,d:b.d,h:b.h,profile:b.interiorProfile,stories:b.stories,counts,upperSlabs,interiorFitting,interiorRejected,bounds:models.find(m=>m.id===b.id)?.worldBounds};
  });
  return {school:{x:s.x,z:s.z,w:s.w,d:s.d,h:s.h,bounds:{min:box.min.toArray(),max:box.max.toArray()},visible:model.visible,audit:q.snap().sourceSchool.interiorAudit,geometry:q.actualSchoolGeometry().result},slots,rows};
 });
 report.inventory=inventory;
 await check('FBX-derived source school fit, interior preservation and parcel clearance',async()=>{
  const s=inventory.school,{min,max}=s.bounds,a=s.audit;
  assert.ok(s.visible&&s.geometry.loaded);
  assert.equal(a.sourceSHA256,build.sources.schoolFBX.sha256);
  assert.equal(s.geometry.details.outputTriangles,build.sources.schoolPlayMesh.triangles);
  assert.ok(a.componentIndex.components>0);
  for(const k of ['walls','floors'])assert.ok(a.renderSimplification[k].kept>0&&a.renderSimplification[k].kept===a.renderSimplification[k].original,'Missing original '+k+' triangles');
  assert.ok(min[0]>=s.x-s.w/2-.02&&max[0]<=s.x+s.w/2+.02);
  assert.ok(min[2]>=s.z-s.d/2-.02&&max[2]<=s.z+s.d/2+.02);
  const intersections=inventory.rows.filter(r=>r.bounds&&Math.min(max[0],r.bounds.maxX)-Math.max(min[0],r.bounds.minX)>.02&&Math.min(max[2],r.bounds.maxZ)-Math.max(min[2],r.bounds.minZ)>.02);
  assert.equal(intersections.length,0,'School intersects mapped parcel bounds: '+intersections.map(r=>r.id));
  return {source:a,clearance:{min,max},intersections:intersections.map(r=>r.id)};
 });
 await check('122 unique loaded parcels with finite world-space geometry',async()=>{
  const {slots,rows}=inventory;
  assert.equal(slots.length,122);assert.equal(new Set(slots.map(s=>s.id)).size,122);
  assert.ok(slots.every(s=>s.status==='loaded'&&s.worldBounds&&Object.values(s.worldBounds).every(Number.isFinite)));
  assert.ok(rows.every(r=>r.bounds&&Object.values(r.bounds).every(Number.isFinite)));
  return {mapped:slots.length,interiorParcels:rows.length};
 });
 await check('Typology-based interiors preserve open worship and assembly volumes',async()=>{
  const rows=inventory.rows,byType={};
  for(const r of rows)(byType[r.profile.kind]??=[]).push(r);
  const halls=rows.filter(r=>['worship','assembly'].includes(r.profile.kind));
  assert.ok(halls.length>=2,'Expected church/assembly parcels');
  for(const r of halls){assert.equal(r.stories,1,r.name);assert.equal(r.upperSlabs,0,r.name);assert.ok(r.counts.furniture>0,r.name+' lacks seating');}
  assert.ok(byType.residential?.some(r=>r.stories>1&&r.upperSlabs>0));
  return {counts:Object.fromEntries(Object.entries(byType).map(([k,v])=>[k,v.length])),halls:halls.map(({id,name,profile,stories,counts})=>({id,name,profile,stories,counts})),noFittingInterior:rows.filter(r=>!r.interiorFitting).map(r=>({id:r.id,name:r.name}))};
 });
 const s=inventory.school;
 await capture('school-front',{...s,y:s.h*.47});
 await capture('school-rear',{...s,y:s.h*.47,mode:'rear'});
 for(const [i,fraction] of [.2,.42,.65,.85].entries())await capture('school-floor-section-'+(i+1),{...s,y:s.h*fraction*.55,mode:'roof',cut:s.h*fraction});
 const picks=[];
 for(const id of ['1005656','1000951','1005655','1003022','1073318']){const r=inventory.rows.find(r=>String(r.id)===id);if(r)picks.push(r);}
 for(const kind of ['assembly','residential','residence-hall']){const r=inventory.rows.find(r=>r.profile.kind===kind);if(r&&!picks.includes(r))picks.push(r);}
 for(const r of picks)await capture('parcel-'+r.id,{...r,y:r.h*.45});
 report.reviewViews=picks.map(r=>({id:r.id,name:r.name,profile:r.profile}));
 report.passed=!!provenance&&report.checks.length===4&&report.checks.every(c=>c.pass)&&!report.errors.length;
 console.log('ARCHITECTURE_SUMMARY '+JSON.stringify({checks:report.checks.map(c=>({name:c.name,pass:c.pass,error:c.error})),reviews:report.reviewViews,passed:report.passed}));
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
