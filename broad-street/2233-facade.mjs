/**
 * 2233 N Broad: photo-constrained, unreleased Blues Babe Foundation frontage.
 * Evidence: user Library Screenshot 2026-11-21 030932.png, underlying Google
 * Street View April 2025. Verified four UPPER sash, one closed ground shutter;
 * door concealed/unknown (never manufacture a public-facing entrance).
 * Colors, depths, masonry aging and cornice lengths are illustrative estimates.
 * This file NEVER changes Philadelphia's GIS footprint, height or street grid.
 */
export const FACADE_2233_ID='1525758';
export const FACADE_2233_CANDIDATE='2233-20261123-NEIGHBOR-CLEARANCE-PASS-07';
export const SIGN_2233={name:'Blues Babe Foundation',address:'2233 N. Broad St.',phone:'267-324-5600',source:'April 2025 street-view photograph'};

/** Browser-only canvas artwork, rendered into a real plane on the shared 3D scene.
 * Artwork is a recognizable reconstruction, NOT an original sign asset or
 * exact reproduction of its custom typeface/flower emblem. */
function addSignArt(T,mesh,edge,x,y,z,w,h){
 if(typeof document==='undefined'||!document.createElement||!T?.CanvasTexture||!T?.PlaneGeometry||!T?.MeshBasicMaterial||typeof mesh!=='function')return false;
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=256;
 const c=canvas.getContext('2d');if(!c)return false;
 c.fillStyle='#1259b9';c.fillRect(0,0,canvas.width,canvas.height);
 // Eight overlapping outline petals evoke the photograph's white flower.
 const cx=158,cy=111;
 c.strokeStyle='#f7f8ff';c.lineWidth=7;c.lineJoin='round';
 for(let i=0;i<8;i++){
  c.save();c.translate(cx,cy);c.rotate((Math.PI*2*i)/8);
  c.beginPath();c.moveTo(0,-10);c.bezierCurveTo(-24,-30,-24,-80,0,-92);
  c.bezierCurveTo(24,-80,24,-30,0,-10);c.stroke();c.restore();
 }
 c.beginPath();c.arc(cx,cy,15,0,Math.PI*2);c.stroke();
 c.fillStyle='#fff';c.textBaseline='middle';
 c.font='300 184px Georgia, serif';c.fillText('blues babe',310,110,1120);
 c.font='30px Arial, sans-serif';c.letterSpacing='14px';c.fillText('F O U N D A T I O N',316,178);
 c.letterSpacing='0px';c.font='bold 30px Arial, sans-serif';
 c.textAlign='left';c.fillText(SIGN_2233.address,26,230);
 c.textAlign='right';c.fillText(SIGN_2233.phone,1510,230);
 const tex=new T.CanvasTexture(canvas);if(T.SRGBColorSpace)tex.colorSpace=T.SRGBColorSpace;
 const panel=mesh(new T.PlaneGeometry(w,h),0xffffff,x,y,z);
 if(!panel)return false;
 panel.material=new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,toneMapped:false});
 panel.userData={...panel.userData,buildingId:FACADE_2233_ID,role:'dated-2025-storefront-sign',signText:SIGN_2233.name};
 return true;
}

