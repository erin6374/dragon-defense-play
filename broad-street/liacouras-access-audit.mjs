import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {buildings} from './district.js';
import {renderSouthDistrict} from './south-district-review25.mjs';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const records=[];
for(const [record,[polys,height,name]] of buildings.entries()){
 if(name!=='The Shops on Liacouras Walk')continue;
 const boxes=[],finishes=[],parts=[];
 renderSouthDistrict(polys,height,name,{T,block:(poly,h,c,base=0,opts={})=>{if(opts.wallFinish)finishes.push({poly,h,base,finish:opts.wallFinish});},box:(x,y,z,w,h,d,c,angle=0)=>boxes.push({x,y,z,w,h,d,c,angle}),mesh:(g,c,x=0,y=0,z=0)=>{const m=new T.Mesh(g,new T.MeshBasicMaterial({color:c}));m.position.set(x,y,z);parts.push(m);return m;}});
 assert.equal(finishes.length,polys.length);for(const f of finishes){assert.equal(f.finish,'liacouras-brick');assert.equal(f.h,height);assert.equal(f.base,0);assert.ok(polys.includes(f.poly));}
 const B=Math.min(...polys.flat(2).map(p=>p[1]));let bays=0,stairs=0;
 for(const poly of polys){const ring=poly[0],area=ring.slice(1).reduce((v,q,i)=>v+ring[i][0]*q[1]-q[0]*ring[i][1],0),sign=area>0?-1:1;
 for(let j=1;j<ring.length;j++){
  const a=ring[j-1],b=ring[j],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(!(Math.abs(dx)>2*Math.abs(dz)&&Math.min(a[1],b[1])<B+2.5&&Math.abs(dx)>2.7))continue;
  const tx=dx/len,tz=dz/len,nx=-tz*sign,nz=tx*sign,n=Math.max(1,Math.round(len/5.2)),bay=len/n;
  const local=q=>({u:(q.x-a[0])*tx+(q.z-a[1])*tz,p:(q.x-a[0])*nx+(q.z-a[1])*nz});
  for(let k=0;k<n;k++){bays++;if(k!==0&&k!==n-1)continue;stairs++;const center=(k+.5)*bay;
   const near=boxes.map(q=>({...q,...local(q)})).filter(q=>Math.abs(q.u-center)<bay*.5+.03);
   const steps=near.filter(q=>q.c===0xa8a79f&&Math.abs(q.u-center)<.001&&q.p>2.5&&q.p<4.6);assert.equal(steps.length,6);
   // All 3 horizontal terrace rails must stop short of the entire stair width.
   const rails=near.filter(q=>q.c===0x646c69&&q.h===.10&&Math.abs(q.p-2.62)<.001);
   assert.equal(rails.length,6);assert.ok(rails.every(q=>Math.abs(q.u-center)-q.w/2>=bay*.21));
   const bars=near.filter(q=>q.c===0x737c77&&Math.abs(q.p-2.62)<.001);assert.ok(bars.length>0&&bars.every(q=>Math.abs(q.u-center)-q.w/2>=bay*.21));
   const posts=near.filter(q=>q.c===0x646c69&&Math.abs(q.w-.08)<1e-6&&Math.abs(q.d-.08)<1e-6&&Math.abs(Math.abs(q.u-center)-bay*.18)<.001);assert.equal(posts.length,8);
   for(const q of posts){const deck=Math.abs(q.p-2.60)<.001;const support=deck?1.125:Math.max(...steps.filter(s=>q.p>=s.p-s.d/2&&q.p<=s.p+s.d/2).map(s=>s.y+s.h/2));assert.ok(Number.isFinite(support));assert.ok(q.y-q.h/2<support&&q.y+q.h/2>support);}
  }
 }
 }
 records.push({record,bays,stairs,brickWalls:finishes.length});
}
assert.equal(records.length,2);assert.equal(records.reduce((s,r)=>s+r.bays,0),20);assert.equal(records.reduce((s,r)=>s+r.stairs,0),11);
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const {makeFrontages}=await import('./mapped-geometry.js');const data=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8'));const scene=new T.Scene();makeFrontages(scene,data.rows,data.streets);let walls=0;scene.traverse(o=>{if(o.userData.wallFinish!=='liacouras-brick')return;walls++;assert.equal(o.material.length,2);assert.ok(o.material[1].map.isDataTexture);assert.ok(o.geometry.groups.some(g=>g.materialIndex===1));assert.ok(o.geometry.getAttribute('uv').array.every(Number.isFinite));});assert.equal(walls,2);
console.log(JSON.stringify({pass:true,records,brickWallMaterials:walls,scope:'Actual render callbacks: all existing stair treads retained, horizontal rail/baluster clearance along each local edge, stair handrail post support, and real Three.js masonry material routing. No survey of stair positions, ADA compliance, triangle contact or GPU rendering.'},null,2));
