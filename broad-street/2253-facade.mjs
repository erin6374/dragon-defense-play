import {paintDatedSign} from './dated-sign-art-11.mjs';
import {addHistoricCornice,addWhiteSash} from './historic-window-cornice-11.mjs';
/** 2253 N Broad Philadelphia Doll Museum. April 2025 indexed street reference.
 * Photo-constrained opening inventory; surface details are provisional. */
export const FACADE_2253_ID='1542243';
export const FACADE_2253_CANDIDATE='2253-20261123-DOLL-MUSEUM-PASS-01';
export function detail2253(row,layout,{box,mesh,T}={}){
 if(String(row?.id)!==FACADE_2253_ID)return {applied:false};
 const {profile:p,openings,groundOpenings,doors,edges}=layout;
 if(p.ground!=='shutter-door-left'||openings.length!==4||groundOpenings.length!==0||doors.length!==1)throw Error('2253 surveyed opening inventory changed');
 const main=edges.reduce((a,b)=>a.width>=b.width?a:b);
 const edge=edges.indexOf(main),front=openings.filter(o=>o.edge===edge);
 if(front.length!==4)throw Error('2253 principal street frontage changed');
 const door=doors[0];
 if(door.x>=main.x)throw Error('2253 left-side door moved');
 const z=main.z+.40;
 for(const floor of [1,2]){
  const arr=front.filter(o=>o.floor===floor);
  if(arr.length!==2)throw Error('2253 two sash windows per upper level required');
  for(const o of arr){
   box(o.x,o.y+o.h*.56,o.z+.32,o.w*1.24,.14,.25,0xb8a99b);
   box(o.x,o.y-o.h*.55,o.z+.36,o.w*1.30,.13,.30,0x9c9082);
   box(o.x,o.y,o.z+.37,o.w*.94,.045,.065,0x4b5052);
   for(const side of [-1,1])box(o.x+side*o.w*.46,o.y,o.z+.36,.05,o.h*.96,.065,0x41484b);
  }
 }
 // The April 2025 photograph documents a full teal green Philadelphia Doll
 // Museum sign, physically mounted to the red-brick mass above the shutter.
 // This solid backing is print-relevant; the canvas lettering is for WebGL.
 const signY=3.80,signH=.78,signW=main.width-.02,signZ=main.z+.56;
 const lowestUpper=Math.min(...front.map(o=>o.y-o.h/2));
 if(signY+signH/2>=lowestUpper)throw Error('2253 museum sign overlaps upper sash openings');
 box(main.x,signY,main.z+.29,signW,signH,.48,0x086c5c);
 box(main.x,signY-signH/2-.03,main.z+.40,signW,.07,.33,0x17493d);
 paintDatedSign({T,mesh,id:FACADE_2253_ID,x:main.x,y:signY,z:signZ,width:signW-.02,height:signH-.05,fill:'#086a5b',
   lines:['PHILADELPHIA','DOLL MUSEUM','2253 NORTH BROAD STREET'],emblem:'woven-mark'});
 addHistoricCornice(box,{edge:main,roofHeight:row.h,color:0xa9afa4,shadow:0x52605b,frieze:0x89958a,dentils:24});
 for(const o of front)addWhiteSash(box,o,{color:0xe3e7df});
 // Retain the shared renderer's shutter; only add guide channels and headbox.
 // Reserve the surveyed left-side pedestrian entrance instead of spanning it.
 const start=Math.max(main.left+.20,door.x+door.w*.5+.18);
 const end=main.right-.20,w=end-start;
 if(w<.65)throw Error('2253 insufficient shutter width beside pedestrian entry');
 box((start+end)/2,3.22,z+.08,w+.12,.26,.28,0x555b5d);
 for(const x of [start,end])box(x,1.47,z+.12,.10,2.88,.15,0x555b5d);
 box((start+end)/2,.17,z+.12,w,.12,.17,0x777775);
 // Door head and dark recessed glazed pedestrian door remain separate.
 box(door.x,door.y+door.h*.54,door.z+.28,door.w+.19,.16,.26,0xaaa092);
 box(door.x,door.y,door.z+.28,door.w*.83,door.h*.87,.035,0x2d5361);
 return {applied:true,sign:'Philadelphia Doll Museum',buildingId:FACADE_2253_ID,candidate:FACADE_2253_CANDIDATE,upperOpeningCount:4,entranceCount:1,doorSide:'left',sourceDate:'2025-04',confidence:'photo-constrained schematic'};
}