export function detail2233(row,layout,{box,mesh,T}={}){
 if(String(row?.id)!==FACADE_2233_ID)return {applied:false};
 const {profile:p,openings,groundOpenings,doors,edges}=layout||{};
 if(p?.ground!=='shutter'||openings?.length!==4||groundOpenings?.length||doors?.length||!edges?.length)
  throw Error('2233: photographed shutter / 4 upper sashes / unknown entry inventory drift');
 const main=edges.reduce((a,b)=>a.width>=b.width?a:b),front=edges.indexOf(main);
 const visible=openings.filter(o=>o.edge===front);
 if(visible.length!==4||main.width<4.5)throw Error('2233: source frontage cannot contain two photo-visible upper sash bays');
 const z=main.z+.16, W=main.width, brown=0x9e7b67,stone=0xb5a38f,
  joint=0x886e62,molding=0x8c6655,light=0xc8c5b5,shadow=0x423e3c,
  sash=0xdfe4dc,ink=0x383e40,blue=0x155cbe;
 const parts=[];
 const put=(tag,x,y,zz,w,h,d,color)=>{if(![x,y,zz,w,h,d].every(Number.isFinite)||w<=0||h<=0||d<=0)throw Error('2233 invalid '+tag);
  box(x,y,zz,w,h,d,color);parts.push({tag,x,y,z:zz,w,h,d});};
 // Back-overlap the source footprint with the facade skin: the old +0.0825 m
 // air gap meant the entire ornamental frontage floated ahead of the GIS wall.
 // Preserve the visible front surface at +0.17 m, with a hidden wall overlap.
 put('warm-brownstone-face',main.x,row.h/2,main.z+.045,W-.045,row.h,.25,brown);
 for(let i=1;i<=16;i++){
  const yy=4.30+(row.h-5.1)*i/17;
  put('masonry-course',main.x,yy,z+.007,W-.12,.019,.047,joint);
  if(i%2===0){
   for(let j=1;j<4;j++)put('masonry-joint',main.left+(W-.17)*j/4,yy+.15,z+.012,.016,.21,.046,joint);
  }
 }
 // The April 2025 photo shows a pronounced belt separating upper stories.
 for(const y of [6.80]){
  put('belting-base',main.x,y,z+.085,W-.03,.21,.22,molding);
  put('belting-cap',main.x,y+.13,z+.105,W-.03,.085,.27,stone);
 }
 // Openings: two per floor. The source image shows predominantly WHITE
 // multi-pane upper sash, not the generic black-centered viewer windows.
 for(const level of [1,2]){
  const arr=visible.filter(o=>o.floor===level);
  if(arr.length!==2)throw Error('2233: missing two sash apertures on level '+level);
  for(const o of arr){
   put('projecting-window-head',o.x,o.y+o.h*.59,z+.17,o.w*1.44,.19,.37,stone);
   put('lintel-shadow',o.x,o.y+o.h*.68,z+.20,o.w*1.17,.063,.39,joint);
   put('stone-sill',o.x,o.y-o.h*.58,z+.225,o.w*1.47,.16,.49,light);
   for(const side of [-1,1]){
    put('stone-jamb',o.x+side*(o.w/2+.055),o.y,z+.18,.10,o.h*.99,.40,stone);
    put('lintel-drop',o.x+side*(o.w/2+.23),o.y+o.h*.61,z+.16,.10,.28,.20,molding);
   }
   // White sash visible faces stay fixed, but extend BACK to the shared window
 // frame and brownstone instead of hovering several centimetres in air.
 // The white panes sit IN FRONT OF the shared black sash so its original
   // dark horizontal mullion cannot counterfeit a different opening count.
   const glassZ=o.z+.39;
   for(const side of [-1,1])put('white-window-side',o.x+side*o.w*.47,o.y,glassZ-.17,.052,o.h*.98,.42,sash);
   put('upper-lower-sash',o.x,o.y-.09,glassZ-.1625,o.w*.94,.06,.435,sash);
   for(const xx of [-.16,.16])put('white-pane-muntin',o.x+xx,o.y+o.h*.21,glassZ-.1585,.028,o.h*.52,.443,sash);
   for(const dy of [.11,.36])put('upper-pane-crossbar',o.x,o.y+dy,glassZ-.1585,o.w*.91,.026,.443,sash);
  }
 }
 // All horizontal cornice courses overlap vertically by at least 10 mm;
 // the earlier courses had 15-40 mm open-air seams between them.
 // Light stone high parapet / deeply layered dentilled historic cornice.
 // Keep cornice layers and end caps strictly inside the GIS side boundaries;
 // Pass06 widened them beyond the party wall, colliding with 2231 roof trim.
 put('cornice-underside',main.x,row.h-1.07,z+.08,W-.03,.19,.32,shadow);
 put('cornice-frieze',main.x,row.h-.91,z+.12,W-.03,.25,.37,stone);
 put('cornice-architrave',main.x,row.h-.70,z+.17,W-.03,.26,.45,light);
 put('cornice-molding',main.x,row.h-.51,z+.20,W-.03,.29,.49,joint);
 put('cornice-cap',main.x,row.h-.28,z+.23,W-.03,.19,.55,light);
 put('cornice-termination',main.x,row.h-.09,z+.20,W-.03,.21,.58,stone);
 for(let j=0;j<27;j++){
  const x=main.left+.17+(W-.34)*j/26;
  put('cornice-dentil',x,row.h-.73,z+.37,.086,.19,.21,shadow);
 }
 for(const side of [-1,1])put('cornice-end-cap',main.x+side*(W/2-.08),row.h-.47,z+.22,.12,.94,.52,light);
 // The photographed lower storefront has off-white glazed tiles, three
 // wall-mounted square lamps and a silver rolling security grille.
 put('ground-tile-backing',main.x,1.76,main.z+.045,W-.04,3.08,.25,0xd9d5c9);
 for(let k=1;k<5;k++)put('tile-joint-row',main.x,k*.60,main.z+.165,W-.08,.018,.020,0xb8b4a9);
 for(let j=1;j<=12;j++)put('tile-joint-column',main.left+(W-.08)*j/13,2.43,main.z+.165,.019,1.44,.020,0xb8b4a9);
 // Sign sits above ground shutter and below the upper sash bases.
 const signW=W-.12,signH=1.28,signY=3.43,signZ=main.z+.51;
 if(signY+signH/2>=Math.min(...visible.map(o=>o.y-o.h/2)))throw Error('2233 sign would obscure upper sash');
 put('sign-metal-cassette',main.x,signY,main.z+.315,signW,signH,.49,0x224369);
 put('sign-blue-ground',main.x,signY,signZ,signW,signH,.10,blue);
 put('sign-blue-top',main.x,signY+signH/2+.03,signZ-.02,signW,.07,.25,0x144489);
 put('sign-bottom-shadow',main.x,signY-signH/2-.035,signZ-.035,signW,.08,.30,0x20334a);
 const canvasSignRendered=addSignArt(T,mesh,main,main.x,signY,signZ+.051,signW-.035,signH-.035);
 // Connect the steel shutter header to its hood, slats to both side guides,
 // and the continuous roll-up sheet to the existing shared shutter volume.
 // Restore the large metal roll-up grille and its unequal slats at street
 // level. Do not invent an entrance behind the opaque shutter.
 const shutterLeft=main.left+W*.055,shutterRight=main.right-W*.055,
  shutterW=shutterRight-shutterLeft,shutterX=(shutterRight+shutterLeft)/2;
 put('shutter-gap-tile',shutterX,2.59,z+.46,shutterW,.32,.065,0xd6d2c6);
 put('steel-shutter-hood',shutterX,2.36,z+.43,shutterW+.16,.20,.33,0x555d60);
 put('steel-shutter-header',shutterX,2.16,z+.43,shutterW+.10,.22,.28,0x8c9390);
 put('steel-shutter-sheet',shutterX,1.20,main.z+.455,shutterW+.025,2.25,.145,0x7d8584);
 for(const side of [-1,1])put('shutter-side-guide',shutterX+side*(shutterW/2+.055),1.19,z+.39,.11,2.34,.23,0x545b5b);
 for(let j=1;j<25;j++)put('shutter-slat',shutterX,.14+j*.086,z+.39,shutterW+.025,.022,.055,j%3===0?0x46565a:0xb7c0bf);
 put('threshold',shutterX,.12,z+.39,shutterW,.13,.28,0x807e78);
 for(const x of [main.left+W*.17,main.x,main.right-W*.17]){
  put('exterior-wall-light',x,2.73,z+.47,.22,.34,.22,0x7e7e75);
  put('light-face',x,2.70,z+.59,.14,.20,.028,0xe1d8b9);
 }
 // The rail spans reach the two end posts; posts penetrate sidewalk by 2 cm.
 // Street fixture: the source shows a low blue crowd-control railing in
 // front of the shutter. Surface-only fixture, not a second entrance.
 const railZ=main.z+1.05,railY=.57,railWidth=Math.min(W*.76,W-.15);
 for(const xx of [main.left+W*.14,main.x,main.right-W*.14])put('low-front-rail-post',xx,railY,railZ,.055,1.20,.057,0x2b526d);
 put('low-front-rail-top',main.x,1.06,railZ,railWidth,.06,.06,0x2b526d);
 put('low-front-rail-mid',main.x,.54,railZ,railWidth,.05,.06,0x2b526d);
 return {applied:true,buildingId:FACADE_2233_ID,candidate:FACADE_2233_CANDIDATE,
  upperOpeningCount:4,groundWindowCount:0,entranceCount:null,sign: {...SIGN_2233,width:signW,height:signH,canvasSignRendered},
  frontage:{left:main.left,right:main.right,width:main.width,groundDepth:main.z},
  details:parts,sourceDate:'2025-04',photo:'Screenshot 2026-11-21 030932.png',
  quality:'photo-constrained facade and sign; non-survey dimensions; actual WebGL and whole-scene acceptance separately required'};
}
