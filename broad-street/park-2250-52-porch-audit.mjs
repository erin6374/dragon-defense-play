import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {buildings} from './district.js';
import {assessments} from './assessment.js';
import {parkFacadePlan,renderParkFrontage,parkWallZ} from './park-facades-20.mjs';
const records=[];
for(const address of ['2250 N PARK AVE','2252 N PARK AVE']){
 const [polys,h]=buildings.find(b=>b[2]===address&&b[1]>4.5);
 const p=parkFacadePlan(polys,h,address,assessments[address]?.number_stories),{left,right,width,z}=p.facade;
 const boxes=[],meshes=[],paintedPanels=[];
 renderParkFrontage(p,{T,box:(x,y,z,w,h,d,c)=>boxes.push({x,y,z,w,h,d,c}),mesh:(g,c,x,y,z,finish)=>{
  (finish?paintedPanels:meshes).push({g,c,x,y,z,finish});
 }});
 const white=address.startsWith('2250'),doorX=left+width*(white?.22:.78),stepW=Math.min(width*.28,1.42),front=z-1.48;
 const steps=boxes.filter(b=>b.c===0xa6a49e&&Math.abs(b.x-doorX)<1e-6&&Math.abs(b.w-stepW)<1e-6);
 assert.equal(steps.length,6);for(let i=0;i<6;i++){assert.ok(Math.abs(steps[i].h-(i+1)*.16)<1e-8);assert.ok(Math.abs(steps[i].z+steps[i].d/2-front-.08)<1e-8);}
 const deck=boxes.find(b=>b.c===0xa6a49e&&b.h===.15);assert.ok(deck);assert.ok(deck.y+deck.h/2>.96);
 const rails=boxes.filter(b=>b.c===(white?0x333635:0x62514a)&&b.h===.065);
 assert.ok(rails.length>=2);assert.ok(rails.every(b=>Math.abs(b.x-doorX)-b.w/2>=stepW/2+.01));
 const windows=boxes.filter(b=>b.c===0x536870);assert.equal(windows.length,6);assert.equal(windows.filter(b=>b.y<3).length,2);
 const doors=boxes.filter(b=>b.c===0x384b51);assert.equal(doors.length,1);assert.equal(doors[0].x,doorX);
 const columns=boxes.filter(b=>b.w===.14&&b.h>2.5);assert.equal(columns.length,3);assert.ok(columns.every(b=>Math.abs(b.x-doorX)-b.w/2>=stepW/2));
 assert.equal(meshes.length,white?0:1);for(const m of meshes){assert.equal(m.g.type,'ExtrudeGeometry');m.g.computeBoundingBox();const b=m.g.boundingBox;assert.ok(m.x+b.min.x>=left&&m.x+b.max.x<=right);assert.ok(m.y+b.min.y<3.72&&m.y+b.max.y>4.1);assert.ok(m.z+b.max.z>parkWallZ(polys,doorX));}
 assert.ok(boxes.every(b=>b.x-b.w/2>=left-1e-8&&b.x+b.w/2<=right+1e-8));
 assert.equal(paintedPanels.length>0,white);
 for(const {g,c,x,y,z,finish} of paintedPanels){
  assert.equal(g.type,'BoxGeometry');
  assert.equal(c,0xdedbd1);
  const pos=g.getAttribute('position'),uv=g.getAttribute('uv');
  const face=g.groups[finish.brickFace];
  for(const i of g.index.array.slice(face.start,face.start+face.count)){
   assert.ok(pos.getZ(i)<0);
   assert.ok(Math.abs(uv.getX(i)-(x-(left+right)/2+pos.getX(i)))<1e-6);
   assert.ok(Math.abs(uv.getY(i)-(y+pos.getY(i)))<1e-6);
  }
  g.computeBoundingBox();
  assert.ok(z+g.boundingBox.max.z>parkWallZ(polys,x));
 }
 records.push({address,boxes:boxes.length,paintedPanels:paintedPanels.length,gables:meshes.length,steps:steps.length,groundWindows:2,door:1,columns:columns.length,stairOpeningClear:true,maximumProjection:+(z-Math.min(...boxes.map(b=>b.z-b.d/2))).toFixed(3)});
}
console.log(JSON.stringify({pass:true,records,scope:'Actual frontage callbacks, six stepped risers, stair rail/column clearance, parcel-width containment and gable geometry; approximate depth beyond source footprint; curb/road clearance and current photo dimensions not measured.'},null,2));
