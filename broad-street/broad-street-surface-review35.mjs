/** Review35: a reversible 3D Broad Street surface, traced approximately
 * from the bundled city-aerial tiles (5 px/metre; capture date unknown).
 * World X runs along Broad; negative Z is the modeled building side.
 * This does not modify any municipal geometry or existing aerial texture.
 * Not surveyed curb radii or traffic-engineering plans.
 */
import * as T from 'three';
import { BROAD_EXTENTS, CURB_SAMPLES, JUNCTIONS, curbAt } from './broad-street-grid-data.mjs';
export { BROAD_EXTENTS, CURB_SAMPLES, JUNCTIONS, curbAt };
// Review41: the three existing traced driveway mouths, narrowed conservatively
// to leave the existing tree trunks and curb-ramp envelopes clear. Exact
// driveway widths and legal crossing geometry are not surveyed.
export const DRIVEWAY_MOUTHS=[
 {id:'autozone-driveway',x0:-656.8,x1:-651.2,back:-19.7},
 {id:'archwell-driveway',x0:-169.0,x1:-165.5,back:-19.7},
 {id:'mcdonalds-driveway',x0:-76.0,x1:-73.1,back:-28.0}
];
export function streetPlan(){
 const [lo,hi]=BROAD_EXTENTS,parts=[];
 const add=(kind,x0,x1,z0,z1,base,top,color)=>{if(x1-x0<.015||z1-z0<.015||top<=base)throw Error('Invalid street piece '+kind);parts.push({kind,x0,x1,z0,z1,base,top,color});};
 const clear=(x0,x1,extra=0)=>!JUNCTIONS.some(j=>x0<j.x+j.half+extra&&x1>j.x-j.half-extra);
 const cuts=[lo,...JUNCTIONS.flatMap(j=>[j.x-j.half,j.x+j.half]),hi];
 // Broad remains continuous through all seven junctions. Separate strips
 // keep sidewalk/curb from physically blocking the crossing streets.
 for(let i=1;i<cuts.length;i++){
  const a=cuts[i-1],b=cuts[i],x=(a+b)/2,[west,east]=curbAt(x);
  add('asphalt',a,b,west,east,.075,.135,0x5a5b58);
  if(!clear(a+.001,b-.001))continue;
  const rampLength=1.8,left=JUNCTIONS.some(j=>Math.abs(a-j.x-j.half)<.001),right=JUNCTIONS.some(j=>Math.abs(b-j.x+j.half)<.001);
  const aa=a+(left?rampLength:0),bb=b-(right?rampLength:0);
  const westOuter=Math.max(-19.55,west-3.45),eastOuter=Math.min(9.5,east+3.20);
  const mouths=DRIVEWAY_MOUTHS.filter(d=>d.x0>=aa&&d.x1<=bb);
  const split=(lo,hi,spans=mouths)=>{
   const result=[];let cursor=lo;
   for(const d of spans){const x0=Math.max(lo,d.x0),x1=Math.min(hi,d.x1);if(x1<=x0)continue;if(x0>cursor+.015)result.push([cursor,x0]);cursor=Math.max(cursor,x1);}
   if(hi>cursor+.015)result.push([cursor,hi]);return result;
  };
  for(const [x0,x1] of split(aa,bb))add('sidewalk-west',x0,x1,westOuter,west,.09,.29,0xbcb9ad);
  for(const d of mouths){
   // A low apron joins the existing driveway end to the sidewalk, without
   // extending behind the building front or overlaying its parking surface.
   add('driveway-apron',d.x0,d.x1,d.back,westOuter,.075,.135,0x666863);parts.at(-1).site=d.id;
   const rise=.80;
   add('driveway-ramp',d.x0,d.x1,westOuter,westOuter+rise,.11,.22,0xbcb9ad);Object.assign(parts.at(-1),{lowAt:'rear',site:d.id});
   add('driveway-crossing',d.x0,d.x1,westOuter+rise,west-rise,.11,.22,0xbcb9ad);parts.at(-1).site=d.id;
   add('driveway-ramp',d.x0,d.x1,west-rise,west,.11,.22,0xbcb9ad);Object.assign(parts.at(-1),{lowAt:'front',site:d.id});
  }
  add('sidewalk-east',aa,bb,east,eastOuter,.09,.29,0xc0bdb1);
  for(const [x0,x1] of split(aa,bb))add('curb-west',x0,x1,west-.22,west,.115,.34,0xb6b3a8);
  add('curb-east',aa,bb,east,east+.22,.115,.34,0xb6b3a8);
  // Corner ramps replace the high slab at each end. Grade changes along X,
  // towards the side-road crossing. Low ends meet the road surface at .135.
  for(const [present,x0,x1,lowAt] of [[left,a,aa,'left'],[right,bb,b,'right']])if(present){
   for(const [z0,z1] of [[westOuter,west],[east,eastOuter]]){
    add('corner-ramp',x0,x1,z0,z1,.09,.29,0xbcb9ad);
    parts.at(-1).lowAt=lowAt;
   }
  }
  for(let xx=aa+3;xx<bb-.10;xx+=3){
   if(!mouths.some(d=>xx+.018>d.x0&&xx-.018<d.x1))add('paving-joint',xx-.018,xx+.018,Math.max(-19.55,west-3.45),west-.22,.29,.297,0x96968c);
   add('paving-joint',xx-.018,xx+.018,east+.22,Math.min(9.5,east+3.2),.29,.297,0x96968c);
  }
  const center=(west+east)/2;
  for(const off of [-.13,.13])add('center-yellow',a,b,center+off-.055,center+off+.055,.135,.148,0xd0b258);
  for(let xx=a+2;xx+3<b-2;xx+=9){
   for(const off of [-5.10,5.10])add('lane-dash',xx,xx+3,center+off-.065,center+off+.065,.135,.148,0xdad9cd);
  }
  for(const off of [-7.9,7.9])for(const [x0,x1] of (off<0?split(a,b):[[a,b]]))add('parking-edge',x0,x1,center+off-.05,center+off+.05,.135,.145,0xb9b8ab);
 }
 for(const j of JUNCTIONS){
  const [west,east]=curbAt(j.x);
  // Side-road approaches remain distinct; bounded to the sidewalk width.
  add('junction-approach',j.x-j.half,j.x+j.half,Math.max(-19.55,west-3.45),west,.075,.135,0x5a5b58);
  add('junction-approach',j.x-j.half,j.x+j.half,east,Math.min(9.5,east+3.20),.075,.135,0x5a5b58);
  // Marked crosswalks along both edges of the junction, as in the imagery.
  for(const side of [-1,1]){
   const x=j.x+side*(j.half-1.0);
   for(let zz=west+.35;zz+.48<east-.30;zz+=1.02)add('crosswalk',x-1.02,x+1.02,zz,zz+.48,.135,.151,0xe0ded2);
   const stop=j.x+side*(j.half+1.75),center=(west+east)/2;
   const [a,b]=side<0?[center+.28,east-.3]:[west+.3,center-.28];
   add('stop-line',stop-.19,stop+.19,a,b,.135,.15,0xdbd9cd);
  }
 }
 return parts;
}
export function drivewayClearanceZones(){
 const p=streetPlan();
 return DRIVEWAY_MOUTHS.map(d=>{const items=p.filter(q=>q.site===d.id);if(items.length!==4)throw Error('driveway missing '+d.id);return [d.id,'driveway',d.x0,Math.min(...items.map(q=>q.z0)),d.x1,Math.max(...items.map(q=>q.z1))];});
}
export function createBroadStreetSurface(){
 const group=new T.Group();group.name='Review35 modeled Broad Street surface';const byColor=new Map(),cube=new T.BoxGeometry(1,1,1),dummy=new T.Object3D();
 const plan=streetPlan();
 // Closed wedge, normalized height. Low end is exactly .135 after scaling.
 const ramp=new T.BufferGeometry();
 ramp.setAttribute('position',new T.Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5,-.5,1,-.5,.5,.225,-.5,.5,.225,.5,-.5,1,.5],3));
 ramp.setIndex([0,1,2,0,2,3,4,7,6,4,6,5,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0]);ramp.computeVertexNormals();
 for(const p of plan){const isDrive=p.kind==='driveway-ramp',isRamp=p.kind==='corner-ramp'||isDrive,key=p.color+':'+isRamp;if(!byColor.has(key))byColor.set(key,{color:p.color,geo:isRamp?ramp:cube,matrices:[]});dummy.position.set((p.x0+p.x1)/2,isRamp?p.base:(p.base+p.top)/2,(p.z0+p.z1)/2);dummy.rotation.y=isDrive?(p.lowAt==='rear'?Math.PI/2:-Math.PI/2):isRamp&&p.lowAt==='left'?Math.PI:0;dummy.scale.set(isDrive?p.z1-p.z0:p.x1-p.x0,p.top-p.base,isDrive?p.x1-p.x0:p.z1-p.z0);dummy.updateMatrix();byColor.get(key).matrices.push(dummy.matrix.clone());}
 for(const {color,geo,matrices} of byColor.values()){const m=new T.InstancedMesh(geo,new T.MeshStandardMaterial({color,roughness:.96}),matrices.length);matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.instanceMatrix.needsUpdate=true;group.add(m);}
 group.userData={pieceCount:plan.length,junctionCount:JUNCTIONS.length,rampCount:plan.filter(p=>p.kind==='corner-ramp').length,drivewayCount:plan.filter(p=>p.kind==='driveway-crossing').length,drivewayRampCount:plan.filter(p=>p.kind==='driveway-ramp').length,source:'bundled aerial tiles; undated; approximate'};
 return group;
}
