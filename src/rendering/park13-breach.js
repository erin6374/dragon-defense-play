// Damage-only shell mesh. Intact parcels continue using the pinned material
// batches. Cut surface triangles around impact sites, retaining polygon holes.
export function buildPark13Breach(T,owner,deform){
 const positions=[],colors=[],color=new T.Color();
 const height=owner.record.height,sites=owner.impacts,damage=owner.damage;
 let removed=0,interiorTriangles=0,reliefRemoved=0;
 const clippedDetails=new Set();
 const dist=(a,p)=>Math.hypot(a[0]-p.x,(a[1]-p.y)*.8,a[2]-p.z);
 const radius=p=>p.radius*Math.min(.75,.30+Math.sqrt(p.budget)*.8);
 const deformed=v=>[v[0],deform(v[1],v[0],v[2]),v[2]];
 function emit(a,b,c,tint,rendered=null){
  color.setHex(tint);
  for(const v of rendered??[a,b,c].map(deformed)){positions.push(...v);colors.push(color.r,color.g,color.b);}
 }
 function cut(a,b,c,tint,depth=0,rendered=[a,b,c].map(deformed)){
  // Interpolate transformed vertices on original triangle planes. Adjacent
  // triangles then share the same straight edge even with uneven subdivision.
  // Prune far triangles using conservative axis bounds before subdividing.
  const tri=[a,b,c],near=sites.filter(p=>{
   const r=radius(p);
   return [p.x,p.y,p.z].every((v,i)=>{
    const span=i===1?r/.8:r,lo=Math.min(a[i],b[i],c[i]),hi=Math.max(a[i],b[i],c[i]);
    return v>=lo-span&&v<=hi+span;
   });
  });
  if(!near.length){emit(a,b,c,tint,rendered);return;}
  const length=(u,v)=>Math.hypot(...u.map((n,i)=>n-v[i]));
  const edges=[length(a,b),length(b,c),length(c,a)],i=edges.indexOf(Math.max(...edges));
  if(depth<10&&edges[i]>.95){
   const u=tri[i],v=tri[(i+1)%3],w=tri[(i+2)%3],m=u.map((n,j)=>(n+v[j])*.5);
   const ru=rendered[i],rv=rendered[(i+1)%3],rw=rendered[(i+2)%3],rm=ru.map((n,j)=>(n+rv[j])*.5);
   cut(u,m,w,tint,depth+1,[ru,rm,rw]);cut(m,v,w,tint,depth+1,[rm,rv,rw]);return;
  }
  const center=a.map((n,j)=>(n+b[j]+c[j])/3);
  if(near.some(p=>dist(center,p)<radius(p))){removed++;return;}
  emit(a,b,c,tint,rendered);
 }
 if(damage>=1||!sites.length)return null;
 for(const volume of owner.volumes){
  const a=volume.original;
  for(let i=0;i<a.length;i+=9)cut(Array.from(a.subarray(i,i+3)),Array.from(a.subarray(i+3,i+6)),Array.from(a.subarray(i+6,i+9)),volume.color);
 }
 if(!removed)return null;
 const shellRemoved=removed;
 // Clip intersecting relief boxes in place rather than leave large cladding
 // panels spanning a new hole. Preserve the original instanced detail if
 // its actual triangles survive the cut; only changed pieces enter the batch.
 for(const detail of owner.details??[]){
  const e=detail.original.elements;
  const corners=Array.from({length:8},(_,i)=>{
   const x=(i&1)?.5:-.5,y=(i&2)?.5:-.5,z=(i&4)?.5:-.5;
   return [e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]];
  });
  if(!sites.some(p=>[p.x,p.y,p.z].every((v,i)=>{
   const pad=radius(p)/(i===1?.8:1);
   return v>=Math.min(...corners.map(c=>c[i]))-pad&&v<=Math.max(...corners.map(c=>c[i]))+pad;
  })))continue;
  const offset=positions.length,prior=removed;
  const faces=[[0,2,3,1],[4,5,7,6],[0,1,5,4],[2,6,7,3],[0,4,6,2],[1,3,7,5]];
  for(const [a,b,c,d] of faces){cut(corners[a],corners[b],corners[c],detail.color);cut(corners[a],corners[c],corners[d],detail.color);}
  if(removed===prior){positions.length=offset;colors.length=offset;continue;}
  clippedDetails.add(detail);reliefRemoved+=removed-prior;
 }
 // Illustrative floor decks only for residential-scale footprints. Do not
 // invent a generic residential floor stack in churches/campus/auditoria.
 const w=owner.collision.w,d=owner.collision.d;
 if(Math.min(w,d)>=2.4&&Math.min(w,d)<=9.5&&Math.max(w,d)>=5&&height>=4.5&&height<=14.5){
  const floors=Math.max(2,Math.min(4,Math.round(height/3.35)));
  for(const poly of owner.record.polys){
   const rings=poly.map(r=>{const pts=r.map(([x,z])=>new T.Vector2(x,z));if(pts.length>1&&pts[0].equals(pts.at(-1)))pts.pop();return pts;});
   const faces=T.ShapeUtils.triangulateShape(rings[0],rings.slice(1)),vertices=rings.flat();
   for(let floor=1;floor<floors;floor++){
    const y=height*floor/floors;
    // Floors remain below the damaged roof; omit decks in the immediate blast.
    for(const face of faces){
     const tri=face.map(i=>[vertices[i].x,y,vertices[i].y]),center=tri[0].map((v,j)=>(v+tri[1][j]+tri[2][j])/3);
     if(sites.some(p=>dist(center,p)<radius(p)*.65))continue;
     emit(...tri,0x9b8c79);interiorTriangles++;
    }
   }
  }
 }
 return {positions,colors,removed:shellRemoved,reliefRemoved,clippedDetails,interiorTriangles};
}


