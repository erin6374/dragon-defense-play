// Structural dynamics shared by rendering and deterministic tests. Units are game metres.
export function distanceToBox(point, part){
 let sum=0;for(const a of ['x','y','z']){const d=Math.max(0,Math.abs(point[a]-part.position[a])-part.size[a]*.5);sum+=d*d}return Math.sqrt(sum);
}
export function supportedFloors(parts,stories){
 const total=Array(stories).fill(0),live=Array(stories).fill(0);
 for(const p of parts)if(p.type==='column'){total[p.floor]++;if(p.state==='attached')live[p.floor]++}
 const supported=[];let below=true;
 for(let f=0;f<stories;f++){
  const ratio=total[f]>0?live[f]/total[f]:1.0;
  // Gradual structural response: a floor remains self-supporting unless >75% of columns on that floor are destroyed
  below=below&&(ratio>=0.12);
  supported.push(below||ratio>=0.20);
 }
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

// The prior full sort was performed for every component. Only the nearest
// two columns on the designated floor are needed; retain stable tie order.
export function nearestSupports(part,columnsByFloor){
 const floor=part.type==='column'&&part.floor>0?part.floor-1:part.floor;
 let first=null,second=null,a=Infinity,b=Infinity;
 for(const column of columnsByFloor[floor]||[]){
  const distance=column.position.distanceToSquared(part.position);
  if(distance<a){second=first;b=a;first=column;a=distance;}
  else if(distance<b){second=column;b=distance;}
 }
 return second?[first,second]:first?[first]:[];
}

// Index the immutable AABBs of attached components; detached pieces are
// filtered by the caller. Preserve original component order for deterministic
// damage and debris emission, including equal-distance contacts.
export function createStructuralImpactIndex(parts,{cellSize=5,maxCellsPerPart=64}={}){
 const grid=new Map(),large=[],order=new Map();
 const cell=v=>Math.floor(v/cellSize),key=(x,y,z)=>x+':'+y+':'+z;
 for(let i=0;i<parts.length;i++){
  const p=parts[i];order.set(p,i);
  const {position,size}=p.original??p;
  if(![position.x,position.y,position.z,size.x,size.y,size.z].every(Number.isFinite)||Math.min(size.x,size.y,size.z)<0){large.push(p);continue;}
  const x0=cell(position.x-size.x*.5),x1=cell(position.x+size.x*.5);
  const y0=cell(position.y-size.y*.5),y1=cell(position.y+size.y*.5);
  const z0=cell(position.z-size.z*.5),z1=cell(position.z+size.z*.5);
  if((x1-x0+1)*(y1-y0+1)*(z1-z0+1)>maxCellsPerPart){large.push(p);continue;}
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++){
   const k=key(x,y,z);let bucket=grid.get(k);if(!bucket)grid.set(k,bucket=[]);bucket.push(p);
  }
 }
 function query(point,radius){
  if(!point||![point.x,point.y,point.z,radius].every(Number.isFinite)||radius<0)return parts;
  const x0=cell(point.x-radius),x1=cell(point.x+radius),y0=cell(point.y-radius),y1=cell(point.y+radius),z0=cell(point.z-radius),z1=cell(point.z+radius);
  if((x1-x0+1)*(y1-y0+1)*(z1-z0+1)>Math.max(64,grid.size*2))return parts;
  const found=new Set(large);
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++){
   const bucket=grid.get(key(x,y,z));if(bucket)for(const p of bucket)found.add(p);
  }
  return [...found].sort((a,b)=>order.get(a)-order.get(b));
 }
 return {query,stats:()=>({components:parts.length,cells:grid.size,large:large.length})};
}
