/**
 * Pass 11: Hidden structural ties from facade ornament to source GIS mass.
 * Contact between two ornament pieces alone is NOT a satisfactory check.
 * Supports are conservative box solids that penetrate the original front mass,
 * and attach independently connected clusters to it without changing any city
 * polygons, window/door count, or visible front surface.
 *
 * NOTE: A connected box approximation is NOT equivalent to a watertight STL.
 * A later per-parcel boolean union and manifold validation is mandatory.
 */
import {facadeEdges} from './frontage-review-14.mjs';

export const SUPPORTS_VERSION='mass-anchored-frontage-v11';
const E=0.001;
const bounds=p=> {
 if(p.kind==='box')return [p.x-p.w/2,p.y-p.h/2,p.z-p.d/2,p.x+p.w/2,p.y+p.h/2,p.z+p.d/2];
 if(p.kind==='mesh'){
  p.object.updateMatrixWorld(true);
  const g=p.object.geometry;
  if(!g||typeof g.computeBoundingBox!=='function')return null;
  g.computeBoundingBox();
  const b=g.boundingBox.clone().applyMatrix4(p.object.matrixWorld);
  // Browser-only decals and single-sided unextruded surfaces are not
  // physical solids and cannot be claimed as printable components.
  if([b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z].some(v=>v<1e-5))return null;
  return [b.min.x,b.min.y,b.min.z,b.max.x,b.max.y,b.max.z];
 }
 return null;
};
const overlaps=(a,b)=>[0,1,2].every(k=>Math.min(a[k+3],b[k+3])-Math.max(a[k],b[k])>E);

function pointInsideRing(x,z,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if(((a[1]>z)!==(b[1]>z)) && x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function insideParcel(x,z,row){
 for(const poly of row.polys){
  if(pointInsideRing(x,z,poly[0])&&!poly.slice(1).some(r=>pointInsideRing(x,z,r)))return true;
 }
 return false;
}
function wallFace(row,x){
 // Source-front ray intersects GIS polygon in the vicinity of the nominated
 // front.  Slanted parcel edges are handled without assuming a rectangle.
 const crossings=[];
 for(const poly of row.polys)for(const ring of poly.slice(0,1))for(let j=0;j<ring.length;j++){
  const a=ring[j],b=ring[(j+1)%ring.length];
  if((a[0]<=x&&x<b[0])||(b[0]<=x&&x<a[0])){
   const z=a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
   if(Math.abs(z-row.front)<1.9)crossings.push(z);
  }
 }
 return crossings.length?Math.max(...crossings):row.front;
}

export function supportFacadeToGIS(row,components,addBox,{color=0x806d60}={}){
 if(!Array.isArray(components)||!components.length)return {supports:0,components:0,unanchored:0,unsupportedMeshObjects:0};
 const edges=facadeEdges(row);
 if(!edges.length)return {supports:0,components:0,unanchored:components.length,unsupportedMeshObjects:0};

 const details=components.map(p=>({p,b:bounds(p)})).filter(x=>x.b);
 // 2D browser decal planes are NOT solid pieces and must be embossed before
 // STL creation. They are deliberately excluded from solid-contact claims.
 const n=details.length,bs=details.map(x=>x.b);
 const adjacency=Array.from({length:n},()=>[]);
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(overlaps(bs[i],bs[j])){
  adjacency[i].push(j);adjacency[j].push(i);
 }
 const seen=new Set(),groups=[];
 for(let i=0;i<n;i++)if(!seen.has(i)){
  let group=[],todo=[i];seen.add(i);
  while(todo.length){const v=todo.pop();group.push(v);for(const k of adjacency[v])if(!seen.has(k)){seen.add(k);todo.push(k)}}
  groups.push(group);
 }
 const directlyOnGIS=b=>{
  if(Math.min(b[4],row.h)-Math.max(b[1],0)<=E)return false;
  // A rectangular facade's back crosses the actual front boundary. Test a
  // point 2 cm behind it, rather than relying on GIS bounding rectangle.
  const x=(b[0]+b[3])/2,z=wallFace(row,x);
  return b[2]<z-.015&&b[5]>z+.015&&insideParcel(x,z-.025,row);
 };
 let supports=0,unanchored=0,unsupportedMeshObjects=components.length-details.length;
 for(const group of groups){
  if(group.some(i=>directlyOnGIS(bs[i])))continue;
  // Anchor the shallowest accessible member of this group, preferably a
  // relatively substantial support part (not a thin lettering stroke).
  let choices=group.map(i=>({i,b:bs[i],kind:details[i].p.kind})).filter(({b})=>{
    const x=(b[0]+b[3])/2,z=wallFace(row,x);
    return edges.some(e=>x>e.left+.025&&x<e.right-.025)&&b[4]>.01&&b[1]<row.h-.01&&insideParcel(x,z-.025,row);
  });
  choices.sort((a,b)=>(a.kind==='mesh')-(b.kind==='mesh')||(a.b[2]-wallFace(row,(a.b[0]+a.b[3])/2))-(b.b[2]-wallFace(row,(b.b[0]+b.b[3])/2))||
   (b.b[4]-b.b[1])*(b.b[3]-b.b[0])-(a.b[4]-a.b[1])*(a.b[3]-a.b[0]));
  if(!choices.length){unanchored++;continue;}
  const b=choices[0].b, x=(b[0]+b[3])/2,faceZ=wallFace(row,x);
  // Embed by 65 mm into the GIS wall and by 30 mm into the ornament.
  const back=faceZ-.065,front=Math.max(faceZ+.035,b[2]+.032);
  const span=front-back;
  const yLo=Math.max(.035,b[1]+.012),yHi=Math.min(row.h-.035,b[4]-.012);
  const y=yHi>=yLo?(yLo+yHi)/2:Math.max(.035,Math.min(row.h-.035,(b[1]+b[4])/2));
  const h=Math.min(.075,Math.max(.034,b[4]-b[1]-.002));
  const w=Math.min(.075,Math.max(.035,b[3]-b[0]-.002));
  addBox(x,y,(front+back)/2,w,h,span,color);
  supports++;
 }
 return {supports,components:groups.length,unanchored,unsupportedMeshObjects,solidDetails:n};
}
