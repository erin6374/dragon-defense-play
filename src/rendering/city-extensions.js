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
 // Back street immediately behind the school and its neighbors: rowhouses were
 // deliberately moved back to leave this roadway visible (see neighborhood.js).
 add(0,-.38,-40,200,.16,9,asphalt);
 add(0,-.23,-33.8,200,.20,2.8,creamStone);
 add(0,-.23,-46.2,200,.20,2.8,creamStone);
 for(let x=-90;x<=90;x+=9){add(x,-.285,-40,3.2,.015,.10,paint);}
 // Side-street access curb cut at each intersection with Broad.
 for(const x of [-53,53])for(const z of [-28,-19])add(x,-.33,z,7.4,.05,1.8,asphalt);
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
 return {group:host,propsEstimate:host.children.length,backStreetZ:-40,gasStationX:gx};
}