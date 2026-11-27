// Run from repository root: node tests/integration-preview-regressions.mjs
// Deterministic data and logic tests; no WebGL or browser is required.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import * as Three from '../vendor/three/build/three.module.js';
import {createCrowdRenderer} from '../src/rendering/crowd-renderer.js';
import {buildPerson,animatePerson} from '../src/rendering/realistic-vehicles.js';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const load=(path,params={},exports=[])=>{
 const source=read(path).replace(/^\uFEFF/,'').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'').replace(/import\.meta\.url/g,JSON.stringify(root.href));
 return new Function(...Object.keys(params),source+'\nreturn {'+exports.join(',')+'}')( ...Object.values(params));
};
let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const district=load('broad-street/district.js',{},['buildings','roads']);
const grid=load('broad-street/broad-street-grid-data.mjs',{},['JUNCTIONS','curbAt','BROAD_EXTENTS']);
const parcels=load('src/simulation/viewer-parcels.js',{buildings:district.buildings},['viewerParcels','containsParcel','touchesParcel','VIEWER_TO_GAME_X','VIEWER_TO_GAME_Z']);
const roads=load('src/simulation/road-corridors.js',{...grid,...parcels},['CROSS_STREETS','CROSS_STREET_X','BROAD_LANES','BROAD_X','isBroadRoad']);
const list=parcels.viewerParcels(JSON.parse(read('broad-street/mapped-data.json')).rows);
test('Unique valid parcel inventory',()=>{assert.equal(new Set(list.map(p=>p.id)).size,list.length);assert.ok(list.length>=122);assert.ok(list.every(p=>p.w>0&&p.d>0&&p.h>0));});
const route=load('src/simulation/responder-routing.js',{roads:district.roads,...roads,...parcels},['planResponderRoute','hoseReach','forcedVehicleRole']);
test('Explicit responder roles',()=>{for(const type of ['fireTruck','police','ambulance','bus'])assert.equal(route.forcedVehicleRole(type),type);});
test('Rear-block response follows mapped road graph',()=>{const fire={x:0,y:4,z:-52},p=route.planResponderRoute({x:-150,y:0,z:10},1,10,fire);assert.ok(p&&p.waypoints.length>2);assert.ok(route.hoseReach({...p.staging,y:0},fire));});
test('Unreachable fire is rejected',()=>assert.equal(route.planResponderRoute({x:0,y:0,z:10},1,10,{x:0,y:8,z:500}),null));
const lane=load('src/simulation/lane-safety.js',roads,['adjacentLane','choosePassingLane']);
const car={root:{position:{x:0,z:10}},laneZ:10,dir:1,length:4,speed:7,desiredSpeed:10};
test('Detour stays in direction of travel',()=>{assert.equal(lane.adjacentLane(10,1),13.5);assert.equal(lane.adjacentLane(23,-1),19);assert.equal(lane.adjacentLane(10,1,true),null);});
test('Two hazards prevent unsafe lane change',()=>assert.equal(lane.choosePassingLane(car,[car],[{x:12,z:10,radius:1,life:1},{x:18,z:13.5,radius:1,life:1}]),null));
const game=read('src/game.js');

test('Campaign and Sandbox flight reach both ends of imported Broad Street',()=>{
 const roadXs=district.roads.flatMap(([,points])=>points.map(([x])=>x+parcels.VIEWER_TO_GAME_X));
 const inspectionBounds={
  minX:Math.min(...roadXs,...list.map(b=>b.x-b.w/2))-6-105,
  maxX:Math.max(...roadXs,...list.map(b=>b.x+b.w/2))+24
 };
 const start=game.indexOf('function clampDragonX('),end=game.indexOf('function perchDragon(',start);
 assert.ok(start>=0&&end>start);
 const source=game.slice(start,end);
 const southEnd=grid.BROAD_EXTENTS[1]+parcels.VIEWER_TO_GAME_X;
 const northEnd=grid.BROAD_EXTENTS[0]+parcels.VIEWER_TO_GAME_X;
 for(const freeFlightMode of [false,true]){
  const flight=new Function('neighborhood','THREE','freeFlightMode',source+'\nreturn {clampDragonX,isDragonAtBoardEdge};')({inspectionBounds},Three,freeFlightMode);
  assert.equal(flight.clampDragonX(southEnd),southEnd);
  assert.equal(flight.clampDragonX(northEnd),northEnd);
  assert.equal(flight.clampDragonX(Infinity),inspectionBounds.maxX);
  assert.equal(flight.clampDragonX(-Infinity),inspectionBounds.minX);
  assert.equal(flight.isDragonAtBoardEdge(380),false);
  assert.equal(flight.isDragonAtBoardEdge(inspectionBounds.maxX),true);
  assert.equal(flight.isDragonAtBoardEdge(inspectionBounds.minX),true);
 }
});

