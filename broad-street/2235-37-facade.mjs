/** 2235–37 N Broad: restrained contemporary retail/apartment facade.
 * 2026-11-22 listing documents mixed retail/apartment use; opening count remains
 * an estimate. This layer only adds facade detail, not certified openings. */
export const MODERN_2235_GIS_ID='1547386';
export const MODERN_2235_CANDIDATE='2235-37-20261123-MIXEDUSE-PASS-01';
export function detail2235(row,layout,{box}){
 if(String(row?.id)!==MODERN_2235_GIS_ID)return {applied:false};
 const {profile:p,openings,groundOpenings,doors,edges}=layout;
 if(p?.ground!=='shop'||openings.length!==12||groundOpenings.length!==2||doors.length!==1)throw Error('2235-37 estimated facade inventory changed');
 const main=edges.reduce((a,b)=>a.width>=b.width?a:b);
 const frontage=main.width,z=main.z+.39;
 if(frontage<7)throw Error('2235-37 main frontage unexpectedly narrow');
 // Distinct horizontal floor spandrels and edge piers. These are surface
 // articulation, not additions to the GIS mass or new apartment openings.
 const floors=[...new Set(openings.map(o=>o.floor))].sort((a,b)=>a-b);
 for(const floor of floors){
  const arr=openings.filter(o=>o.floor===floor&&o.edge===edges.indexOf(main));
  if(!arr.length)continue;
  const sill=Math.min(...arr.map(o=>o.y-o.h/2));
  box(main.x,sill-.31,z,frontage*.97,.23,.19,0x575a59);
  box(main.x,sill+arr[0].h+.23,z,frontage*.97,.16,.17,0x79716b);
  for(const o of arr){
   box(o.x,o.y,o.z+.34,o.w*1.12,o.h*1.12,.10,0x383e41);
   box(o.x,o.y,o.z+.405,o.w*.99,o.h*.99,.045,0x587783);
   box(o.x,o.y,o.z+.45,.05,o.h*.98,.05,0x252d32);
   box(o.x,o.y-o.h*.51,o.z+.47,o.w*1.10,.065,.10,0x3b4345);
  }
 }
 // Retail ground level: broad lintel, sign band and distinct masonry piers;
 // no additional entrances or unverified shop names/signage.
 box(main.x,3.18,z+.07,frontage*.97,.43,.23,0x555453);
 for(const x of [main.left+.22,main.right-.22])box(x,1.54,z,.30,3.08,.31,0x77716c);
 for(const o of groundOpenings){
  box(o.x,o.y,o.z+.36,o.w*1.06,o.h*1.04,.09,0x313a3d);
  box(o.x,o.y,o.z+.43,o.w*.94,o.h*.94,.035,0x597984);
  box(o.x,o.y,o.z+.46,.055,o.h*.94,.04,0x303638);
 }
 const door=doors[0];box(door.x,door.y+door.h*.58,door.z+.36,door.w+.38,.17,.63,0x44484a);
 return {applied:true,buildingId:MODERN_2235_GIS_ID,candidate:MODERN_2235_CANDIDATE,upperOpeningCount:12,groundWindowCount:2,entranceCount:1,floorBands:floors.length,confidence:'schematic',reference:'2026-11-22 listing and partial April 2025 Street View'};
}
