// Models face local +Z. Orient from actual displacement, including retreat and crossings.
export function updatePedestrianPose(p,previousX,previousZ,dt){
 const dx=p.g.position.x-previousX,dz=p.g.position.z-previousZ,distance=Math.hypot(dx,dz);
 if(distance>1e-5){const heading=Math.atan2(dx,dz);p.g.rotation.y=heading;}
 return distance;
}
