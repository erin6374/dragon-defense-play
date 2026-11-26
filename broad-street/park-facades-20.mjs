import {render2318ParkFrontage} from './park-2318-frontage.mjs';
import {render2316ParkFrontage} from './park-2316-frontage.mjs';
import {PARK_2328_32_FRONTAGES,render2328To2332Frontage} from './park-2328-32-frontages.mjs';
import {render2336And2338Frontage} from './park-2336-38-frontages.mjs';
import {PARK_2350_56_FRONTAGES,render2350To2356Frontage} from './park-2350-56-frontages.mjs';
import {PARK_2430_32_FRONTAGES,render2430And2432Frontage} from './park-2430-32-frontages.mjs';
import {PARK_2428,render2428Frontage} from './park-2428-frontage.mjs';

// Park Avenue contact/coverage refinement: 47 GIS-proportioned addresses adjoining the mapped
// block. These are *GIS-proportioned*, not individually photo-verified.
// A rowhouse address can occur in multiple footprint pieces; choose the main
// volume before drawing to avoid duplicate doors across rear additions.
export const PARK_REVIEW_ADDRESSES=Object.freeze([
  '2228 N PARK AVE','2230 N PARK AVE','2232 N PARK AVE','2234 N PARK AVE','2236 N PARK AVE',
  '2238 N PARK AVE','2240 N PARK AVE','2242 N PARK AVE','2244 N PARK AVE',
  '2246 N PARK AVE','2248 N PARK AVE','2250 N PARK AVE','2252 N PARK AVE',
  '2254 N PARK AVE','2256 N PARK AVE','2258 N PARK AVE','2260 N PARK AVE',
  '2262 N PARK AVE','2264 N PARK AVE','2306 N PARK AVE','2308 N PARK AVE',
  '2310 N PARK AVE','2312 N PARK AVE','2316 N PARK AVE','2318 N PARK AVE',
  '2322 N PARK AVE','2324 N PARK AVE','2326 N PARK AVE','2328 N PARK AVE',
  '2330 N PARK AVE','2332 N PARK AVE','2336 N PARK AVE','2338 N PARK AVE',
  '2342 N PARK AVE','2344 N PARK AVE','2346 N PARK AVE','2350 N PARK AVE',
  '2352 N PARK AVE','2354 N PARK AVE','2356 N PARK AVE','2358 N PARK AVE',
  '2422 N PARK AVE','2424 N PARK AVE','2426 N PARK AVE','2428 N PARK AVE',
  '2430 N PARK AVE','2432 N PARK AVE'
]);
const included=new Set(PARK_REVIEW_ADDRESSES);
export function parkFacadePlan(polys,height,address,assessedStories=null){
 if(!included.has(address)||!Number.isFinite(height)||height<4.5||!Array.isArray(polys))return null; // exclude detached low rear garages
 const points=polys.flatMap(p=>p?.[0]||[]);
 if(points.length<3)return null;
 const frontZ=Math.min(...points.map(p=>p[1]));
 const candidates=[];
 for(const poly of polys)for(const ring of poly)for(let j=1;j<ring.length;j++){
  const a=ring[j-1],b=ring[j],dx=b[0]-a[0],dz=b[1]-a[1],width=Math.hypot(dx,dz);
  if(width<2.0||Math.max(a[1],b[1])>frontZ+1.75||Math.abs(dx)<Math.abs(dz)*2)continue;
  candidates.push({left:Math.min(a[0],b[0]),right:Math.max(a[0],b[0]),z:(a[1]+b[1])/2,width});
 }
 // The Park Avenue face is often digitized as two collinear short edges.
 // Reconstruct one measured party-wall width from all vertices near the actual
 // street-facing edge; using only the longest segment made narrow rows too thin.
 const near=points.filter(p=>p[1]<=frontZ+2.35);
 const left=Math.min(...near.map(p=>p[0])),right=Math.max(...near.map(p=>p[0]));
 const combined={left,right,z:frontZ,width:right-left};
 const facade=combined.width>=2.2?combined:candidates.sort((a,b)=>b.width-a.width)[0];
 if(!facade)return null;
 const floors=Number.isInteger(assessedStories)&&assessedStories>=1&&assessedStories<=5?assessedStories:Math.max(1,Math.round(height/3.55));
 const upper=Math.max(0,floors-1),upperWindowCount=facade.width>6?3:2;
 return Object.freeze({address,facade,floors,upper,upperWindowCount,height,polys,origin:'municipal-footprint+assessment',
   openingConfidence:'schematic; location/count unverified by frontal photo'});
}
// Return the actual outward (minimum-z) footprint boundary at a given x.
// Use the center of the main wall, not the most projecting bay or global min Z.
export function parkWallZ(polys,x){
 const hits=[];
 for(const poly of polys)for(const ring of poly.slice(0,1))for(let j=1;j<ring.length;j++){
  const [a,z]=ring[j-1],[b,v]=ring[j];
  if(Math.abs(b-a)<1e-9)continue;
  const t=(x-a)/(b-a);
  if(t>=-1e-8&&t<=1+1e-8)hits.push(z+t*(v-z));
 }
 return hits.length?Math.min(...hits):null;
}
export function renderParkFrontage(plan,{box,mesh,T}){
 if(!plan)return false;
 if(plan.address===PARK_2428.address){
  render2428Frontage(plan,{T,box,mesh,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 if(Object.hasOwn(PARK_2430_32_FRONTAGES,plan.address)){
  render2430And2432Frontage(plan,{T,box,mesh,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 const newerBrick=PARK_2350_56_FRONTAGES[plan.address];
 if(newerBrick?.full){
  render2350To2356Frontage(plan,{T,box,mesh,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 if(plan.address==='2336 N PARK AVE'||plan.address==='2338 N PARK AVE'){
  render2336And2338Frontage(plan,{T,box,mesh,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 if(Object.hasOwn(PARK_2328_32_FRONTAGES,plan.address)){
  render2328To2332Frontage(plan,{T,box,mesh,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 if(plan.address==='2316 N PARK AVE'){
  render2316ParkFrontage(plan,{T,box,mesh,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 if(plan.address==='2318 N PARK AVE'){
  render2318ParkFrontage(plan,{box,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 const {left,right,width}=plan.facade,mid=(left+right)/2,h=plan.height;
 const brick=0xa68f7f,stone=0xc9bba5,glass=0x536870,frame=0x6b6661;
 const is2236=plan.address==='2236 N PARK AVE';
 const lightRender=0xdad7cc,greenDoor=0x42784c;
 // Every decoration is a solid layer whose rear extends INTO the wall or
 // preceding layer. A 0.045m interpenetration is intentional; zero-distance
 // contacts and exterior air gaps are not dependable for later boolean union.
 const overlap=.045;
 const contact=(x,w)=>{
  const samples=[x-w*.44,x-w*.22,x,x+w*.22,x+w*.44].map(v=>parkWallZ(plan.polys,v)).filter(Number.isFinite);
  if(samples.length!==5)return null;
  return {front:Math.min(...samples),back:Math.max(...samples)};
 };
 const slab=(x,y,w,hh,front,back,color)=>box(x,y,(front+back)/2,w,hh,back-front,color);
 // Short cornice pieces follow the real footprint, including its bay offsets.
 // Segment ends overlap each other without crossing the property boundary.
 const segments=Math.max(2,Math.ceil(width/1.0)),span=width*.94/segments;
 for(let i=0;i<segments;i++){
  const x=mid-width*.47+(i+.5)*span,w=span+.025,c=contact(x,w);
  if(c){
   slab(x,h-.21,w,.40,c.front-.20,c.back+overlap,is2236?lightRender:brick);
   if(is2236)slab(x,(h+.66)/2,w,h-.66,c.front-.04,c.back+overlap,lightRender);
  }
 }
 const pitch=h/plan.floors;
 function opening(x,y,w,hh,kind,{step=true,trim=stone,doorColor=0x384b51}={}){
  const c=contact(x,w+.24);if(!c)return;
  const z=c.front, trimFront=z-.17;
  // The backing (stone trim) bridges any locally stepped bay face. Subsequent
  // layers overlap it rather than being placed at detached absolute offsets.
  slab(x,y,w+.24,hh+.24,trimFront,c.back+overlap,trim);
  slab(x,y,w,hh,trimFront-.065,trimFront+overlap,kind==='door'?doorColor:glass);
  if(kind==='door'){
   slab(x+w*.30,y-.04,.06,.08,trimFront-.10,trimFront-.035,0xdcc88e);
   if(step){
    const stepW=Math.min(1.48,width*.31),stepContact=contact(x,stepW);
    if(stepContact)slab(x,.12,stepW,.24,z-.70,stepContact.back+overlap,stone);
   }
  }else{
   slab(x,y,.055,hh,trimFront-.095,trimFront-.025,frame);
   const sw=w+.32,sc=contact(x,sw);
   if(sc)slab(x,y-hh*.5-.08,sw,.16,z-.32,sc.back+overlap,stone);
  }
 }
 for(let floor=1;floor<plan.floors;floor++){
  const y=(floor+.46)*pitch;
  if(is2236&&floor===1&&mesh&&T){
   // The numbered listing shows a projecting bay; the facet sizes are estimated.
   const x=left+width*.54,outer=width*.33,inner=outer*.61;
   const wall=contact(x,outer*2),z=wall.front,back=wall.back-z+overlap;
   const skirt=-.17,face=-.64,halfH=1.17;
   for(const [base,height,lip,color] of [[y-halfH,2*halfH,0,lightRender],[y-halfH-.11,.15,.075,0xaaa291],[y+halfH-.075,.155,.09,0xe4e0d5]]){
    const section=new T.Shape();
    section.moveTo(-outer-lip,-back);section.lineTo(outer+lip,-back);
    section.lineTo(outer+lip,-skirt);section.lineTo(inner+lip,-face+lip);
    section.lineTo(-inner-lip,-face+lip);section.lineTo(-outer-lip,-skirt);section.closePath();
    const solid=new T.ExtrudeGeometry(section,{depth:height,bevelEnabled:false});solid.rotateX(-Math.PI/2);
    mesh(solid,color,x,base,z);
   }
   const hipW=outer-inner,hipD=skirt-face,angle=Math.atan2(hipD,hipW);
   const panes=[[0,face,inner*1.77,0],[-(outer+inner)/2,(skirt+face)/2,Math.hypot(hipW,hipD)*.76,angle],[(outer+inner)/2,(skirt+face)/2,Math.hypot(hipW,hipD)*.76,-angle]];
   for(const [dx,dz,w,yaw] of panes){
    const nx=-Math.sin(yaw),nz=-Math.cos(yaw);
    box(x+dx+nx*.018,y,z+dz+nz*.018,w+.10,1.76,.09,0xe7e7e2,yaw);
    box(x+dx+nx*.063,y,z+dz+nz*.063,w,1.63,.055,glass,yaw);
    box(x+dx+nx*.088,y-.12,z+dz+nz*.088,w,.047,.04,frame,yaw);
   }
   continue;
  }
  for(let k=0;k<plan.upperWindowCount;k++){
   const x=left+width*(k+1)/(plan.upperWindowCount+1);
   opening(x,y,Math.min(.98,width/(plan.upperWindowCount+1)*.59),Math.min(1.55,pitch*.56),'window',is2236?{trim:lightRender}:{});
  }
 }
 if(newerBrick){
  render2350To2356Frontage(plan,{T,box,mesh,wallAt:x=>parkWallZ(plan.polys,x)});
  return true;
 }
 if(is2236||plan.address==='2238 N PARK AVE'){
  // Photo-informed porch details share an approximate street alignment, while
  // each assembly remains owned by its individual GIS footprint.
  const deck=.72,wall=contact(mid,width*.92),front=plan.facade.z-1.25;
  const back=wall.back+overlap,porchW=width*.91,edgeLeft=mid-porchW/2,edgeRight=mid+porchW/2;
  const doorX=left+width*.22,stairW=1.12,entryLeft=doorX-stairW/2,entryRight=doorX+stairW/2;
  const white=0xe7e7e2,black=0x2e3336,gray=0x70777b,concrete=0xa4a5a1,roofY=3.37;
  slab(mid,.34,porchW,.68,front+.025,back,gray);
  slab(mid,.69,porchW,.12,front,back,concrete);
  for(let riser=1;riser<=4;riser++){
   const top=riser*deck/4;
   slab(doorX,top/2,stairW,top,front-(5-riser)*.22,front+.08,concrete);
  }
  // Both rail runs terminate at the stair opening, and overlap their posts.
  for(const [a,b] of [[edgeLeft+.08,entryLeft-.08],[entryRight+.08,edgeRight-.08]]){
   if(b-a<.13)continue;
   const z=front+.09,railWidth=b-a;
   for(const x of [a,b])slab(x,deck+.42,.09,.86,z-.045,z+.045,white);
   for(const y of [deck+.16,deck+.79])slab((a+b)/2,y,railWidth+.09,.07,z-.055,z+.055,white);
   const count=Math.ceil(railWidth/.155);
   for(let i=1;i<count;i++)slab(a+railWidth*i/count,deck+.47,.026,.68,z-.021,z+.021,black);
  }
  slab(mid,roofY,porchW+.10,.18,front-.09,back,white);
  slab(mid,roofY+.11,porchW+.12,.06,front-.105,back,gray);
  for(const x of [edgeLeft+.12,edgeRight-.12]){
   slab(x,(roofY+deck)/2,.135,roofY-deck+.11,front+.015,front+.15,white);
   if(is2236){
    slab(x,deck+.095,.23,.22,front-.015,front+.18,white);
    slab(x,roofY-.19,.21,.21,front-.012,front+.18,white);
   }
  }
  opening(doorX,deck+1.03,1.0,2.06,'door',is2236?{step:false,trim:lightRender,doorColor:greenDoor}:{step:false,trim:gray});
  opening(left+width*.72,deck+1.21,1.16,1.54,'window',{trim:white});
  if(is2236)return true;
  const lightX=entryRight+.16,lightWall=parkWallZ(plan.polys,lightX);
  slab(lightX,deck+1.83,.14,.23,lightWall-.13,lightWall+overlap,black);
  slab(lightX,deck+1.81,.098,.13,lightWall-.152,lightWall-.10,0xd8d2bb);
  // Glass block in the raised plinth. Relief pieces all embed in the backing.
  const blockX=left+width*.73;
  slab(blockX,.34,.88,.38,front-.055,front+.055,white);
  for(let row=0;row<2;row++)for(let col=0;col<5;col++){
   slab(blockX+(col-2)*.153,.265+row*.15,.141,.137,front-.067,front-.04,0x829494);
  }
  return true;
 }
 if(plan.address==='2250 N PARK AVE'||plan.address==='2252 N PARK AVE'){
  // The 2250 sale photo shows painted brick and a dark security entry.
  // The 2252 rental's example photo informs a provisional porch and gable.
  const white=plan.address==='2250 N PARK AVE',deck=.96,front=plan.facade.z-1.48;
  const doorX=left+width*(white?.22:.78),doorW=Math.min(1.02,width*.22),stepW=Math.min(width*.28,1.42);
  const back=contact(mid,width*.92).back+.05,foundation=white?0x555653:0x926452,concrete=0xa6a49e,rail=white?0x333635:0x62514a;
  const porchW=width*.92,x0=mid-porchW/2,x1=mid+porchW/2;
  slab(mid,(deck-.10)/2,porchW,deck-.10,front+.03,back,foundation);
  slab(mid,deck-.065,porchW,.15,front,back,concrete);
  for(let i=1;i<=6;i++){const top=i*deck/6;slab(doorX,top/2,stepW,top,front-(7-i)*.255,front+.08,concrete);}
  // Continuous landing with a clear stair opening; all posts overlap the deck.
  const railing=(a,b)=>{if(b-a<.14)return;const z=front+.09,w=b-a;
   for(const x of [a,b])slab(x,deck+.45,.075,.98,z-.05,z+.05,rail);
   for(const y of [deck+.14,deck+.89])slab((a+b)/2,y,w+.065,.065,z-.04,z+.04,rail);
   const n=Math.max(1,Math.floor(w/.19));for(let i=1;i<n;i++)slab(a+w*i/n,deck+.515,.032,.80,z-.024,z+.024,rail);
  };
  railing(x0+.06,doorX-stepW/2-.05);railing(doorX+stepW/2+.05,x1-.06);
  for(const side of [-1,1]){const x=doorX+side*(stepW/2-.055);for(let i=1;i<=6;i++){const z=front-(6.5-i)*.255,top=i*deck/6;slab(x,top+.39,.055,.84,z-.045,z+.045,rail);if(i<6)slab(x,top+.79,.055,.20,z-.06,z+.30,rail);}}
  // The existing footprint remains the house volume. The painted face is
  // restricted to the photographed ground floor, leaving unseen faces alone.
  if(white){
   for(let i=0;i<segments;i++){
    const x=mid-width*.47+(i+.5)*span,w=span+.025,c=contact(x,w);
    if(!c)continue;
    const wallFront=c.front-.095,wallBack=c.back+.045,paint=0xdedbd1;
    const height=3.62-deck,y=(deck+3.62)/2;
    if(!mesh||!T){slab(x,y,w,height,wallFront,wallBack,paint);continue;}
    const panel=new T.BoxGeometry(w,height,wallBack-wallFront);
    const uv=panel.getAttribute('uv');
    const positions=panel.getAttribute('position');
    const frontFace=panel.groups[5];
    for(const vertex of new Set(panel.index.array.slice(frontFace.start,frontFace.start+frontFace.count))){
     uv.setXY(vertex,x-mid+positions.getX(vertex),y+positions.getY(vertex));
    }
    mesh(panel,paint,x,y,(wallFront+wallBack)/2,{brickFace:frontFace.materialIndex});
   }
  }
  const entryTrim=white?0x292c2c:0xc6c0b2,windowTrim=white?0xe0ddd3:0xc9bba5;
  const faceOpening=(x,y,w,hh,door=false)=>{
   const c=contact(x,w+.18);if(!c)return;const z=c.front-.20;
   slab(x,y,w+.16,hh+.15,z,c.back+.045,door?entryTrim:windowTrim);
   slab(x,y,w,hh,z-.055,z+.035,door?0x384b51:glass);
   const bar=white?0x333635:0x494541;
   if(door){for(const k of [-.32,0,.32])slab(x+w*k,y,.038,hh,z-.094,z-.03,bar);slab(x,y-.1,w,.05,z-.094,z-.03,bar);slab(x+w*.32,y-.08,.05,.13,z-.13,z-.06,0xbdbeb7);}
   else{slab(x,y,.045,hh,z-.09,z-.03,frame);slab(x,y+.02,w,.055,z-.09,z-.03,windowTrim);
    for(const yy of [y-hh/2-.09,y+hh/2+.09])slab(x,yy,w+.21,.13,z-.14,z+.055,white?0x303332:stone);
    if(!white)for(const k of [-.36,-.12,.12,.36])slab(x+w*k,y,.025,hh,z-.12,z-.05,bar);
   }
  };
  faceOpening(doorX,deck+1.06,doorW,2.12,true);
  const windowFracs=white?[.51,.78]:[.22,.49];
  for(const f of windowFracs)faceOpening(left+width*f,deck+1.33,Math.min(.81,width*.174),1.67);
  // Projecting canopy beams and columns, with gable over 2252's entry.
  const roofY=3.63,roofFront=front-.09,roofBack=back+.04,wood=white?0xdedbd1:0x69534a;
  slab(mid,roofY,porchW+.035,.18,roofFront,roofBack,wood);
  slab(mid,roofY+.095,porchW+.035,.055,roofFront-.015,roofBack,0x55585a);
  for(const x of [x0+.10,x1-.10,doorX+(white?1:-1)*(stepW/2+.11)])slab(x,(deck+roofY)/2,.14,roofY-deck+.10,front+.015,front+.16,wood);
  if(!white&&mesh&&T){const half=stepW*.72,shape=new T.Shape();shape.moveTo(-half,-.055);shape.lineTo(half,-.055);shape.lineTo(0,.57);shape.closePath();
   mesh(new T.ExtrudeGeometry(shape,{depth:roofBack-roofFront,bevelEnabled:false}),0x69534a,doorX,roofY+.09,roofFront);}
  return true;
 }
 opening(left+width*.22,1.23,Math.min(1.06,width*.22),2.22,'door');
 opening(left+width*.72,1.78,Math.min(1.22,width*.24),1.55,'window');
 return true;
}
