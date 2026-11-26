import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c)}});
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const {makeFrontages}=await import('./mapped-geometry.js');
const data=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8'));
const records=[];
for(const [id,finish] of [['1542243','broad-2253-brick'],['3000691','broad-2255-brick']]){
 const row=data.rows.find(r=>String(r.id)===id);assert.ok(row);
 const scene=new T.Scene();makeFrontages(scene,[row],[],{auditOnly:true,hideTrees:true});let walls=0,roofCaps=0;
 scene.traverse(o=>{if(!o.isMesh)return;if(o.userData.wallFinish!==finish)return;walls++;assert.equal(o.material.length,2);assert.ok(o.material[1].map.isDataTexture);assert.ok(o.geometry.groups.some(g=>g.materialIndex===0));assert.ok(o.geometry.groups.some(g=>g.materialIndex===1));assert.ok(o.geometry.getAttribute('uv').array.every(Number.isFinite));assert.equal(o.material[1].map.repeat.x,1/(8*.215));assert.equal(o.material[1].map.repeat.y,1/(8*.075));o.geometry.computeBoundingBox();assert.ok(Math.abs(o.geometry.boundingBox.max.y-row.h)<.0001);assert.ok(Math.abs(o.geometry.boundingBox.min.y)<.0001);});
 assert.equal(walls,row.polys.length);records.push({id,address:row.address,brickWalls:walls,footprintPolygons:row.polys.length});
}
console.log(JSON.stringify({pass:true,records,scope:'Retained footprint and mass heights; real Three.js shared brick material and physical UV scale. Existing reference interpretation only, not newly verified facade imagery, GPU QA or measured finish.'},null,2));
