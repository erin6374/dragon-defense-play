import * as T from './vendor/three.module.js';
import assert from 'node:assert/strict';
import {buildings} from './district.js';
import {assessments} from './assessment.js';
import {PARK_REVIEW_ADDRESSES,parkFacadePlan,renderParkFrontage,parkWallZ} from './park-facades-20.mjs';
import {PARK_2328_32_FRONTAGES} from './park-2328-32-frontages.mjs';
import {PARK_2336_38_PORCH} from './park-2336-38-frontages.mjs';
import {PARK_2350_56_FRONTAGES} from './park-2350-56-frontages.mjs';
import {PARK_2430_32_FRONTAGES} from './park-2430-32-frontages.mjs';
import {PARK_2428} from './park-2428-frontage.mjs';
const rows=[];let fails=0;
for(const name of PARK_REVIEW_ADDRESSES){
 const candidates=buildings.filter(b=>b[2]===name).sort((a,b)=>b[1]-a[1]);
 if(!candidates.length){rows.push({name,error:'no footprint'});fails++;continue;}
 const [polys,height]=candidates[0],plan=parkFacadePlan(polys,height,name,assessments[name]?.number_stories);
 if(!plan){rows.push({name,error:'no plan'});fails++;continue;}
 const boxes=[];
 renderParkFrontage(plan,{T,box:(x,y,z,w,h,d,color,angle=0)=>{
  const sin=Math.abs(Math.sin(angle)),cos=Math.abs(Math.cos(angle));
  boxes.push({x,y,z,w:w*cos+d*sin,h,d:d*cos+w*sin,color,angle});
 },mesh:(g,color,x,y,z)=>{g.computeBoundingBox();const c=g.boundingBox.getCenter(new T.Vector3()),s=g.boundingBox.getSize(new T.Vector3());boxes.push({x:x+c.x,y:y+c.y,z:z+c.z,w:s.x,h:s.y,d:s.z,color});}});
 const bound=b=>[[b.x-b.w/2,b.x+b.w/2],[b.y-b.h/2,b.y+b.h/2],[b.z-b.d/2,b.z+b.d/2]];
 const connected=new Set();
 const overlap=(a,b)=>bound(a).every(([lo,hi],i)=>Math.min(hi,bound(b)[i][1])-Math.max(lo,bound(b)[i][0])>.001);
 for(let i=0;i<boxes.length;i++){
  const b=boxes[i],bb=bound(b);
  if(bb[1][1]<=0||bb[1][0]>=height)continue;
  for(const k of [-.44,-.22,0,.22,.44]){
   const wall=parkWallZ(polys,b.x+b.w*k);
   if(Number.isFinite(wall)&&bb[2][1]>wall+.001&&bb[2][0]<wall+.05){connected.add(i);break;}
  }
 }
 let changed=true;
 while(changed){changed=false;for(let i=0;i<boxes.length;i++)if(!connected.has(i)&&[...connected].some(j=>overlap(boxes[i],boxes[j]))){connected.add(i);changed=true;}}
 const has2236Bay=name==='2236 N PARK AVE';
 const northRow=PARK_2328_32_FRONTAGES[name];
 const awningRow=PARK_2430_32_FRONTAGES[name];
 const is2428=name===PARK_2428.address;
 const is2336=name==='2336 N PARK AVE';
 const is2338=name==='2338 N PARK AVE';
 const expectedGroundWindows=northRow?.windows.length??awningRow?.sashes.length??(['2236 N PARK AVE','2250 N PARK AVE','2252 N PARK AVE'].includes(name)||is2336||is2338||is2428?2:1);
 const expectedWindows=(plan.floors-1)*plan.upperWindowCount+expectedGroundWindows;
 const actualWindows=boxes.filter(b=>b.color===0x536870).length;
 const newerBrick=PARK_2350_56_FRONTAGES[name];
 const doors=boxes.filter(b=>b.color===(awningRow?.door??newerBrick?.door??(is2428?PARK_2428.door:is2336?0xb4aea3:is2338?0x3d3047:has2236Bay?0x42784c:0x384b51)));
 const actualDoors=doors.length;
 if(has2236Bay||name==='2238 N PARK AVE'){
  const [door]=doors;
  assert.ok(door);
  const stairs=boxes.filter(b=>b.color===0xa4a5a1&&Math.abs(b.x-door.x)<1e-8);
  assert.deepEqual(stairs.map(b=>+b.h.toFixed(3)),[.18,.36,.54,.72]);
  assert.equal(boxes.filter(b=>b.color===0x829494).length,has2236Bay?0:10);
  const handrails=boxes.filter(b=>b.color===0xe7e7e2&&b.h===.07);
  assert.equal(handrails.length,4);
  assert.ok(handrails.every(b=>Math.abs(b.x-door.x)-b.w/2>stairs[0].w/2));
  const porchDepth=plan.facade.z-Math.min(...stairs.map(b=>b.z-b.d/2));
  assert.ok(Math.abs(porchDepth-2.13)<1e-8);
 }
 if(has2236Bay){
  const bay=boxes.filter(b=>b.color===0x536870&&b.y>4&&b.y<6);
  const angled=bay.filter(b=>b.angle);
  assert.equal(bay.length,3);
  assert.equal(angled.length,2);
  assert.ok(Math.abs(angled[0].angle+angled[1].angle)<1e-8);
  assert.ok(bay.every(b=>b.z+b.d/2<plan.facade.z));
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-8&&b.x+b.w/2<=plan.facade.right+1e-8));
 }
 if(name==='2318 N PARK AVE'){
  const [door]=doors;
  const steps=boxes.filter(b=>b.color===0x9d9a90&&Math.abs(b.x-door.x)<1e-8&&b.w===1.12);
  assert.deepEqual(steps.map(b=>+b.h.toFixed(2)),[.21,.42,.63,.84]);
  const balcony=boxes.filter(b=>b.color===0x9d9a90&&b.y>3);
  assert.equal(balcony.length,1);
  const [deck]=balcony;
  const railUprights=boxes.filter(b=>b.color===0xdaddd6&&b.h===.95);
  assert.equal(railUprights.length,20);
  assert.ok(railUprights.every(b=>Math.abs(b.x-deck.x)+b.w/2<=deck.w/2+.01));
  assert.equal(boxes.filter(b=>b.color===0x93a0a1).length,17);
  assert.equal(boxes.filter(b=>b.color===0x534840).length,11);
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-8&&b.x+b.w/2<=plan.facade.right+1e-8));
 }
 if(name==='2316 N PARK AVE'){
  const streetWall=parkWallZ(polys,plan.facade.left+plan.facade.width*.55);
  const bays=boxes.filter(b=>b.color===0x44494a&&b.h===2.46);
  assert.equal(bays.length,2);
  assert.ok(bays[0].y+bays[0].h/2<bays[1].y-bays[1].h/2);
  assert.ok(bays.every(b=>b.z+b.d/2>streetWall+.07&&b.z-b.d/2>plan.facade.z));
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-6&&b.x+b.w/2<=plan.facade.right+1e-6));
  const steps=boxes.filter(b=>b.color===0xa49c8c&&b.w===1.12);
  assert.deepEqual(steps.map(b=>+b.h.toFixed(3)),[.175,.35,.525,.7]);
 }
 if(northRow){
  const steps=boxes.filter(b=>b.color===0x9d9789&&b.w===1.12);
  assert.deepEqual(steps.map(b=>+b.h.toFixed(2)),[.18,.36,.54,.72]);
  assert.ok(Math.abs(plan.facade.z-Math.min(...steps.map(b=>b.z-b.d/2))-1.94)<1e-8);
  const gablePeak=boxes.some(b=>b.y+b.h/2>plan.height+.65);
  assert.equal(gablePeak,northRow.gable);
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-6&&b.x+b.w/2<=plan.facade.right+1e-6));
 }
 if(is2336||is2338){
  const {joint,roofHeight,front,gableHalfWidth}=PARK_2336_38_PORCH;
  const steps=boxes.filter(b=>b.color===0x99958c&&b.w===1.42);
  assert.deepEqual(steps.map(b=>+b.h.toFixed(2)),[.20,.40,.60,.80]);
  const roofs=boxes.filter(b=>b.color===0xd9d1bd&&b.h===.24&&b.y===roofHeight);
  assert.equal(roofs.length,1);
  assert.ok(Math.abs(roofs[0].x+(is2336?-1:1)*roofs[0].w/2-joint)<1e-7);
  const sharedGable=boxes.find(b=>Math.abs(b.w-gableHalfWidth)<1e-5&&b.z-b.d/2<front-.17);
  assert.ok(sharedGable);
  assert.ok(Math.abs(sharedGable.x+(is2336?-1:1)*sharedGable.w/2-joint)<1e-6);
  assert.equal(boxes.some(b=>b.y+b.h/2>plan.height+.63),is2338);
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-6&&b.x+b.w/2<=plan.facade.right+1e-6));
 }
 if(newerBrick){
  const steps=boxes.filter(b=>b.color===0xaca293&&b.w===1.14);
  assert.equal(steps.length,newerBrick.steps);
  assert.ok(steps.every((b,i)=>Math.abs(b.h-newerBrick.rise*(i+1))<1e-8));
  assert.equal(boxes.filter(b=>b.color===0x738692).length,newerBrick.fanlight?1:0);
  assert.equal(boxes.filter(b=>b.color===0x63747a).length,newerBrick.full?1:0);
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-6&&b.x+b.w/2<=plan.facade.right+1e-6));
 }
 if(awningRow){
  const is2430=name==='2430 N PARK AVE';
  const steps=boxes.filter(b=>b.color===(is2430?0x657b66:0x4c4942)&&b.w===1.20);
  assert.deepEqual(steps.map(b=>+b.h.toFixed(2)),[.17,.34,.51,.68]);
  const roof=boxes.filter(b=>b.color===awningRow.awning&&b.w>4&&b.h>.40);
  assert.equal(roof.length,1);
  assert.equal(boxes.filter(b=>b.color===awningRow.awning&&b.y>4&&b.h>.30).length,is2430?2:0);
  assert.equal(boxes.filter(b=>b.color===0x696b64).length,16);
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-6&&b.x+b.w/2<=plan.facade.right+1e-6));
 }
 if(is2428){
  assert.equal(boxes.filter(b=>b.color===PARK_2428.awning).length,3);
  const stairs=boxes.filter(b=>b.color===PARK_2428.porchBrick&&Math.abs(b.h-.784)>1e-6);
  assert.deepEqual(stairs.map(b=>+b.h.toFixed(3)),[.164,.328,.492,.656,.82]);
  assert.ok(stairs.every(b=>b.x>doors[0].x));
  assert.ok(boxes.every(b=>b.x-b.w/2>=plan.facade.left-1e-6&&b.x+b.w/2<=plan.facade.right+1e-6));
 }
 const detached=boxes.map((b,i)=>i).filter(i=>!connected.has(i));
 const bad=detached.length||actualWindows!==expectedWindows||actualDoors!==1||boxes.some(b=>![b.x,b.y,b.z,b.w,b.h,b.d].every(Number.isFinite)||Math.min(b.w,b.h,b.d)<=0);
 if(bad)fails++;
 rows.push({name,height,floors:plan.floors,assessmentStories:assessments[name]?.number_stories??null,components:boxes.length,connected:connected.size,detached,actualWindows,expectedWindows,actualDoors,status:bad?'FAIL':'PASS'});
}
const totals={addresses:rows.length,components:rows.reduce((s,r)=>s+(r.components||0),0),connected:rows.reduce((s,r)=>s+(r.connected||0),0),failedAddresses:fails};
console.log(JSON.stringify({scope:'GIS-proportioned Park frontage; primitive contact graph, not mesh watertightness or photographic validation',totals,rows},null,2));
if(fails)process.exitCode=1;
