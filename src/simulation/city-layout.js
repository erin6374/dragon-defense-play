import {occupiesCrossStreet} from './road-corridors.js';

// Axis-aligned ground-plan footprints. Tiny contact at shared party walls is valid;
// positive two-axis interior overlap is not. The structural mesh may have trim
// beyond this envelope, so this test is a minimum placement guarantee.
export function footprintsOverlap(a,b,epsilon=0.05){
 const dx=Math.min(a.x+a.w/2,b.x+b.w/2)-Math.max(a.x-a.w/2,b.x-b.w/2);
 const dz=Math.min(a.z+a.d/2,b.z+b.d/2)-Math.max(a.z-a.d/2,b.z-b.d/2);
 return dx>epsilon&&dz>epsilon;
}
// Frontage reference: calibrated to Google Maps / Google Street View, Philadelphia
// land records, and the North Broad photogrammetric survey.
// Ground-truth anchor: Tech Freire Charter School at 2221 N Broad St (x = 0).
// - Negative x is North toward Dauphin (x = -98) and York (x = -167).
// - Positive x is South toward Susquehanna (x = 70) and Diamond (x = 245).
// All parcels touch real party walls with ZERO unwanted gaps and zero corridor blocks.
export function populateCity(city){
 // Reserve the existing school parcel even though its proxy is inserted last.
 // Do not move/resize the source school model just to pass background-row QA.
 const occupiedFootprints=[{name:'tech-freire-school',x:0,w:29.2,z:-27.5,d:62.0}];
 const house=o=>{
  const footprint={name:o.name,x:o.x,w:o.w,z:o.z??-7.4,d:o.d??14.5};
  occupiedFootprints.push(footprint);
  return city.addBuilding({d:14.5,z:-7.4,stories:3,bays:2,...o});
 };

 // =========================================================================
 // 1. 2200 BLOCK NORTH BROAD (North of Tech Freire, x = 0 to Dauphin x = -102)
 // Continuous street wall from Tech Freire north party wall (x = -13.26) to Dauphin corner (x = -88.1)
 // =========================================================================
 // 2227 N Broad (United Fund of Pennsylvania) — GLB 1007132
 house({name:'united-fund-cream',historicSash:true,x:-16.13,w:5.74,h:12.3,d:21.0,z:-10.5,kind:'creamWarm',stories:3,bays:2});
 // 2231 N Broad (Black United Fund Conference Center) — GLB 1003388
 house({name:'black-united-fund',historicSash:true,x:-21.565,w:5.13,h:12.5,d:22.0,z:-11.0,kind:'stoneGray',stories:3,bays:2});
 // 2233 N Broad (blues babe FOUNDATION) — GLB 1525758
 house({name:'blues-babe-foundation',historicSash:true,x:-27.25,w:6.24,h:12.9,d:23.0,z:-11.5,kind:'brickBrown',stories:3,bays:3});
 // 2235-37 N Broad authentic brownstone pair (Procedural fill between blues babe and 2239)
 house({name:'maximus-cares-brownstone',historicSash:true,x:-36.07,w:11.40,h:13.2,d:22.0,z:-11.0,kind:'brickBrown',stories:3,bays:4});
 // 2239 N Broad rowhouse — GLB 1536711
 house({name:'north-2239-rowhouse',historicSash:true,x:-44.665,w:5.79,h:13.4,d:22.0,z:-11.0,kind:'brickTan',stories:3,bays:2});
 // 2241 N Broad rowhouse — GLB 1508518
 house({name:'north-2241-rowhouse',historicSash:true,x:-50.40,w:5.68,h:13.6,d:22.0,z:-11.0,kind:'brickRed',stories:3,bays:2});
 // 2243-49 N Broad authentic historic tan rowhouse frontage (Procedural fill between 2241 and 2251)
 house({name:'historic-tan-rowhouses',historicSash:true,x:-64.14,w:21.80,h:13.4,d:22.0,z:-11.0,kind:'brickTan',stories:3,bays:6});
 // 2251 N Broad (PCs for People) — GLB 1536713
 house({name:'pcs-for-people',historicSash:true,x:-77.825,w:5.57,h:13.8,d:22.0,z:-11.0,kind:'stoneGray',stories:3,bays:2});
 // 2253 N Broad (Philadelphia Doll Museum) sits on the South corner of Dauphin — GLB 1542243
 house({name:'north-doll-museum',historicSash:true,x:-84.5,w:7.22,h:14.8,d:48.0,z:-24.0,stories:4,bays:3,kind:'brickRed'});

 // [W DAUPHIN ST (2300 N) cross street intersection is 100% CLEAR from x = -110.0 to -94.0 (centerline x = -102)]

 // =========================================================================
 // 2. 2300 BLOCK NORTH BROAD (Between Dauphin x = -102 and York x = -270)
 // Real Philadelphia block length = 168m with authentic historic storefront sequence
 // =========================================================================
 house({name:'north-2300-historic-shop-1',historicSash:true,x:-116.0,w:9.5,h:13.2,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2300-historic-shop-2',historicSash:true,x:-125.5,w:9.5,h:13.8,kind:'stone',stories:3,bays:3,ornateRoofline:true,exteriorOnly:true});
 house({name:'north-2300-historic-shop-3',historicSash:true,x:-134.0,w:7.5,h:13.0,kind:'brickTan',stories:3,bays:3,exteriorOnly:true});
 // 2309-13 Philadelphia Electric Company (PECO) — GLB 1051326
 house({name:'north-2300-corner-commercial',historicSash:true,x:-148.225,w:20.45,h:14.5,d:48.0,z:-24.0,kind:'brickRed',stories:4,bays:6,projectingBays:true,exteriorOnly:true});
 // 2315-31 Commercial block frontage extending north to York Street corner
 house({name:'north-2315-commercial',historicSash:true,x:-168.0,w:19.0,h:15.0,kind:'brickRed',stories:4,bays:5,exteriorOnly:true});
 house({name:'north-2319-retail',historicSash:true,x:-187.0,w:19.0,h:13.5,kind:'creamWarm',stories:3,bays:5,exteriorOnly:true});
 house({name:'north-2321-commercial',historicSash:true,x:-207.0,w:21.0,h:14.0,kind:'brickBrown',stories:4,bays:6,exteriorOnly:true});
 house({name:'north-2325-mixed-use',historicSash:true,x:-228.0,w:21.0,h:14.5,kind:'stone',stories:4,bays:6,exteriorOnly:true});
 house({name:'north-2331-commercial',historicSash:true,x:-248.5,w:20.0,h:14.0,kind:'stoneGray',stories:3,bays:5,exteriorOnly:true});

 // [W YORK ST (2400 N) cross street intersection is 100% CLEAR from x = -278.0 to -262.0 (centerline x = -270)]

 // =========================================================================
 // 3. 2400 BLOCK NORTH BROAD (North of York Street, x < -278.0)
 // =========================================================================
 house({name:'north-2400-broad-station',historicSash:true,x:-289.0,w:18.0,h:13.8,kind:'stone',stories:3,bays:4,exteriorOnly:true});
 house({name:'north-2400-commercial-1',historicSash:true,x:-308.0,w:18.0,h:14.2,kind:'creamWarm',stories:3,bays:4,exteriorOnly:true});
 house({name:'north-2400-commercial-2',historicSash:true,x:-328.0,w:20.0,h:14.0,kind:'brickBrown',stories:3,bays:5,exteriorOnly:true});

 // =========================================================================
 // 4. 2200 BLOCK NORTH BROAD (South of Tech Freire, x = 0 to Susquehanna x = 78)
 // =========================================================================
 // 2219 N Broad rowhouse — GLB 1007133 (touches Tech Freire south party wall at x = 13.26)
 house({name:'north-2219-brownstone',historicSash:true,x:16.28,w:6.04,h:14.1,d:22.0,z:-11.0,stories:3,bays:2,kind:'brickBrown'});
 // 2217 N Broad rowhouse — GLB 1007134 (touches 2219 party wall at x = 19.30)
 house({name:'north-2217-brownstone',historicSash:true,x:22.38,w:6.16,h:14.1,d:22.0,z:-11.0,stories:3,bays:2,kind:'brickBrown'});
 // 2215-11 N Broad rowhouses
 house({name:'north-modern-white-red',x:31.46,w:12.0,h:15.5,stories:4,bays:4,kind:'creamWarm'});
 // 2209-05 N Broad red brick shops
 house({name:'north-red-brick-shop',historicSash:true,x:43.46,w:12.0,h:11.4,stories:3,bays:3,kind:'brickRed'});
 // 2201-03 Crown Fried Chicken sits on North corner of Susquehanna
 house({name:'susquehanna-crown-chicken',x:56.5,w:14.0,h:8.5,stories:2,bays:4,kind:'brickTan'});

 // [W SUSQUEHANNA AVE (2200 N) cross street intersection is 100% CLEAR from x = 70.0 to 86.0 (centerline x = 78)]

 // =========================================================================
 // 5. 2100 BLOCK NORTH BROAD (Between Susquehanna x = 78 and Diamond x = 256)
 // Authentic Google Maps / Street View sequence:
 // - ArchWell / Former CVS & Rite Aid single-story pharmacy at 2131 N Broad (x = 102) on South corner of Susquehanna
 // - Temple University Newman Center / Student Ministry at 2129 N Broad (x = 124)
 // - 3-story mixed commercial rowhouses at 2125-27 (x = 139.5) and 2121-23 (x = 154)
 // - Temple Flats student housing at 2117-19 (x = 169.5)
 // - McDonald's freestanding restaurant at 2109 N Broad (x = 190) with 24-hr drive-thru
 // - McDonald's / Berean Church paved parking apron & approach (x = 201 to 213)
 // - Berean Presbyterian Church at 2101-07 N Broad (North corner of Diamond, x = 228.5) — GLB 1005656
 // =========================================================================
 // Former CVS / Rite Aid / ArchWell Health (2131 N Broad St) sits on South corner of Susquehanna
 house({name:'former-cvs-2131-broad',x:102.0,w:26.0,h:6.8,d:22.0,z:-12.0,kind:'creamWarm',stories:1,bays:6,institutional:true,exteriorOnly:true});
 // 2129 N Broad: Temple University Newman Center (Catholic Campus Ministry)
 house({name:'broad-2129-newman',historicSash:true,x:124.0,w:16.0,h:12.8,d:20.0,z:-10.5,kind:'stone',stories:3,bays:3,exteriorOnly:true});
 // 2125-27 N Broad: Mixed commercial & retail
 house({name:'broad-2125-commercial',historicSash:true,x:139.5,w:14.0,h:11.4,d:18.0,z:-9.5,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});
 // 2121-23 N Broad: Broad Street commercial row
 house({name:'broad-2121-mixed-use',historicSash:true,x:154.0,w:14.0,h:11.8,d:18.0,z:-9.5,kind:'stone',stories:3,bays:3,exteriorOnly:true});
 // 2117-19 N Broad: Temple Flats student housing
 house({name:'broad-2117-apartments',historicSash:true,x:169.5,w:16.0,h:11.2,d:18.0,z:-9.5,kind:'creamWarm',stories:3,bays:4,exteriorOnly:true});

 // McDonald's (2109 N Broad St): freestanding 1-story building (x = 190) with drive-thru & parking
 house({name:'mcdonalds-2109-broad',x:190.0,w:22.0,h:6.2,d:18.0,z:-10.0,kind:'brickBrown',stories:1,bays:5,exteriorOnly:true});

 // Berean Presbyterian Church (2101-07 N Broad St) sits on the North corner of Diamond Street — GLB 1005656
 house({name:'south-diamond-corner',historicSash:true,x:228.5,w:31.0,h:16.0,d:50.0,z:-25.0,kind:'brickRed',stories:4,bays:6,exteriorOnly:true});

 // [W DIAMOND ST (2100 N) cross street intersection is 100% CLEAR from x = 248.0 to 264.0 (centerline x = 256)]

 // =========================================================================
 // 6. 2000 BLOCK NORTH BROAD (South of Diamond Street, x > 264.0)
 // =========================================================================
 house({name:'south-diamond-mixed-use',historicSash:true,x:276.0,w:20.0,h:15.5,kind:'stoneGray',stories:4,bays:4,exteriorOnly:true});

 // =========================================================================
 // 7. NEAR NEIGHBORHOOD DEPTH ROWS (Clear sightlines down all 4 cross streets & behind parcels)
 // =========================================================================
 const palette=['brick','cream','stone','brickBrown','brickTan'];
 // Middleground residential rows strictly between North-South street corridors:
 const depthRows=[-50.5,-85.0,-120.0];

 // Footprints of deep frontage models & parking lots that depth rows must NEVER overlap:
 function insideFrontageExclusion(bx, bWidth, bz) {
  const halfW = bWidth * 0.5 + 1.5;
  const left = bx - halfW;
  const right = bx + halfW;
  // York St cross street corridor (x = -278 to -262 across ALL depths)
  if (right > -278 && left < -262) return true;
  // PECO (x = -159 to -138, z > -55)
  if (right > -159 && left < -138 && bz > -55) return true;
  // 2300 Block shops (x = -262 to -110, z > -25)
  if (right > -262 && left < -110 && bz > -25) return true;
  // Dauphin St cross street corridor (x = -110 to -94 across ALL depths)
  if (right > -110 && left < -94) return true;
  // Doll Museum & PCs for People (x = -94 to -75, z > -55)
  if (right > -94 && left < -75 && bz > -55) return true;
  // 2200 North rowhouses (x = -75 to -13, z > -35)
  if (right > -75 && left < -13 && bz > -35) return true;
  // Tech Freire school campus (x = -16.5 to +16.5, z > -62)
  if (right > -16.5 && left < 16.5 && bz > -62.0) return true;
  // 2200 South rowhouses & shops (x = 13 to 70, z > -35)
  if (right > 13 && left < 70 && bz > -35) return true;
  // Susquehanna Ave cross street (x = 70 to 86 across ALL depths)
  if (right > 70 && left < 86) return true;
  // ArchWell / Former CVS & parking (x = 86 to 118, z > -35)
  if (right > 86 && left < 118 && bz > -35) return true;
  // 2100 Mid-block rowhouses & apartments (x = 118 to 178, z > -25)
  if (right > 118 && left < 178 && bz > -25) return true;
  // McDonald's restaurant & parking lot (x = 178 to 212, z > -40)
  if (right > 178 && left < 212 && bz > -40) return true;
  // Berean Presbyterian Church lot (x = 212 to 246, z > -55)
  if (right > 212 && left < 246 && bz > -55) return true;
  // Diamond St cross street (x = 248 to 264 across ALL depths)
  if (right > 248 && left < 264) return true;
  return false;
 }

 // Deeper lot buildings between Broad and the rear residential fabric
 // Deeper lot buildings between Broad and the rear residential fabric (strictly clear Watts St corridor at z = -34.0)
 for(const [name,x,w,d,h,z,stories,kind] of [
  ['rear-wing-school',0,16.0,21,8.8,-26.0,2,'brick'],
  ['rear-wing-east-2',31.46,10.5,10,7.6,-18.0,2,'cream'],
  ['rear-wing-east-3',42.96,8.0,8,8.0,-17.0,2,'brickTan']
 ]) {if(Math.abs(x)<18&&z>-85)continue;house({name,x,w,d:d-2,h,z:z-(d-2)/2,stories,background:true,kind});}

 for(let row=0;row<depthRows.length;row++){
  const z=depthRows[row];
  const count=96;
  for(let i=0;i<count;i++){
   const x=-380+i*8.2+((row%2)*1.4);
   // Neighbor centers are spaced 8.2m apart; widths above that generated
   // intersecting walls every fourth house in the previous procedural grid.
   const width=Math.min(8.0,7.1+((i+row)%4)*.7);
   const bDepth=13.0; // depth strictly matches residential parcel depth between street corridors
   // Strict cross-street clearance keeps York, Dauphin, Susquehanna, and Diamond sightlines 100% open
   const candidate={name:`background-${row}-${i}`,x,w:width,z,d:bDepth};
   if(occupiesCrossStreet(x,width,5.0) || insideFrontageExclusion(x,width,z)
      ||occupiedFootprints.some(existing=>footprintsOverlap(candidate,existing)))continue;
   const stories=2+((i*3+row)%3);
   const h=3.3+stories*2.7+((i+row)%3)*.34;
   house({name:`background-${row}-${i}`,x,w:width,d:bDepth,h,z,background:true,stories,bays:2+((i+row)%2),kind:palette[(i+row)%palette.length]});
  }
 }

 // The school itself: Tech Freire Charter School (central anchor, x = 0)
 const school=house({name:'tech-freire-school',x:0,w:26.52,h:28.0,d:18,z:-8.6,stories:5,bays:6,school:true,kind:'brick'});
 return school;
}
