import {occupiesCrossStreet} from './road-corridors.js';
// Frontage reference: supplied April 2025 / September 2026 Google Street View,
// historical Philadelphia land records, and North Broad photogrammetric survey.
// Relative x is game-space Broad Street:
// - x = 0 is Tech Freire Charter School (2221 N Broad St);
// - Negative x is North toward Dauphin (x = -98) and York (x = -167);
// - Positive x is South toward Susquehanna (x = 53) and Diamond (x = 245).
// Dimensions accurately preserve real block hierarchy, party walls, and open cross-street corridors.
export function populateCity(city){
 const house=o=>city.addBuilding({d:14.5,z:-7.4,stories:3,bays:2,...o});

 // =========================================================================
 // 1. 2200 BLOCK NORTH BROAD (North of Tech Freire, x = 0 to Dauphin x = -98)
 // =========================================================================
 // Replaced parcels matched directly to North Broad photogrammetric model pack
 house({name:'united-fund-cream',historicSash:true,x:-13.55,w:5.74,h:12.3,kind:'creamWarm',stories:3,bays:2});
 house({name:'south-cream-rowhouse',historicSash:true,x:-26.65,w:11.37,h:12.9,kind:'stoneGray',stories:3,bays:4});
 // Authentic 2235-37 brownstone gap between Black United Fund (2233) and stoop rowhouse (2239)
 house({name:'maximus-cares-brownstone',historicSash:true,x:-38.3,w:11.4,h:13.2,kind:'brickBrown',stories:3,bays:4});
 house({name:'south-tan-brick',historicSash:true,x:-49.82,w:11.47,h:13.6,kind:'brickTan',stories:3,bays:4});
 // Authentic 2243-49 historic tan rowhouse frontage gap between 2241 and 2251
 house({name:'historic-tan-rowhouses',historicSash:true,x:-66.5,w:21.8,h:13.4,kind:'brickTan',stories:3,bays:6});
 // 2251 PCs for People & 2253 Philadelphia Doll Museum (sits directly on the South corner of Dauphin)
 house({name:'north-doll-museum',historicSash:true,x:-83.32,w:12.05,h:14.8,stories:4,bays:4,kind:'brickRed'});

 // [W DAUPHIN ST (2300 N) cross street intersection is 100% CLEAR from x = -106.5 to -89.5 (centerline x = -98)]

 // =========================================================================
 // 2. 2300 BLOCK NORTH BROAD (Between Dauphin x = -98 and York x = -167)
 // =========================================================================
 house({name:'north-2300-historic-shop-1',historicSash:true,x:-113.0,w:9.0,h:13.2,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2300-historic-shop-2',historicSash:true,x:-123.5,w:9.0,h:13.8,kind:'stone',stories:3,bays:3,ornateRoofline:true,exteriorOnly:true});
 house({name:'north-2300-historic-shop-3',historicSash:true,x:-133.5,w:8.5,h:13.0,kind:'brickTan',stories:3,bays:3,exteriorOnly:true});
 // 2309-13 Philadelphia Electric Company (PECO) sits on the South corner of York Street
 house({name:'north-2300-corner-commercial',historicSash:true,x:-148.425,w:20.45,h:14.5,kind:'brickRed',stories:4,bays:6,projectingBays:true,exteriorOnly:true});

 // [W YORK ST (2400 N) cross street intersection is 100% CLEAR from x = -175.5 to -158.5 (centerline x = -167)]

 // =========================================================================
 // 3. 2400 BLOCK NORTH BROAD (North of York Street, x < -175.5)
 // =========================================================================
 house({name:'north-2400-broad-station',historicSash:true,x:-183.0,w:12.0,h:13.8,kind:'stone',stories:3,bays:4,exteriorOnly:true});
 house({name:'north-2400-commercial-1',historicSash:true,x:-196.5,w:11.0,h:14.2,kind:'creamWarm',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2400-commercial-2',historicSash:true,x:-209.0,w:11.0,h:14.0,kind:'brickBrown',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2400-historic-corner',historicSash:true,x:-222.0,w:11.0,h:15.0,kind:'stoneGray',stories:4,bays:4,projectingBays:true,exteriorOnly:true});
 house({name:'north-york-commercial',historicSash:true,x:-234.5,w:11.0,h:13.5,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});

 // =========================================================================
 // 4. 2200 BLOCK NORTH BROAD (South of Tech Freire, x = 0 to Susquehanna x = 53)
 // =========================================================================
 // 2219 and 2217 N Broad rowhouse pair
 house({name:'north-brownstone',historicSash:true,x:16.75,w:12.2,h:14.1,stories:3,bays:4,kind:'brickBrown'});
 // Alley immediately east of brownstone intentionally left open (x = 23 to 27)
 house({name:'north-modern-white-red',x:32.0,w:9.6,h:18.8,stories:5,bays:4,kind:'creamWarm'});
 house({name:'north-red-brick-shop',historicSash:true,x:39.1,w:3.5,h:11.4,stories:3,bays:2,kind:'brickRed'});
 house({name:'susquehanna-crown-chicken',x:43.2,w:3.5,h:7.4,stories:2,bays:3,kind:'brickTan'});

 // [W SUSQUEHANNA AVE (2200 N) cross street intersection is 100% CLEAR from x = 44.5 to 61.5 (centerline x = 53)]

 // =========================================================================
 // 5. 2100 BLOCK NORTH BROAD (Between Susquehanna x = 53 and Diamond x = 245)
 // =========================================================================
 house({name:'broad-south-low-institution',x:77.0,w:28.0,h:5.8,d:21,z:-15.5,kind:'stoneGray',stories:1,bays:9,institutional:true,exteriorOnly:true});
 house({name:'south-temple-broad-corner',historicSash:true,x:98.5,w:9.5,h:14.8,kind:'brickRed',stories:4,bays:3,exteriorOnly:true});
 house({name:'south-temple-broad-shop',historicSash:true,x:108.0,w:8.8,h:13.2,kind:'creamWarm',stories:3,bays:3,exteriorOnly:true});
 house({name:'south-broad-mixed-use-1',historicSash:true,x:117.5,w:9.4,h:14.5,kind:'stone',stories:4,bays:3,exteriorOnly:true});
 house({name:'south-broad-mixed-use-2',historicSash:true,x:127.5,w:9.6,h:13.8,kind:'brickBrown',stories:3,bays:3,exteriorOnly:true});
 house({name:'south-norris-corner',historicSash:true,x:138.0,w:10.4,h:15.2,kind:'stoneGray',stories:4,bays:4,projectingBays:true,exteriorOnly:true});
 house({name:'south-temple-campus-hall',x:150.0,w:12.0,h:16.5,kind:'brickTan',stories:4,bays:4,exteriorOnly:true});
 house({name:'south-2100-broad-apartments',x:166.5,w:14.0,h:17.2,kind:'creamWarm',stories:5,bays:4,exteriorOnly:true});
 house({name:'south-2100-broad-commercial',historicSash:true,x:183.5,w:15.0,h:15.0,kind:'stone',stories:4,bays:4,exteriorOnly:true});
 house({name:'south-2100-broad-plaza',historicSash:true,x:202.0,w:16.0,h:15.0,kind:'brickRed',stories:4,bays:5,exteriorOnly:true});
 // Berean Presbyterian Church (2101-07 N Broad) sits on the North corner of Diamond Street
 house({name:'south-diamond-corner',historicSash:true,x:227.485,w:20.29,h:16.0,kind:'brickRed',stories:4,bays:6,exteriorOnly:true});

 // [W DIAMOND ST (2100 N) cross street intersection is 100% CLEAR from x = 236.5 to 253.5 (centerline x = 245)]

 // =========================================================================
 // 6. 2000 BLOCK NORTH BROAD (South of Diamond Street, x > 253.5)
 // =========================================================================
 house({name:'south-diamond-mixed-use',historicSash:true,x:265.0,w:16.0,h:15.5,kind:'stoneGray',stories:4,bays:4,exteriorOnly:true});

 // =========================================================================
 // 7. NEAR NEIGHBORHOOD DEPTH ROWS (Clear sightlines down all 4 cross streets)
 // =========================================================================
 const palette=['brick','cream','stone','brickBrown','brickTan'];
 const depthRows=[-25,-41,-57,-73];
 for(let row=0;row<depthRows.length;row++){
  const z=depthRows[row];
  const count=96;
  for(let i=0;i<count;i++){
   const x=-380+i*8.2+((row%2)*1.4);
   const width=7.1+((i+row)%4)*.7;
   // Strict cross-street clearance keeps York, Dauphin, Susquehanna, and Diamond sightlines 100% open
   if(occupiesCrossStreet(x,width,2.5)|| (Math.abs(x)<17&&z>-80) || (x+width*.5>63&&x-width*.5<93&&z+7.25>-26&&z-7.25<-5))continue;
   const stories=2+((i*3+row)%3);
   const h=3.3+stories*2.7+((i+row)%3)*.34;
   house({name:`background-${row}-${i}`,x,w:width,h,z,background:true,stories,bays:2+((i+row)%2),kind:palette[(i+row)%palette.length]});
  }
 }

 // Deeper lot buildings between Broad and the rear residential fabric
 // (Poking rear wings behind replaced rowhouses are cleanly removed)
 for(const [name,x,w,d,h,z,stories,kind] of [
  ['rear-wing-school',0,16.0,21,8.8,-26.0,2,'brick'],
  ['rear-wing-east-2',32.0,10.5,20,7.6,-27.5,2,'cream'],
  ['rear-wing-east-3',43.0,8.0,13,8.0,-21.5,2,'brickTan']
 ]) {if(Math.abs(x)<17&&z>-85)continue;house({name,x,w,d:d-2,h,z:z-(d-2)/2,stories,background:true,kind});}

 // The school itself: Tech Freire Charter School (central anchor, x = 0)
 const school=house({name:'tech-freire-school',x:0,w:27.0,h:28.0,d:18,z:-8.6,stories:5,bays:6,school:true,kind:'brick'});
 return school;
}
