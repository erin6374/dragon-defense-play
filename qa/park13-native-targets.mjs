// Matched target schedule comes from the pinned imported parcel inventory,
// including both southern records. Sample inside real polygon rings/holes.
import {VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z} from '../src/simulation/viewer-parcels.js';
const inside=(r,x,z)=>{let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [a,b]=r[i],[c,d]=r[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)hit=!hit;}return hit;};
function sample(r){
 for(const poly of r.polys){
  const xs=poly[0].map(p=>p[0]),zs=poly[0].map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const valid=(x,z)=>inside(poly[0],x,z)&&!poly.slice(1).some(h=>inside(h,x,z));
  const midX=(minX+maxX)/2,midZ=(minZ+maxZ)/2;
  if(valid(midX,midZ))return {id:r.id,x:midX+VIEWER_TO_GAME_X,z:midZ+VIEWER_TO_GAME_Z};
  for(let i=1;i<10;i++)for(let j=1;j<10;j++){
   const x=minX+(maxX-minX)*i/10,z=minZ+(maxZ-minZ)*j/10;
   if(valid(x,z))return {id:r.id,x:x+VIEWER_TO_GAME_X,z:z+VIEWER_TO_GAME_Z};
  }
 }
 return null;
}
export function selectPark13NativeTargets(pilot,south){
 const candidates=pilot.filter(r=>r.height<22).map(sample).filter(Boolean).sort((a,b)=>a.x-b.x);
 const southern=south.map(sample);
 if(candidates.length<10||southern.length!==2||southern.some(r=>!r))throw Error('Insufficient matched bombardment targets');
 const targets=[...Array.from({length:10},(_,i)=>candidates[Math.floor(i*(candidates.length-1)/9)]),...southern].sort((a,b)=>a.x-b.x);
 if(new Set(targets.map(t=>t.id)).size!==12)throw Error('Duplicate bombardment targets');
 return targets;
}
