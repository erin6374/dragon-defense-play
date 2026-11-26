/** Pass 12: 2243 N Broad, December 2022 as-built photos + published proposed elevations.
 * Geometry dimensions are evidence-informed, not a field survey. The front GIS
 * projection is interpreted as balcony/canopy extent; original source untouched.
 */
export const MODERN_2243_GIS_ID='3000277';
export const MODERN_2243_CANDIDATE='2243-20261124-ASBUILT-PASS12';
export const DIM2243=Object.freeze({left:-315.96,right:-311.48,face:-23.18,roof:45.5*.3048,parapet:49*.3048,floors:[14,24.5,35].map(f=>f*.3048),maxProjection:.91});
const is2243=r=>String(r?.id)===MODERN_2243_GIS_ID;
const {left,right,face,roof,parapet,floors,maxProjection}=DIM2243;
const w=right-left, x=f=>left+w*f;
const brick=0xe5e1d9, panel=0xb8bbbc, black=0x303338, frame=0x353b3e, glass=0x46606a;
export function layout2243(row,profile){
 const edges=[{x:x(.5),z:face,width:w,length:w,left,right}];
 const openings=floors.flatMap((y,i)=>[{kind:'balcony-door',floor:i+1,edge:0,x:x(.46),y:y+1.12,z:face,w:w*.43,h:2.24,bay:1},{kind:'horizontal-window',floor:i+1,edge:0,x:x(.825),y:y+1.72,z:face,w:w*.18,h:.60,bay:2}]);
 const groundOpenings=[{kind:'retail-bank',floor:0,edge:0,x:x(.5),y:1.55,z:face,w:w*.39,h:2.5}];
 const doors=[.15,.85].map(f=>({kind:'door',x:x(f),y:1.28,z:face,w:w*.17,h:2.44}));
 return {profile,edges,openings,groundOpenings,doors};
}
// Clip ONLY the street projection in the rendered structural body. GIS polygons
// are never edited; balconies and canopy replace the former solid projection.
function clipFront(ring){const input=ring.slice(0,-1),out=[];for(let i=0;i<input.length;i++){const a=input[i],b=input[(i+1)%input.length],ai=a[1]<=face,bi=b[1]<=face;if(ai)out.push(a);if(ai!==bi)out.push([a[0]+(b[0]-a[0])*(face-a[1])/(b[1]-a[1]),face]);}return out.length>2?[...out,out[0]]:[];}
export function mass2243(row,{block,box}){
 if(!is2243(row))return false;
 for(const poly of row.polys){const shell=clipFront(poly[0]);if(shell.length<4)continue;const p=[shell,...poly.slice(1).map(clipFront).filter(r=>r.length>=4)];block(p,parapet,brick);block(p,.12,0x656669,parapet-.12);}
 // Single documented rear roof access bulkhead; position schematic, contained
 // within source footprint and below source GIS maximum height.
 box(-313.15,(parapet+row.h)/2,-55.8,2.7,row.h-parapet+.10,2.8,0xb3ada3);
 return true;
}
export function detail2243(row,layout,{box}){
 if(!is2243(row))return {applied:false};
 const {openings,doors,groundOpenings}=layout;
 if(openings.length!==6||doors.length!==2||groundOpenings.length!==1)throw Error('2243 as-built opening inventory mismatch');
 // Continuous backing overlaps clipped mass by 0.18m, spans small GIS seam.
 box(x(.5),parapet/2,face-.07,w,parapet,.25,brick);
 // Dark center wall panels around the full-height doors, left textured brick.
 box(x(.46),(floors[0]+roof)/2,face+.085,w*.49,roof-floors[0],.12,panel);
 // Each protruding brick is real relief, not a texture or detached plane.
 for(let j=0;j<66;j++)for(let k=0;k<2;k++)box(x(.065+k*.073+(j%2)*.023),.22+j*.214,face+.081,w*.059,.087,.125,0xd9d7cf);
 const deckL=x(.21),deckR=x(.79),deckW=deckR-deckL,cx=(deckL+deckR)/2;
 const frontZ=face+maxProjection, railZ=frontZ-.045, rearZ=face+.10;
 for(const [i,y] of floors.entries()){
  // A full-depth slab embeds into the structural backing (not an unsupported lip).
  box(cx,y-.10,(face-.13+frontZ)/2,deckW,.29,frontZ-(face-.13),black);
  box(cx,y+.055,(face-.12+frontZ)/2,deckW,.065,frontZ-(face-.12),0x929597);
  const railBase=y+.055,railTop=railBase+1.03;
  // Open black steel vertical pickets, cap rail, and two return rails.
  box(cx,railTop,railZ,deckW,.065,.07,black);
  for(let j=0;j<=14;j++)box(deckL+.035+(deckW-.07)*j/14,(railBase+railTop)/2,railZ,.034,1.07,.04,black);
  for(const px of [deckL+.035,deckR-.035]){
   box(px,railTop,(rearZ+railZ)/2,.065,.065,railZ-rearZ+.04,black);
   for(let j=0;j<5;j++)box(px,(railBase+railTop)/2,rearZ+(railZ-rearZ)*j/4,.04,1.07,.04,black);
  }
  // Façade slab front-panel seams and underside lighting as attached relief.
  for(let j=1;j<5;j++)box(deckL+deckW*j/5,y-.10,frontZ+.002,.013,.25,.018,0x202327);
  box(cx,y-.246,face+.53,.14,.025,.14,0xe1dbba);
  for(const o of openings.filter(o=>o.floor===i+1)){
   box(o.x,o.y,face+.13,o.w+.08,o.h+.08,.19,frame);
   box(o.x,o.y,face+.214,o.w-.045,o.h-.06,.045,glass);
   if(o.kind==='balcony-door')box(o.x,o.y,face+.244,.045,o.h-.06,.045,frame);
  }
 }
 // Deep charcoal standing-seam canopy, distinct from roof parapet.
 const canopyL=x(.20),canopyR=x(.83),canopyW=canopyR-canopyL,canopyX=(canopyL+canopyR)/2;
 box(canopyX,parapet-.90,(face-.12+frontZ)/2,canopyW,1.80,frontZ-face+.12,black);
 for(let j=1;j<8;j++)box(canopyL+canopyW*j/8,parapet-.90,frontZ+.002,.015,1.76,.018,0x202327);
 // Ground-level central display window between two glazed pedestrian doors.
 for(const o of [...groundOpenings,...doors]){
  box(o.x,o.y,face+.105,o.w+.085,o.h+.085,.14,frame);
  box(o.x,o.y,face+.183,o.w-.06,o.h-.07,.055,glass);
  if(o.kind==='door'){
   box(o.x,o.y+o.h*.39,face+.216,o.w-.04,.05,.045,0xc0beb4);
   box(o.x+o.w*.34,1.05,face+.216,.045,.15,.045,0xb9bcb9);
  }
 }
 box(x(.5),3.02,face+.12,w*.40,.18,.20,0xc1b5a1);
 return {applied:true,candidate:MODERN_2243_CANDIDATE,buildingId:MODERN_2243_GIS_ID,levels:3,openings:6,doorEvidence:'photo-visible',sourceDate:'2022-12',note:'As-built front; published floor heights, inferred GIS-aligned wall and balcony projection; rear unresolved'};
}