const budgetStart=game.indexOf('function schoolMeteorBudget'),budgetEnd=game.indexOf('function carveSchool',budgetStart);
assert.ok(budgetStart>=0&&budgetEnd>budgetStart);
const damage=new Function(game.slice(budgetStart,budgetEnd)+'\nreturn {schoolMeteorBudget,penetrationDamageStep}')();
test('School meteor budgets bounded between 5 and 15 percent for damaging rocks',()=>{assert.equal(damage.schoolMeteorBudget(1.35),.05);assert.equal(damage.schoolMeteorBudget(1.1),0);for(let n=1.35;n<=20;n+=.1)assert.ok(damage.schoolMeteorBudget(n)>=.05&&damage.schoolMeteorBudget(n)<=.150000001);});
test('Penetration spends budget once at any tested step size',()=>{for(const size of [1.35,2,2.8,3.6,13])for(const delta of [.01,.3,2,30]){const budget=damage.schoolMeteorBudget(size);let y=16,remaining=budget;while(y>-.8){const next=Math.max(-.8,y-delta);remaining-=damage.penetrationDamageStep(budget,remaining,16,-.8,y,next);y=next;}assert.ok(Math.abs(remaining)<1e-9);}});
test('No global partial-damage floor clipping',()=>{const shader=read('src/rendering/school-source-damage.js');assert.ok(!shader.includes('collapseCutoff'));assert.ok(shader.includes('schoolDestructionRatio>=1.0'));});
test('Water-only preset is independent of subway breach',()=>assert.ok(game.includes('addCrater(0,BROAD_CENTER,4.5,{waterOnly:true})')));
const collision=load('src/simulation/meteor-collision.js',{containsParcel:parcels.containsParcel},['traceMeteorCollision']);
const school={min:{x:-13.5,z:-58.4},max:{x:13.5,z:.4,y:28}};
test('Every mapped building owns its vertical roof collision',()=>{
 for(const b of list){
  let sample=null;
  for(let u=1;u<20&&!sample;u++)for(let v=1;v<20&&!sample;v++){
   const x=b.x-b.w/2+b.w*u/20,z=b.z-b.d/2+b.d*v/20;
   if(parcels.containsParcel(b,x,z)&&!list.some(q=>q!==b&&parcels.containsParcel(q,x,z)))sample={x,z};
  }
  assert.ok(sample,'exclusive footprint sample for '+b.id);
  const hit=collision.traceMeteorCollision({...sample,y:b.h+35},{...sample,y:-2},list,school);
  assert.equal(hit?.building?.id,b.id);
  assert.ok(Math.abs(hit.point.y-b.h)<1e-6);
 }
});
test('Fast diagonal meteor hits facade even with endpoint beyond building',()=>{
 const b={id:'test',x:14,z:-10,w:5,d:12,h:8,damage:0};
 const hit=collision.traceMeteorCollision({x:5,y:7,z:-10},{x:25,y:3,z:-10},[b],school,false);
 assert.equal(hit?.building?.id,b.id);
});
test('Ground and collapsed building collision',()=>{
 const b={id:'test',x:14,z:-10,w:5,d:12,h:8,damage:1};
 assert.equal(collision.traceMeteorCollision({x:14,y:30,z:-10},{x:14,y:0,z:-10},[b],school).kind,'ground');
});
test('Penetration budget does not double-charge measured structural damage',()=>{
 const line=game.match(/b\.damage=Math\.max\(b\.damage\|\|0,Math\.min\(1\.0,m\.crunchInitialDamage\+m\.crunchDamageDealt\)\);/);
 assert.ok(line);
 const apply=new Function('b','m',line[0]+'return b.damage;');
 const b={damage:.3},m={crunchInitialDamage:.1,crunchDamageDealt:.2};
 assert.ok(Math.abs(apply(b,m)-.3)<1e-8);
 m.crunchDamageDealt=.5;
 assert.ok(Math.abs(apply(b,m)-.6)<1e-8);
 assert.ok(Math.abs(apply(b,m)-.6)<1e-8);
 b.damage=.8;assert.equal(apply(b,m),.8);
});
test('Forced damage detaches only its missing quota, without premature flattening',()=>{
 const structural=read('src/rendering/structural-city.js');
 const start=structural.indexOf(' function forceDamage('),end=structural.indexOf(' function update(',start);
 assert.ok(start>=0&&end>start);
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}}
 let detaches=0;
 const force=new Function('THREE','detach',structural.slice(start,end)+'return forceDamage;')({Vector3:V},p=>{p.state='falling';detaches++;});
 const parts=Array.from({length:100},(_,i)=>({type:'wall',state:i<20?'settled':'attached',original:{position:new V(i%5,i%10,0)},position:new V(i%5,i%10,0)}));
 const b={x:0,z:0,w:10,h:10,d:10,damage:.2,pressure:.2,structuralParts:parts,parts};
 force(b,.5);assert.equal(detaches,30);
 force(b,.5);assert.equal(detaches,30);
 force(b,.9);assert.equal(parts.filter(p=>p.state==='attached').length,10);
 force(b,1);assert.equal(detaches,80);
 force(b,1);assert.equal(detaches,80);
});
test('Structural support queue drains after stable damage and retains delayed failures',()=>{
 const structural=read('src/rendering/structural-city.js');
 const start=structural.indexOf(' function scheduleSupport('),end=structural.indexOf(' function detach(',start);
 const a=structural.indexOf(' function update(dt)'),b=structural.indexOf('  for(const p of moving)',a);
 assert.ok(start>=0&&end>start&&a>=0&&b>a);
 const code=structural.slice(start,end)+structural.slice(a,b)+'\n}';
 const env=new Function('supportedFloors',
  "let time=0,supportPasses=0;const supportWork=new Set();function detach(p){if(p.state!=='attached')return 0;p.state='falling';scheduleSupport(p.building);return 1;}function forceDamage(b,value){b.damage=value;for(const p of b.parts)detach(p);}"+code+
  'return {scheduleSupport,update,state:()=>({supportPasses,pending:supportWork.size})}'
 )((parts,stories)=>Array(stories).fill(parts.some(p=>p.type==='column'&&p.state==='attached')));
 const mk=()=>{const b={school:false,h:6,stories:1,damage:0,pressure:.4,collapseClock:0,supportRevision:0,parts:[],sections:[],slabs:[]};
  b.parts=[{type:'column',state:'attached',floor:0,building:b,original:{position:{y:1}},position:{}},{type:'wall',state:'attached',floor:0,building:b,original:{position:{y:1}},position:{}}];b.structuralParts=b.parts;return b;};
 const one=mk();env.scheduleSupport(one);env.update(.3);assert.equal(env.state().pending,0);assert.equal(env.state().supportPasses,1);
 for(let i=0;i<100;i++)env.update(.1);assert.equal(env.state().supportPasses,1);
 one.parts[0].state='removed';env.scheduleSupport(one);env.update(.3);assert.equal(env.state().pending,1);assert.equal(one.parts[1].state,'attached');
 for(let i=0;i<20;i++)env.update(.3);assert.equal(one.parts[1].state,'falling');assert.equal(env.state().pending,0);
 for(let i=0;i<122;i++)env.scheduleSupport(mk());env.update(.3);const passes=env.state().supportPasses;
 for(let i=0;i<40;i++)env.update(.25);assert.equal(env.state().supportPasses,passes);assert.equal(env.state().pending,0);
});
test('Floor-indexed nearest supports match the original stable sort',()=>{
 const {nearestSupports}=load('src/simulation/structural-dynamics.js',{},['nearestSupports']);
 const vec=(x,y,z)=>({x,y,z,distanceToSquared(p){return (x-p.x)**2+(y-p.y)**2+(z-p.z)**2;}});
 const cols=Array.from({length:120},(_,i)=>({id:i,floor:i%5,position:vec(i%7,i%5*5,Math.floor(i/7)%4)}));
 const groups=Array.from({length:5},(_,f)=>cols.filter(c=>c.floor===f));
 for(let i=0;i<500;i++){
  const part={floor:i%5,type:i%2?'column':'wall',position:vec(i%13,i%8,i%9)};
  const floor=part.type==='column'&&part.floor>0?part.floor-1:part.floor;
  const expected=cols.filter(c=>c.floor===floor).sort((a,b)=>a.position.distanceToSquared(part.position)-b.position.distanceToSquared(part.position)).slice(0,2);
  assert.equal(nearestSupports(part,groups).map(c=>c.id).join(','),expected.map(c=>c.id).join(','));
 }
 assert.equal(nearestSupports({floor:8,type:'wall',position:vec(0,0,0)},groups).length,0);
});
test('Rubble writes are batched and capped',()=>{
 const a=game.indexOf('let rubbleDirty=false;'),b=game.indexOf('const crashedWrecks',a);
 const p=game.indexOf('function preserveRubble('),q=game.indexOf('function settleMeteorAsPermanentSlag',p);
 assert.ok(a>=0&&b>a&&p>=0&&q>p);
 let builds=0,adds=0;
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 const api=new Function('THREE','rubblePool','scene','MAX_RUBBLE','const settledRubble=[];'+game.slice(a,b)+game.slice(p,q)+'return {preserveRubble,refreshRubble,settledRubble};')({Vector3:V},{begin(){builds++;},add(){adds++;},end(){}},{remove(){}},220);
 for(let i=0;i<50;i++)api.preserveRubble({position:{x:i,y:0,z:0},scale:.4});
 assert.equal(builds,0);api.refreshRubble();assert.equal(builds,1);assert.equal(adds,50);
 api.refreshRubble();assert.equal(builds,1);
 for(let i=0;i<300;i++)api.preserveRubble({position:{x:i,y:0,z:0},scale:.4});
 api.refreshRubble();assert.equal(api.settledRubble.length,220);assert.equal(adds,270);
});
test('Barrage scheduler enforces a global cap and cancels pending launches',()=>{
 const a=game.indexOf('const pendingBarrageTimers=new Set();'),b=game.indexOf('let dragonEnabled',a);
 assert.ok(a>=0&&b>a);let serial=0,spawned=0;const timers=new Map();
 const api=new Function('setTimeout','clearTimeout','sandboxReticle','dragon','spawnTestMeteorAt','sound','message',game.slice(a,b)+'return {spawnMeteorBarrage,clearPendingBarrages,pending:()=>pendingBarrageTimers.size};')((fn)=>{timers.set(++serial,fn);return serial;},id=>timers.delete(id),{visible:false},null,()=>spawned++,()=>{},()=>{});
 api.spawnMeteorBarrage(100,0,0);assert.equal(api.pending(),24);
 api.spawnMeteorBarrage(10,0,0);assert.equal(api.pending(),24);
 const fn=timers.get(1);timers.delete(1);fn();assert.equal(spawned,1);assert.equal(api.pending(),23);
 api.clearPendingBarrages();assert.equal(timers.size,0);assert.equal(api.pending(),0);
});
test('Cinematic particle upload ranges are bounded to active instances',()=>{
 const {uploadActivePrefix}=load('src/rendering/cinematic-effects.js',{},['uploadActivePrefix']);
 let ranges=[],versions=0;
 const attr={clearUpdateRanges(){ranges=[];},addUpdateRange(a,b){ranges.push([a,b]);},set needsUpdate(v){if(v)versions++;}};
 assert.equal(uploadActivePrefix(attr,0,16),false);assert.equal(versions,0);
 uploadActivePrefix(attr,7,16);assert.equal(ranges[0][1],112);
 uploadActivePrefix(attr,4,3);assert.equal(ranges.length,1);assert.equal(ranges[0][1],12);
 const legacy={needsUpdate:false};uploadActivePrefix(legacy,4,1);assert.equal(legacy.needsUpdate,true);
});
test('Generic particle pool respects capacity and active matrix ranges',()=>{
 const {InstancedParticlePool}=load('src/rendering/instanced-particles.js',{},['InstancedParticlePool']);
 class Mesh{constructor(){this.instanceMatrix={ranges:[],setUsage(){},clearUpdateRanges(){this.ranges=[];},addUpdateRange(a,b){this.ranges.push([a,b]);},needsUpdate:false};}setMatrixAt(){}}
 const T={Object3D:class{constructor(){this.position={copy(){}};this.rotation={set(){}};this.scale={setScalar(){}};}updateMatrix(){}},InstancedMesh:Mesh,DynamicDrawUsage:1};
 const pool=new InstancedParticlePool({THREE:T,parent:{add(){}},geometry:{},material:{},capacity:4});
 pool.begin();for(let i=0;i<3;i++)pool.add({},1);pool.end();
 assert.equal(pool.mesh.instanceMatrix.ranges[0][1],48);
 pool.begin();for(let i=0;i<4;i++)pool.add({},1);assert.equal(pool.add({},1),false);pool.end();
 assert.equal(pool.mesh.instanceMatrix.ranges[0][1],64);pool.clear();assert.equal(pool.mesh.count,0);
});
test('Parcel damage mask persists locally and restores original shared materials',()=>{
 const {createParcelDamageMask}=load('src/rendering/parcel-damage-mask.js',{},['createParcelDamageMask']);
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 class Texture{constructor(data,w,h,d){this.image={data,w,h,d};this.disposals=0;}dispose(){this.disposals++;}}
 const T={Vector3:V,Data3DTexture:Texture};
 const original={clone(){return {dispose(){this.disposals=(this.disposals||0)+1;}};},customProgramCacheKey:()=> 'base',onBeforeCompile(){}};
 const a={isMesh:true,material:original},b={isMesh:true,material:original},other={isMesh:true,material:original};
 const mask=createParcelDamageMask(T,{traverse(cb){cb(a);cb(b);}},{minX:0,maxX:10,minY:0,maxY:10,minZ:0,maxZ:10});
 assert.equal(a.material,b.material);assert.ok(a.material!==original);assert.equal(other.material,original);
 const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <color_fragment>'};
 a.material.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.includes('instanceMatrix*parcelLocal'));
 const tex=shader.uniforms.uParcelDamageMap.value,im=tex.image;
 const sample=(x,y,z)=>{const o=shader.uniforms.uParcelDamageMin.value,s=shader.uniforms.uParcelDamageSize.value;return im.data[(Math.floor((z-o.z)/s.z*im.d)*im.h+Math.floor((y-o.y)/s.y*im.h))*im.w+Math.floor((x-o.x)/s.x*im.w)];};
 for(const [point,radius,strength] of [[{x:2,y:4,z:0},4,0],[{x:2,y:4,z:0},4,-1],[{x:2,y:4,z:0},4,NaN],[{x:2,y:4,z:0},4,Infinity],[{x:2,y:4,z:0},0,1],[null,4,1],[{x:NaN,y:4,z:0},4,1]])assert.equal(mask.stamp(point,radius,strength),false);
 assert.equal(mask.strikes(),0);assert.ok(im.data.every(value=>value===0));
 mask.stamp({x:2,y:4,z:0},4,1);assert.ok(sample(2,4,0)>122);
 assert.equal(sample(8,4,0),0);assert.equal(sample(2,4,10),0);
 mask.stamp({x:8,y:6,z:10},3,1);assert.ok(sample(2,4,0)>122&&sample(8,6,10)>122);
 assert.ok(mask.byteLength<=48**3);
 const clone=a.material;mask.dispose();mask.dispose();
 assert.equal(a.material,original);assert.equal(b.material,original);assert.equal(clone.disposals,1);assert.equal(tex.disposals,1);
});
test('Swept contact includes exact parcel edges without widening parcel ownership',()=>{
 const b={x:0,z:0,w:6,d:4,polys:[[[[-3,-2],[3,-2],[3,2],[-3,2]]]]};
 assert.equal(parcels.containsParcel(b,3,0),false);
 assert.ok(parcels.touchesParcel(b,3,0));
 assert.equal(parcels.touchesParcel(b,3.1,0),false);
});
test('Viewer damage never hides an entire floor band on a partial strike',()=>{
 const {createViewerCityModels}=load('src/rendering/viewer-city-models.js',{
 THREE:{Group:class{constructor(){this.children=[];this.visible=true;}add(o){this.children.push(o);}},Vector3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}},Frustum:class{},Matrix4:class{}},
 makeViewerBuilding:()=>({model:{visible:true,traverse(fn){fn(this);}},bounds:{min:{x:0,y:0,z:0},max:{x:1,y:1,z:1},clone(){return {expandByScalar(){return this;}};}}}),
 containsParcel:(b,x,z)=>Math.abs(x-b.x)<=b.w/2&&Math.abs(z)<=3,
 createParcelDamageMask:()=>{let n=0;return {stamp(){n++;},strikes(){return n;},dispose(){}};}
 },['createViewerCityModels']);
 const city={buildings:[{id:'a',name:'A',viewerParcel:true,h:6,x:0,z:0,w:6,front:3,damage:0},{id:'b',name:'B',viewerParcel:true,h:6,x:4,z:0,w:6,front:3,damage:0}],impact(b){b.damage+=.2;},forceDamage(b,v){b.damage=v;}};
 const api=createViewerCityModels({add(){}},city);
 for(const [point,radius,strength] of [[{x:2,y:3,z:0},3,0],[{x:2,y:3,z:0},3,-1],[{x:2,y:3,z:0},3,NaN],[{x:2,y:3,z:0},3,Infinity],[{x:2,y:3,z:0},0,1],[null,3,1],[{x:NaN,y:3,z:0},3,1]])assert.equal(api.impactBuilding('b',point,radius,strength),0);
 assert.equal(api.impact(null,3,1),0);
 assert.equal(api.entries[1].targetBuilding.damage,0);assert.ok(!api.entries[1].impactMask);
 api.impactBuilding('b',{x:2,y:3,z:0},3,1);assert.equal(api.entries[0].damage,0);
 assert.ok(api.entries[1].model.visible);
 assert.equal(api.entries[1].impactMask.strikes(),1);
 api.impactBuilding('b',{x:2,y:4,z:0},3,1);assert.equal(api.entries[1].impactMask.strikes(),2);
 api.restore();assert.equal(api.entries[1].impactMask,null);
});
test('Exposed interior geometry is floor-specific and conservatively footprint-contained',()=>{
 const structural=read('src/rendering/structural-city.js');
 const a=structural.indexOf(' function interiorFitsParcel('),b=structural.indexOf(' function scheduleSupport(',a);
 assert.ok(a>=0&&b>a);const writes=[];
 const api=new Function('write','containsParcel',structural.slice(a,b)+'return {interiorFitsParcel,exposeInterior};')(p=>writes.push(p),(b,x,z)=>x>=0&&x<=10&&z>=0&&z<=10&&!(x>4&&x<6&&z>4&&z<6));
 const part=(x,z,w,d)=>({original:{position:{x,z},size:{x:w,z:d}}});
 assert.equal(api.interiorFitsParcel({},part(2,2,2,2)),true);
 assert.equal(api.interiorFitsParcel({},part(1,1,4,4)),false);
 assert.equal(api.interiorFitsParcel({},part(5,5,8,8)),false);
 const building={viewerParcel:true,exposedFloors:new Set(),floorHeight:3,stories:4,parts:[{floor:1,state:'attached',type:'slab',interiorFits:true},{floor:1,state:'attached',type:'column',interiorFits:false},{floor:1,state:'attached',type:'wall',interiorFits:true}]};
 assert.equal(api.exposeInterior(building,{y:4.5},1),1);assert.equal(writes.length,1);assert.equal(writes[0],building.parts[0]);
 assert.equal(api.exposeInterior(building,{y:4.5},1),0);assert.equal(writes.length,1);
});
test('Landmark-aware interior profiles preserve open assembly spaces and school exception',()=>{
 const {interiorProfile,interiorFurnishings}=load('src/simulation/interior-profiles.js',{},['interiorProfile','interiorFurnishings']);
 const expected={'1005656':'worship','1000951':'worship','district-5':'worship','district-29':'assembly','1005655':'restaurant','1003022':'retail','1073318':'retail','district-1':'residence-hall'};
 for(const [id,kind] of Object.entries(expected)){
  const b=list.find(p=>p.id===id);assert.ok(b);
  const profile=interiorProfile(b);assert.equal(profile.kind,kind);
  if(['worship','assembly','restaurant'].includes(kind)||['1003022','1073318'].includes(id))assert.equal(profile.stories,1);
  assert.ok(interiorFurnishings(b,profile).length>0);
 }
 const school=interiorProfile({school:true,h:28,stories:5});
 assert.equal(school.kind,'school-source');assert.equal(school.requiresSourceVerification,true);
 assert.equal(interiorFurnishings({school:true,w:27,d:58.8,h:28},school).length,0);
});
test('All 122 mapped parcels have interior profiles and conservative furnishing placement',()=>{
 const {interiorProfile,interiorFurnishings}=load('src/simulation/interior-profiles.js',{},['interiorProfile','interiorFurnishings']);
 const structural=read('src/rendering/structural-city.js');
 const a=structural.indexOf(' function interiorFitsParcel('),b=structural.indexOf(' function exposeInterior(',a);
 const fits=new Function('containsParcel',structural.slice(a,b)+'return interiorFitsParcel;')(parcels.containsParcel);
 let total=0,worship=0,assembly=0;
 for(const p of list){
  const profile=interiorProfile(p);assert.ok(profile.kind&&profile.stories>0);
  const plan=interiorFurnishings(p,profile);
  const placed=plan.filter(q=>q.y-q.h/2>=0&&q.y+q.h/2<=p.h&&fits(p,{original:{position:{x:q.x,y:q.y,z:q.z},size:{x:q.w,y:q.h,z:q.d}}}));
  assert.ok(placed.every(q=>q.w>0&&q.h>0&&q.d>0));
  total+=placed.length;
  if(profile.kind==='worship'){worship++;assert.equal(profile.stories,1);assert.ok(placed.length>0);}
  if(profile.kind==='assembly'){assembly++;assert.equal(profile.stories,1);assert.ok(placed.length>0);}
 }
 assert.equal(list.length,122);assert.equal(worship,3);assert.equal(assembly,1);assert.ok(total>1000);
 console.log('  Accepted interior furnishings: '+total);
});
test('School source fixtures retained only within the original school zone',()=>{
 const {schoolSourceCategory,classifyArchitecturalMesh,schoolInteriorSourceEligible}=load('src/rendering/tech-freire-source-fit.js',{},['schoolSourceCategory','classifyArchitecturalMesh','schoolInteriorSourceEligible']);
 const box={min:{x:0,y:1,z:-10},max:{x:2,y:3,z:-8}};
 for(const [name,category] of [['Furniture_Desk','furniture'],['Stairs_123','circulation'],['Basic Wall','walls'],['Floor_Slab','floors'],['Structural Column','structure'],['Door_14','doors'],['Lighting_Fixture','lighting'],['Plumbing_Sink','plumbing']])assert.equal(schoolSourceCategory({name}),category);
 assert.equal(classifyArchitecturalMesh({name:'Furniture_Desk'},box),'school');
 assert.equal(classifyArchitecturalMesh({name:'Furniture_Desk'},{min:{...box.min,x:49},max:{...box.max,x:51}}),null);
 assert.equal(schoolInteriorSourceEligible({name:'Furniture_Desk'},{min:{...box.min,x:-29},max:{...box.max,x:46}}),false);
});
test('Production FBX batching retains source interiors and suppresses approximate attached geometry',()=>{
 const batch=read('src/rendering/school-source-batch.js'),proxy=read('src/rendering/destructible-school.js');
 assert.ok(!/if\s*\(role\s*===\s*['"]interior['"]\)\s*continue/.test(batch));
 assert.ok(batch.includes('bySurface'));
 assert.ok(proxy.includes('if(overlayMode&&!p.falling&&!p.resting)continue;'));
 assert.ok(game.includes("attachedGeometrySource:'original FBX',damagePhysicsSource:'approximate proxy'"));
});
test('Crowd batches preserve poses and clear hidden or removed walkers',()=>{
 const scene=new Three.Scene(),renderer=createCrowdRenderer(Three,scene);
 const camera=new Three.PerspectiveCamera(60,1,.1,100);
 camera.position.set(0,1,8);camera.lookAt(0,1,0);
 const person=buildPerson(Three,2),other=buildPerson(Three,3);
 scene.add(person,other);
 renderer.register(person);renderer.register(other);
 const people=[{g:person},{g:other}];
 other.position.x=300;
 animatePerson(person,1,true,true);
 renderer.update(people,camera,true);
 const batches=scene.children.filter(node=>node.isInstancedMesh);
 assert.ok(batches.length<5);
 assert.equal(batches.reduce((n,b)=>n+b.count,0),11);
 const expected=[];
 person.traverse(part=>{if(part.isMesh){assert.equal(part.visible,false);expected.push(part);}});
 for(const batch of batches){
  const originals=expected.filter(part=>part.geometry===batch.geometry);
  const matrix=new Three.Matrix4(),color=new Three.Color();
  for(const [i,part] of originals.entries()){
   batch.getMatrixAt(i,matrix);batch.getColorAt(i,color);
   for(let j=0;j<16;j++)assert.ok(Math.abs(matrix.elements[j]-part.matrixWorld.elements[j])<1e-6);
   assert.ok(Math.abs(color.r-part.material.color.r)<1e-6);
  }
 }
 renderer.update(people,camera,false);
 assert.ok(batches.every(batch=>batch.count===0));
 renderer.update([],camera,true);
 assert.ok(batches.every(batch=>batch.count===0));
});
test('School play mesh matches the FBX source and stays within its render budget',()=>{
 const packed=readFileSync(new URL('assets/tech-freire-play-mesh-v1.bin',root));
 const payload=gunzipSync(packed);
 const bytes=payload.readUInt32LE();
 const info=JSON.parse(payload.subarray(4,4+bytes));
 const fbx=readFileSync(new URL('assets/tech-freire-original.fbx',root));
 assert.equal(info.sourceSha256,createHash('sha256').update(fbx).digest('hex'));
 assert.equal(info.format,1);
 assert.equal(info.triangles,info.batches.reduce((n,batch)=>n+batch.count/3,0));
 assert.equal(payload.length,4+bytes+bytes%2+info.triangles*36);
 assert.ok(info.triangles<250000&&packed.length<2000000);
 for(const category of ['walls','floors','roof','glazing','doors','structure']){
  assert.ok(info.byCategory[category].kept>0);
  assert.equal(info.byCategory[category].original,info.byCategory[category].kept);
 }
});
test('Spatial batches separate floors and bays without clipping large components',()=>{
 const {schoolBatchRegion}=load('src/rendering/school-source-batch.js',{},['schoolBatchRegion']);
 const box=(x,y,z,w=4,h=3,d=4)=>({min:{x,y,z},max:{x:x+w,y:y+h,z:z+d}});
 assert.equal(schoolBatchRegion('brick',box(0,0,0)),'shell');
 assert.equal(schoolBatchRegion('interior',box(1,1,1)),schoolBatchRegion('interior',box(6,3,9)));
 assert.ok(schoolBatchRegion('interior',box(1,1,1))!==schoolBatchRegion('interior',box(1,20,1)));
 assert.ok(schoolBatchRegion('interior',box(1,1,1))!==schoolBatchRegion('interior',box(1,1,-70)));
 assert.equal(schoolBatchRegion('interior',box(0,0,0,60,1,60)),'large');
 assert.equal(schoolBatchRegion('interior',box(0,0,0,-1)),'unbounded');
});
test('Original school component index chooses only nearby materials',()=>{
 const {sourceComponentMaterial,createSchoolComponentIndex}=load('src/simulation/school-source-impact.js',{},['sourceComponentMaterial','createSchoolComponentIndex']);
 const rec=(category,min,max,name='')=>({category,min,max,material:sourceComponentMaterial(category,name)});
 const index=createSchoolComponentIndex([rec('glazing',{x:0,y:3,z:0},{x:2,y:5,z:.2}),rec('walls',{x:0,y:3,z:-20},{x:2,y:5,z:-19},'brick'),rec('structure',{x:1,y:3,z:-1},{x:1.5,y:5,z:0}),rec('floors',{x:-30,y:0,z:-60},{x:30,y:.2,z:0})]);
 assert.equal(index.query({x:1,y:4,z:0},2).map(x=>x.material).sort().join(','),'glass,metal');
 assert.equal(index.query({x:1,y:4,z:-20},1)[0].material,'brick');
 assert.equal(index.query({x:0,y:.1,z:-30},1)[0].category,'floors');
 assert.equal(index.query({x:100,y:100,z:100},4).length,0);
 assert.equal(index.query({x:1,y:4,z:0},2,1).length,1);
 assert.equal(sourceComponentMaterial('glazing','mullion'),'metal');
});
test('Source-school health gauge does not fabricate partial debris',()=>{
 const proxy=read('src/rendering/destructible-school.js');
 const start=proxy.indexOf(' function syncDestruction('),end=proxy.indexOf(' function reset()',start);
 assert.ok(start>=0&&end>start);
 let collapses=0;
 const fn=new Function('collapse','THREE','let currentRatio=0,schoolCracksGroup=null,overlayMode=true;'+proxy.slice(start,end)+'return syncDestruction;')(()=>collapses++,{});
 fn(.15);fn(.9);assert.equal(collapses,0);fn(1);assert.equal(collapses,1);
});
test('Full collapse releases interior furnishings once while preserving foundations',()=>{
 const structural=read('src/rendering/structural-city.js');
 const start=structural.indexOf(' function forceDamage('),end=structural.indexOf(' function update(',start);
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}distanceTo(p){return Math.hypot(this.x-p.x,this.y-p.y,this.z-p.z);}}
 let calls=0;const force=new Function('THREE','detach',structural.slice(start,end)+'return forceDamage;')({Vector3:V},p=>{p.state='falling';calls++;});
 const part=type=>({type,state:'attached',position:new V(0,0,0),original:{position:new V(0,0,0)}});
 const structuralParts=[part('wall'),part('slab'),part('column')],extra=[part('furniture'),part('partition'),part('window'),part('foundation')];
 const b={school:false,x:0,z:0,w:10,h:10,d:10,damage:0,pressure:0,structuralParts,parts:[...structuralParts,...extra]};
 force(b,.5);assert.equal(calls,1);assert.ok(extra.every(p=>p.state==='attached'));
 force(b,1);assert.equal(calls,6);assert.equal(extra[3].state,'attached');
 force(b,1);assert.equal(calls,6);
 assert.ok(structural.includes('b.fullCollapseReconciled=false;b.fallenFloors?.clear()'));
});
test('Runoff restoration clears current and queued water and hides drain effects',()=>{
 const s=read('src/rendering/street-water-runoff.js'),a=s.indexOf('    reset() {'),b=s.indexOf('    getStats()',a);
 assert.ok(a>=0&&b>a);
 const v={set(...v){this.values=v;}},ribbon={opacity:.5,normalScale:{...v}},film={opacity:.5},tex={offset:{x:5}},gutters=[{visible:true}],drains=[{flowRate:.7,vortexMesh:{visible:true,rotation:{z:5},scale:{...v}},vortexMat:{opacity:.8}}];
 const api=new Function('waterFlowRibbonMat','waterFilmMat','rippleNormalTex','gutterMeshes','drainObjects','let currentRunoffVolume=1,targetRunoffVolume=1,flowClock=3,ripplePulse=2;return {'+s.slice(a,b)+'state:()=>[currentRunoffVolume,targetRunoffVolume,flowClock,ripplePulse]};')(ribbon,film,tex,gutters,drains);
 api.reset();assert.ok(api.state().every(x=>x===0));assert.equal(ribbon.opacity,0);assert.equal(film.opacity,0);assert.equal(gutters[0].visible,false);assert.equal(drains[0].vortexMesh.visible,false);assert.equal(drains[0].vortexMat.opacity,0);assert.equal(tex.offset.x,0);
 assert.equal(game.split('cinematicFX.syncSubwayCraters?.([]);streetWaterRunoff.reset();').length-1,3);
});
test('Frozen vehicle recycling restores original materials and bounds idle smoke pools',()=>{
 const a=game.indexOf('function freezeResponder('),b=game.indexOf('function gasAttack(',a),c=game.indexOf('function recycleCar('),d=game.indexOf('const burningVehicles=',c),e=game.indexOf('function releaseSkyObject('),f=game.indexOf('function backgroundImpactEffects(',e);
 let disposed=0;const mat={clone(){return {color:{setHex(){}},dispose(){disposed++;}};}},mesh={isMesh:true,material:mat},car={emergency:true,root:{traverse(fn){fn(mesh);}},poolKey:'fire'};
 const api=new Function('scene','let score=0;const vehiclePool=new Map(),vehiclePoolStats={recycled:0},skySmokePool=[],skyBurstPool=[];'+game.slice(a,b)+game.slice(c,d)+game.slice(e,f)+'return {freezeResponder,recycleCar,releaseSkyObject,vehiclePool,skySmokePool,skyBurstPool};')({remove(){}});
 assert.ok(api.freezeResponder(car));assert.ok(mesh.material!==mat);
 api.recycleCar(car);assert.equal(mesh.material,mat);assert.equal(disposed,1);assert.equal(api.vehiclePool.get('fire').length,1);
 api.recycleCar(car);assert.equal(disposed,1);
 for(let i=0;i<100;i++)api.releaseSkyObject({smoke:true,m:{material:{dispose(){disposed++;}}}});
 assert.equal(api.skySmokePool.length,64);assert.equal(disposed,37);
});
test('Sandbox repair clears debris and vehicles without removing campaign meteors',()=>{
 const a=game.indexOf('function clearSandboxDamageResidue('),b=game.indexOf('function repairAllBuildings(',a);
 assert.ok(a>=0&&b>a);
 function fixture(sandbox){
  const car={burning:2,serviceStop:true},arrays={meteors:[{}],debris:[{},{}],settledRubble:[{}],crashedWrecks:[{root:{}}],escapingPilots:[{root:{}}],burningVehicles:[{driver:{},car}]};
  let cleared=0,removed=0;
  const fn=new Function('scene','rubblePool','remove',...Object.keys(arrays),'let freeFlightMode='+sandbox+',rubbleDirty=true;'+game.slice(a,b)+'return {clearSandboxDamageResidue,dirty:()=>rubbleDirty};')({remove(){removed++;}},{clear(){cleared++;}},(a,i)=>a.splice(i,1),...Object.values(arrays));
  fn.clearSandboxDamageResidue();assert.equal(arrays.meteors.length,sandbox?0:1);
  for(const [key,value] of Object.entries(arrays))if(key!=='meteors')assert.equal(value.length,0);
  assert.equal(car.burning,0);assert.equal(car.serviceStop,false);assert.equal(fn.dirty(),false);assert.equal(removed,3);assert.equal(cleared,1);
 }
 fixture(true);fixture(false);
});
test('Vehicle ownership preserves shared cache assets and releases unique pre-bake and baked resources once',()=>{
 const source=read('src/rendering/realistic-vehicles.js'),a=source.indexOf('const modelResources='),b=source.indexOf('export function buildRoadVehicle',a);
 assert.ok(a>=0&&b>a);
 const mk=()=>({n:0,dispose(){this.n++;}}),shared=mk(),unique=mk(),old=mk(),baked=mk(),mat=mk();
 const root={nodes:[{isMesh:true,geometry:shared,material:mat},{isMesh:true,geometry:old,material:unique}],traverse(fn){this.nodes.forEach(fn);}};
 const api=new Function('kit',source.slice(a,b).replace(/^export /gm,'')+'return {captureVehicleResources,releaseVehicleResources};')(()=>({sphere:shared,box:mk(),geo:new Map(),mats:new Map([['m',mat]])}));
 assert.equal(api.captureVehicleResources({},root),2);
 root.nodes=[{isMesh:true,geometry:baked,material:unique}];assert.equal(api.captureVehicleResources({},root),3);
 assert.equal(api.releaseVehicleResources(root),3);assert.equal(shared.n,0);assert.equal(mat.n,0);assert.equal(old.n,1);assert.equal(baked.n,1);assert.equal(unique.n,1);
 assert.equal(api.releaseVehicleResources(root),0);
});
test('Helicopter retirement bounds reuse and releases crashed model resources once',()=>{
 const a=game.indexOf('function retireHelicopter('),b=game.indexOf('function disposeHelicopterElectric(',a);
 assert.ok(a>=0&&b>a);let disposed=0,lights=0,unique=0;
 const api=new Function('disposeHelicopterElectric','scene','helicopterLightPool','releaseVehicleResources','const helicopterModels=new Map();'+game.slice(a,b)+'return {retireHelicopter,helicopterModels};')(()=>{},{remove(){}},{release(){lights++;}},()=>unique++);
 for(let i=0;i<4;i++)api.retireHelicopter({root:{},variant:1,searchlight:{}});
 assert.equal(api.helicopterModels.get(1).length,3);assert.equal(unique,1);assert.equal(lights,4);
 const goo={dispose(){disposed++;}},h={root:{},variant:1,gasHit:true,gooResources:[goo,goo],searchlight:{}};
 api.retireHelicopter(h);api.retireHelicopter(h);
 assert.equal(unique,2);assert.equal(disposed,1);assert.equal(lights,5);
});
test('Road vehicle pool has per-variant and global retention limits',()=>{
 const a=game.indexOf('function recycleCar('),b=game.indexOf('const burningVehicles=',a);
 let disposed=0;
 const api=new Function('scene','releaseVehicleResources','const vehiclePool=new Map(),vehiclePoolStats={recycled:0};'+game.slice(a,b)+'return {recycleCar,vehiclePool};')({remove(){}},()=>disposed++);
 for(let i=0;i<5;i++)api.recycleCar({root:{},poolKey:'a'});
 assert.equal(api.vehiclePool.get('a').length,4);assert.equal(disposed,1);
 for(let i=0;i<60;i++)api.recycleCar({root:{},poolKey:'other'+i});
 assert.equal([...api.vehiclePool.values()].reduce((n,p)=>n+p.length,0),48);assert.equal(disposed,17);
});
test('Frame pacing preserves requested average cadence at common refresh rates and recovers after stalls',()=>{
 const a=game.indexOf('function renderDeadline('),b=game.indexOf('const detailedTimings=',a);
 assert.ok(a>=0&&b>a);
 const pace=new Function(game.slice(a,b)+'return renderDeadline;')();
 for(const hz of [60,120,144])for(const cap of [30,45,60,0]){
  let deadline=null,frames=0;
  for(let i=0;i<hz*10;i++){const v=pace(i*1000/hz,deadline,cap);deadline=v.next;if(v.render)frames++;}
  assert.ok(Math.abs(frames-10*(cap?Math.min(cap,hz):hz))<=2,`refresh ${hz}, cap ${cap}: ${frames}`);
 }
 const late=pace(5000,100,45);assert.ok(late.render&&late.next>5000);assert.equal(pace(5001,late.next,45).render,false);
});
test('Adaptive resolution ignores intentional cap delay but still responds to sustained overload',()=>{
 const a=game.indexOf('function evaluateRenderPressure('),b=game.indexOf('function applyVisualPreset(',a);
 assert.ok(a>=0&&b>a);
 const {AdaptiveFramebuffer}=load('src/rendering/frame-governor.js',{},['AdaptiveFramebuffer']);
 for(const cap of [30,45,60]){
  const governor=new AdaptiveFramebuffer();
  let applied=0;
  const evaluate=new Function('frameGovernor','maxRenderFPS','applyVisualPreset','let adaptiveResolution=1,adaptiveAdjustments=0;'+game.slice(a,b)+'return evaluateRenderPressure;')(governor,cap,()=>applied++);
  for(let i=0;i<150;i++)evaluate(1/cap,true);
  assert.equal(governor.scale,1);assert.equal(applied,0);
  for(let i=0;i<100;i++)evaluate(.08,true);
  assert.ok(governor.scale<1);assert.ok(applied>0);
 }
});
test('Stall diagnostics attribute only preceding frame work and preserve unknown external gaps',()=>{
 const {createFrameHealth}=load('src/core/frame-health.js',{},['createFrameHealth']);
 let focused=true,recording=false;
 const health=createFrameHealth({now:()=>0,isHidden:()=>false,isFocused:()=>focused,isRecording:()=>recording});
 const base={simMs:3,renderMs:4,frameMs:16};
 const pair=(before,after={},gap=220)=>{health.reset();health.observe({...base,frameStart:0,...before});return health.observe({...base,frameStart:gap,...after});};
 let e=pair({renderMs:200});assert.equal(e.classification,'renderer-or-driver-block');assert.equal(e.renderMs,200);assert.equal(e.outsideMeasuredCodeMs,17);
 e=pair({},{renderMs:300},2000);assert.equal(e.classification,'unattributed-raf-gap');assert.equal(e.renderMs,4);
 e=pair({captureMs:140},{},160);assert.equal(e.classification,'capture-main-thread-block');
 e=pair({prepareMs:95},{},110);assert.equal(e.classification,'render-preparation-block');
 e=pair({setupMs:50,cameraAudioMs:40},{},110);assert.equal(e.classification,'combined-frame-work');
 e=pair({simMs:100});assert.equal(e.classification,'simulation-main-thread-block');
 e=pair({bookkeepingMs:100});assert.equal(e.classification,'frame-bookkeeping-block');
 e=pair({cameraAudioMs:100});assert.equal(e.classification,'camera-or-audio-block');
 e=pair({setupMs:100});assert.equal(e.classification,'frame-setup-block');
 recording=true;e=pair({},{});assert.equal(e.classification,'capture-or-external-frame-gap');recording=false;
 health.reset();focused=false;health.observe({...base,frameStart:0,renderMs:200});focused=true;
 e=health.observe({...base,frameStart:220});assert.equal(e.classification,'visibility-or-focus-interruption');
 assert.equal(pair({collect:false}),undefined);
 assert.equal(pair({},{},16),undefined);
 health.reset();assert.equal(health.summary().totalLongFrames,0);
 health.dispose();
});
test('Game loop submits separate render, preparation and capture timings to stall diagnostics',()=>{
 const a=game.indexOf('function renderFrame('),b=game.indexOf('}animate();',a);
 assert.ok(a>=0&&b>a);const frame=game.slice(a,b+1);
 const prepare=frame.indexOf('const prepareStart='),render=frame.indexOf('const renderStart='),submit=frame.indexOf('renderer.render('),capture=frame.indexOf('const captureStart='),report=frame.indexOf('frameHealth.observe(');
 assert.ok(prepare>=0&&prepare<render&&render<submit&&submit<capture&&capture<report);
 assert.ok(frame.includes('frameStart:present'));assert.ok(frame.includes('collect:active&&!paused&&!motionQA&&forcedDt===null'));
 assert.ok(frame.includes('setupMs,cameraAudioMs,prepareMs,captureMs,bookkeepingMs'));
});
test('Projectile retirement tolerates meshless water and preserves borrowed GPU resources',()=>{
 const a=game.indexOf('function retireProjectile('),b=game.indexOf('const sharedBlastGeometry',a);
 assert.ok(a>=0&&b>a);
 const shots=[],removed=[];let disposed=0;
 const shared={dispose(){throw Error('Borrowed geometry or material was disposed');}};
 const owned={dispose(){disposed++;}};
 const api=new Function('scene','shots','debris','blasts','meteors',game.slice(a,b)+'return {remove,retireProjectile};')({remove(m){removed.push(m);}},shots,[],[],[]);
 const water={mesh:{}},fire={mesh:{geometry:shared,material:shared,children:[{geometry:shared,material:shared}]}};
 const custom={mesh:{},ownedResources:[owned,owned]};
 shots.push(water,fire,custom);
 while(shots.length)api.remove(shots,0);
 assert.equal(removed.length,3);assert.equal(disposed,1);assert.equal(shots.length,0);
 api.remove(shots,0);assert.equal(removed.length,3);
});
test('All current projectile producers borrow assets or use meshless markers',()=>{
 assert.equal((game.match(/shots\.push\(/g)||[]).length,5);
 assert.ok(game.includes('new THREE.Mesh(policeShotGeometry,policeShotMaterial)'));
 assert.ok(game.includes('new THREE.Mesh(groundShotGeometry,mats.fire)'));
 assert.ok(game.includes('const waterDummy=new THREE.Object3D()'));
 assert.ok(game.includes('if(!s.hostile)remove(shots,i);'));
 assert.ok(game.includes('for(const e of effectObjects){effects.remove(e.mesh);}effectObjects.length=0;'));
});
test('Crater retirement preserves borrowed rim assets and releases owned resources exactly once',()=>{
 const source=read('src/rendering/procedural-crater.js');
 const a=source.indexOf('export function collectCraterResources'),b=source.indexOf('/**',a);
 const mk=()=>({n:0,dispose(){this.n++;}});
 const borrowed=Array.from({length:4},mk);
 const api=new Function('_boxGeo','_cylinderGeo','_asphaltChunkMat','_rebarSteelMat',source.slice(a,b).replace(/^export /gm,'')+'return {collectCraterResources,releaseCraterResources};')(...borrowed);
 const owned=mk(),mat=mk(),retained=mk(),light={};
 const rim={traverse(fn){fn({geometry:borrowed[0],material:borrowed[2]});fn({geometry:owned,material:[mat,retained]});}};
 const subway={userData:{lights:[light,light]},traverse(fn){fn({geometry:owned,material:mat});}};
 const resources=api.collectCraterResources([rim,subway,rim]);
 assert.equal(resources.size,3);
 api.releaseCraterResources(resources,new Set([retained]));
 assert.equal(owned.n,1);assert.equal(mat.n,1);assert.equal(retained.n,0);
 owned.n=mat.n=0;
 const start=game.indexOf('function disposeCrater(c)'),end=game.indexOf('const _craterV1',start);
 let removed=0,released=0;
 const dispose=new Function('scene','explosionLightPool','collectCraterResources','releaseCraterResources','thermalCraterLights',game.slice(start,end)+'return disposeCrater;')({remove(){removed++;}},{release(){released++;}},api.collectCraterResources,api.releaseCraterResources,[]);
 const crater={rimMesh:rim,subwayGroup:subway};dispose(crater);dispose(crater);
 assert.equal(removed,2);assert.equal(released,1);assert.equal(owned.n,1);assert.equal(mat.n,1);assert.equal(retained.n,1);assert.ok(borrowed.every(r=>r.n===0));
});
test('Subway batching reclaims discarded resources and uses the subway scorch aperture',()=>{
 const before=game.indexOf('const subwayBeforeBatch=collectCraterResources([subwayGroup])');
 const batch=game.indexOf('batchOpaqueRelief(subwayGroup,{preserveNamed:true})',before);
 const after=game.indexOf('releaseCraterResources(subwayBeforeBatch,collectCraterResources([subwayGroup]))',batch);
 assert.ok(before>=0&&batch>before&&after>batch);
 assert.ok(game.includes('createFeatheredRadialSootDecal(radius*(isTitanicOrExtinction?1.45:1.1),true)'));
});
test('Thermal crater lights use a fixed budget, follow nearby craters and clear expired slots',()=>{
 const source=read('src/rendering/procedural-crater.js'),a=source.indexOf('export function syncThermalCraterLights'),b=source.indexOf('/**',a);
 const sync=new Function(source.slice(a,b).replace(/^export /gm,'')+'return syncThermalCraterLights;')();
 const slots=Array.from({length:3},()=>({userData:{},position:{set(x,y,z){Object.assign(this,{x,y,z});}}}));
 const make=(x,z,life=10)=>({x,z,life,radius:4,thermalGroup:{position:{y:-2}},thermalIntensity:1.5});
 const craters=[make(100,0),make(8,0),make(3,0),make(5,0),make(0,0,0)];
 sync(slots,craters,{x:0,z:0});
 assert.equal(slots.map(l=>l.position.x).join(','),'3,5,8');
 assert.equal(craters[0].x,100);assert.equal(slots[0].distance,14);assert.equal(slots[0].intensity,1.5);
 craters[2].disposed=true;sync(slots,craters,{x:0,z:0});assert.equal(slots[0].position.x,5);
 sync(slots,craters,{x:101,z:0});assert.equal(slots[0].position.x,100);
 sync(slots,[],{x:0,z:0});assert.ok(slots.every(l=>l.intensity===0&&l.userData.thermalCrater===null));
});
test('Crater update uses external thermal lighting and cached animation references',()=>{
 assert.ok(game.includes('createPulsatingThermalFissures(radius,bowlObj.depth,{externalLighting:true})'));
 assert.ok(game.includes('syncThermalCraterLights(thermalCraterLights,craters,dragon.position)'));
 const a=game.indexOf('function updateCraters(dt)'),b=game.indexOf('function updateWorld(dt)',a);
 const update=game.slice(a,b);assert.ok(!update.includes('getObjectByName('));
 assert.ok(update.includes('animatedParts'));assert.ok(update.includes('c.geyserGroup.userData.puddle'));assert.ok(update.includes('c.thermalIntensity=c.thermalUpdate(elapsed)'));
});
test('Fire cluster counting preserves the 28 meter radius without allocating an array',()=>{
 const a=game.indexOf('function updateFires(dt)'),b=game.indexOf('function clearFires()',a),source=game.slice(a,b);
 assert.ok(source.includes('distanceToSquared(f.root.position)<784'));
 assert.ok(!source.includes('clusterFires'));
 const pos=x=>({distanceToSquared(other){return (x-other.x)**2;},x});
 const f={root:{position:pos(0)}},schoolFire=[f,...[3,27.99,28,40].map(x=>({root:{position:pos(x)}}))];
 const start=source.indexOf('let clusterCount=0;'),end=source.indexOf('if(clusterCount>=2)',start);
 assert.equal(new Function('schoolFire','f',source.slice(start,end)+'return clusterCount;')(schoolFire,f),2);
});
test('Parcel render culling restores visibility, excludes swapped models and preserves shadow rendering',()=>{
 const source=read('src/rendering/viewer-city-models.js');
 const a=source.indexOf('export function createParcelRenderCuller'),b=source.indexOf('export function createViewerCityModels',a);
 const create=new Function(source.slice(a,b).replace(/^export /gm,'')+'return createParcelRenderCuller;')();
 const T={Frustum:class{setFromProjectionMatrix(){} intersectsBox(b){return b.x<10}},Matrix4:class{multiplyMatrices(){}}};
 const model=(x,visible=true)=>({x,visible});
 const on=model(5),off=model(100),collapsed=model(100,false),swap=model(100);
 const entry=(m,x,objects=40,original=m)=>({model:m,renderCull:{model:original,bounds:{x},objects}});
 const culler=create(T,[entry(on,5),entry(off,100),entry(collapsed,100),entry(swap,100,40,model(100))]);
 const camera={updateWorldMatrix(){},projectionMatrix:{},matrixWorldInverse:{}};
 const draw=()=>{assert.ok(on.visible&&!off.visible&&!collapsed.visible&&swap.visible);return 7;};
 assert.equal(culler.render(camera,draw),7);
 assert.ok(off.visible&&!collapsed.visible);
 assert.equal(culler.stats().eligible,2);assert.equal(culler.stats().culled,1);assert.equal(culler.stats().skippedObjects,40);
 try{culler.render(camera,()=>{throw Error('render failed');});assert.ok(false);}catch(e){assert.equal(e.message,'render failed');}
 assert.ok(off.visible);
 for(const opts of [{enabled:false},{shadows:true}])culler.render(camera,()=>assert.ok(off.visible),opts);
 assert.equal(culler.stats().culled,0);
 assert.ok(game.includes("get('parcelCull')!=='0'"));
 assert.ok(game.includes('shadows:renderer.shadowMap.enabled'));
});
test('Parcel render culling with actual Three.js perspective and orthographic cameras',()=>{
 const source=read('src/rendering/viewer-city-models.js');
 const a=source.indexOf('export function createParcelRenderCuller'),b=source.indexOf('export function createViewerCityModels',a);
 const create=new Function(source.slice(a,b).replace(/^export /gm,'')+'return createParcelRenderCuller;')();
 const entries=[-200,0,200].map(x=>{
  const model=new Three.Group();
  const bounds=new Three.Box3(new Three.Vector3(x-2,-2,-22),new Three.Vector3(x+2,2,-18));
  return {model,renderCull:{model,bounds,objects:10}};
 });
 const culler=create(Three,entries);
 for(const camera of [new Three.PerspectiveCamera(60,1,.1,500),new Three.OrthographicCamera(-10,10,10,-10,.1,500)]){
  camera.lookAt(0,0,-1);
  culler.render(camera,()=>assert.equal(entries.map(e=>e.model.visible).join(','),'false,true,false'));
  assert.ok(entries.every(e=>e.model.visible));
  camera.position.x=200;camera.lookAt(200,0,-1);
  culler.render(camera,()=>assert.equal(entries.map(e=>e.model.visible).join(','),'false,false,true'));
  assert.equal(culler.stats().culled,2);
 }
});
test('School play mesh indexes only identical position and normal tuples without changing any triangle',()=>{
 const {decodeSchoolBatch}=load('src/rendering/school-play-mesh.js',{},['decodeSchoolBatch']);
 const A=[0,0,0,0,0,32767],B=[128,0,0,0,0,32767],C=[0,128,0,0,0,32767],D=[0,0,0,0,32767,0];
 const data=new Int16Array([...A,...B,...C,...A,...C,...B,...D,...B,...C]);
 const result=decodeSchoolBatch(data),original=decodeSchoolBatch(data,{allowIndex:false});
 assert.equal(result.vertices,4);assert.equal(result.index.join(','),'0,1,2,0,2,1,3,1,2');
 assert.ok(result.bytes<original.bytes);
 for(let i=0;i<original.vertices;i++)for(let k=0;k<3;k++){
  const j=result.index[i]*3+k;
  assert.equal(result.positions[j],original.positions[i*3+k]);
  assert.equal(result.normals[j],original.normals[i*3+k]);
 }
 const unique=decodeSchoolBatch(new Int16Array([...A,...B,...C]));
 assert.equal(unique.index,null);assert.equal(unique.bytes,72);
 const large=new Int16Array(180000*6);
 for(let i=0;i<180000;i++){large[i*6]=i%300;large[i*6+1]=Math.floor(i/300)%100;large[i*6+5]=32767;}
 const compact=decodeSchoolBatch(large);
 assert.equal(compact.vertices,30000);assert.ok(compact.index instanceof Uint16Array);
 assert.equal(compact.bytes,1080000);
 const wide=new Int16Array(210000*6);
 for(let i=0;i<210000;i++){const id=i%70000;wide[i*6]=id%1000;wide[i*6+1]=Math.floor(id/1000);wide[i*6+5]=32767;}
 const wideResult=decodeSchoolBatch(wide);
 assert.equal(wideResult.vertices,70000);assert.ok(wideResult.index instanceof Uint32Array);
 assert.equal(wideResult.index[69999],69999);assert.equal(wideResult.index[70000],0);
});
test('Packaged school model indexing preserves every decoded triangle and never increases batch storage',()=>{
 const {decodeSchoolBatch}=load('src/rendering/school-play-mesh.js',{},['decodeSchoolBatch']);
 const payload=gunzipSync(readFileSync(new URL('assets/tech-freire-play-mesh-v1.bin',root)));
 const header=payload.readUInt32LE(),info=JSON.parse(payload.subarray(4,4+header));
 let offset=4+header+header%2,originalBytes=0,indexedBytes=0,indexedBatches=0;
 for(const {count} of info.batches){
  const data=new Int16Array(count*6);
  for(let i=0;i<data.length;i++)data[i]=payload.readInt16LE(offset+i*2);
  offset+=data.byteLength;
  const result=decodeSchoolBatch(data),baseline=decodeSchoolBatch(data,{allowIndex:false});
  assert.ok(result.bytes<=baseline.bytes);
  assert.equal(result.index?.length??result.vertices,count);
  for(let i=0;i<count;i++)for(let k=0;k<3;k++){
   const j=(result.index?result.index[i]:i)*3+k;
   assert.equal(result.positions[j],baseline.positions[i*3+k]);
   assert.equal(result.normals[j],baseline.normals[i*3+k]);
  }
  originalBytes+=baseline.bytes;indexedBytes+=result.bytes;if(result.index)indexedBatches++;
 }
 assert.equal(offset,payload.length);
 assert.ok(indexedBytes<=originalBytes);
 console.log('School geometry storage: '+originalBytes+' -> '+indexedBytes+' bytes; indexed batches '+indexedBatches);
});
test('Optimized school volume matches the original stamp formula across impacts and ring-buffer wrap',()=>{
 const path='src/rendering/school-source-damage.js';
 class V{constructor(...v){this.set(...v)}set(x,y,z,w){Object.assign(this,{x,y,z,w});}}
 class Texture{constructor(data,w,h,d){this.image={data,w,h,d};this.source={};this.updates=0;}set needsUpdate(v){if(v)this.updates++;}}
 const T={Vector3:V,Vector4:V,Data3DTexture:Texture,MathUtils:{clamp:(n,a,b)=>Math.max(a,Math.min(b,n))}};
 const {createSchoolSourceDamage}=load(path,{THREE:T},['createSchoolSourceDamage']);
 const api=createSchoolSourceDamage(),material={name:'school-glass'};
 api.patch(material);
 const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <dithering_fragment>'};material.onBeforeCompile(shader);
 const tex=shader.uniforms.schoolDamageMap.value,baseline=new Uint8Array(72*92*152);
 function original(x,y,z,radius){
  const r=radius*1.2,cell=.5,min={x:-18,y:-7,z:-68};
  const low=(p,o)=>Math.max(0,Math.floor((p-o-r)/cell)),high=(p,o,n)=>Math.min(n-1,Math.ceil((p-o+r)/cell));
  for(let k=low(z,min.z);k<=high(z,min.z,152);k++)for(let j=low(y,min.y);j<=high(y,min.y,92);j++)for(let i=low(x,min.x);i<=high(x,min.x,72);i++){
   const dx=min.x+(i+.5)*cell-x,dy=min.y+(j+.5)*cell-y,dz=min.z+(k+.5)*cell-z;
   const edge=radius*(.92+.13*Math.sin(dx*3.7+dy*2.9+dz*4.1)),t=1-Math.hypot(dx,dy,dz)/edge;
   if(t<=0)continue;const offset=(k*92+j)*72+i;baseline[offset]=Math.max(baseline[offset],Math.min(255,Math.round(t*420)));
  }
 }
 const inputs=[[0,4,-2,4.5],[0,4,-2,4.5],[2,5,-8,1.8],[-17,0,-67,3],[100,2,2,2],[1,10,-12,.1]];
 for(let i=0;i<30;i++)inputs.push([Math.sin(i)*12,Math.cos(i)*10+12,-i*2,1+i%4]);
 for(const args of inputs){original(...args);api.stamp(...args);}
 assert.equal(api.strikes(),36);assert.ok(tex.image.data.every((v,i)=>v===baseline[i]));
 assert.equal(api.stats().textureBytes,1006848);assert.ok(api.stats().unchangedStamps>=3);
 const lo=shader.uniforms.uSchoolImpactBoundsMin.value,hi=shader.uniforms.uSchoolImpactBoundsMax.value;
 for(const p of api.impacts())for(const k of ['x','y','z']){assert.ok(lo[k]<=p[k]-p.w*1.55);assert.ok(hi[k]>=p[k]+p.w*1.55);}
 assert.ok(shader.fragmentShader.includes('uSchoolImpactCount>0&&all(greaterThanEqual(damageUv'));
 api.reset();assert.equal(api.strikes(),0);assert.ok(tex.image.data.every(v=>v===0));
 const before=tex.updates;api.reset();assert.equal(tex.updates,before);
 assert.equal(api.stamp(NaN,0,0,1),false);
});
test('Optimized parcel volume matches the original localized mask formula',()=>{
 const {createParcelDamageMask}=load('src/rendering/parcel-damage-mask.js',{},['createParcelDamageMask']);
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 class Texture{constructor(data,w,h,d){this.image={data,w,h,d};}dispose(){}}
 const original={clone(){return {dispose(){}};}},node={isMesh:true,material:original};
 const api=createParcelDamageMask({Vector3:V,Data3DTexture:Texture},{traverse(fn){fn(node);}},{minX:-8,maxX:8,minY:0,maxY:20,minZ:-22,maxZ:2});
 const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <color_fragment>'};node.material.onBeforeCompile(shader);
 const im=shader.uniforms.uParcelDamageMap.value.image,min=shader.uniforms.uParcelDamageMin.value,size=shader.uniforms.uParcelDamageSize.value;
 const baseline=new Uint8Array(im.data.length),dims=[im.w,im.h,im.d],cell=[size.x/im.w,size.y/im.h,size.z/im.d];
 function originalStamp(point,radius,strength){
  const r=Math.min(4.2,Math.max(.65,radius*.55))*Math.min(1,Math.max(.45,Math.sqrt(Math.max(0,strength))));
  const center=[point.x,point.y,point.z],origin=[min.x,min.y,min.z];
  const low=center.map((v,i)=>Math.max(0,Math.floor((v-origin[i]-r*1.2)/cell[i]))),high=center.map((v,i)=>Math.min(dims[i]-1,Math.ceil((v-origin[i]+r*1.2)/cell[i])));
  let changed=false;
  for(let z=low[2];z<=high[2];z++)for(let y=low[1];y<=high[1];y++)for(let x=low[0];x<=high[0];x++){
   const dx=min.x+(x+.5)*cell[0]-point.x,dy=min.y+(y+.5)*cell[1]-point.y,dz=min.z+(z+.5)*cell[2]-point.z;
   const edge=r*(.92+.12*Math.sin(dx*3.7+dy*2.9+dz*4.1)),t=1-Math.hypot(dx,dy,dz)/edge;
   if(t<=0)continue;const idx=(z*im.h+y)*im.w+x,value=Math.min(255,Math.round(t*440));
   if(value>baseline[idx]){baseline[idx]=value;changed=true;}
  }
  return changed;
 }
 const inputs=[];for(let i=0;i<60;i++)inputs.push([{x:Math.sin(i)*9,y:Math.cos(i)*10+10,z:-i%24},1+i%12,.1+(i%9)*.2]);
 inputs.push(inputs[0],inputs[0]);for(const args of inputs)assert.equal(api.stamp(...args),originalStamp(...args));
 assert.ok(im.data.every((v,i)=>v===baseline[i]));assert.ok(api.stats().unchangedStamps>=2);api.dispose();assert.equal(node.material,original);
});
test('Structural broad phase preserves exact narrow-phase hits and original component order',()=>{
 const {createStructuralImpactIndex,distanceToBox}=load('src/simulation/structural-dynamics.js',{},['createStructuralImpactIndex','distanceToBox']);
 const parts=[];for(let x=0;x<30;x++)for(let y=0;y<10;y++)for(let z=0;z<20;z++)parts.push({id:parts.length,position:{x:x*2,y:y*3,z:z*2},size:{x:1.5,y:2.5,z:1.5}});
 parts.push({id:parts.length,position:{x:30,y:0,z:20},size:{x:60,y:.5,z:40}});
 const index=createStructuralImpactIndex(parts);let candidates=0,baseline=0;
 for(let i=0;i<100;i++){
  const p={x:Math.sin(i)*30+30,y:i%30,z:Math.cos(i)*20+20},r=1+i%5,found=index.query(p,r);
  assert.equal(found.filter(q=>distanceToBox(p,q)<=r).map(q=>q.id).join(','),parts.filter(q=>distanceToBox(p,q)<=r).map(q=>q.id).join(','));
  candidates+=found.length;baseline+=parts.length;
 }
 assert.equal(candidates,12718);assert.equal(baseline,600100);
 assert.equal(index.query({x:0,y:0,z:0},10000),parts);
 const city=read('src/rendering/structural-city.js');assert.ok(city.includes('impactIndexes.get(b)?.query(origin,radius*.85)??b.parts'));
});
test('Structural GPU update ranges survive multiple simulation steps and intact meshes stop rewriting during rubble motion',()=>{
 const source=read('src/rendering/structural-city.js');
 const a=source.indexOf('export function markStructuralRange'),b=source.indexOf('export function createStructuralCity',a);
 const mark=new Function(source.slice(a,b).replace(/^export /gm,'')+'return markStructuralRange;')();
 const attribute=()=>({updateRanges:[],versions:0,addUpdateRange(start,count){this.updateRanges.push({start,count});},clearUpdateRanges(){this.updateRanges.length=0;},set needsUpdate(v){if(v)this.versions++;}});
 const attr=attribute();for(let i=0;i<10;i++)mark(attr,i,16);
 assert.equal(attr.updateRanges.length,1);assert.equal(attr.updateRanges[0].count,160);
 for(let i=0;i<80;i++)mark(attr,100+i*3,16);
 for(let i=0;i<80;i++){const lo=(100+i*3)*16;assert.ok(attr.updateRanges.some(r=>r.start<=lo&&r.start+r.count>=lo+16));}
 assert.ok(attr.updateRanges.length<=32);
 const makeMesh=()=>({instanceMatrix:attribute(),visible:true,writes:[],setMatrixAt(i,m){this.writes.push([i,m]);}});
 const mesh=makeMesh(),broken=makeMesh(),zero={zero:true},dummy={position:{copy(){}},rotation:{copy(){}},scale:{copy(){}},updateMatrix(){},matrix:{draw:true}};
 const start=source.indexOf(' function write(p)'),end=source.indexOf(' function interiorFitsParcel',start);
 const write=new Function('dummy','zero','markStructuralRange',source.slice(start,end)+'return write;')(dummy,zero,mark);
 const p={bucket:{mesh,broken},building:{viewerParcel:true,hideIntactGeometry:true,exposedFloors:new Set([0])},type:'slab',floor:0,interiorFits:true,state:'attached',index:4};
 write(p);p.state='falling';write(p);for(let i=0;i<120;i++)write(p);
 assert.equal(mesh.writes.length,2);assert.equal(broken.writes.length,122);
 p.state='settled';write(p);p.state='attached';write(p);
 assert.equal(mesh.writes.at(-1)[1],dummy.matrix);assert.equal(broken.writes.at(-1)[1],zero);
 p.building.exposedFloors.clear();write(p);assert.equal(mesh.writes.at(-1)[1],zero);
 const previous=mesh.writes.length;write(p);assert.equal(mesh.writes.length,previous);
});
test('Legacy school 2D canvases are QA-only while production uses the world-space damage volume',()=>{
 assert.ok(!game.includes('schoolDamageTextures'));
 assert.ok(game.includes("get('qa')==='1'?{front:document.createElement('canvas'),side:document.createElement('canvas')}:{}"));
 assert.ok(game.includes('if(schoolDamagePlanes.front){'));
 assert.ok(game.includes('schoolDamageMask:sourceDamage.stats()'));
});
test('Dense opaque structural slots preserve matrix and color identity during compaction and reuse',()=>{
 const source=read('src/rendering/structural-city.js');
 const a=source.indexOf('export function markStructuralRange'),b=source.indexOf('export function createStructuralCity',a);
 const {createDenseStructuralSlots}=new Function(source.slice(a,b).replace(/^export /gm,'')+'return {createDenseStructuralSlots};')();
 const attribute=n=>({array:new Float32Array(n),updateRanges:[],addUpdateRange(start,count){this.updateRanges.push({start,count});},clearUpdateRanges(){this.updateRanges=[];}});
 const mesh={instanceMatrix:attribute(1600*16),instanceColor:attribute(1600*3),setMatrixAt(i,m){this.instanceMatrix.array.set(m,i*16);},setColorAt(i,c){this.instanceColor.array.set(c,i*3);}};
 const pool=createDenseStructuralSlots(mesh,1600,[1,1,1]),parts=Array.from({length:1600},(_,i)=>({i})),matrix=i=>Array(16).fill(i+1);
 assert.equal(mesh.count,0);assert.equal(mesh.visible,false);
 for(let i=0;i<1600;i++)pool.put(parts[i],matrix(i),[i/1600,0,1]);
 assert.equal(mesh.count,1600);
 for(let i=0;i<1500;i++)pool.remove(parts[i]);
 assert.equal(mesh.count,100);
 for(let slot=0;slot<100;slot++){
  const id=mesh.instanceMatrix.array[slot*16]-1;
  assert.ok(id>=1500&&Math.abs(mesh.instanceColor.array[slot*3]-id/1600)<1e-6);
 }
 pool.put(parts[1599],matrix(2000));pool.recolor(parts[1599],[.5,.5,.5]);assert.equal(mesh.count,100);
 for(let i=1500;i<1600;i++)pool.remove(parts[i]);
 assert.equal(mesh.count,0);assert.equal(mesh.visible,false);
 pool.put(parts[7],matrix(7),[.1,.2,.3]);assert.equal(mesh.count,1);assert.equal(mesh.instanceMatrix.array[0],8);
 assert.ok(source.includes('if(!bucket.material.transparent){bucket.intactSlots='));
});
test('Dense structural slots transition correctly between intact, hidden, falling and repaired states',()=>{
 const source=read('src/rendering/structural-city.js');
 const a=source.indexOf('export function markStructuralRange'),b=source.indexOf('export function createStructuralCity',a);
 const {createDenseStructuralSlots}=new Function(source.slice(a,b).replace(/^export /gm,'')+'return {createDenseStructuralSlots};')();
 const mesh=()=>({instanceMatrix:{array:new Float32Array(32)},instanceColor:{array:new Float32Array(6)},setMatrixAt(i,m){this.instanceMatrix.array.set(m,i*16);},setColorAt(i,c){this.instanceColor.array.set(c,i*3);}});
 const intact=mesh(),broken=mesh(),white=[1,1,1],zero=Array(16).fill(0),dummy={position:{copy(){}},rotation:{copy(){}},scale:{copy(){}},updateMatrix(){},matrix:Array(16).fill(1)};
 const bucket={mesh:intact,broken,intactSlots:createDenseStructuralSlots(intact,2,white),brokenSlots:createDenseStructuralSlots(broken,2,white)};
 const start=source.indexOf(' function write(p)'),end=source.indexOf(' function interiorFitsParcel',start);
 const {write,colorPart}=new Function('dummy','zero','white','markStructuralRange',source.slice(start,end)+'return {write,colorPart};')(dummy,zero,white,()=>{});
 const building={viewerParcel:true,hideIntactGeometry:true,exposedFloors:new Set()},p={bucket,building,type:'slab',floor:0,interiorFits:true,state:'attached'};
 write(p);assert.equal(intact.count,0);assert.equal(broken.count,0);
 building.exposedFloors.add(0);write(p);assert.equal(intact.count,1);
 colorPart(p,[.4,.5,.6]);assert.ok(Math.abs(intact.instanceColor.array[0]-.4)<1e-6);
 p.state='falling';write(p);assert.equal(intact.count,0);assert.equal(broken.count,1);
 p.state='settled';write(p);assert.equal(broken.count,1);
 p.state='attached';building.exposedFloors.clear();colorPart(p,white);write(p);
 assert.equal(intact.count,0);assert.equal(broken.count,0);
 building.exposedFloors.add(0);write(p);assert.equal(intact.count,1);assert.equal(intact.instanceColor.array[0],1);
});
test('Debris render slots preserve logical ring reuse and reset without drawing unused capacity',()=>{
 const source=read('src/rendering/structural-city.js');
 const a=source.indexOf('export function createDebrisRenderSlots'),b=source.indexOf('export function createStructuralCity',a);
 const create=new Function(source.slice(a,b).replace(/^export /gm,'')+'return createDebrisRenderSlots;')();
 const slots=create(1600);for(let i=0;i<800;i++)assert.equal(slots.slotFor(i*2),i);
 assert.equal(slots.count(),800);assert.equal(slots.slotFor(100),50);assert.equal(slots.count(),800);
 slots.reset();assert.equal(slots.count(),0);assert.equal(slots.slotFor(1599),0);
 assert.ok(source.includes('chipMeshes[p.kind].setMatrixAt(p.drawSlot,dummy.matrix)'));
 assert.ok(source.includes('contact.count=Math.min(512,contactCursor)'));
 assert.ok(source.includes('dustMesh.count=count'));
});
test('Per-floor slab candidate ordering is equivalent to the full-building lookup',()=>{
 const source=read('src/rendering/structural-city.js');
 assert.ok(source.includes('(b.slabsByFloor?.[f]??b.slabs).find'));
 assert.ok(source.includes('(b.slabsByFloor?.[p.floor]??b.slabs).some'));
 assert.ok(source.includes('supportedFloors(b.columns??b.parts,b.stories)'));
 const slabs=Array.from({length:200},(_,i)=>({floor:i%10,state:i%7===0?'removed':'attached',position:{x:i%5,z:i%9},size:{x:3,z:3}})),by=Array.from({length:10},()=>[]);
 for(const p of slabs)by[p.floor].push(p);
 for(let f=0;f<10;f++)for(let x=0;x<5;x++)for(let z=0;z<9;z++){
  const matches=s=>s.floor===f&&s.state==='attached'&&Math.abs(s.position.x-x)<s.size.x*.5&&Math.abs(s.position.z-z)<s.size.z*.5;
  assert.equal(slabs.find(matches),by[f].find(matches));
 }
});
test('Cached meteor screen projections preserve swept-circle impact selection, including new fragments and movement',()=>{
 const {createDefenseProjectionCache,projectedMeteorHit}=load('src/simulation/defense-zone.js',{},['createDefenseProjectionCache','projectedMeteorHit']);
 const cache=createDefenseProjectionCache(),camera={x:4,y:8,z:60};cache.begin(camera);
 const meteors=Array.from({length:80},(_,i)=>({size:1+i%4,mesh:{position:{x:i*3-120,y:8+i%20,z:-i%35}}}));
 function baseline(a,b,m){
  const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,ox=a.x-m.x,oy=a.y-m.y,c=ox*ox+oy*oy-m.radius*m.radius;
  if(c<=0)return 0;if(d<1e-10)return Infinity;
  const hb=ox*dx+oy*dy,disc=hb*hb-d*c;if(disc<0)return Infinity;
  const t=(-hb-Math.sqrt(disc))/d;return t>=0&&t<=1?t:Infinity;
 }
 for(let i=0;i<200;i++){
  const a={x:Math.sin(i)*110,y:Math.cos(i)*50},b={x:a.x+Math.sin(i*3)*20,y:a.y+Math.cos(i*3)*10};
  let first=-1,oldFirst=-1,t=Infinity,oldT=Infinity;
  for(const [index,m] of meteors.entries()){
   const p=cache.get(m),hit=projectedMeteorHit(a,b,p),old=baseline(a,b,p);assert.equal(hit,old);
   if(hit<t){first=index;t=hit;}if(old<oldT){oldFirst=index;oldT=old;}
  }
  assert.equal(first,oldFirst);
 }
 assert.equal(cache.stats().projections,80);assert.equal(cache.stats().hits,15920);
 const m=meteors[0];m.mesh.position.x++;assert.equal(cache.get(m).wx,m.mesh.position.x);
 m.size=7;assert.equal(cache.get(m).size,7);
 const fragment={size:1,mesh:{position:{x:0,y:3,z:0}}};assert.equal(cache.get(fragment).x,0);
 cache.begin({x:10,y:10,z:90});assert.equal(cache.stats().projections,0);cache.get(m);assert.equal(cache.stats().projections,1);
 assert.equal(projectedMeteorHit({x:0,y:0},{x:0,y:0},{x:0,y:0,radius:1}),0);
 assert.equal(projectedMeteorHit({x:0,y:0},{x:0,y:0},{x:3,y:0,radius:1}),Infinity);
 assert.ok(game.includes('projectedMeteorHit(defensePrevious,defenseCurrent,defenseProjectionCache.get(m))'));
});
test('Traffic neighbor filtering preserves speed, passing, crater detours and original order',()=>{
 const {trafficTarget,trafficNeighborCandidates,maximumTrafficLength}=load('src/simulation/traffic-dynamics.js',roads,['trafficTarget','trafficNeighborCandidates','maximumTrafficLength']);
 let checked=0,candidateCount=0,baselineCount=0;
 for(let i=0;i<30;i++){
  const cars=Array.from({length:80},(_,n)=>({root:{position:{x:(n-40)*8+Math.sin(i+n)*3,z:[10,13.5,19,23][n%4]}},dir:n%4<2?1:-1,laneZ:[10,13.5,19,23][n%4],length:3+n%8,speed:2+(n+i)%16,desiredSpeed:18,driverPhase:n,emergency:n%13===0}));
  const max=maximumTrafficLength(cars),craters=i%2?[{x:12,z:10,radius:2,life:10}]:[];
  const pedestrians=[{down:0,crossing:true,g:{position:{x:16,z:10}}}];
  for(const car of cars){
   const near=trafficNeighborCandidates(car,cars,max);candidateCount+=near.length;baselineCount+=cars.length;checked++;
   assert.equal(near.map(c=>cars.indexOf(c)).join(','),near.map(c=>cars.indexOf(c)).sort((a,b)=>a-b).join(','));
   assert.equal(trafficTarget(car,cars,pedestrians,true,false,i),trafficTarget(car,near,pedestrians,true,false,i));
   for(const opts of [{},{allowWithoutLeader:true}])assert.equal(lane.choosePassingLane(car,cars,craters,opts),lane.choosePassingLane(car,near,craters,opts));
  }
 }
 assert.equal(checked,2400);assert.equal(candidateCount,20614);assert.equal(baselineCount,192000);
 assert.ok(game.includes('trafficTarget(c,neighbors,crowd,'));
 assert.ok(game.includes('choosePassingLane(c,neighbors,craters'));
});
test('Crowd renderer avoids unchanged color writes and offscreen limb traversal',()=>{
 const {createCrowdRenderer}=load('src/rendering/crowd-renderer.js',{},['createCrowdRenderer']);
 const attr=n=>({count:n,updateRanges:[],array:new Float32Array(n*3),clearUpdateRanges(){this.updateRanges=[];},addUpdateRange(start,count){this.updateRanges.push({start,count});}});
 class Matrix{multiplyMatrices(){return this;}getMaxScaleOnAxis(){return 1;}}
 class V{set(x,y,z){Object.assign(this,{x,y,z});return this;}applyMatrix4(m){this.x=m.x??0;return this;}copy(v){Object.assign(this,v);return this;}}
 class Batch{constructor(g,m,n){this.instanceMatrix=attr(n);this.instanceMatrix.setUsage=()=>{};this.instanceColor=null;this.capacity=n;}setMatrixAt(){}setColorAt(i,c){if(!this.instanceColor)this.instanceColor=attr(this.capacity);this.instanceColor.array.set([c.r,c.g,c.b],i*3);}}
 const T={MeshStandardMaterial:class{},Frustum:class{setFromProjectionMatrix(){}intersectsSphere(s){return Math.abs(s.center.x)<20;}},Matrix4:Matrix,Sphere:class{constructor(){this.center=new V();}},Vector3:V,InstancedMesh:Batch};
 const scene={add(){},remove(){}},renderer=createCrowdRenderer(T,scene),geometry={};
 function person(x){
  const part={isMesh:true,geometry,material:{color:{r:.2,g:.4,b:.6}},matrixWorld:new Matrix(),updates:0,updateWorldMatrix(){this.updates++;}};
  const g={visible:true,children:[part],matrixWorld:Object.assign(new Matrix(),{x}),traverse(fn){fn(this);fn(part);},updateWorldMatrix(){}};
  renderer.register(g);return {g,part};
 }
 const a=person(0),b=person(100),camera={updateWorldMatrix(){},projectionMatrix:{},matrixWorldInverse:{}};
 renderer.update([a,b],camera,true);
 assert.equal(renderer.stats().visiblePeople,1);assert.equal(renderer.stats().culledPeople,1);assert.equal(renderer.stats().colorWrites,1);assert.equal(b.part.updates,0);
 renderer.update([a,b],camera,true);assert.equal(renderer.stats().colorWrites,0);assert.equal(a.part.updates,2);
 a.part.material.color.r=.7;renderer.update([a,b],camera,true);assert.equal(renderer.stats().colorWrites,1);
 b.g.matrixWorld.x=0;renderer.update([a,b],camera,true);assert.equal(renderer.stats().submittedParts,2);assert.equal(renderer.stats().colorWrites,1);assert.equal(b.part.updates,1);
 renderer.update([a,b],camera,false);assert.equal(renderer.stats().submittedParts,0);
});
console.log(count+' integration regression groups passed. Browser/GPU validation is separate.');
