import assert from 'node:assert/strict';
import {buildings} from './district.js';
import {assessments} from './assessment.js';
import {renderWattsTarget,WATTS_TARGET_ADDRESSES} from './watts-antigravity.mjs';
import {insidePoly,indexDistrict} from './secondary-contact.mjs';
const index=indexDistrict(buildings),rows=[];
for(const [polys,h,name] of buildings){
 if(!WATTS_TARGET_ADDRESSES.includes(name))continue;
 for(const poly of polys){
  const parts=[];renderWattsTarget(poly,h,name,{box:(x,y,z,w,hh,d,c,angle=0)=>parts.push({x,y,z,w,h:hh,d,c,angle}),assessments});
  let neighborCandidates=0,frameCandidates=0,neighborHits=0,frameMisses=0;
  for(const p of parts){
   assert.ok([p.x,p.y,p.z,p.w,p.h,p.d,p.angle].every(Number.isFinite)&&Math.min(p.w,p.h,p.d)>0);
   if(p.h<.15||p.y-p.h/2<.02)continue;
   const nx=Math.sin(p.angle),nz=Math.cos(p.angle),tx=nz,tz=-nx;
   const sample=(u,v)=>[p.x+u*p.w*tx+nx*p.d*v,p.z+u*p.w*tz+nz*p.d*v];
   neighborCandidates++;
   const front=[-.4,0,.4].map(u=>sample(u,.35));
   if(index.some(n=>n.p!==poly&&n.h>p.y+p.h/2&&front.some(([x,z])=>insidePoly(n.p,x,z))))neighborHits++;
   if(p.y+p.h/2>=h+.02||p.d!==.14||p.w<.4)continue;
   frameCandidates++;
   if(![-.48,0,.48].map(u=>sample(u,-.48)).every(([x,z])=>insidePoly(poly,x,z)))frameMisses++;
  }
  rows.push({name,height:h,parts:parts.length,neighborCandidates,frameCandidates,neighborHits,frameMisses});
 }
}
const totals={addresses:new Set(rows.map(r=>r.name)).size,volumes:rows.length};
for(const k of ['parts','neighborCandidates','frameCandidates','neighborHits','frameMisses'])totals[k]=rows.reduce((a,r)=>a+r[k],0);
assert.equal(totals.addresses,19);assert.equal(totals.volumes,21);assert.equal(totals.neighborHits,0);assert.equal(totals.frameMisses,0);
console.log(JSON.stringify({pass:true,totals,rows,scope:'Watts specialist callbacks: three front-face sample points per qualifying above-grade box against taller neighboring source polygons; three rear sample points on selected .14m deep frame-like boxes against own footprint. Excludes low details, roof-height frame candidates and public-realm yards; not exact intersections, photo validation or watertightness.'},null,2));
