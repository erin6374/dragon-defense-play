/** 2255 N Broad: narrow modern infill; April 2025 partial street view.
 * Provisional geometry: three single wide upper windows; ground not certified. */
export const FACADE_2255_ID='3000691';
export const FACADE_2255_CANDIDATE='2255-20261123-INFILL-PASS-01';
export function detail2255(row,layout,{box}){
 if(String(row?.id)!==FACADE_2255_ID)return {applied:false};
 const {profile:p,openings,groundOpenings,doors,edges}=layout;
 if(p.bays!==1||p.upperLevels!==3||openings.length!==3||groundOpenings.length!==1||doors.length!==1)throw Error('2255 surveyed inventory changed');
 const main=edges.reduce((a,b)=>a.width>=b.width?a:b);
 const front=openings.filter(o=>o.edge===edges.indexOf(main));
 if(front.length!==3||new Set(front.map(o=>o.floor)).size!==3)throw Error('2255 three distinct upper floors required');
 for(const o of front){
  // Deep dark window recess and thin white metal perimeter on each floor.
  box(o.x,o.y,o.z+.26,o.w*1.19,o.h*1.13,.22,0xe4e4df);
  box(o.x,o.y,o.z+.40,o.w*1.05,o.h*1.01,.085,0x263a43);
  box(o.x,o.y-o.h*.54,o.z+.46,o.w*1.20,.10,.25,0xd1d1cc);
  box(o.x,o.y,o.z+.49,.04,o.h*.98,.04,0x79888a);
 }
 // Avoid claiming exact ground glazing/entrance positions: the source is obscured.
 const z=main.z+.32;
 box(main.x,3.28,z,main.width*.92,.17,.29,0xe1e1db);
 box(main.x,row.h-.26,z,main.width*.96,.19,.28,0xe4e4df);
 return {applied:true,buildingId:FACADE_2255_ID,candidate:FACADE_2255_CANDIDATE,upperOpeningCount:3,groundStatus:'estimated/partly obscured',sourceDate:'2025-04',confidence:'partial-reference schematic'};
}
