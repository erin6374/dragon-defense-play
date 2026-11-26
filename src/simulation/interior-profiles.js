// Interior archetypes are gameplay approximations, not surveyed plans.
// Landmark overrides are drawn from the Viewer source renderers and names.
const CHURCH_IDS=new Set(['1005656','1000951']);
const RETAIL_IDS=new Set(['1003022','1073318']);
export function interiorProfile(b){
 const id=String(b.id??''),name=String(b.name??'').toLowerCase();
 const stories=Math.max(1,b.stories||Math.round(b.h/3)||1);
 if(b.school||id==='1003073')return {kind:'school-source',stories,approximate:false};
 if(CHURCH_IDS.has(id)||/church|chapel|cathedral|sanctuary/.test(name))return {kind:'worship',stories:1,approximate:true};
 if(/mitten hall|auditorium|theat(er|re)|performance hall|concert hall/.test(name))return {kind:'assembly',stories:1,approximate:true};
 if(id==='1005655'||/mcdonald|restaurant|cafe/.test(name))return {kind:'restaurant',stories:1,approximate:true};
 if(RETAIL_IDS.has(id)||/shops|pharmacy|retail|autozone/.test(name))return {kind:'retail',stories,approximate:true};
 if(/residence hall|dormitory/.test(name))return {kind:'residence-hall',stories,approximate:true};
 if(b.w<=10&&b.h>=6&&b.d>=7)return {kind:'residential',stories,approximate:true};
 if(b.h<=6&&b.w>=10)return {kind:'commercial-open',stories:1,approximate:true};
 return {kind:'generic',stories,approximate:true};
}
// Low-poly furnishings are created only for compatible footprint locations.
// Return descriptors in world coordinates for existing instanced batches.
export function interiorFurnishings(b,profile){
 if(profile.kind==='school-source'||b.w<2.6||b.d<3)return [];
 const pieces=[],w=b.w,d=b.d,stories=profile.stories,sh=b.h/stories;
 const add=(floor,type,mat,x,z,sx,sy,sz,base=0)=>{
  if(sx<.12||sy<.1||sz<.12)return;
  pieces.push({floor,type,mat,x:b.x+x,y:floor*sh+.24+base+sy/2,z:b.z+z,w:sx,h:sy,d:sz});
 };
 if(profile.kind==='worship'||profile.kind==='assembly'){
  const church=profile.kind==='worship',seatW=Math.min(4.8,w*.31),rows=Math.max(2,Math.min(7,Math.floor(d/2.2)));
  // Long nave with two banks of seating separated by a central aisle.
  for(let i=0;i<rows;i++){
   const z=d*(.24-.62*i/Math.max(1,rows-1));
   for(const side of [-1,1])add(0,'furniture','wood',side*w*.24,z,seatW,church?.85:.65,.44);
  }
  add(0,'furniture',church?'wood':'concrete',0,-d*.34,Math.min(w*.57,9),church?.65:.7,Math.min(3.2,d*.13));
  if(church)add(0,'furniture','wood',0,-d*.33,Math.min(1.65,w*.26),.85,.6,.65);
  return pieces;
 }
 for(let f=0;f<stories;f++){
  if(profile.kind==='retail'){
   for(const side of [-1,1])for(const z of [-.25,.08,.30])add(f,'furniture','furniture',side*w*.22,d*z,Math.min(1.1,w*.13),Math.min(1.65,sh*.5),Math.min(3.8,d*.21));
   add(f,'furniture','wood',0,d*.36,Math.min(3,w*.45),.9,.65);
  }else if(profile.kind==='restaurant'){
   for(const side of [-1,1])for(const z of [-.12,.12,.30])add(f,'furniture','wood',side*w*.23,d*z,Math.min(1.2,w*.2),.76,.8);
   add(f,'furniture','furniture',0,-d*.32,Math.min(w*.58,6),1.0,.8);
  }else if(profile.kind==='residential'||profile.kind==='residence-hall'){
   add(f,'partition','plaster',0,-d*.12,Math.min(w*.72,5),Math.max(.9,sh-.5),.12);
   add(f,'furniture','wood',w*.17,d*.24,Math.min(1.6,w*.34),.72,.8);
   add(f,'furniture','furniture',-w*.18,-d*.26,Math.min(1.4,w*.32),.45,Math.min(1.95,d*.2));
   add(f,'furniture','wood',w*.23,-d*.30,.55,Math.min(1.35,sh*.45),.45);
  }else{
   add(f,'furniture','wood',w*.2,d*.17,Math.min(1.8,w*.32),.8,.8);
   add(f,'furniture','furniture',-w*.2,-d*.21,Math.min(1.1,w*.23),Math.min(1.5,sh*.48),.6);
  }
 }
 return pieces;
}
