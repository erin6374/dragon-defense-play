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
export function renderParkFrontage(plan,{box}){
 if(!plan)return false;
 const {left,right,width}=plan.facade,mid=(left+right)/2,h=plan.height;
 const brick=0xa68f7f,stone=0xc9bba5,glass=0x536870,frame=0x6b6661;
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
  if(c)slab(x,h-.21,w,.40,c.front-.20,c.back+overlap,brick);
 }
 const pitch=h/plan.floors;
 function opening(x,y,w,hh,kind){
  const c=contact(x,w+.24);if(!c)return;
  const z=c.front, trimFront=z-.17;
  // The backing (stone trim) bridges any locally stepped bay face. Subsequent
  // layers overlap it rather than being placed at detached absolute offsets.
  slab(x,y,w+.24,hh+.24,trimFront,c.back+overlap,stone);
  slab(x,y,w,hh,trimFront-.065,trimFront+overlap,kind==='door'?0x384b51:glass);
  if(kind==='door'){
   slab(x+w*.30,y-.04,.06,.08,trimFront-.10,trimFront-.035,0xdcc88e);
   const stepW=Math.min(1.48,width*.31),stepContact=contact(x,stepW);
   if(stepContact)slab(x,.12,stepW,.24,z-.70,stepContact.back+overlap,stone);
  }else{
   slab(x,y,.055,hh,trimFront-.095,trimFront-.025,frame);
   const sw=w+.32,sc=contact(x,sw);
   if(sc)slab(x,y-hh*.5-.08,sw,.16,z-.32,sc.back+overlap,stone);
  }
 }
 for(let floor=1;floor<plan.floors;floor++){
  const y=(floor+.46)*pitch;
  for(let k=0;k<plan.upperWindowCount;k++){
   const x=left+width*(k+1)/(plan.upperWindowCount+1);
   opening(x,y,Math.min(.98,width/(plan.upperWindowCount+1)*.59),Math.min(1.55,pitch*.56),'window');
  }
 }
 opening(left+width*.22,1.23,Math.min(1.06,width*.22),2.22,'door');
 opening(left+width*.72,1.78,Math.min(1.22,width*.24),1.55,'window');
 return true;
}
