// Arcade wind physics for an incoming military rocket. This is defensive:
// Paulo can throw missiles off their tracks, including homing weapons.
// Keep the cone and frame delta bounded; never create render objects here.
export function militaryWindImpulse(position,origin,direction,dt){
 if(!position||!origin||!direction||![position.x,position.y,position.z,origin.x,origin.y,origin.z,direction.x,direction.y,direction.z,dt].every(Number.isFinite))return null;
 if(dt<=0)return null;
 const dx=position.x-origin.x,dy=position.y-origin.y,dz=position.z-origin.z;
 const len=Math.hypot(direction.x,direction.y,direction.z);
 if(len<.00001)return null;
 const nx=direction.x/len,ny=direction.y/len,nz=direction.z/len;
 const along=dx*nx+dy*ny+dz*nz;
 if(along<=0||along>49)return null;
 const distanceSquared=dx*dx+dy*dy+dz*dz;
 const across=Math.sqrt(Math.max(0,distanceSquared-along*along));
 const radius=6.5+along*.36;
 if(across>=radius)return null;
 const strength=Math.max(0,(1-along/62)*(1-across/radius));
 const impulse=38*strength*Math.min(.06,dt);
 return {x:nx*impulse,y:ny*impulse+impulse*.35,z:nz*impulse,disrupt:.58+strength*.65,strength};
}
