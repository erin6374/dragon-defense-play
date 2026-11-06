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
