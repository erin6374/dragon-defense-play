/** v4.11 environment: geometry only, bounded object count, no runtime texture requests.
 * Site block approximations are artistic reconstructions, NOT parcel-accurate GIS.
 * X axis follows Broad Street; Z increases toward camera. */
export function createCityExtensions({THREE,root,block,material}){
 const host=new THREE.Group();host.name='v411-backstreet-gasstation-street-furniture';root.add(host);
 const asphalt=new THREE.MeshStandardMaterial({color:0x34383c,roughness:.96});
 const paint=new THREE.MeshBasicMaterial({color:0xd3d1c6,depthWrite:false});
 const metal=new THREE.MeshStandardMaterial({color:0x52606a,metalness:.52,roughness:.48});
 const dark=new THREE.MeshStandardMaterial({color:0x2d383e,roughness:.78});
 const cream=new THREE.MeshStandardMaterial({color:0xd2c6af,roughness:.83});
 const rust=new THREE.MeshStandardMaterial({color:0xa84b36,roughness:.82});
 const blue=new THREE.MeshStandardMaterial({color:0x235780,roughness:.42,metalness:.16});
 const window=new THREE.MeshStandardMaterial({color:0x476f82,roughness:.25,metalness:.16});
 const green=new THREE.MeshStandardMaterial({color:0x356a4b,roughness:.87});
 const brick=new THREE.MeshStandardMaterial({color:0x98675a,roughness:.91});
 const glass=new THREE.MeshStandardMaterial({color:0x8cb0b9,roughness:.16,metalness:.15});
 const creamStone=new THREE.MeshStandardMaterial({color:0xb8a99a,roughness:.92});
 const lamp=new THREE.MeshBasicMaterial({color:0xffefbf});
 const cube=new THREE.BoxGeometry(1,1,1);
 const add=(x,y,z,w,h,d,mat)=>block(host,x,y,z,w,h,d,mat);
 // Real-World Philadelphia Street Grid Alignment:
 // N Watts Street is a secondary street running parallel to North Broad Street at z = -34.0.
 // In authentic Philadelphia parcel geography (Google Maps / Philadelphia Land Records):
 // 1. Tech Freire Charter School (2221 N Broad, x in [-16.0, 16.0]) is an authentic deep industrial parcel
 //    extending back to z = -58.4m. N Watts Street DOES NOT cut through Tech Freire!
 //    Watts Street dead-ends cleanly at the school's north property line (x = -16.0) and south line (x = 16.0).
 // 2. PECO Substation at York Street (x in [-159.0, -138.0]) occupies a deep lot; Watts terminates at x = -138.0.
 // 3. The 2100 Block (between Susquehanna x = 62.0 and Diamond x = 253.0) contains deep institutional lots
 //    (ArchWell, McDonald's parking/drive-thru, Berean Presbyterian Church); Watts Street does not exist there.
 // 4. Continuous through-traffic runs along N Park Avenue at z = -66.0, clearing all frontage buildings.
 const wattsSegments = [
   [-550.0, -175.0], // 2400 block (North of York Street)
   [-158.0, -90.0],  // 2300 block (Between PECO south wall and Dauphin Street)
   [-90.0,  -16.0],  // 2200 North block (Dauphin Street down to Tech Freire north property line)
   [ 16.0,   62.0],  // 2200 South block (Tech Freire south property line down to Susquehanna Ave)
   [253.0,  550.0]   // 2000 block (South of Diamond Street)
 ];
 for (const [xMin, xMax] of wattsSegments) {
   const segW = xMax - xMin;
   const segX = (xMin + xMax) * 0.5;
   // Roadway: width = 7.0, spans z in [-37.5, -30.5]
   add(segX, -.38, -34.0, segW, .16, 7.0, asphalt);
   // East sidewalk (facing Broad parcel rears): z = -29.0, width = 3.0
   add(segX, -.23, -29.0, segW, .20, 3.0, creamStone);
   // West sidewalk (facing depth rowhouses): z = -39.0, width = 3.0
   add(segX, -.23, -39.0, segW, .20, 3.0, creamStone);
 }
 // Dashed centerlines along active Watts Street roadway segments
 for (const [xMin, xMax] of wattsSegments) {
   for (let x = xMin + 4; x <= xMax - 4; x += 9) {
     add(x, -.285, -34.0, 3.2, .015, .10, paint);
   }
 }
 // Clean dead-end curb caps and safety bollards at Tech Freire property lines (x = -16.0 and x = 16.0)
 for (const endX of [-16.0, 16.0]) {
   // Transverse curb barrier cap across Watts Street roadway
   add(endX, -.23, -34.0, 0.6, .32, 7.0, creamStone);
   // Trio of safety bollards preventing vehicles from driving into school lot
   for (const bz of [-36.2, -34.0, -31.8]) {
     add(endX + (endX < 0 ? -0.4 : 0.4), .35, bz, .22, .75, .22, metal);
     add(endX + (endX < 0 ? -0.4 : 0.4), .75, bz, .26, .10, .26, rust);
   }
 }
 // Dead-end cap at PECO south lot line (x = -138.0)
 add(-138.0, -.23, -34.0, 0.6, .32, 7.0, creamStone);
 for (const bz of [-36.2, -34.0, -31.8]) add(-138.4, .35, bz, .22, .75, .22, metal);

 // Side-street access curb cuts at York (x = -167), Dauphin (x = -98), and Susquehanna (x = 70)
 // connecting Broad Street to N Watts Street (spanning z in [-28, -8])
 for (const x of [-167, -98, 70]) {
   for (const z of [-28, -22, -16]) add(x, -.33, z, 8.4, .05, 4.0, asphalt);
 }
 // Previous speculative service-station placeholder removed because it overlapped
 // the real masonry block documented in the user's Street View references.
 const gx=null;
 // Streetscape: mailbox, wire wastebasket, bollards, bus stop, hydrant,
 // planted tree pits and pedestrian-facing lamp arms.
 const utility=[-87,-65,-43,-20,22,45,66,84];
 for(const x of utility){if(x>-75&&x<-62)continue;
  add(x,.9,9.5,.67,1.4,.55,blue);add(x,1.61,9.5,.72,.14,.60,dark); // USPS-style blue box, no logo
  add(x+1.9,.53,9.3,.72,1.05,.67,metal);add(x+1.9,1.10,9.3,.80,.11,.72,dark);
  for(const dx of [-.6,.6])add(x+dx,.43,9.1,.07,.8,.08,dark);
  add(x-2.5,.5,10.5,.26,1,.26,rust);add(x-2.5,1.05,10.5,.65,.22,.37,rust);
  add(x+3,-.15,10.1,1.7,.16,1.0,metal);add(x+3,.37,10.1,1.4,.79,.80,green);
  add(x-3,3.35,9.5,.20,6.7,.20,metal);add(x-2.1,6.52,9.5,2.2,.14,.16,metal);
  add(x-1.1,6.4,9.5,.70,.24,.45,lamp);
 }
 // Protective curb rail and benches near the school's main entrance.
 for(const x of [-13,13]){add(x,.52,10.2,2.4,.14,.65,metal);add(x,.32,10.2,2.4,.48,.09,creamStone);}
 for(const x of [-46,46]){
  add(x,.52,9.6,3.4,.20,1.0,creamStone);add(x,.80,9.15,3.4,.65,.16,metal);
  add(x-1.35,.22,9.6,.12,.55,.75,metal);add(x+1.35,.22,9.6,.12,.55,.75,metal);
 }
 return {group:host,propsEstimate:host.children.length,backStreetZ:-34.0,gasStationX:gx};
}