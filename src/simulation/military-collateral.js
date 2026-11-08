// Segment/sphere intersection for fast military rockets versus moving targets.
// Returns the first contact in this frame, or null for a clear path.
export function segmentSphereEntry(start,end,center,radius){
 if(!start||!end||!center||!(radius>0)||![start.x,start.y,start.z,end.x,end.y,end.z,center.x,center.y,center.z,radius].every(Number.isFinite))return null;
 const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z;
 const fx=start.x-center.x,fy=start.y-center.y,fz=start.z-center.z;
 const a=dx*dx+dy*dy+dz*dz,c=fx*fx+fy*fy+fz*fz-radius*radius;
 if(c<=0)return {t:0,x:start.x,y:start.y,z:start.z};
 if(a<1e-12)return null;
 const b=2*(fx*dx+fy*dy+fz*dz),disc=b*b-4*a*c;
 if(disc<0)return null;
 const t=(-b-Math.sqrt(disc))/(2*a);
 if(t<0||t>1)return null;
 return {t,x:start.x+dx*t,y:start.y+dy*t,z:start.z+dz*t};
}

// Collision-only helper. Kept independent of Three.js for deterministic QA.
// Geometry is an approximate gameplay footprint, not actual BIM mesh raycasting.
// Sweep the missile's entire frame segment so fast rockets cannot tunnel through
// narrow rowhouses or skip over Broad Street during a long animation frame.
function segmentBoxEntry(start,end,lo,hi){
 let enter=0,leave=1;
 for(const axis of ['x','y','z']){
  const delta=end[axis]-start[axis];
  if(Math.abs(delta)<1e-9){
   if(start[axis]<lo[axis]||start[axis]>hi[axis])return null;
   continue;
  }
  const a=(lo[axis]-start[axis])/delta,b=(hi[axis]-start[axis])/delta;
  enter=Math.max(enter,Math.min(a,b));
  leave=Math.min(leave,Math.max(a,b));
  if(enter>leave)return null;
 }
 return enter;
}
export function detectMilitaryCollateral(position,age,structures=[],previousPosition=null){
 const start=previousPosition||position;
 if(!(age>.4)||!position||!start||![position.x,position.y,position.z,start.x,start.y,start.z].every(Number.isFinite))return null;
 let nearest=null,nearestT=Infinity;
 function consider(type,name,lo,hi){
  const t=segmentBoxEntry(start,position,lo,hi);
  if(t===null||t>=nearestT)return;
  nearestT=t;
  nearest={type,name,x:start.x+(position.x-start.x)*t,
   y:type==='road'?.9:start.y+(position.y-start.y)*t,
   z:start.z+(position.z-start.z)*t};
 }
 for(const b of structures){
  if(!b||b.damage>=1||b.background||![b.x,b.z,b.w,b.d,b.h].every(Number.isFinite)||b.w<=0||b.d<=0||b.h<=0)continue;
  consider('structure',b.name||'building',
   {x:b.x-b.w*.5-.45,y:1,z:b.z-b.d*.5-.45},
   {x:b.x+b.w*.5+.45,y:b.h+.7,z:b.z+b.d*.5+.45});
 }
 // A missed missile may crater the road; select the earliest impact, not
 // whichever structure happens to be first in the city array.
 consider('road','Broad Street',{x:-90,y:-100,z:12},{x:90,y:.95,z:42});
 return nearest;
}
