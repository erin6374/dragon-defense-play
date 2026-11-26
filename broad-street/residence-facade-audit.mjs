import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {buildings} from './district.js';
import {renderSouthDistrict} from './south-district-review25.mjs';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const records=[];
for(const [record,[polys,height,name]] of buildings.entries()){
 if(![1,63].includes(record))continue;
 const boxes=[],finishes=[],blocks=[];
 renderSouthDistrict(polys,height,name,{T,block:(poly,h,c,base=0,opts={})=>{blocks.push({poly,h,c,base,opts});if(opts.wallFinish)finishes.push({h,base,finish:opts.wallFinish});},box:(x,y,z,w,h,d,c,angle=0)=>boxes.push({x,y,z,w,h,d,c,angle}),mesh:(g,c,x=0,y=0,z=0)=>{const m=new T.Mesh(g,new T.MeshBasicMaterial({color:c}));m.position.set(x,y,z);return m;}});
 if(record===1){
  assert.equal(name,'Liacouras Walk Residence Hall');assert.equal(finishes.length,2);
  assert.deepEqual(finishes,[{h:3.72,base:0,finish:'residence-brick'},{h:height-3.70,base:3.70,finish:'residence-brick'}]);
  assert.ok(blocks.some(b=>b.poly===polys[0]&&b.base===height-.06&&b.opts.aerialRoof===false));
  const frames=boxes.filter(q=>q.c===0x594a40&&q.h===1.77);const meeting=boxes.filter(q=>q.c===0x3e4447&&q.h===.075);const head=boxes.filter(q=>q.c===0x3e4447&&q.h===.065);
  assert.ok(frames.length>0);assert.equal(meeting.length,frames.length);assert.equal(head.length,frames.length);
  const bands=boxes.filter(q=>q.c===0xa47c5d&&q.h===.19);assert.equal(bands.length,2);
  const soldiers=boxes.filter(q=>[0x946f53,0xa47b5d,0xb08a69].includes(q.c)&&q.h===.16);assert.ok(soldiers.length>0);
  records.push({record,windowFrames:frames.length,meetingRails:meeting.length,soldierCourseBands:bands.length,soldierBricks:soldiers.length,brickWalls:finishes.length});
 }else{
  assert.equal(name,'2001-47 N BROAD ST');assert.equal(finishes.length,0);
  const R=Math.max(...polys.flat(2).map(q=>q[0]));const fascia=boxes.filter(q=>q.c===0x9b2335&&q.h===.53);assert.equal(fascia.length,1);assert.ok(fascia[0].x>R-.6);assert.ok(fascia[0].y+fascia[0].h/2<5.4);
  const glazing=boxes.filter(q=>q.c===0x40545a&&q.h===2.86);assert.equal(glazing.length,7);assert.ok(glazing.every(q=>q.x>R-.6&&q.y+q.h/2<5.4));
  records.push({record,clubGlazedBays:glazing.length,clubRedFascias:fascia.length});
 }
}
assert.equal(records.length,2);
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const {makeFrontages}=await import('./mapped-geometry.js');const data=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8'));const scene=new T.Scene();makeFrontages(scene,data.rows,data.streets);let walls=0;scene.traverse(o=>{if(o.userData.wallFinish!=='residence-brick')return;walls++;assert.equal(o.material.length,2);assert.ok(o.material[1].map.isDataTexture);assert.ok(o.geometry.groups.some(g=>g.materialIndex===1));assert.ok(o.geometry.getAttribute('uv').array.every(Number.isFinite));});assert.equal(walls,2);
console.log(JSON.stringify({pass:true,records,brickWallMaterials:walls,scope:'Actual callbacks and Three.js material construction; existing modeled openings, brick material routing, soldier-course accents, and south wing glazing/fascia. Not a survey, GPU render, or structural certification.'},null,2));
