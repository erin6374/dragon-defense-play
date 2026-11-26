import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const {makeFrontages}=await import('./mapped-geometry.js');
const data=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8'));
const out=[];
const overlap=(a,b)=>['x','y','z'].every(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])>.0001);
for(const row of data.rows){
 if(row.school||row.context){out.push({address:row.address,id:row.id,excluded:row.school?'original FBX separately loaded':'context'});continue;}
 const scene=new T.Scene();try{makeFrontages(scene,[row],[],{auditOnly:true,hideTrees:true});}catch(e){out.push({address:row.address,id:row.id,error:String(e)});continue;}
 scene.updateMatrixWorld(true);const parts=[],visual=[];let invalid=0;
 const matrix=new T.Matrix4();scene.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const g=o.geometry.boundingBox;
 const put=(m,i)=>{const bb=g.clone().applyMatrix4(m);if(bb.isEmpty()||![...bb.min.toArray(),...bb.max.toArray()].every(Number.isFinite)){invalid++;return;}const size=g.getSize(new T.Vector3());const p={bb,kind:o.geometry.type,instance:i,name:o.name||null};if(Math.min(...size.toArray())<.000001)visual.push(p);else parts.push(p);};
 if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);put(new T.Matrix4().multiplyMatrices(o.matrixWorld,matrix),i);}}else put(o.matrixWorld,null);
 });
 const reached=new Set(),adj=Array.from(parts,()=>[]);
 const order=parts.map((p,i)=>i).sort((a,b)=>parts[a].bb.min.x-parts[b].bb.min.x);
 for(const [i,p] of parts.entries())if(p.bb.min.y<=.001&&p.bb.max.y>.001)reached.add(i);
 for(let i=0;i<order.length;i++){const a=order[i],A=parts[a].bb;for(let j=i+1;j<order.length;j++){const b=order[j],B=parts[b].bb;if(B.min.x>=A.max.x-.0001)break;if(overlap(A,B)){adj[a].push(b);adj[b].push(a);}}}
 const queue=[...reached];for(let i=0;i<queue.length;i++)for(const j of adj[queue[i]])if(!reached.has(j)){reached.add(j);queue.push(j);}
 const unresolved=parts.map((p,i)=>({i,kind:p.kind,bounds:[p.bb.min.toArray().map(v=>+v.toFixed(3)),p.bb.max.toArray().map(v=>+v.toFixed(3))]})).filter(p=>!reached.has(p.i));
 out.push({address:row.address,id:row.id,volumetricParts:parts.length,visualPlanes:visual.length,aabbReachable:reached.size,unresolved,invalid});
}
const active=out.filter(r=>!r.excluded&&!r.error);console.log(JSON.stringify({scope:'Actual makeFrontages per-address auditOnly render using bundled Three.js and canvas stub; AABB reachability from any grounded solid; possible false positives from overlapping bounding boxes and independently grounded fixtures. Planes excluded from solid contact; no WebGL or FBX validation.',totals:{mappedRecords:out.length,rendered:active.length,excluded:out.filter(r=>r.excluded).length,errors:out.filter(r=>r.error).length,volumetricParts:active.reduce((n,r)=>n+r.volumetricParts,0),visualPlanes:active.reduce((n,r)=>n+r.visualPlanes,0),unresolved:active.reduce((n,r)=>n+r.unresolved.length,0),invalid:active.reduce((n,r)=>n+r.invalid,0)},records:out},null,2));if(out.some(r=>r.error||r.invalid))process.exitCode=1;
