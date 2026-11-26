/** Review39 public-facing landscape, separate from Watts/rear work.
 * Undated existing aerial tiles and Apr 2025 street photo 030432.
 * Conservative envelopes, not cadastral boundaries. Planting approximations
 * are confined to the observed open space. No proposed construction.
 */
import * as T from 'three';
export const LANDSCAPE_ZONES=[
 ['school-vacant-frontage','soil',-232.4,-39,-224.2,-21.2],
 ['mitten-campus-green','grass',222,-67,247,-26]
];
const TREE_SITES=[[229,-58,3.1,6.7],[239,-48,3.6,7.4],[230,-35,2.7,6.0]];
export function createPublicLandscape(){
 const root=new T.Group();root.name='Review39 public landscape';
 const materials=new Map(),material=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.98}));return materials.get(c);};
 const meshes={};
 for(const [id,kind,x0,z0,x1,z1] of LANDSCAPE_ZONES){
  const group=new T.Group();group.name=id;root.add(group);
  const add=(geo,c,x,y,z,name)=>{const m=new T.Mesh(geo,material(c));m.position.set(x,y,z);m.name=name;group.add(m);return m;};
  const soilTop=.155;
  add(new T.BoxGeometry(x1-x0,.08,z1-z0),kind==='soil'?0x82735b:0x777f51,(x0+x1)/2,soilTop-.04,(z0+z1)/2,'continuous ground slab');
  // Low irregular color patches, intersecting the base slab. Seeded so
  // screenshots and tests are reproducible without remote textures.
  let seed=kind==='soil'?813:1937;
  const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<(kind==='soil'?24:46);i++){
   const r=.25+rand()*(kind==='soil'?.72:1.7),sx=.65+rand()*.35,sz=.55+rand()*.45;
   const x=x0+r+.12+rand()*(x1-x0-2*r-.24),z=z0+r+.12+rand()*(z1-z0-2*r-.24);
   const colors=kind==='soil'?[0x756f4c,0x938164,0x68704a,0x8b8066]:[0x6c774c,0x85865a,0x6c7049,0x808753];
   const patch=add(new T.CylinderGeometry(r,r,.014,9),colors[i%colors.length],x,soilTop-.002+i*.00018,z,'flush surface variation');
   patch.scale.set(sx,1,sz);
  }
  if(kind==='soil'){
   // Street photo shows sparse scrub and exposed soil, not a manicured lawn.
   for(let i=0;i<18;i++){
    const x=x0+.5+rand()*(x1-x0-1),z=z0+.5+rand()*(z1-z0-1);
    const h=.12+rand()*.18;
    add(new T.ConeGeometry(.07+rand()*.07,h,5),i%2?0x697d45:0x7d8050,x,soilTop+h*.42,z,'low rooted weed');
   }
  }else{
   // Approximate canopy centers from the aerial, separate from existing
   // Peabody walkway and previously modeled Broad sidewalk trees.
   for(const [x,z,r,h] of TREE_SITES){
    add(new T.CylinderGeometry(.65,.65,.035,18),0x776750,x,soilTop+.004,z,'tree bed');
    add(new T.CylinderGeometry(.13,.20,h*.66,12),0x71604a,x,soilTop+h*.32,z,'rooted trunk');
    const crownY=soilTop+h*.67;
    const canopy=add(new T.IcosahedronGeometry(r,2),0x63774b,x,crownY,z,'main crown');canopy.scale.set(.77,.75,.80);
    for(const [dx,dz,dy,c] of [[-.32,.14,.04,0x728153],[.33,.05,.06,0x596f48],[0,-.33,.12,0x687a4d]]){
     const leaf=add(new T.IcosahedronGeometry(r*.67,1),c,x+r*dx,crownY+r*dy,z+r*dz,'crown cluster');leaf.scale.y=.80;
    }
   }
  }
  meshes[id]=group.children.length;
 }
 root.userData={siteCount:LANDSCAPE_ZONES.length,treeCount:TREE_SITES.length,pieceCount:Object.values(meshes).reduce((a,b)=>a+b,0),source:'bundled aerial, unknown acquisition date; 030432 April 2025 vacant lot; approximate modeled surface and vegetation'};
 return root;
}
