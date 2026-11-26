import * as T from './vendor/three.module.js';
import {buildings} from './district.js';
import {addDistrict} from './district-geometry.js';
import {insidePoly,indexDistrict} from './secondary-contact.mjs';
const index=indexDistrict(buildings),rows=[],secondary=[],publicRealm=[];let current=null;
const bb=(g,m)=>{g.computeBoundingBox();return g.boundingBox.clone().applyMatrix4(m);};
const dummy=new T.Object3D(),cube=new T.BoxGeometry(),identity=new T.Matrix4();
function add(obj){(current?.parts||publicRealm).push(obj);}
function box(x,y,z,w,h,d,c,angle=0){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,angle,0);dummy.updateMatrix();add({kind:'box',bounds:bb(cube,dummy.matrix),finite:[x,y,z,w,h,d,angle].every(Number.isFinite)&&Math.min(w,h,d)>0});}
function block(poly,h,c,base=0){const path=(r,C)=>{const p=new C();r.forEach(([x,z],i)=>i?p.lineTo(x,-z):p.moveTo(x,-z));p.closePath();return p;};const s=path(poly[0],T.Shape);s.holes=poly.slice(1).map(r=>path(r,T.Path));const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);const m=new T.Matrix4().makeTranslation(0,base,0);add({kind:'block',bounds:bb(g,m),poly,base,h,finite:Number.isFinite(h)&&h>0&&Number.isFinite(base)});g.dispose();}
function mesh(g,c,x=0,y=0,z=0){const m=new T.Mesh(g,new T.MeshBasicMaterial({color:c}));m.position.set(x,y,z);add({kind:'mesh',mesh:m,finite:true});return m;}
addDistrict({T,box,block,mesh,tree:()=>{},audit:e=>{if(e.type==='record'){current={name:e.name,record:e.record,polys:e.polys,height:e.height,parts:[]};rows.push(current);}else if(e.type==='secondary'){secondary.push(e);}else if(e.type==='public-realm')current=null;}});
const bad=[],samples=[];let checked=0,skipped=0;
for(const e of secondary){skipped+=e.plan.skipped.length;for(const q of e.plan.parts){checked++;const tx=q.nz,tz=-q.nx,back=-.065;const cx=q.x-(q.d/2+back)*q.nx,cz=q.z-(q.d/2+back)*q.nz; // center on wall
 const at=(u,v)=>[cx+u*tx+v*q.nx,cz+u*tz+v*q.nz];
 const valid=[-.40,0,.40].every(t=>insidePoly(e.poly,...at(t*q.w,-.04)))&&q.y+q.h/2>0&&q.y-q.h/2<e.h;
 let hits=[];for(const p of index){if(p.p===e.poly||p.h<=q.y-q.h/2)continue;if(p.maxX<q.x-q.w-q.d||p.minX>q.x+q.w+q.d||p.maxZ<q.z-q.w-q.d||p.minZ>q.z+q.w+q.d)continue;
 if([-.45,0,.45].some(t=>[.02,.5, .95].some(k=>insidePoly(p.p,...at(t*q.w,k*(q.d+back))))))hits.push(p.name);}
 if(!valid||hits.length)bad.push({name:e.name,record:e.record,kind:q.kind,wallContact:valid,neighborHits:hits});
 }}
// All actual district primitives: AABB reachability is a SCREEN ONLY, not
// positive mesh contact. Grounded separate GIS volumes are separate seeds.
const overlap=(a,b)=>['x','y','z'].every(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])>.0001);
const report=[];
for(const row of rows){const parts=row.parts;for(const p of parts)if(p.mesh){p.mesh.updateMatrixWorld(true);p.bounds=bb(p.mesh.geometry,p.mesh.matrixWorld);}
 const connected=new Set();let invalid=0;for(let i=0;i<parts.length;i++){const p=parts[i];if(!p.finite||p.bounds.isEmpty()||![...p.bounds.min.toArray(),...p.bounds.max.toArray()].every(Number.isFinite)){invalid++;continue;}
 if(p.kind==='block'&&p.base<=.001)connected.add(i);}
 // Sweep along X to generate candidate overlap edges.
 const order=parts.map((p,i)=>i).sort((a,b)=>parts[a].bounds.min.x-parts[b].bounds.min.x),edges=Array.from(parts,()=>[]);
 for(let i=0;i<order.length;i++){const a=order[i],A=parts[a].bounds;for(let j=i+1;j<order.length;j++){const b=order[j],B=parts[b].bounds;if(B.min.x>=A.max.x-.0001)break;if(overlap(A,B)){edges[a].push(b);edges[b].push(a);}}}
 const queue=[...connected];for(let i=0;i<queue.length;i++)for(const j of edges[queue[i]])if(!connected.has(j)){connected.add(j);queue.push(j);}
 const unresolved=parts.map((p,i)=>({i,kind:p.kind,bounds:[p.bounds.min.toArray().map(v=>+v.toFixed(3)),p.bounds.max.toArray().map(v=>+v.toFixed(3))]})).filter(p=>!connected.has(p.i));
 report.push({name:row.name,record:row.record,components:parts.length,aabbReachable:connected.size,invalid,unresolved});}
const totals={districtRecords:rows.length,secondaryEdges:secondary.length,secondaryComponents:checked,secondaryFailures:bad.length,skippedOpeningCandidates:skipped,allDistrictComponents:report.reduce((n,r)=>n+r.components,0),aabbUnresolved:report.reduce((n,r)=>n+r.unresolved.length,0),invalid:report.reduce((n,r)=>n+r.invalid,0)};
console.log(JSON.stringify({scope:'Actual 83-record district callback; independent sampled secondary-wall contact and neighboring footprint check; approximate all-district AABB reachability screen only, flags include detached site fixtures and intentional disconnected objects; excludes 40 primary Broad Street records, school FBX, public realm, trees, and STL union',totals,secondaryFailures:bad,records:report},null,2));if(bad.length||totals.invalid)process.exitCode=1;
