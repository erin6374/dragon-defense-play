// Structural dynamics shared by rendering and deterministic tests. Units are game metres.
export function distanceToBox(point, part){
 let sum=0;for(const a of ['x','y','z']){const d=Math.max(0,Math.abs(point[a]-part.position[a])-part.size[a]*.5);sum+=d*d}return Math.sqrt(sum);
}
export function supportedFloors(parts,stories){
 const total=Array(stories).fill(0),live=Array(stories).fill(0);
 for(const p of parts)if(p.type==='column'){total[p.floor]++;if(p.state==='attached')live[p.floor]++}
 const supported=[];let below=true;
 for(let f=0;f<stories;f++){below=below&&live[f]/Math.max(1,total[f])>=.67;supported.push(below)}
 return supported;
}
export function verticalExtent(p){const r=p.rotation,s=p.size,cx=Math.cos(r.x),sx=Math.sin(r.x),cy=Math.cos(r.y),sy=Math.sin(r.y),cz=Math.cos(r.z),sz=Math.sin(r.z);return (Math.abs(cx*sz+cz*sx*sy)*s.x+Math.abs(cx*cz-sx*sy*sz)*s.y+Math.abs(sx*cy)*s.z)*.5;}
export function integrateFragment(p,dt,ground=.08){
 p.velocity.y-=10.8*dt;p.position.x+=p.velocity.x*dt;p.position.y+=p.velocity.y*dt;p.position.z+=p.velocity.z*dt;
 p.rotation.x+=p.spin.x*dt;p.rotation.y+=p.spin.y*dt;p.rotation.z+=p.spin.z*dt;
 const bottom=p.position.y-verticalExtent(p);let tipping=false;
 if(bottom<ground+.03&&p.size.y>p.size.z*2&&Math.abs(Math.cos(p.rotation.x))>.08){const target=(p.rotation.x<0?-1:1)*Math.PI/2;const delta=target-p.rotation.x;p.rotation.x+=Math.sign(delta)*Math.min(Math.abs(delta),dt*1.8);p.position.y=ground+verticalExtent(p);p.spin.x=0;tipping=true;}

 if(bottom<ground){p.position.y=ground+verticalExtent(p);if(p.velocity.y<-.8){p.velocity.y*=-.06;p.velocity.x*=.53;p.velocity.z*=.53;p.spin.x*=.22;p.spin.y*=.22;p.spin.z*=.22}else{p.velocity.x*=Math.max(0,1-dt*9);p.velocity.z*=Math.max(0,1-dt*9);p.velocity.y=0;p.spin.x*=.75;p.spin.y*=.75;p.spin.z*=.75}}
 return !tipping&&p.position.y-verticalExtent(p)<=ground+.02&&Math.hypot(p.velocity.x,p.velocity.y,p.velocity.z)<.12;
}
