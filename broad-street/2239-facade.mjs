/**
 * 2239 N Broad Street · observed-frontage refinement · UNRELEASED PASS 02.
 * Evidence: user's Google Street View screenshot saved 2026-11-21 03:09:46,
 * with underlying imagery labeled April 2025. Brownstone is between the
 * light-stone 2241 facade and the taller contemporary 2235-37 facade.
 * The screenshot supports the raised stoop, black curved 2239 awning,
 * basement level, ornamented parapet, banding and paired sash windows.
 * Depths, ironwork measurements and precise stone profiles remain interpreted.
 * Never edit city footprint polygons or draw this overlay for other GIS IDs.
 */
export const ROWHOUSE_2239_GIS_ID = '1536711';
export const ROWHOUSE_2239_CANDIDATE = '2239-20261123-REFERENCE-FACADE-PASS-02';

const SEGMENTS = {
  '2':[0,1,6,4,3], '3':[0,1,6,2,3], '9':[0,1,2,5,6,3]
};
function addressDigits(box, x, y, z, color) {
  // Tiny, geometry-based stylized digits; legible from close street view.
  const w=.113,h=.20,dx=.136;
  const pairs=[
    [-.056,.105,w,.018], [.064,.052,.018,.105],
    [.064,-.052,.018,.105], [-.056,-.105,w,.018],
    [-.064,-.052,.018,.105], [-.064,.052,.018,.105],
    [-.056,0,w,.018]
  ];
  const digits='2239',total=digits.length*dx-dx+w;
  for(let i=0;i<digits.length;i++) for(const s of SEGMENTS[digits[i]]){
    const [ox,oy,sw,sh]=pairs[s];
    box(x-total/2+i*dx+ox+w/2, y+oy, z, sw,sh,.075,color);
  }
}

