import {paintDatedSign} from './dated-sign-art-11.mjs';
import {addHistoricCornice,addWhiteSash} from './historic-window-cornice-11.mjs';
/** 2231 N Broad / Black United Fund. Photo-indexed April 2025 street facade.
 * Measured dimensions and colors are provisional; no GIS geometry edits. */
export const FACADE_2231_ID='1003388';
export const FACADE_2231_CANDIDATE='2231-20261123-TWO-ENTRY-SASH-PASS-01';
export function detail2231(row,layout,{box,mesh,T}={}){
 if(String(row?.id)!==FACADE_2231_ID)return {applied:false};
 const {profile:p,openings,groundOpenings,doors,edges}=layout;
 if(p.ground!=='shop'||openings.length!==4||groundOpenings.length!==1||doors.length!==2||edges.length!==1)throw Error('2231 photo-constrained opening inventory drift');
 const e=edges[0], z=e.z+.43;
 if(e.width<4||e.width>6)throw Error('2231 unexpected street frontage');
 // Two photographed upper sash apertures per floor. Trim overlays do not
 // constitute extra apertures; keep shared renderer's glazing in place.
 for(const floor of [1,2]){
  const arr=openings.filter(o=>o.floor===floor);
  if(arr.length!==2)throw Error('2231 sash count per floor changed');
  for(const o of arr){
   box(o.x,o.y+o.h*.56,o.z+.36,o.w*1.18,.14,.24,0xd2cab8);
   box(o.x,o.y-o.h*.56,o.z+.38,o.w*1.24,.13,.30,0xbab2a0);
   box(o.x,o.y,o.z+.39,.055,o.h*.98,.065,0x3d464a);
   box(o.x,o.y-.04,o.z+.40,o.w*.98,.055,.065,0x3d464a);
  }
 }
 // Pale storefront tile with recessed glazing. This grounded panel actually
 // penetrates the original mass; it is not a hovering facade sprite.
 box(e.x,1.48,e.z+.075,e.width-.045,2.96,.30,0xdadbd1);
 for(let j=1;j<4;j++)box(e.x,j*.69,e.z+.242,e.width-.10,.019,.035,0xb9bcb4);
 for(let j=1;j<9;j++)box(e.left+(j+.5)*(e.width-.16)/10,1.47,e.z+.24,.023,2.85,.027,0xc2c5bf);
 // The April 2025 photograph shows the distinct green Black United Fund
 // Conference Center fascia; it belongs below the first-story sash windows.
 const signY=3.54,signH=.91,signW=e.width-.035,signZ=e.z+.59;
 if(signY+signH/2>=Math.min(...openings.map(o=>o.y-o.h/2)))throw Error('2231 sign would cover the photographed upper windows');
 box(e.x,signY,e.z+.31,signW,signH,.46,0x0d6b57);
 box(e.x,signY+signH/2+.032,e.z+.39,signW,.075,.36,0x1b5146);
 paintDatedSign({T,mesh,id:FACADE_2231_ID,x:e.x,y:signY,z:signZ,width:signW-.02,height:signH-.035,fill:'#0a6b59',
   lines:['Black United Fund','Conference Center','2231 NORTH BROAD STREET'],emblem:'geometric-mark'});
 addHistoricCornice(box,{edge:e,roofHeight:row.h,color:0xc8bfab,shadow:0x736c61,frieze:0xb4afa0,dentils:24});
 for(const o of openings)addWhiteSash(box,o,{color:0xe2e5df});
 // Ground: the photo survey distinguishes a central glazed entry and a
 // separate right-side door. Avoid invented business signage or a third door.
 const [leftDoor,rightDoor]=[...doors].sort((a,b)=>a.x-b.x);
 if(!(leftDoor.x<rightDoor.x&&groundOpenings[0].x>leftDoor.x&&groundOpenings[0].x<rightDoor.x))throw Error('2231 door/glazing order changed');
 box(e.x,3.19,z+.08,e.width*.95,.26,.24,0x665e59);
 for(const d of doors){
  box(d.x,d.y,d.z+.36,d.w*.91,d.h*.94,.045,d===rightDoor?0x243640:0x718786);
  box(d.x,d.y+.18,d.z+.405,.052,d.h*.75,.055,0x30383c);
  box(d.x,d.y+d.h*.51,d.z+.38,d.w*1.14,.13,.21,0xaaa199);
 }
 const g=groundOpenings[0];
 box(g.x,g.y,g.z+.37,g.w*.98,g.h*.97,.055,0x486773);
 box(g.x,g.y,g.z+.42,.052,g.h*.95,.065,0x30383c);
 // Narrow masonry piers remain within the documented frontage.
 for(const x of [e.left+.14,e.right-.14])box(x,1.50,z,.20,3.0,.26,0x9d8d80);
 return {applied:true,sign:'Black United Fund Conference Center',sourceDate:'2025-04',candidate:FACADE_2231_CANDIDATE,buildingId:FACADE_2231_ID,upperWindows:4,groundWindows:1,entrances:2,reference:'Screenshot 2026-11-21 030932.png; April 2025 Street View',confidence:'photo-counts-confirmed; finish-and-proportions-estimated'};
}
