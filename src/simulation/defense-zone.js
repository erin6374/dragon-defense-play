// Street, school block and its immediate rear row are the player defense zone.
// All rocks in the playable meteor collection remain interceptable at any depth.
export const DEFENSE_REAR_Z=-36;
// Project viewed world positions onto a common world-Z plane. This preserves
// screen aim under perspective, including camera scroll, without 3D plane misses.
export function projectDefensePoint(point,camera,out){
 const scale=Math.abs(camera.z/(camera.z-point.z));
 out.set(camera.x+(point.x-camera.x)*scale,camera.y+(point.y-camera.y)*scale,0);
 return scale;
}

// Project each unchanged meteor once per projectile phase. New fragments
// and any position/size changes are observed immediately, never by stale index.
export function createDefenseProjectionCache(){
 let cached=new WeakMap(),cx,cy,cz,projections=0,hits=0;
 function begin(camera){
  cached=new WeakMap();cx=camera.x;cy=camera.y;cz=camera.z;projections=hits=0;
 }
 function get(meteor){
  const p=meteor.mesh.position,size=meteor.size;
  let v=cached.get(meteor);
  if(v&&v.wx===p.x&&v.wy===p.y&&v.wz===p.z&&v.size===size){hits++;return v;}
  const scale=Math.abs(cz/(cz-p.z));
  v={wx:p.x,wy:p.y,wz:p.z,size,x:cx+(p.x-cx)*scale,y:cy+(p.y-cy)*scale,radius:(size*1.1+.95)*scale};
  cached.set(meteor,v);projections++;return v;
 }
 return {begin,get,stats:()=>({projections,hits})};
}
// Exact swept-circle hit time, including initial overlap and zero-length paths.
// Broad phase only rejects circles entirely outside the segment bounding box.
export function projectedMeteorHit(start,end,meteor){
 const dx=end.x-start.x,dy=end.y-start.y,travelSq=dx*dx+dy*dy;
 const x=meteor.x,y=meteor.y,r=meteor.radius;
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(r)||r<0)return Infinity;
 if(x+r<Math.min(start.x,end.x)||x-r>Math.max(start.x,end.x)||y+r<Math.min(start.y,end.y)||y-r>Math.max(start.y,end.y))return Infinity;
 const ox=start.x-x,oy=start.y-y,c=ox*ox+oy*oy-r*r;
 if(c<=0)return 0;
 if(travelSq<1e-10)return Infinity;
 const halfB=ox*dx+oy*dy,disc=halfB*halfB-travelSq*c;
 if(disc<0)return Infinity;
 const t=(-halfB-Math.sqrt(disc))/travelSq;
 return t>=0&&t<=1?t:Infinity;
}
