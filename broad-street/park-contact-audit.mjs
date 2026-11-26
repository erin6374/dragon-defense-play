import {buildings} from './district.js';
import {assessments} from './assessment.js';
import {PARK_REVIEW_ADDRESSES,parkFacadePlan,renderParkFrontage,parkWallZ} from './park-facades-20.mjs';
const rows=[];let fails=0;
for(const name of PARK_REVIEW_ADDRESSES){
 const candidates=buildings.filter(b=>b[2]===name).sort((a,b)=>b[1]-a[1]);
 if(!candidates.length){rows.push({name,error:'no footprint'});fails++;continue;}
 const [polys,height]=candidates[0],plan=parkFacadePlan(polys,height,name,assessments[name]?.number_stories);
 if(!plan){rows.push({name,error:'no plan'});fails++;continue;}
 const boxes=[];
 renderParkFrontage(plan,{box:(x,y,z,w,h,d,color)=>boxes.push({x,y,z,w,h,d,color})});
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
 const expectedWindows=(plan.floors-1)*plan.upperWindowCount+1;
 const actualWindows=boxes.filter(b=>b.color===0x536870).length;
 const actualDoors=boxes.filter(b=>b.color===0x384b51).length;
 const detached=boxes.map((b,i)=>i).filter(i=>!connected.has(i));
 const bad=detached.length||actualWindows!==expectedWindows||actualDoors!==1||boxes.some(b=>![b.x,b.y,b.z,b.w,b.h,b.d].every(Number.isFinite)||Math.min(b.w,b.h,b.d)<=0);
 if(bad)fails++;
 rows.push({name,height,floors:plan.floors,assessmentStories:assessments[name]?.number_stories??null,components:boxes.length,connected:connected.size,detached,actualWindows,expectedWindows,actualDoors,status:bad?'FAIL':'PASS'});
}
const totals={addresses:rows.length,components:rows.reduce((s,r)=>s+(r.components||0),0),connected:rows.reduce((s,r)=>s+(r.connected||0),0),failedAddresses:fails};
console.log(JSON.stringify({scope:'GIS-proportioned Park frontage; primitive contact graph, not mesh watertightness or photographic validation',totals,rows},null,2));
if(fails)process.exitCode=1;
