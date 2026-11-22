import {occupiesCrossStreet} from './road-corridors.js';
// Frontage reference: supplied April 2025 / September 2026 Google Street View,
// historical Philadelphia land records, and North Broad photogrammetric survey.
// Real-world location: 2221 N Broad St, Philadelphia PA (Tech Freire Charter School).
// Relative x is game-space Broad Street:
// - x = 0 is Tech Freire Charter School (2221 N Broad St);
// - Negative x is North toward Dauphin (x = -98) and York (x = -167);
// - Positive x is South toward Susquehanna (x = 70) and Diamond (x = 245).
// Dimensions accurately preserve real block hierarchy, party walls, and open cross-street corridors.
export function populateCity(city){
 const house=o=>city.addBuilding({d:14.5,z:-7.4,stories:3,bays:2,...o});

 // =========================================================================
 // 1. 2200 BLOCK NORTH BROAD (North of Tech Freire, x = 0 to Dauphin x = -98)
 // =========================================================================
 // Replaced parcels matched directly to North Broad photogrammetric model pack
 house({name:'united-fund-cream',historicSash:true,x:-13.55,w:5.74,h:12.3,d:21.0,z:-10.5,kind:'creamWarm',stories:3,bays:2});
 house({name:'south-cream-rowhouse',historicSash:true,x:-26.65,w:11.37,h:12.9,d:32.0,z:-16.0,kind:'stoneGray',stories:3,bays:4});
 // Authentic 2235-37 brownstone gap between Black United Fund (2233) and stoop rowhouse (2239)
 house({name:'maximus-cares-brownstone',historicSash:true,x:-38.3,w:11.4,h:13.2,d:22.0,z:-11.0,kind:'brickBrown',stories:3,bays:4});
 house({name:'south-tan-brick',historicSash:true,x:-49.82,w:11.47,h:13.6,d:29.0,z:-14.5,kind:'brickTan',stories:3,bays:4});
 // Authentic 2243-49 historic tan rowhouse frontage gap between 2241 and 2251
 house({name:'historic-tan-rowhouses',historicSash:true,x:-66.5,w:21.8,h:13.4,d:22.0,z:-11.0,kind:'brickTan',stories:3,bays:6});
 // 2251 PCs for People & 2253 Philadelphia Doll Museum (sits directly on the South corner of Dauphin)
 house({name:'north-doll-museum',historicSash:true,x:-83.32,w:12.05,h:14.8,d:48.0,z:-24.0,stories:4,bays:4,kind:'brickRed'});

 // [W DAUPHIN ST (2300 N) cross street intersection is 100% CLEAR from x = -106.5 to -89.5 (centerline x = -98)]

 // =========================================================================
 // 2. 2300 BLOCK NORTH BROAD (Between Dauphin x = -98 and York x = -167)
 // =========================================================================
 house({name:'north-2300-historic-shop-1',historicSash:true,x:-113.0,w:9.0,h:13.2,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2300-historic-shop-2',historicSash:true,x:-123.5,w:9.0,h:13.8,kind:'stone',stories:3,bays:3,ornateRoofline:true,exteriorOnly:true});
 house({name:'north-2300-historic-shop-3',historicSash:true,x:-133.5,w:8.5,h:13.0,kind:'brickTan',stories:3,bays:3,exteriorOnly:true});
 // 2309-13 Philadelphia Electric Company (PECO) sits on the South corner of York Street
 house({name:'north-2300-corner-commercial',historicSash:true,x:-148.425,w:20.45,h:14.5,d:48.0,z:-24.0,kind:'brickRed',stories:4,bays:6,projectingBays:true,exteriorOnly:true});

 // [W YORK ST (2400 N) cross street intersection is 100% CLEAR from x = -175.5 to -158.5 (centerline x = -167)]

 // =========================================================================
 // 3. 2400 BLOCK NORTH BROAD (North of York Street, x < -175.5)
 // =========================================================================
 house({name:'north-2400-broad-station',historicSash:true,x:-186.0,w:12.0,h:13.8,kind:'stone',stories:3,bays:4,exteriorOnly:true});
 house({name:'north-2400-commercial-1',historicSash:true,x:-199.5,w:11.0,h:14.2,kind:'creamWarm',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2400-commercial-2',historicSash:true,x:-212.0,w:11.0,h:14.0,kind:'brickBrown',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2400-historic-corner',historicSash:true,x:-225.0,w:11.0,h:15.0,kind:'stoneGray',stories:4,bays:4,projectingBays:true,exteriorOnly:true});
 house({name:'north-york-commercial',historicSash:true,x:-237.5,w:11.0,h:13.5,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});

 // =========================================================================
 // 4. 2200 BLOCK NORTH BROAD (South of Tech Freire, x = 0 to Susquehanna x = 70)
 // =========================================================================
 // 2219 and 2217 N Broad rowhouse pair (models 1007133 & 1007134)
 house({name:'north-brownstone',historicSash:true,x:16.75,w:12.2,h:14.1,d:33.0,z:-16.5,stories:3,bays:4,kind:'brickBrown'});
 // Alley immediately south of 2217 brownstone intentionally open (x = 23 to 26)
 house({name:'north-modern-white-red',x:32.0,w:12.0,h:18.8,stories:5,bays:4,kind:'creamWarm'});
 house({name:'north-red-brick-shop',historicSash:true,x:43.5,w:7.0,h:11.4,stories:3,bays:3,kind:'brickRed'});
 house({name:'susquehanna-crown-chicken',x:54.5,w:9.0,h:7.8,stories:2,bays:4,kind:'brickTan'});

 // [W SUSQUEHANNA AVE (2200 N) cross street intersection is 100% CLEAR from x = 59.0 to 79.0 (centerline x = 70)]

 // =========================================================================
 // 5. 2100 BLOCK NORTH BROAD (Between Susquehanna x = 70 and Diamond x = 245)
 // Authentic Philadelphia architecture matching user Street View & real records:
 // - ArchWell / Former CVS commercial parking lot fronting Susquehanna (x = 79..113)
 // - Former CVS / Rite Aid (ArchWell Health) single-story pharmacy at 2131 N Broad (x = 123)
 // - Commercial mixed-use & Temple student apartments mid-block (x = 138, 149, 162)
 // - McDonald's drive-thru lane & surface parking approach (x = 170..179)
 // - McDonald's fast food restaurant at 2109 N Broad (x = 188)
 // - Courtyard & church driveway approach (x = 196.5..216.5)
 // - Berean Presbyterian Church at 2101-07 N Broad (North corner of Diamond, x = 227.485)
 // =========================================================================
 // Former CVS / Rite Aid / ArchWell Health (2131 N Broad St)
 // Open commercial retail parking lot occupies corner at x = 79..113
 house({name:'former-cvs-2131-broad',x:123.0,w:18.0,h:6.8,d:22.0,z:-12.0,kind:'creamWarm',stories:1,bays:6,institutional:true,exteriorOnly:true});
 // Mid-block 2100 row: authentic mixed commercial, deli, and Temple student residence
 house({name:'broad-2125-commercial',historicSash:true,x:138.0,w:10.0,h:11.4,d:18.0,z:-9.5,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});
 house({name:'broad-2121-mixed-use',historicSash:true,x:149.0,w:10.0,h:11.8,d:18.0,z:-9.5,kind:'stone',stories:3,bays:3,exteriorOnly:true});
 house({name:'broad-2117-apartments',x:162.0,w:14.0,h:11.2,d:18.0,z:-9.5,kind:'creamWarm',stories:3,bays:4,exteriorOnly:true});

 // McDonald's (2109 N Broad St): freestanding 1-story building + open drive-thru & parking lot (x = 170..179)
 house({name:'mcdonalds-2109-broad',x:188.0,w:16.0,h:6.2,d:16.0,z:-10.0,kind:'brickBrown',stories:1,bays:5,exteriorOnly:true});

 // Open courtyard / driveway gap between McDonald's and Berean Church (x = 196.5..216.5)

 // Berean Presbyterian Church (2101-07 N Broad St) sits on the North corner of Diamond Street
 house({name:'south-diamond-corner',historicSash:true,x:227.485,w:20.29,h:16.0,d:50.0,z:-25.0,kind:'brickRed',stories:4,bays:6,exteriorOnly:true});

 // [W DIAMOND ST (2100 N) cross street intersection is 100% CLEAR from x = 237.0 to 253.0 (centerline x = 245)]

 // =========================================================================
 // 6. 2000 BLOCK NORTH BROAD (South of Diamond Street, x > 253.0)
 // =========================================================================
 house({name:'south-diamond-mixed-use',historicSash:true,x:265.0,w:16.0,h:15.5,kind:'stoneGray',stories:4,bays:4,exteriorOnly:true});

 // =========================================================================
 // 7. NEAR NEIGHBORHOOD DEPTH ROWS (Clear sightlines down all 4 cross streets & behind parcels)
 // =========================================================================
 const palette=['brick','cream','stone','brickBrown','brickTan'];
 const depthRows=[-25,-41,-57,-73];

 // Footprints of deep frontage models & parking lots that depth rows must NEVER overlap:
 function insideFrontageExclusion(bx, bWidth, bz) {
  const halfW = bWidth * 0.5 + 1.5;
  const left = bx - halfW;
  const right = bx + halfW;
  // PECO (x = -160 to -137, z > -55)
  if (right > -161 && left < -136 && bz > -55) return true;
  // 2300 Block shops (x = -136 to -108, z > -25)
  if (right > -136 && left < -108 && bz > -25) return true;
  // Doll Museum & PCs for People (x = -91 to -75, z > -55)
  if (right > -91 && left < -75 && bz > -55) return true;
  // 2200 North rowhouses (x = -75 to -10, z > -38)
  if (right > -75 && left < -10 && bz > -38) return true;
  // Tech Freire school campus (x = -18 to +18, z > -45)
  if (right > -18 && left < 18 && bz > -45) return true;
  // 2200 South rowhouses & shops (x = 10 to 60, z > -38)
  if (right > 10 && left < 60 && bz > -38) return true;
  // Susquehanna Ave cross street (x = 58 to 82 across ALL depths)
  if (right > 58 && left < 82) return true;
  // ArchWell / CVS parking lot & pharmacy (x = 78 to 134, z > -35)
  if (right > 78 && left < 134 && bz > -40) return true;
  // 2100 Mid-block shops (x = 134 to 170, z > -25)
  if (right > 134 && left < 170 && bz > -25) return true;
  // McDonald's approach, building & courtyard (x = 170 to 220, z > -40)
  if (right > 170 && left < 220 && bz > -40) return true;
  // Berean Presbyterian Church lot (x = 216 to 238, z > -55)
  if (right > 216 && left < 238 && bz > -55) return true;
  // Diamond St cross street (x = 236 to 254 across ALL depths)
  if (right > 236 && left < 254) return true;
  return false;
 }

 for(let row=0;row<depthRows.length;row++){
  const z=depthRows[row];
  const count=96;
  for(let i=0;i<count;i++){
   const x=-380+i*8.2+((row%2)*1.4);
   const width=7.1+((i+row)%4)*.7;
   // Strict cross-street clearance keeps York, Dauphin, Susquehanna, and Diamond sightlines 100% open
   if(occupiesCrossStreet(x,width,5.0) || insideFrontageExclusion(x,width,z))continue;
   const stories=2+((i*3+row)%3);
   const h=3.3+stories*2.7+((i+row)%3)*.34;
   house({name:`background-${row}-${i}`,x,w:width,h,z,background:true,stories,bays:2+((i+row)%2),kind:palette[(i+row)%palette.length]});
  }
 }

 // Deeper lot buildings between Broad and the rear residential fabric
 for(const [name,x,w,d,h,z,stories,kind] of [
  ['rear-wing-school',0,16.0,21,8.8,-26.0,2,'brick'],
  ['rear-wing-east-2',32.0,10.5,20,7.6,-27.5,2,'cream'],
  ['rear-wing-east-3',43.5,8.0,13,8.0,-21.5,2,'brickTan']
 ]) {if(Math.abs(x)<18&&z>-85)continue;house({name,x,w,d:d-2,h,z:z-(d-2)/2,stories,background:true,kind});}

 // The school itself: Tech Freire Charter School (central anchor, x = 0)
 const school=house({name:'tech-freire-school',x:0,w:27.0,h:28.0,d:18,z:-8.6,stories:5,bays:6,school:true,kind:'brick'});
 return school;
}
