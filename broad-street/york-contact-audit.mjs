import {buildings} from './district.js';
import {YORK_PROFILES,yorkPlan,yorkRelief,yorkWallS,renderYorkDistrict} from './york-facades.mjs';
import * as T from './vendor/three.module.js';
const rows=[];let failed=0;
function inside(ring,x,z){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
 const [a,b]=ring[i],[c,d]=ring[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)yes=!yes;
 }return yes;}
function inPolys(ps,x,z){return ps.some(p=>inside(p[0],x,z)&&!p.slice(1).some(r=>inside(r,x,z)));}
for(const [address,profile] of Object.entries(YORK_PROFILES)){
 const matches=buildings.filter(b=>b[2]===address);if(matches.length!==1){rows.push({address,error:'expected one mapped record'});failed++;continue;}
 const [ps,height]=matches[0],p=yorkPlan(ps,height,address),b=yorkRelief(p),connected=new Set();
 const bounds=q=>[[q.u-q.w/2,q.u+q.w/2],[q.y-q.h/2,q.y+q.h/2],[q.a,q.b]];
 const overlap=(a,b)=>bounds(a).every(([lo,hi],i)=>Math.min(hi,bounds(b)[i][1])-Math.max(lo,bounds(b)[i][0])>.001);
 for(let i=0;i<b.length;i++){
  const q=b[i];if(q.y+q.h/2<=0||q.y-q.h/2>=p.eave)continue;
  for(const t of [-.46,-.23,0,.23,.46]){const u=q.u+t*q.w,s=yorkWallS(ps,u,q.side);if(!Number.isFinite(s)||q.a>=s-.002||q.b<=s-.005)continue;const test=Math.max(q.a+.001,s-.025);if(test<s&&test<q.b&&inPolys(ps,q.side*test,u)){connected.add(i);break;}}
 }
 let changed=true;while(changed){changed=false;for(let i=0;i<b.length;i++)if(!connected.has(i)&&[...connected].some(j=>overlap(b[i],b[j]))){connected.add(i);changed=true;}}
 const detached=b.map((q,i)=>i).filter(i=>!connected.has(i));
 const finite=b.every(q=>[q.u,q.y,q.w,q.h,q.a,q.b].every(Number.isFinite)&&q.w>0&&q.h>0&&q.b>q.a);
 const windowCount=b.filter(q=>q.kind==='window').length,doorCount=b.filter(q=>q.kind==='door').length;
 const expectedWindows=profile.kind==='small-detached'?0:profile.kind==='corner'?14:(profile.floors-1)*2+1;
 const expectedDoors=profile.kind==='small-detached'?0:1;
 let meshes=[],blocks=[],actualBoxes=[];
 const rendered=renderYorkDistrict(ps,height,address,{T,box:(...a)=>actualBoxes.push(a),block:(...a)=>blocks.push(a),mesh:(g,c)=>{meshes.push(g);return new T.Mesh(g,new T.MeshBasicMaterial({color:c}));}});
 let roof=null;if(p.hip){const g=meshes[0],pos=g.attributes.position,edges=new Map();const vertex=i=>[pos.getX(i),pos.getY(i),pos.getZ(i)].map(x=>x.toFixed(4)).join(',');
 for(let i=0;i<pos.count;i+=3)for(const [a,c] of [[i,i+1],[i+1,i+2],[i+2,i]]){const key=[vertex(a),vertex(c)].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}
 const [x0,x1,z0,z1]=p.hip.rect;let contained=true;for(let i=0;i<=10;i++)for(let j=0;j<=10;j++)if(!inPolys(ps,x0+(x1-x0)*i/10,z0+(z1-z0)*j/10))contained=false;
 roof={closed:[...edges.values()].every(n=>n===2),triangles:pos.count/3,insideFootprint:contained,verticalOverlap:p.eave-(p.hip.eave-.10),peak:p.hip.peak};}
 // Check no relief component enters the interior of another mapped parcel (sample grid).
 let neighborHits=[];for(let i=0;i<b.length;i++){const q=b[i];for(const [other,oh,n] of buildings){if(n===address)continue;
  if(q.y-q.h/2>=oh)continue;
  if([-.45,0,.45].some(t=>[.05,.5,.95].some(k=>inPolys(other,q.side*(q.a+(q.b-q.a)*k),q.u+q.w*t))))neighborHits.push({component:i,neighbor:n});}}
 const ok=rendered&&blocks.length===ps.length*2&&actualBoxes.length===b.length&&finite&&!detached.length&&!neighborHits.length&&windowCount===expectedWindows&&doorCount===expectedDoors&&(!roof||(roof.closed&&roof.insideFootprint&&roof.verticalOverlap>.05));
 if(!ok)failed++;
 rows.push({address,kind:profile.kind,sourceHeight:height,provisionalStories:profile.floors??null,components:b.length,connected:connected.size,detached,windows:windowCount,doors:doorCount,neighborHits,roof,status:ok?'PASS':'FAIL'});
}
const totals={structures:rows.length,facadeComponents:rows.reduce((n,r)=>n+(r.components||0),0),connected:rows.reduce((n,r)=>n+(r.connected||0),0),failed};
console.log(JSON.stringify({scope:'York Street actual renderer callback, sampled wall contact/adjacent footprint exclusion; closed roof topology; NOT STL union or photo validation',totals,rows},null,2));if(failed)process.exitCode=1;
