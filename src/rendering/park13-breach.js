// Damage-only shell mesh. Intact parcels continue using the pinned material
// batches. Cut surface triangles around impact sites, retaining polygon holes.
export function buildPark13Breach(T,owner,deform){
 const positions=[],colors=[],color=new T.Color();
 const height=owner.record.height,sites=owner.impacts,damage=owner.damage;
 let removed=0,interiorTriangles=0;
 const dist=(a,p)=>Math.hypot(a[0]-p.x,(a[1]-p.y)*.8,a[2]-p.z);
 const radius=p=>p.radius*Math.min(.75,.30+Math.sqrt(p.budget)*.8);
 function emit(a,b,c,tint){
  color.setHex(tint);
  for(const v of [a,b,c]){positions.push(v[0],deform(v[1],v[0],v[2]),v[2]);colors.push(color.r,color.g,color.b);}
 }
 function cut(a,b,c,tint,depth=0){
  // Prune far triangles using conservative axis bounds before subdividing.
  const tri=[a,b,c],near=sites.filter(p=>{
   const r=radius(p);
   return [p.x,p.y,p.z].every((v,i)=>{
    const span=i===1?r/.8:r,lo=Math.min(a[i],b[i],c[i]),hi=Math.max(a[i],b[i],c[i]);
    return v>=lo-span&&v<=hi+span;
   });
  });
  if(!near.length){emit(a,b,c,tint);return;}
  const length=(u,v)=>Math.hypot(...u.map((n,i)=>n-v[i]));
  const edges=[length(a,b),length(b,c),length(c,a)],i=edges.indexOf(Math.max(...edges));
  if(depth<10&&edges[i]>.95){
   const u=tri[i],v=tri[(i+1)%3],w=tri[(i+2)%3],m=u.map((n,j)=>(n+v[j])*.5);
   cut(u,m,w,tint,depth+1);cut(m,v,w,tint,depth+1);return;
  }
  const center=a.map((n,j)=>(n+b[j]+c[j])/3);
  if(near.some(p=>dist(center,p)<radius(p))){removed++;return;}
  emit(a,b,c,tint);
 }
 if(damage>=1||!sites.length)return null;
 for(const volume of owner.volumes){
  const a=volume.original;
  for(let i=0;i<a.length;i+=9)cut(Array.from(a.subarray(i,i+3)),Array.from(a.subarray(i+3,i+6)),Array.from(a.subarray(i+6,i+9)),volume.color);
 }
 if(!removed)return null;
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
 return {positions,colors,removed,interiorTriangles};
}