export function detail2239(row,layout,{box,mesh,T}) {
  if(String(row?.id)!==ROWHOUSE_2239_GIS_ID)return {applied:false};
  const {openings,groundOpenings,doors,edges,profile}=layout||{};
  if(!profile||openings?.length!==4||groundOpenings?.length!==2||doors?.length!==1||edges?.length!==1)
    throw Error('2239: expected historical source openings 4/2/1 on one GIS front');
  if(!T?.Shape||!T?.ExtrudeGeometry||!T?.BoxGeometry||typeof mesh!=='function')
    throw Error('2239: real Three.js geometry required for canopy and ironwork');
  const edge=edges[0],d=doors[0];
  if(!(d.y>2.0&&d.y-d.h/2>=1.0&&Math.min(...groundOpenings.map(o=>o.y-o.h/2))>1.5))
    throw Error('2239: raised first floor regressed to pavement-level template');
  const masonry=0x86675b,trim=0x9d8376,stone=0xa99282,deepStone=0x755950,
    shadow=0x292a28,frame=0x4b3a33,rail=0x33312e,glass=0x4a5960,gold=0xb8a582;
  const z=edge.z+.58,w=edge.width;
  // The municipal footprint has a 4.42m principal front edge PLUS short
  // nearly collinear returns (1.16m left and .21m right). The previous
  // pass decorated only 4.42m, leaving a glaring naked cornice on the left.
  // Keep opening counts on the principal edge, but run architectural bands
  // across the FULL actual front polygon, without moving any city vertices.
  const streetVertices=(row.polys||[]).flatMap(poly=>poly[0]||[])
    .filter(pt=>Math.abs(pt[1]-row.front)<.12);
  if(streetVertices.length<4)throw Error('2239 full street-facing polygon became unavailable');
  const fullLeft=Math.min(...streetVertices.map(p=>p[0]));
  const fullRight=Math.max(...streetVertices.map(p=>p[0]));
  const fullCenter=(fullLeft+fullRight)/2,fullWidth=fullRight-fullLeft;
  if(fullWidth<edge.width||fullWidth>6.2)throw Error('2239 complete frontage outside saved GIS');
  // A continuous recessed masonry backing closes the daylight gaps between
  // mid-level string courses without altering upper-story window placement.
  box(fullCenter,7.75,z-.41,fullWidth+.01,.82,.57,deepStone);
  // Horizontal ashlar-level articulation visible across the April 2025 front.
  // The original GIS-extruded wall remains the sole structural mass.
  for(const [y,height,thickness,color] of [
    [1.34,.19,.37,deepStone],[3.95,.20,.36,trim],
    [7.52,.17,.28,deepStone],[row.h-.80,.19,.34,trim],
    [row.h-.53,.25,.49,shadow],[row.h-.24,.18,.56,deepStone],
    [row.h-.09,.15,.61,shadow]]){
      box(fullCenter,y,z-.15,fullWidth+.03,height,thickness,color);
    }
  // Bracketed, deeply shadowed cornice; depth is a modest interpreted relief.
  for(let i=0;i<13;i++){
    const x=fullLeft+.23+(i/12)*(fullWidth-.46);
    box(x,row.h-.62,z+.03,.105,.24,.36,deepStone);
  }
  for(const [y,c] of [[7.72,deepStone],[8.04,trim]])
    box(fullCenter,y,z-.25,fullWidth-.10,.07,.16,c);
  // Upper windows. The shared source renderer owns their four counted panes;
  // these merely give each opening photographed recessed stonework/headers.
  for(const o of openings){
    box(o.x,o.y+o.h/2+.20,z-.20,o.w+.36,.24,.38,stone);
    box(o.x,o.y-o.h/2-.10,z-.10,o.w+.34,.17,.43,deepStone);
    for(const side of [-1,1])
      box(o.x+side*(o.w/2+.095),o.y,z-.21,.11,o.h+.18,.27,trim);
    box(o.x,o.y-.03,z+.05,o.w,.035,.09,frame);
    // Narrow inner mullions remain one architectural sash opening.
    box(o.x+.12,o.y,z+.06,.033,o.h*.92,.06,frame);
  }
  // Raised first floor. Broadly comparable window scale and recessed grilles.
  for(const o of groundOpenings){
    box(o.x,o.y+o.h/2+.16,z-.21,o.w+.31,.22,.36,stone);
    box(o.x,o.y-o.h/2-.115,z-.13,o.w+.32,.20,.36,deepStone);
    for(const side of [-1,1])box(o.x+side*(o.w/2+.06),o.y,z-.18,.09,o.h+.11,.23,trim);
    for(let k=0;k<3;k++)box(o.x+(k-1)*o.w*.26,o.y,z+.07,.023,o.h*.92,.055,rail);
    box(o.x,o.y+.03,z+.07,o.w,.038,.055,rail);
  }
  // One street-facing basement area is visibly below the raised first floor.
  // Photographic obstructions obscure the exact basement opening inventory;
  // this is deliberately uncounted as a principal first-floor window.
  const boardedX=edge.left+w*.27;
  const boardedW=Math.min(1.55,w*.37);
  box(boardedX,.59,z-.29,boardedW,1.16,.78,0x684b3d);
  for(let i=0;i<8;i++)box(boardedX-boardedW*.41+i*boardedW*.115,.59,z+.11,.029,1.06,.025,0x48352e);
  const basementW=Math.min(.80,w*.22);
  const basementX=edge.left+w*.56;
  box(basementX,.57,z+.04,basementW,.76,.11,deepStone);
  box(basementX,.57,z+.12,basementW*.86,.56,.07,shadow);
  for(let i=0;i<5;i++)box(basementX-basementW*.32+i*basementW*.16,.57,z+.145,.021,.48,.10,frame);
  // Raised door, trim, dark inset and photographed lighter central door panel.
  box(d.x,d.y,d.z+.35,d.w+.19,d.h+.19,.17,stone);
  box(d.x,d.y,d.z+.46,d.w*.86,d.h*.93,.07,shadow);
  box(d.x+.06,d.y-.12,d.z+.51,d.w*.57,d.h*.80,.045,0xd3d0c5);
  box(d.x+.14,d.y+.28,d.z+.535,d.w*.31,.51,.09,glass);
  box(d.x-.20,d.y-.15,d.z+.535,.045,.085,.065,gold);
  // PHOTO EVIDENCE: 2239 has a raised stoop with dark side railings and a
  // curved metal awning bearing the address. Generic 2239's ground-level door
  // and flat arch were incorrect. Approximate stair count and dimensions only.
  const steps=7,stepRise=(d.y-d.h/2)/steps,stepRun=.31,stepStartZ=d.z+.48;
  const stoopWidth=Math.min(1.30,edge.right-d.x+.48);
  for(let i=0;i<steps;i++){
    const height=(steps-i)*stepRise;
    const centerZ=stepStartZ+(i+.5)*stepRun;
    box(d.x,height/2,centerZ,stoopWidth,height,stepRun+.015,0x84776c);
    box(d.x,height+.021,centerZ,stoopWidth+.025,.043,stepRun+.02,stone);
  }
  // Two continuous sloping rails with three vertical posts each.
  for(const side of [-1,1]){
    const x=d.x+side*(stoopWidth/2+.055);
    for(const i of [0,3,6]){
      const ht=(steps-i)*stepRise;
      box(x,ht+.52,stepStartZ+(i+.5)*stepRun,.06,1.04,.065,rail);
    }
    const start=[x,d.y-d.h/2+1.02,stepStartZ+.17];
    const end=[x,.93,stepStartZ+(steps-.35)*stepRun];
    const dx=end[0]-start[0],dy=end[1]-start[1],dz=end[2]-start[2];
    const len=Math.hypot(dx,dy,dz);
    const bar=mesh(new T.BoxGeometry(.067,len,.067),rail,(start[0]+end[0])/2,(start[1]+end[1])/2,(start[2]+end[2])/2);
    if(bar?.quaternion&&T.Vector3) bar.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(dx,dy,dz).normalize());
  }
  const hoodWidth=Math.min(1.49,2*Math.min(d.x-edge.left,edge.right-d.x)-.06);
  if(hoodWidth<d.w+.20)throw Error('2239 awning cannot fit on GIS front');
  const radius=hoodWidth/2,rise=.58,springY=d.y+d.h/2+.18,hoodZ=d.z+.25,hoodDepth=.87;
  const outline=new T.Shape();
  outline.moveTo(-radius,0);outline.lineTo(radius,0);
  outline.quadraticCurveTo(radius*.98,rise*.74,0,rise);
  outline.quadraticCurveTo(-radius*.98,rise*.74,-radius,0);outline.closePath();
  mesh(new T.ExtrudeGeometry(outline,{depth:hoodDepth,steps:1,curveSegments:20,bevelEnabled:false}),shadow,d.x,springY,hoodZ);
  box(d.x,springY+.04,hoodZ+hoodDepth,hoodWidth-.06,.075,.07,deepStone);
  // The light ribs and gold address reproduce visual cues, not measured metalwork.
  for(const u of [-.72,-.42,-.13,.13,.42,.72]){
    const lift=rise*(1-u*u);
    box(d.x+u*radius,springY+lift*.51,hoodZ+hoodDepth+.045,.025,Math.max(.14,lift),.035,deepStone);
  }
  // A recessed continuous address plaque anchors every gold character to
  // the physical canopy rather than leaving isolated floating strokes.
  box(d.x,springY+.22,hoodZ+hoodDepth-.010,hoodWidth-.08,.39,.096,shadow);
  addressDigits(box,d.x,springY+.25,hoodZ+hoodDepth+.058,gold);
  return {
    applied:true,id:ROWHOUSE_2239_GIS_ID,candidate:ROWHOUSE_2239_CANDIDATE,
    canopy:{x:d.x,y:springY,z:hoodZ,width:hoodWidth,rise,depth:hoodDepth,address:'2239'},
    stoop:{stepCount:steps,streetRiseMeters:steps*stepRise,approxProjectionMeters:steps*stepRun,railings:2},
    frontage:{left:edge.left,right:edge.right,z:edge.z,fullLeft,fullRight,fullWidth},
    openings:{upper:4,ground:2,doors:1},
    observation:{sourceDate:'2025-04',sourceFile:'Screenshot 2026-11-21 030946.png',photoBundled:false},
    evidenceStatus:'photo-informed; individual dimensions/projection not surveyed'
  };
}
