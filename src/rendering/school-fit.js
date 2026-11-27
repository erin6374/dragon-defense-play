/** Ground-truth oriented fit for the Tech Freire exterior FBX.
 * Do not use the minimum of the three dimension ratios: Revit FBX can contain
 * deep service/roof extents which previously shrank a five-storey building.
 * The reference envelope is a visual game-space target, not a survey. */
export function schoolFitDimensions(raw,target={width:20.4,height:27.2,depth:15.0}){
 for(const key of ['x','y','z'])if(!Number.isFinite(raw[key])||raw[key]<=0)throw Error(`Invalid school FBX ${key} dimension`);
 const sx=target.width/raw.x,sy=target.height/raw.y,sz=target.depth/raw.z;
 return {
  scale:{x:sx,y:sy,z:sz},
  fitted:{width:raw.x*sx,height:raw.y*sy,depth:raw.z*sz},
  originalAspect:raw.x/raw.y,
  fittedAspect:target.width/target.height,
  maxAnisotropy:Math.max(sx,sy,sz)/Math.min(sx,sy,sz),
  fiveFloorHeights:[0,.2,.4,.6,.8,1].map(frac=>+(frac*target.height).toFixed(3)),
  fitPolicy:'five-story target height is authoritative; X and Z fitted separately; no min-ratio shrink'
 };
}

// Keep source floor heights and horizontal aspect ratio. Fit the complete
// measured visible mesh (including projections) inside the mapped envelope.
export function fitSchoolHorizontalEnvelope(raw,target){
 const width=raw.max.x-raw.min.x,depth=raw.max.z-raw.min.z;
 const w=target.max.x-target.min.x,d=target.max.z-target.min.z;
 if(![width,depth,w,d,raw.min.x,raw.max.x,raw.min.z,raw.max.z,target.min.x,target.max.x,target.min.z,target.max.z].every(Number.isFinite)||Math.min(width,depth,w,d)<=0)throw Error('Invalid school model envelope');
 const scale=Math.min(1,w/width,d/depth);
 const x=(target.min.x+target.max.x)/2-(raw.min.x+raw.max.x)/2*scale;
 const z=target.max.z-raw.max.z*scale;
 return {scale,x,z};
}
export function transformSchoolComponentBounds(records,fit){
 const transform=p=>({x:p.x*fit.scale+fit.x,y:p.y,z:p.z*fit.scale+fit.z});
 return records.map(r=>({...r,min:transform(r.min),max:transform(r.max)}));
}
