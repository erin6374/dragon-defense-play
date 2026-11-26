import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c)}});
const {openingLayout}=await import('./opening-survey-15.mjs');
const {detail2241}=await import('./2241-facade.mjs');
const {detail2239}=await import('./2239-facade.mjs');
const {rows}=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8'));
const records=[];
for(const [id,detail] of [['1508518',detail2241],['1536711',detail2239]]){
 const row=rows.find(r=>String(r.id)===id),layout=openingLayout(row),boxes=[];
 assert.equal(layout.openings.length,4);assert.equal(layout.groundOpenings.length,2);assert.equal(layout.doors.length,1);
 const result=detail(row,layout,{T,box:(x,y,z,w,h,d,c)=>boxes.push({x,y,z,w,h,d,c}),mesh:(g,c,x,y,z)=>{const m=new T.Mesh(g);m.position.set(x,y,z);return m;}});assert.ok(result.applied);
 const light=id==='1508518',frames=boxes.filter(b=>b.c===(light?0x4b4038:0x765045)&&b.d===(light?.23:.25));
 assert.equal(frames.length,light?6:4);
 const windows=light?[...layout.openings,...layout.groundOpenings]:layout.openings;
 for(const o of windows)assert.ok(frames.some(b=>b.x===o.x&&b.y===o.y&&b.h>o.h&&b.w>o.w));
 const units=boxes.filter(b=>b.c===0xd2cfc3&&b.h===.32);assert.equal(units.length,light?2:0);
 if(light){assert.ok(layout.openings.every(o=>o.h===1.85));for(const b of units)assert.ok(layout.openings.some(o=>o.bay===1&&b.x===o.x&&b.y===o.y+o.h*.30));assert.equal(boxes.filter(b=>b.c===0xbcbdb5&&b.h===.011).length,10);}
 assert.ok(boxes.every(b=>[b.x,b.y,b.z,b.w,b.h,b.d].every(Number.isFinite)&&Math.min(b.w,b.h,b.d)>0));
 records.push({id,address:row.address,upperWindows:4,groundWindows:2,doors:1,refinedFrames:frames.length,windowACUnits:units.length,upperWindowHeight:layout.openings[0].h});
}
console.log(JSON.stringify({pass:true,records,scope:'Existing opening inventory, actual facade callbacks, window casing alignment, AC placement and finite dimensions. Photo-derived proportions and finishes approximate; no GPU or measured survey.'},null,2));
