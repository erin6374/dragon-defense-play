// Collision-only helper. Kept independent of Three.js for deterministic QA.
// Geometry is an approximate gameplay footprint, not actual BIM mesh raycasting.
export function detectMilitaryCollateral(position,age,structures=[]) {
 if(!(age>.4)||!position||![position.x,position.y,position.z].every(Number.isFinite))return null;
 for(const b of structures) {
  if(!b||b.damage>=1||b.background)continue;
  if(position.y<1||position.y>(b.h||0)+.7)continue;
  if(Math.abs(position.x-b.x)<=b.w*.5+.45&&Math.abs(position.z-b.z)<=b.d*.5+.45)
   return {type:'structure',name:b.name||'building',x:position.x,y:position.y,z:position.z};
 }
 // A missed missile may crater the road and hit nearby traffic.
 if(position.y<=.95&&Math.abs(position.x)<90&&position.z>=12&&position.z<=42)
  return {type:'road',name:'Broad Street',x:position.x,y:.9,z:position.z};
 return null;
}
