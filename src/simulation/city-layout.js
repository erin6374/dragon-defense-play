import {occupiesCrossStreet} from './road-corridors.js';
// Frontage reference: supplied April 2025 / September 2026 Google Street View
// plus user-supplied satellite imagery. Relative x is game-space Broad Street,
// x=0 is Tech Freire; negative x is north toward Dauphin and positive x is south toward
// Susquehanna. Dimensions remain visual approximations, but they now preserve
// the real hierarchy: Tech Freire is the tallest five-story building on the block.
export function populateCity(city){
 const house=o=>city.addBuilding({d:14.5,z:-7.4,stories:3,bays:2,...o});
 // Frontage on the east side of Broad, ordered north-to-south in the reference image.
 house({name:'united-fund-cream',historicSash:true,x:-18.8,w:5.8,h:12.3,kind:'creamWarm',stories:3,bays:2});
 house({name:'south-cream-rowhouse',historicSash:true,x:-25.5,w:7.0,h:12.9,kind:'stoneGray',stories:3,bays:2});
 house({name:'south-tan-brick',historicSash:true,x:-33.0,w:8.2,h:13.6,kind:'brickTan',stories:3,bays:2});
 house({name:'north-doll-museum',historicSash:true,x:-41.5,w:7.8,h:14.8,stories:4,bays:3,kind:'brickRed'});
 house({name:'north-dauphin-historic-corner',historicSash:true,x:-68.2,w:9.8,h:16.2,stories:4,bays:3,kind:'stone',projectingBays:true,ornateRoofline:true});
 house({name:'south-dauphin-historic',historicSash:true,x:-77.5,w:10.5,h:15.8,stories:4,bays:3,kind:'stone',projectingBays:true});
 house({name:'north-brownstone',historicSash:true,x:19.6,w:8.9,h:14.1,stories:3,bays:2,kind:'brickBrown'});
 // Alley immediately east of brownstone intentionally left open.
 house({name:'north-modern-white-red',x:32.0,w:9.6,h:18.8,stories:5,bays:4,kind:'creamWarm'});
 house({name:'north-red-brick-shop',historicSash:true,x:39.1,w:3.5,h:11.4,stories:3,bays:2,kind:'brickRed'});
 house({name:'susquehanna-crown-chicken',x:43.2,w:3.5,h:7.4,stories:2,bays:3,kind:'brickTan'});
 // Reference-led extensions: north remains attached historic frontage;
 // south of Susquehanna is a LOW, SET-BACK institutional footprint, not shops.
 // See qa/NORTH-BROAD-REFERENCE.md for image evidence and remaining uncertainty.
 house({name:'broad-north-historic-extension',historicSash:true,x:-88.5,w:9,h:12.9,kind:'stone',stories:3,bays:3,projectingBays:true,ornateRoofline:true,exteriorOnly:true});
 house({name:'north-2300-historic-shop-1',historicSash:true,x:-98.2,w:8.8,h:13.2,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2300-historic-shop-2',historicSash:true,x:-107.5,w:9.2,h:13.8,kind:'stone',stories:3,bays:3,ornateRoofline:true,exteriorOnly:true});
 // Authentic 2300-2400 blocks of North Broad extending 1 full screen left toward York Street
 house({name:'north-2300-historic-shop-3',historicSash:true,x:-116.8,w:8.5,h:13.0,kind:'brickTan',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2300-historic-residence',historicSash:true,x:-125.8,w:8.8,h:13.4,kind:'stone',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2300-corner-commercial',historicSash:true,x:-135.2,w:9.4,h:14.5,kind:'brickRed',stories:4,bays:3,projectingBays:true,exteriorOnly:true});
 house({name:'north-2400-broad-station',historicSash:true,x:-155.0,w:9.2,h:13.8,kind:'stone',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2400-commercial-1',historicSash:true,x:-165.0,w:9.8,h:14.2,kind:'creamWarm',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2400-commercial-2',historicSash:true,x:-175.5,w:10.2,h:14.0,kind:'brickBrown',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-2400-historic-corner',historicSash:true,x:-186.5,w:10.5,h:15.0,kind:'stoneGray',stories:4,bays:4,projectingBays:true,exteriorOnly:true});
 house({name:'north-york-commercial',historicSash:true,x:-198.0,w:11.0,h:13.5,kind:'brickRed',stories:3,bays:3,exteriorOnly:true});
 house({name:'north-york-station',historicSash:true,x:-210.0,w:11.5,h:14.0,kind:'stone',stories:3,bays:4,exteriorOnly:true});
 house({name:'broad-south-low-institution',x:77,w:28,h:5.8,d:21,z:-15.5,kind:'stoneGray',stories:1,bays:9,institutional:true,exteriorOnly:true});
 // Authentic South Broad corridor extending 1 full screen right toward Diamond Street & Temple University
 house({name:'south-temple-broad-corner',historicSash:true,x:98.5,w:9.5,h:14.8,kind:'brickRed',stories:4,bays:3,exteriorOnly:true});
 house({name:'south-temple-broad-shop',historicSash:true,x:108.0,w:8.8,h:13.2,kind:'creamWarm',stories:3,bays:3,exteriorOnly:true});
 house({name:'south-broad-mixed-use-1',historicSash:true,x:117.5,w:9.4,h:14.5,kind:'stone',stories:4,bays:3,exteriorOnly:true});
 house({name:'south-broad-mixed-use-2',historicSash:true,x:127.5,w:9.6,h:13.8,kind:'brickBrown',stories:3,bays:3,exteriorOnly:true});
 house({name:'south-norris-corner',historicSash:true,x:138.0,w:10.4,h:15.2,kind:'stoneGray',stories:4,bays:4,projectingBays:true,exteriorOnly:true});
 house({name:'south-temple-campus-hall',x:150.0,w:12.0,h:16.5,kind:'brickTan',stories:4,bays:4,exteriorOnly:true});
 house({name:'south-2100-broad-apartments',x:163.5,w:13.0,h:17.2,kind:'creamWarm',stories:5,bays:4,exteriorOnly:true});
 house({name:'south-2100-broad-commercial',historicSash:true,x:177.5,w:13.5,h:15.0,kind:'stone',stories:4,bays:4,exteriorOnly:true});
 house({name:'south-diamond-corner',historicSash:true,x:192.0,w:14.0,h:16.0,kind:'brickRed',stories:4,bays:4,exteriorOnly:true});
 house({name:'south-diamond-mixed-use',historicSash:true,x:207.5,w:14.5,h:15.5,kind:'stoneGray',stories:4,bays:4,exteriorOnly:true});
 // Detailed collision-enabled near neighborhood. Farther blocks use instanced LOD.
 const palette=['brick','cream','stone','brickBrown','brickTan'];
 const depthRows=[-25,-41,-57,-73];
 for(let row=0;row<depthRows.length;row++){
  const z=depthRows[row];
  // Extend rowhouses westward to far left (negative x) across North Broad and Dauphin corridors
  const count=64;
  for(let i=0;i<count;i++){
   const x=-280+i*8.2+((row%2)*1.4);
   const width=7.1+((i+row)%4)*.7;
   if(occupiesCrossStreet(x,width)|| (Math.abs(x)<17&&z>-80) || (x+width*.5>63&&x-width*.5<93&&z+7.25>-26&&z-7.25<-5))continue; // keep Dauphin and Susquehanna open and preserve south campus
   const stories=2+((i*3+row)%3);
   const h=3.3+stories*2.7+((i+row)%3)*.34;
   house({name:`background-${row}-${i}`,x,w:width,h,z,background:true,stories,bays:2+((i+row)%2),kind:palette[(i+row)%palette.length]});
  }
 }
 // Deeper lot buildings between Broad and the rear residential fabric.
 for(const [name,x,w,d,h,z,stories,kind] of [
  ['rear-wing-west-1',-29,10.2,18,7.2,-19.5,2,'brickTan'],
  ['rear-wing-west-2',-17.2,8.5,15,8.0,-24.0,2,'stone'],
  ['rear-wing-school',0,16.0,21,8.8,-26.0,2,'brick'],
  ['rear-wing-east-1',20.5,6.5,14,8.3,-20.0,2,'brickBrown'],
  ['rear-wing-east-2',32.0,10.5,20,7.6,-27.5,2,'cream'],
  ['rear-wing-east-3',43.0,8.0,13,8.0,-21.5,2,'brickTan']
 ]) {if(Math.abs(x)<17&&z>-85)continue;house({name,x,w,d:d-2,h,z:z-(d-2)/2,stories,background:true,kind});}
 // The school itself.
 const school=house({name:'tech-freire-school',x:0,w:27.0,h:28.0,d:18,z:-8.6,stories:5,bays:6,school:true,kind:'brick'});
 return school;
}
