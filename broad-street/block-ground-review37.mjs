/** Review37: aerial-traced school-block access routes and selected parking.
 * All rectangles are deliberately conservative, checked against all original
 * mapped and district polygon records. No cadastral or surveyed claims.
 * Aerial capture date unknown. X follows Broad; negative Z is the rear.
 */
import * as T from 'three';
export const GROUND_ZONES=[
 ['watts-lane','road',-348,-79,-187,-73.6],
 ['watts-north-sidewalk','walk',-348,-80.5,-187,-79],
 ['watts-south-sidewalk','walk',-348,-73.6,-187,-72.4],
 ['watts-dauphin-link','road',-352.5,-79,-348,-73.6],
 ['watts-susquehanna-link','road',-187,-79,-184,-73.6],
 ['dauphin-school-approach','road',-363.5,-79,-352.5,-37.55],
 ['susquehanna-school-approach','road',-184,-79,-173.5,-37.55],
 ['dauphin-school-sidewalk','walk',-352.5,-72.4,-351,-37.55],
 ['susquehanna-school-sidewalk','walk',-185.5,-72.4,-184,-37.55],
 ['susquehanna-opposite-sidewalk','walk',-173.5,-79,-172,-37.55],
 ['archwell-north-parking','lot',-170,-99,-159,-28],
 ['archwell-front-parking','lot',-158,-44,-121,-29],
 ['archwell-south-parking','lot',-118,-96,-112,-30],
 ['archwell-driveway','lot',-169,-28,-159,-19.7],
 ['mcdonalds-side-parking','lot',-55,-58,-46,-28],
 ['mcdonalds-rear-parking','lot',-79,-71,-47,-59],
 ['mcdonalds-driveway','lot',-79,-59,-73,-28],
 ['autozone-rear-parking','lot',-688,-72,-651,-53],
 ['autozone-side-parking','lot',-663,-52,-651,-28],
 ['autozone-driveway','lot',-657,-28,-651,-19.7]
];
const surfaces={road:[.075,.135,0x5e605d],walk:[.09,.255,0xb9b5a9],lot:[.075,.134,0x666863]};
export function groundPlan(){
 const parts=[];
 const add=(site,kind,x0,z0,x1,z1,base,top,color)=>{if(x1-x0<=.012||z1-z0<=.012||top<=base)throw Error('invalid '+site+':'+kind);parts.push({site,kind,x0,z0,x1,z1,base,top,color});};
 for(const [site,kind,x0,z0,x1,z1] of GROUND_ZONES){
  // Extend the three McDonald's site slabs down into the existing terrain.
  // Retain the exact traced plan and finished pavement elevation.
  const [base,top,color]=surfaces[kind];
  add(site,kind,x0,z0,x1,z1,site.startsWith('mcdonalds-')?-.21:base,top,color);
  if(kind==='walk'){
   if(x1-x0>z1-z0){for(let x=x0+3;x<x1-.10;x+=3)add(site,'joint',x-.018,z0+.06,x+.018,z1-.06,.255,.260,0x8d8d83);}
   else{for(let z=z0+3;z<z1-.10;z+=3)add(site,'joint',x0+.06,z-.018,x1-.06,z+.018,.255,.260,0x8d8d83);}
  }
 }
 // Deliberately model only plausible marked stall rows on the aerial parking
 // surfaces. Exact stall count and accessible designation are not verified.
 const rows=[
 ['archwell-north-parking','z',-169.7,-98,-165.1,-29,2.65],
 ['archwell-front-parking','x',-157,-34.4,-122,-29.25,2.65],
 ['archwell-south-parking','z',-117.7,-94,-112.9,-31,2.65],
 ['mcdonalds-side-parking','z',-51.2,-57,-46.3,-29,2.7],
 ['autozone-rear-parking','x',-687,-71.7,-652,-66.8,2.65],
 ['autozone-side-parking','z',-662.7,-51,-657.9,-29,2.65]
 ];
 for(const [site,axis,x0,z0,x1,z1,spacing] of rows){
  if(axis==='z'){
   for(let z=z0;z<=z1;z+=spacing)add(site,'stall-mark',x0,z-.045,x1,z+.045,site.startsWith('mcdonalds-')?.128:.134,.146,0xd5d2c5);
   add(site,'stall-edge',x1-.045,z0,x1+.045,z1,site.startsWith('mcdonalds-')?.128:.134,.146,0xd5d2c5);
  }else{
   for(let x=x0;x<=x1;x+=spacing)add(site,'stall-mark',x-.045,z0,x+.045,z1,.134,.146,0xd5d2c5);
   add(site,'stall-edge',x0,z1-.045,x1,z1+.045,.134,.146,0xd5d2c5);
  }
 }
 return parts;
}
export function createBlockGround({sitePrefix=''}={}){
 const group=new T.Group();group.name='Review37 school block and parking';
 const plan=groundPlan().filter(p=>p.site.startsWith(sitePrefix)),colors=new Map(),dummy=new T.Object3D(),cube=new T.BoxGeometry(1,1,1);
 for(const p of plan){if(!colors.has(p.color))colors.set(p.color,[]);dummy.position.set((p.x0+p.x1)/2,(p.base+p.top)/2,(p.z0+p.z1)/2);dummy.scale.set(p.x1-p.x0,p.top-p.base,p.z1-p.z0);dummy.updateMatrix();colors.get(p.color).push(dummy.matrix.clone());}
 for(const [color,matrices] of colors){const m=new T.InstancedMesh(cube,new T.MeshStandardMaterial({color,roughness:.96}),matrices.length);matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.instanceMatrix.needsUpdate=true;group.add(m);}
 group.userData={zoneCount:GROUND_ZONES.length,roadZones:GROUND_ZONES.filter(r=>r[1]==='road').length,walkZones:GROUND_ZONES.filter(r=>r[1]==='walk').length,lotZones:GROUND_ZONES.filter(r=>r[1]==='lot').length,pieceCount:plan.length,source:'undated bundled aerial; conservative trace; widths and stalls approximate'};
 return group;
}
