/** South Broad roofs: measured in saved city-aerial-1.jpg (5 px/m).
 * City imagery attribution retained; exact acquisition date not independently verified.
 * Equipment silhouettes and plan dimensions approximate; equipment type and height inferred.
 * The GIS footprint, courtyard and roof slab height are immutable.
 */
export const SOUTH_ROOF_PLANS={
 '1000951':{address:'2125–29 N Broad',origin:[1170,351],color:0x65625a,features:[
  [57,120,10,8,.50],[77,120,9,8,.50],[28,154,8,9,.55],[100,156,7,7,.40],[30,88,5,5,.28]
 ]},
 '1003022':{address:'2131 N Broad',origin:[991,169],color:0xb5b5a8,features:[
  [80,93,17,13,.42],[83,120,10,12,.56],[88,208,12,13,.55],[130,132,8,9,.45],[112,64,7,7,.42]
 ]}
};
function insideRing(x,z,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
 const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;
}return yes;}
export function planSouthRoof(row){
 const plan=SOUTH_ROOF_PLANS[String(row.id)];if(!plan)return null;
 const deck=row.h+.07;
 const units=plan.features.map(([px,pz,pw,pd,h])=>{
  const x=(plan.origin[0]+px)/5-350,z=(plan.origin[1]+pz)/5-130,w=pw/5,d=pd/5;
  const supports=row.polys.some(poly=>[-1,0,1].every(u=>[-1,0,1].every(v=>{
   const a=x+u*w/2,b=z+v*d/2;return insideRing(a,b,poly[0])&&!poly.slice(1).some(r=>insideRing(a,b,r));
  })));
  if(!supports)throw Error(`Roof equipment outside supported roof ${row.id}: ${x}, ${z}`);
  return {x,z,w,d,h,base:deck-.05};
 });
 return {deck,color:plan.color,units};
}
export function renderSouthRoof(row,{block,box},wallColor){
 const plan=planSouthRoof(row);if(!plan)return false;
 for(const p of row.polys){block(p,row.h,wallColor);block(p,.14,plan.color,row.h-.07,{aerialRoof:false});}
 // Each inferred equipment envelope has a supporting base intersecting the deck;
 // no photogrammetric texture or unsupported decorative plane on these roofs.
 for(const u of plan.units){
  const baseH=.14,bodyH=u.h-baseH+.04;
  box(u.x,u.base+baseH/2,u.z,u.w,baseH,u.d,0x898c84);
  box(u.x,u.base+baseH-.04+bodyH/2,u.z,u.w*.79,bodyH,u.d*.78,0xa5a9a0);
 }
 return true;
}
