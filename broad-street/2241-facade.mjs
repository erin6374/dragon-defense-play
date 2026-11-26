/**
 * 2241 N Broad Street: April 2025 Street View-referenced facade, unreleased.
 * Source: user's saved 'Screenshot 2026-11-21 030946.png', whose *imagery*
 * is dated April 2025. Appearance is constrained by visible front elevation,
 * not a measured facade or verified November 2026 current condition.
 * Only municipal ID 1508518 receives these details. The footprint is not edited.
 */
export const ROWHOUSE_2241_GIS_ID='1508518';
export const ROWHOUSE_2241_CANDIDATE='2241-20261123-LIGHTSTONE-STOOP-PASS-01';
const SEGMENTS={
  '1':[1,2], '2':[0,1,6,4,3], '4':[5,6,1,2]
};
function numberOnAwning(box,address,x,y,z,c){
  const glyph=.110,dx=.150,half=.065,total=address.length*dx-dx+glyph;
  const segments=[[-.050,.09,glyph,.021],[half,.045,.022,.09],[half,-.045,.022,.09],[-.050,-.09,glyph,.021],[-half,-.045,.022,.09],[-half,.045,.022,.09],[-.050,0,glyph,.020]];
  for(let i=0;i<address.length;i++)for(const index of SEGMENTS[address[i]]||[]){
    const [ox,oy,w,h]=segments[index];box(x-total/2+i*dx+ox+glyph/2,y+oy,z-.0735,w,h,.17,c);
  }
}
export function detail2241(row,layout,{box,mesh,T}){
  if(String(row?.id)!==ROWHOUSE_2241_GIS_ID)return {applied:false};
  const {profile,openings,groundOpenings,doors,edges}=layout||{};
  if(!profile||openings?.length!==4||groundOpenings?.length!==2||doors?.length!==1||edges?.length!==1)
    throw Error('2241: expected documented 4/2/1 openings on one street-facing GIS edge');
  if(!T?.Shape||!T?.ExtrudeGeometry||!T?.BoxGeometry||typeof mesh!=='function')
    throw Error('2241: real Three.js scene geometry required');
  const edge=edges[0],d=doors[0],z=edge.z+.34;
  if(d.x>=edge.x||d.y-d.h/2<1.0||groundOpenings.some(o=>o.y-o.h/2<1.65))
    throw Error('2241: raised LEFT door and elevated two ground sash required');
  const facade=0xbeb5a7,stone=0xc6bcae,trim=0xa99f92,
        baseStone=0xd3c8b5,mortar=0x9a9082,ink=0x252629,
        shadow=0x48433f,glass=0x50616b,rail=0x292b2b,gold=0xd5c29a;
  const width=edge.width;
  // Face skin lies behind existing generic sash and frame geometry; photo
  // identifies the much LIGHTER elevation, not color of hidden side walls.
  box(edge.x,row.h/2,edge.z+.155,width,row.h,.13,facade);
  // Deeply coursed rusticated ashlar base, visible up to first-floor sills.
  const baseTop=3.98;
  box(edge.x,baseTop/2,edge.z+.248,width-.07,baseTop,.10,baseStone);
  for(let i=1;i<9;i++){
    const h=baseTop*i/9;
    box(edge.x,h,z+.013,width-.07,.023,.065,mortar);
  }
  // Stone blocks/rustication on the Broad elevation, not separate facades.
  for(const x of [edge.left+.11,edge.right-.11]){
    for(let n=0;n<9;n++)box(x,(n+.5)*baseTop/9,z+.018,.27,baseTop/9-.037,.25,trim);
  }
  // Principal base/plinth and surviving basement vents/recesses.
  box(edge.x,.24,z+.015,width-.08,.19,.26,trim);
  const lower=groundOpenings.map(o=>o.x);
  for(const x of lower){
    box(x,.55,z+.06,.95,1.03,.12,shadow);
    box(x,.54,z+.14,.79,.77,.055,0x343737);
    for(let k=-1;k<=1;k++)box(x+k*.21,.54,z+.18,.024,.66,.03,rail);
  }
  // On April 2025 reference, the rear wall is NOT visible; avoid invented
  // side windows and chimneys. Retain the GIS-extruded original mass.
  // Address-anchored Bright MLS facade photograph: dark perimeter casing,
  // pale single-width sash, two visible AC units in the LEFT upper bays.
  // Relief panes cover the old schematic cross bars, with positive overlap.
  for(const o of [...openings,...groundOpenings]){
    const faceZ=edge.z+.46, casing=0x4b4038, sash=0xd1cfc5;
    box(o.x,o.y,faceZ,o.w+.15,o.h+.17,.23,casing);
    box(o.x,o.y,faceZ+.105,o.w-.075,o.h-.10,.085,sash);
    box(o.x,o.y,faceZ+.158,o.w-.19,o.h-.22,.055,glass);
    box(o.x,o.y-.04,faceZ+.19,o.w-.15,.044,.05,sash);
    box(o.x,o.y-o.h/2-.10,faceZ-.04,o.w+.26,.12,.24,trim);
    if(o.floor>0&&o.bay===1){
      // Photograph shows window units in the top portion, with light trim.
      const y=o.y+o.h*.30,acW=o.w*.57;
      box(o.x,y,faceZ+.27,acW,.32,.30,0xd2cfc3);
      box(o.x,y,faceZ+.427,acW-.095,.235,.045,0x777a76);
      for(let i=0;i<5;i++)box(o.x,y-.085+i*.042,faceZ+.454,acW-.11,.011,.025,0xbcbdb5);
    }
  }
  // Stone panel seams follow visible head/sill courses rather than a brick grid.
  for(const o of openings.filter(o=>o.bay===1)){
    for(const y of [o.y-o.h/2-.25,o.y+o.h/2+.28])box(edge.x,y,edge.z+.223,width-.10,.018,.055,mortar);
  }
  for(const y of [4.06,8.36]){
    box(edge.x,y,z+.01,width+.05,.18,.31,trim);
  }
  // Distinctive deep black dentil-and-modillion eave of the LIGHT 2241 house.
  const corniceY=row.h-.44;
  for(const [yy,h,depth,c] of [[row.h-1.04,.19,.39,ink],[row.h-.83,.15,.46,shadow],
        [row.h-.55,.20,.52,ink],[row.h-.30,.20,.61,shadow],
        [row.h-.12,.23,.69,ink]])box(edge.x,yy,z+.02,width+.12,h,depth,c);
  for(let i=0;i<17;i++){
    const x=edge.left+.16+(width-.32)*i/16;
    box(x,corniceY-.16,z+.23,.13,.35,.35,ink);
  }
  // Black segmented, semi-circular photographed canopy marked '2241'.
  const hoodW=Math.min(1.71,2*Math.min(d.x-edge.left,edge.right-d.x)-.08);
  if(hoodW<d.w+.20)throw Error('2241: black entry awning would cross GIS boundary');
  const r=hoodW/2,hoodY=d.y+d.h/2+.18,hoodDepth=.79,hoodZ=d.z+.16,rise=.70;
  const hood=new T.Shape();hood.moveTo(-r,0);hood.lineTo(r,0);
  hood.quadraticCurveTo(r*.98,rise*.86,0,rise);
  hood.quadraticCurveTo(-r*.98,rise*.86,-r,0);hood.closePath();
  mesh(new T.ExtrudeGeometry(hood,{depth:hoodDepth,curveSegments:20,bevelEnabled:false}),ink,d.x,hoodY,hoodZ);
  // Concealed rear fixing connects the awning to the documented stone facade.
  box(d.x,hoodY+.15,hoodZ-.10,hoodW*.95,.18,.45,ink);
  // Thin champagne-colored ribs and white '2241' address near canopy front.
  for(let i=-3;i<=3;i++){
    const u=i/4,lift=rise*(1-u*u);
    box(d.x+u*r,hoodY+lift*.52,hoodZ+hoodDepth-.03,.017,Math.max(.11,lift*.98),.10,trim);
  }
  numberOnAwning(box,'2241',d.x,hoodY+.16,hoodZ+hoodDepth+.076,gold);
  // Blackened entrance, stone surround and photo's raised concrete stoop.
  box(d.x,d.y,d.z+.36,d.w+.22,d.h+.23,.17,trim);
  box(d.x,d.y,d.z+.46,d.w*.85,d.h*.93,.065,ink);
  box(d.x+.03,d.y-.20,d.z+.51,d.w*.71,d.h*.77,.055,0x4d4541);
  box(d.x+.12,d.y+.31,d.z+.46,d.w*.33,.60,.235,glass);
  const steps=7,riseToDoor=d.y-d.h/2,run=.32,stoopW=Math.min(1.43,edge.right-d.x+.12);
  if(stoopW<=1.06)throw Error('2241: stair too narrow');
  const startZ=d.z+.53;
  // Recessed stoop core ties the first stair riser into the existing entry surround.
  box(d.x,riseToDoor/2,d.z+.49,stoopW,riseToDoor,.26,0x968a7d);
  for(let i=0;i<steps;i++){
    const height=riseToDoor*(steps-i)/steps;
    box(d.x,height/2,startZ+(i+.5)*run,stoopW,height,run+.02,0x9b9184);
    box(d.x,height+.015,startZ+(i+.5)*run,stoopW+.03,.044,run+.035,stone);
  }
  for(const side of [-1,1]){
    const x=d.x+side*(stoopW/2-.025);
    for(const i of [0,3,6]){
      const h=riseToDoor*(steps-i)/steps;
      box(x,h+.45,startZ+(i+.5)*run,.055,1.08,.055,rail);
    }
    const a=[x,riseToDoor+1.05,startZ+.15],b=[x,.91,startZ+(steps-.4)*run];
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
    const len=Math.hypot(dx,dy,dz);
    const m=mesh(new T.BoxGeometry(.065,len,.065),rail,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
    if(m?.quaternion&&T.Vector3)m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(dx,dy,dz).normalize());
  }
  return {applied:true,candidate:ROWHOUSE_2241_CANDIDATE,
    buildingId:ROWHOUSE_2241_GIS_ID,sourceDate:'2025-04',
    photo:'Screenshot 2026-11-21 030946.png',
    frontage:{left:edge.left,right:edge.right,width:edge.width,z:edge.z},
    awning:{width:hoodW,depth:hoodDepth,rise,address:'2241'},
    stair:{steps,riseMeters:riseToDoor,approxProjectionMeters:steps*run,rails:2},
    openings:{upper:4,firstFloor:2,entry:1},
    confidence:'photo-visible major features; interpreted dimensions and stone textures'};
}
