// Review 14 — address-specific facade renderings, preserving saved GIS outlines.
// Window layouts and colors are illustrative unless a source-specific note says otherwise.
// No source polygons or street centerlines are modified here.
export const REVIEW14 = Object.freeze(
{
  "1001197": {
    "style": "masonry",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2205 N BROAD ST"
  },
  "1007134": {
    "style": "warmstone",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2217 N BROAD ST"
  },
  "1007133": {
    "style": "warmstone",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2219 N BROAD ST"
  },
  "1007132": {
    "style": "warmstone",
    "ground": "institutional",
    "confidence": "address-known",
    "address": "2227 N BROAD ST"
  },
  "1003388": {
    "style": "brownstone",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2231 N BROAD ST"
  },
  "1525758": {
    "style": "brownstone",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2233 N BROAD ST"
  },
  "1547386": {
    "style": "contemporary-brick",
    "ground": "retail",
    "confidence": "photo-listing",
    "address": "2235-37 N BROAD ST"
  },
  "1536711": {
    "style": "brownstone",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2239 N BROAD ST"
  },
  "1508518": {
    "style": "brownstone",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2241 N BROAD ST"
  },
  "1519830": {
    "style": "masonry",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2245 N BROAD ST"
  },
  "1536712": {
    "style": "redbrick",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2247 N BROAD ST"
  },
  "1531017": {
    "style": "redbrick",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2249 N BROAD ST"
  },
  "1536713": {
    "style": "redbrick",
    "ground": "glass-retail",
    "confidence": "photo-confirmed",
    "address": "2251 N BROAD ST"
  },
  "1542243": {
    "style": "redbrick",
    "ground": "residential",
    "confidence": "address-known",
    "address": "2253 N BROAD ST"
  },
  "3000691": {
    "style": "redbrick",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2255 N BROAD ST"
  },
  "1050173": {
    "style": "historic-stone",
    "ground": "historic-corner",
    "confidence": "historic-nomination",
    "address": "2301-03 N BROAD ST"
  },
  "1050168": {
    "style": "historic-brownstone",
    "ground": "historic-pair",
    "confidence": "historic-nomination",
    "address": "2305-07 N BROAD ST"
  },
  "1050169": {
    "style": "masonry",
    "ground": "residential",
    "confidence": "municipal-only",
    "address": "2315-17 N BROAD ST"
  },
  "1079073": {
    "style": "masonry",
    "ground": "setback",
    "confidence": "municipal-only",
    "address": "2319 N BROAD ST"
  },
  "1050167": {
    "style": "masonry",
    "ground": "setback",
    "confidence": "municipal-only",
    "address": "2321 N BROAD ST"
  }
}
);
export const REVIEW14_IDS=Object.freeze(Object.keys(REVIEW14));
export function review14Profile(row){return REVIEW14[String(row?.id)]||null;}
export function facadeEdges(row,tolerance=1.6){
 if(!row?.polys||!Number.isFinite(row.front))return [];
 const edges=[];
 for(const poly of row.polys)for(const ring of poly.slice(0,1))for(let i=1;i<ring.length;i++){
  const [x,z]=ring[i-1],[xx,zz]=ring[i],len=Math.hypot(xx-x,zz-z);
  if(len<1.65||Math.abs(xx-x)<1.5||Math.abs(zz-z)>len*.24)continue;
  // No facade painted onto the back of a deep parcel or internal courtyard.
  if(Math.abs(z-row.front)>tolerance||Math.abs(zz-row.front)>tolerance)continue;
  edges.push({x:(x+xx)/2,z:(z+zz)/2,width:Math.abs(xx-x),length:len,left:Math.min(x,xx),right:Math.max(x,xx)});
 }
 return edges.sort((a,b)=>a.left-b.left);
}
export function recommendedBays(width){return Math.max(1,Math.min(6,Math.floor((width+.35)/2.15)));}
// Five trapezoid panels plus a flat cap make a true mansard silhouette,
// rather than adding a gabled hip roof to a full-height rectangular block.
function mansardRoof(row,base,height,{mesh,T}){
 const inset=Math.min(2.4,row.w*.20,row.d*.12);
 const x0=row.x-row.w/2,x1=row.x+row.w/2,z0=row.z-row.d/2,z1=row.z+row.d/2;
 const b=[[x0,base,z0],[x1,base,z0],[x1,base,z1],[x0,base,z1]];
 const t=[[x0+inset,height,z0+inset],[x1-inset,height,z0+inset],
  [x1-inset,height,z1-inset],[x0+inset,height,z1-inset]];
 const vertices=[];
 function face(a,b,c,d){vertices.push(...a,...b,...c,...a,...c,...d)}
 for(let i=0;i<4;i++)face(b[i],b[(i+1)%4],t[(i+1)%4],t[i]);
 face(t[0],t[1],t[2],t[3]);
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geometry.computeVertexNormals();
 const roof=mesh(geometry,0x4d5055);roof.material.side=T.DoubleSide;
}
export function renderReviewedFrontage(row,{box,block,hipRoof,mesh,T}){
 const profile=review14Profile(row);if(!profile)return false;
 const colors={masonry:0xa6a398,warmstone:0xb7ac98,brownstone:0x977d72,
  'contemporary-brick':0xa18778,redbrick:0x875f56,'historic-stone':0xb4a99f,
  'historic-brownstone':0x8c6052};
 const wall=colors[profile.style]||0xa8a49b,trim=0xd0c6b3,frame=0x434d54,glass=0x546e78;
 const historic=profile.ground.startsWith('historic');
 const wallHeight=historic?row.h-3.10:row.h;
 const floorCount=historic?3:Math.max(1,Math.min(6,Math.round(row.h/3.35)));
 const floorHeight=wallHeight/floorCount;
 // The exact saved city polygon (including courtyards) remains the 3D wall mass.
 for(const poly of row.polys){block(poly,wallHeight,wall);if(!historic)block(poly,.16,0x575552,row.h)}
 if(historic)mansardRoof(row,wallHeight,row.h,{mesh,T});
 const edges=facadeEdges(row);
 for(const edge of edges){
  const bays=recommendedBays(edge.width),bayWidth=edge.width/bays,face=edge.z+.16;
  // Discrete ground-level architectural type, never a copied/claimed photo facade.
  const storefront=profile.ground==='glass-retail'||profile.ground==='retail';
  if(storefront){
   const shopH=Math.min(3.45,row.h*.26);
   box(edge.x,shopH*.53,face+.14,edge.width*.91,shopH*.79,.19,frame);
   const count=Math.max(2,bays*2);
   for(let j=0;j<count;j++){
    const px=edge.left+(j+.5)*edge.width/count;
    box(px,shopH*.53,face+.29,edge.width/count*.79,shopH*.70,.07,glass);
   }
   // A ground-level opening is documented, but door counts/positions remain approximate.
   if(profile.ground==='glass-retail'){
    box(edge.left+edge.width*.23,shopH*.43,face+.37,.08,shopH*.70,.11,trim);
    box(edge.left+edge.width*.23+.28,shopH*.55,face+.41,.04,.14,.06,trim);
   }
   box(edge.x,shopH+.06,face+.23,edge.width,.24,.40,0x5c5d58);
  }
  for(let level=storefront?1:0;level<floorCount;level++){
   const h=Math.max(.7,Math.min(1.78,floorHeight*.52));
   const y=(level+.50)*floorHeight;
   for(let bay=0;bay<bays;bay++){
    const cx=edge.left+(bay+.5)*bayWidth;
    const w=Math.max(.52,Math.min(bayWidth*.62,bayWidth-.32));
    box(cx,y,face+.12,w+.18,h+.2,.18,trim);
    box(cx,y,face+.25,w,h,.09,glass);
    box(cx,y,face+.31,.055,h,.08,frame);
    box(cx,y+h*.04,face+.32,w,.055,.075,frame);
    box(cx,y-h*.52,face+.23,w+.28,.14,.32,0x8d8176);
   }
  }
  box(edge.x,wallHeight-.16,face+.16,edge.width,.31,.38,trim);
  if(historic){
   // Nominated 2301-07: documented mansard/dormer roof; detailed roof
   // pitch and exact dormer locations remain estimated at this scale.
   for(const u of [-.24,.24]){
    box(edge.x+u*edge.width,wallHeight+1.48,face-1.45,edge.width*.20,1.72,.83,0x77736e);
    box(edge.x+u*edge.width,wallHeight+1.48,face-.99,edge.width*.15,1.24,.12,glass);
   }
   for(const u of [-.25,.25]){
    box(edge.x+u*edge.width,wallHeight*.56,face+.32,edge.width*.22,3.7,.42,0x937968);
    box(edge.x+u*edge.width,wallHeight*.56,face+.65,edge.width*.18,2.48,.12,glass);
    box(edge.x+u*edge.width,wallHeight*.69,face+.82,edge.width*.24,.13,.51,0x577669);
   }
   if(profile.ground==='historic-corner'){
    // Corner turret belongs to 2301-03; height and exact projection approximate.
    const tx=edge.right-edge.width*.14;
    const c=mesh(new T.CylinderGeometry(1.15,1.38,wallHeight*.49,10),wall,tx,wallHeight*.755,face+.18);
    c.rotation.y=Math.PI/10;
    mesh(new T.ConeGeometry(1.45,2.35,10),0x4d5055,tx,row.h-.26,face+.18);
   }
  }
 }
 return true;
}