// Segment intersection against the same damaged shell and floor triangles
// used by the renderer. Two-sided surfaces; nearest contact wins. Cache the
// tight bounds and Float32 vertices once per impact, not on each game tick.
export function createPark13BreachTracer(positions,offsetX=0,offsetZ=0){
 const a=Float32Array.from(positions);
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<a.length;i++){const j=i%3;lo[j]=Math.min(lo[j],a[i]);hi[j]=Math.max(hi[j],a[i]);}
 return function trace(start,end,maxT=1){
  if(!a.length)return null;
  const ox=start.x-offsetX,oy=start.y,oz=start.z-offsetZ;
  const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z;
  const limit=Math.min(1,maxT);
  // Axis slab rejection limits triangle tests to actually crossed parcels.
  let near=0,far=limit;
  const origin=[ox,oy,oz],delta=[dx,dy,dz];
  for(let j=0;j<3;j++){
   if(Math.abs(delta[j])<1e-10){if(origin[j]<lo[j]-1e-5||origin[j]>hi[j]+1e-5)return null;continue;}
   const t0=(lo[j]-origin[j]-1e-5)/delta[j],t1=(hi[j]-origin[j]+1e-5)/delta[j];
   near=Math.max(near,Math.min(t0,t1));far=Math.min(far,Math.max(t0,t1));
   if(near>far)return null;
  }
  let best=limit,found=false;
  for(let i=0;i<a.length;i+=9){
   const e1x=a[i+3]-a[i],e1y=a[i+4]-a[i+1],e1z=a[i+5]-a[i+2];
   const e2x=a[i+6]-a[i],e2y=a[i+7]-a[i+1],e2z=a[i+8]-a[i+2];
   const px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x;
   const det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-10)continue;
   const inv=1/det,tx=ox-a[i],ty=oy-a[i+1],tz=oz-a[i+2];
   const u=(tx*px+ty*py+tz*pz)*inv;if(u< -1e-7||u>1+1e-7)continue;
   const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x;
   const v=(dx*qx+dy*qy+dz*qz)*inv;if(v< -1e-7||u+v>1+1e-7)continue;
   const t=(e2x*qx+e2y*qy+e2z*qz)*inv;
   if(t< -1e-7||t>best||oy+dy*t<.7)continue;
   best=Math.max(0,t);found=true;
  }
  return found?best:null;
 };
}
