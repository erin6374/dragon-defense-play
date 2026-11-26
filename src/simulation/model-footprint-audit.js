// Pure spatial QA helpers used by loaded North Broad GLB visual diagnostics.
// Coordinates are game-space world units. A model's AABB includes decorative
// projections, so overlap warnings require visual review rather than automatic
// deletion or placement edits.
export function boundsOverlap3D(a,b,tolerance=0.20){
 if(!a||!b)return null;
 const axes=['X','Y','Z'];
 const overlap={};
 for(const axis of axes){
  const low=Math.max(a['min'+axis],b['min'+axis]);
  const high=Math.min(a['max'+axis],b['max'+axis]);
  if(!Number.isFinite(low)||!Number.isFinite(high)||high-low<=tolerance)return null;
  overlap[axis.toLowerCase()]=high-low;
 }
 return {x:overlap.x,y:overlap.y,z:overlap.z,volume:overlap.x*overlap.y*overlap.z};
}

export function parcelOverhang(worldBounds,parcel){
 if(!worldBounds||!parcel)return null;
 const box={minX:parcel.x-parcel.w/2,maxX:parcel.x+parcel.w/2,
  minZ:parcel.z-parcel.d/2,maxZ:parcel.z+parcel.d/2};
 if(!Object.values(box).every(Number.isFinite))return null;
 const overhang={
  northX:Math.max(0,box.minX-worldBounds.minX),
  southX:Math.max(0,worldBounds.maxX-box.maxX),
  rearZ:Math.max(0,box.minZ-worldBounds.minZ),
  frontZ:Math.max(0,worldBounds.maxZ-box.maxZ)
 };
 return Object.fromEntries(Object.entries(overhang).map(([key,value])=>[key,+value.toFixed(3)]));
}

export function overlapsBetweenLoadedModels(entries,tolerance=0.20){
 const pairs=[];
 for(let i=0;i<entries.length;i++){
  if(!entries[i].loaded||!entries[i].worldBounds)continue;
  for(let j=i+1;j<entries.length;j++){
   if(!entries[j].loaded||!entries[j].worldBounds)continue;
   const overlap=boundsOverlap3D(entries[i].worldBounds,entries[j].worldBounds,tolerance);
   if(overlap)pairs.push({
    first:entries[i].def.id,second:entries[j].def.id,
    firstAddress:entries[i].def.address,secondAddress:entries[j].def.address,
    overlap:{x:+overlap.x.toFixed(3),y:+overlap.y.toFixed(3),z:+overlap.z.toFixed(3)}
   });
  }
 }
 return pairs;
}
