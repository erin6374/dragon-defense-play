import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const {makeFrontages}=await import('./mapped-geometry.js');
const {groundPlan}=await import('./block-ground-review37.mjs');
const row=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8')).rows.find(r=>r.id==='1005655');
const scene=new T.Scene();makeFrontages(scene,[row],[],{auditOnly:true,hideTrees:true});scene.updateMatrixWorld(true);
const results=[];const test=(label,pass,details={})=>results.push({label,pass:!!pass,...details});
const bounds=o=>new T.Box3().setFromObject(o);
const intersection=(a,b)=>['x','y','z'].map(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k]));
const overlaps=(a,b)=>intersection(a,b).every(v=>v>1e-4);
const inside=(x,z,ring)=>{let a=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,zi]=ring[i],[xj,zj]=ring[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)a=!a;}return a;};
const room=scene.children.find(o=>o.name===row.address);const floor=room.children.find(o=>o.name==='Floor 0');
const supports=room.children.filter(o=>['Counter','Table pedestal','Bench'].includes(o.name));
test('13 floor-mounted furniture supports',supports.length===13);
for(const [i,o] of supports.entries()){
 const b=bounds(o),f=bounds(floor),corners=[[b.min.x,b.min.z],[b.min.x,b.max.z],[b.max.x,b.min.z],[b.max.x,b.max.z]];
 const inFloor=corners.every(([x,z])=>row.polys.some(p=>inside(x,z,p[0])&&!p.slice(1).some(r=>inside(x,z,r))));
 test(o.name+' '+i+' overlaps actual footprint slab',inFloor&&overlaps(b,f),{overlapY:Math.min(b.max.y,f.max.y)-Math.max(b.min.y,f.min.y)});
}
const tables=room.children.filter(o=>o.name==='Dining table');test('four dining tables',tables.length===4);
for(const [i,o] of tables.entries())test('Table '+i+' intersects pedestal',supports.some(s=>s.name==='Table pedestal'&&overlaps(bounds(o),bounds(s))));
const parts=groundPlan().filter(p=>p.site.startsWith('mcdonalds-'));const lots=parts.filter(p=>p.kind==='lot');const lot=lots.find(p=>p.site==='mcdonalds-side-parking');
test('three parking/drive slabs penetrate legacy terrain top -0.20 m',lots.length===3&&lots.every(p=>p.base<-.20&&p.top>.0));
for(const p of parts.filter(p=>p.kind==='stall-mark'||p.kind==='stall-edge'))test('Parking marking overlaps its pavement',p.base<lot.top&&p.top>lot.top&&p.x0>=lot.x0&&p.x1<=lot.x1&&p.z0>=lot.z0&&p.z1<=lot.z1);
const cars=scene.children.filter(o=>o.name.startsWith('McDonalds parked vehicle '));test('three parked vehicle groups',cars.length===3);
for(const group of cars){const body=group.children.find(o=>o.name==='Body'),cabin=group.children.find(o=>o.name==='Cabin'),tires=group.children.filter(o=>o.name==='Tire');const all=bounds(group);
 test(group.name+' inside traced lot',all.min.x>=lot.x0&&all.max.x<=lot.x1&&all.min.z>=lot.z0&&all.max.z<=lot.z1);
 test(group.name+' cabin overlaps body',overlaps(bounds(body),bounds(cabin)));test(group.name+' has four tires',tires.length===4);
 for(const [i,t] of tires.entries()){const b=bounds(t);test(group.name+' tire '+i+' penetrates pavement and body envelope',b.min.y<lot.top&&b.max.y>lot.top&&overlaps(b,bounds(body)),{wheelPavementOverlapMeters:lot.top-b.min.y});}
}
const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({scope:'Actual emitted scene: furniture footprint containment, box/slab overlap, traced parking plan and tire/body envelope checks. Not triangle-level contact, WebGL, source photo validation, or STL proof.',totals:{checks:results.length,passed:results.length-failed.length,failed:failed.length},results},null,2));if(failed.length)process.exitCode=1;
