/** Review36: short side-street approaches beyond Broad sidewalks.
 * Municipal centerline samples determine bends; widths are provisional.
 * No new GIS records; Norris/Polett lack source side-road centerlines here.
 */
import * as T from 'three';
import {JUNCTIONS,curbAt} from './broad-street-surface-review35.mjs';
export function approachPlan(streets){
 const out=[];
 for(const j of JUNCTIONS)for(const side of [-1,1]){
  const [west,east]=curbAt(j.x),start=side<0?Math.max(-19.55,west-3.45):Math.min(9.5,east+3.20);
  const lines=streets.filter(s=>s.name.toUpperCase()===j.name.toUpperCase()&&s.points.some(p=>side<0?p[1]<start-1:p[1]>start+1));
  const points=lines.flatMap(s=>s.points).sort((a,b)=>a[1]-b[1]);
  const sample=z=>{
   if(!points.length)return j.x;
   for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(z>=a[1]&&z<=b[1]&&b[1]-a[1]>.001)return a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]);}
   return z<points[0][1]?points[0][0]:points.at(-1)[0];
  };
  const length=lines.length?18:8,steps=6;
  const cross=d=>{const z=start+side*d,blend=Math.min(1,d/8);return {z,x:j.x+(sample(z)-j.x)*blend};};
  const piece=(kind,a,b,l,r,base,top,color)=>out.push({kind,junction:j.name,side,source:lines.length?'municipal centerline':'provisional continuation',base,top,color,ring:[[a.x+l,a.z],[a.x+r,a.z],[b.x+r,b.z],[b.x+l,b.z]]});
  for(let i=0;i<steps;i++){
   const a=cross(length*i/steps),b=cross(length*(i+1)/steps);
   piece('side-road',a,b,-j.half,j.half,.075,.135,0x5a5b58);
   // Road-only extension: side sidewalks need a separate lot/footprint
   // clearance review. Add short low crosswalk bars at the Broad-side mouth.
   if(i===0)for(let x=-j.half+.35;x+.42<j.half-.3;x+=.94){
    const c=cross(.45),d=cross(Math.min(length/steps-.05,1.8));
    piece('side-crosswalk',c,d,x,x+.42,.135,.151,0xe0ded2);
   }
  }
 }
 return out;
}
export function createJunctionApproaches(streets){
 const group=new T.Group();group.name='Review36 side-street approaches';
 const plan=approachPlan(streets),materials=new Map();
 for(const p of plan){
  const shape=new T.Shape();p.ring.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:p.top-p.base,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  if(!materials.has(p.color))materials.set(p.color,new T.MeshStandardMaterial({color:p.color,roughness:.96}));
  const m=new T.Mesh(geo,materials.get(p.color));m.position.y=p.base;m.name=p.kind+' '+p.junction;group.add(m);
 }
 group.userData={approachCount:plan.filter(p=>p.kind==='side-road').length/6,sourceCenterlineApproaches:new Set(plan.filter(p=>p.source==='municipal centerline').map(p=>p.junction+':'+p.side)).size,approximateApproaches:new Set(plan.filter(p=>p.source!=='municipal centerline').map(p=>p.junction+':'+p.side)).size,pieceCount:plan.length};return group;
}
