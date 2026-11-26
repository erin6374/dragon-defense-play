/** Pass18: photo-driven Broad Street frontages only.
 * 2413-29 Ruth Williams House: Street View Oct 2026, screenshots 031221/031230.
 * 2431-45 AutoZone: Street View Oct 2026, 031230/031240.
 * 2401-11 Shell shop: Mar 2023 031212, Oct 2026 031158 (latter controls colors).
 * Retain city polygons; all dimensions are photo/GIS-derived approximations.
 */
export const PASS18_IDS=new Set(['1544523','1073318','1011866']);
const inside=(v,a,b)=>v>=a&&v<=b;
export function frontageEdges(row){
 const edges=[];
 for(const poly of row.polys)for(let i=1;i<poly[0].length;i++){
  const a=poly[0][i-1],b=poly[0][i];
  if(Math.abs(b[0]-a[0])<2||Math.abs(b[1]-a[1])>.35||Math.min(a[1],b[1])<row.front-2)continue;
  const l=Math.min(a[0],b[0]),r=Math.max(a[0],b[0]);
  edges.push({l,r,w:r-l,z:Math.min(a[1],b[1]),x:(l+r)/2});
 }
 return edges.sort((a,b)=>a.l-b.l);
}
function sign(T,scene,label,x,y,z,w,h,bg,fg,angle=0){
 if(!scene||typeof document==='undefined'||!T?.CanvasTexture)return;
 const cv=document.createElement('canvas');cv.width=1024;cv.height=160;const ctx=cv.getContext('2d');if(!ctx)return;
 ctx.fillStyle=bg;ctx.fillRect(0,0,1024,160);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 110px Arial,sans-serif';ctx.fillText(label,512,83,994);
 const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
 const obj=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));obj.position.set(x,y,z);obj.rotation.y=angle;obj.name='pass18-photo-sign-'+label;scene.add(obj);
}
export function renderPass18(row,{T,box,block,mesh,scene}){
 const id=String(row.id);if(!PASS18_IDS.has(id))return false;
 const {x,z,w,d,h,front}=row;
 const dark=0x303a3c,glass=0x5f7a7f,ivory=0xd4d2c7,gray=0x949c9c;
 const mass=(c,H=h)=>{for(const poly of row.polys){block(poly,H,c);block(poly,.13,0x777a77,H-.065,{aerialRoof:false});}};
 function frame(cx,y,zz,ww,hh,projection=.23){
  box(cx,y,zz+projection-.14,ww+.12,hh+.12,.36,dark);
  box(cx,y,zz+projection+.03,ww,hh,.13,glass);
  box(cx,y,zz+projection+.105,.07,hh,.08,dark);
  box(cx,y+hh*.29,zz+projection+.105,ww,.06,.08,dark);
 }
 if(id==='1544523'){
  // Four red projecting 2-window towers alternate with recessed ivory/silver bays.
  // Follow each actual shallow stepped GIS wall, not a single bounding-box facade.
  mass(0xd0cec4,h-.43);
  const edges=frontageEdges(row);
  const towers=edges.filter(e=>e.z>front-.50&&e.w>6);
  const ground=3.48,pitch=(h-ground-.55)/4;
  for(const e of edges){
   const isTower=towers.includes(e),brown=e.x>x+w*.38;
   const H=isTower?h:h-.48,face=e.z;
   const F=(u,y,W,H,c,p=.12,dep=.48)=>box(e.l+e.w*u,y,face+p,e.w*W,H,dep,c);
   if(isTower){
    F(.5,(H+ground)/2,.98,H-ground,0x9f5545,.13,.54);
    // Narrow low-relief red panel joints, not opaque window overlays.
    for(let j=1;j<7;j++)F(j/7,(H+ground)/2,.003,H-ground,0x855346,.41,.07);
    for(let j=1;j<14;j++)F(.5,ground+j*(H-ground)/14,.98,.018,0x8b584a,.41,.07);
    F(.5,H-.05,.99,.18,0x57595a,.15,.59);
   }else{
    F(.5,(H+ground)/2,.98,H-ground,brown?0x9b8e76:ivory,.09,.37);
    if(!brown)F(.5,H-pitch/2,.98,pitch,gray,.20,.24);
    for(let j=1;j<5;j++)F(j/5,(H+ground)/2,.003,H-ground,0xb2b2aa,.27,.08);
    if(!brown)for(let j=0;j<14;j++)F(.5,H-.10-j*.20,.98,.018,0x787f80,.34,.07);
   }
   F(.5,1.72,.98,3.44,0xc7c6bb,.07,.35);
   F(.5,.45,.98,.85,0x777c7b,.13,.46);
   for(const u of [.27,.73]){
    const cx=e.l+e.w*u;
    frame(cx,1.84,face,Math.min(e.w*.34,2.45),2.68,.25);
    for(let k=0;k<4;k++)frame(cx,ground+(k+.53)*pitch,face,Math.min(e.w*.29,2.03),1.46,isTower?.51:.39);
   }
   if(brown)for(let k=0;k<4;k++)F(.5,ground+k*pitch+.12,.98,.14,0xe2e0d4,.62,1.58);
  }
  // Central canopy and sign sit on the actual recessed wall between towers.
  const entrance=edges.filter(e=>!towers.includes(e)).sort((a,b)=>Math.abs(a.x-(x-3))-Math.abs(b.x-(x-3)))[0];
  if(entrance){
   const e=entrance;box(e.x,3.63,e.z+.40,e.w*.96,.28,1.34,0xdadad2);
   box(e.x,4.06,e.z+.29,e.w*.90,.58,.55,dark);
   sign(T,scene,'RUTH WILLIAMS HOUSE',e.x,4.06,e.z+.57,e.w*.85,.45,'#303a3c','#eeeeea');
  }
  return true;
 }
 if(id==='1073318'){
  // Broad/Cumberland elevations in Oct 2026: mostly blank dark gray masonry,
  // long horizontal red/white fascia. Main glazed entry faces parking, not Broad.
  mass(0x646b6b);
  const e=frontageEdges(row).sort((a,b)=>b.w-a.w)[0];
  if(!e)throw Error('AutoZone actual Broad wall not found');
  const F=(u,y,W,H,c,p=.1,dep=.40)=>box(e.l+u*e.w,y,e.z+p,e.w*W,H,dep,c);
  F(.5,(h-1.8)/2,.985,h-1.8,0x666d6e,.06,.30);
  for(let y=.20;y<h-1.80;y+=.23)F(.5,y,.985,.023,0x515b5d,.20,.08);
  F(.5,h-.83,.99,1.66,0xe0dfd6,.09,.40);
  F(.5,h-.54,.98,.62,0xbc322b,.27,.24);
  F(.5,h-1.57,.98,.22,0xbe332c,.27,.24);
  F(.72,h-.76,.50,.79,0xe7e5dc,.37,.24);
  sign(T,scene,'AutoZone',e.l+e.w*.72,h-.76,e.z+.495,e.w*.47,.68,'#e7e5dc','#c32822');
  // Long south/parking side follows source polygon; entrance close to Broad.
  // Cumberland-facing side remains predominantly solid, with matching stripe.
  for(const poly of row.polys)for(let i=1;i<poly[0].length;i++){
   const a=poly[0][i-1],b=poly[0][i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(L<6||Math.abs(b[0]-a[0])>1)continue;
   const nx=(a[0]+b[0])/2>x?1:-1,near=a[1]>b[1]?a:b,far=near===a?b:a;
   const at=(t,y,W,H,c,p=.10,dep=.40)=>box(near[0]+(far[0]-near[0])*t+nx*p,y,near[1]+(far[1]-near[1])*t,W,H,dep,c,nx*Math.PI/2);
   at(.5,h-.82,L*.99,1.58,0xe0dfd6,.10,.42);
   at(.5,h-.55,L*.985,.62,0xbc322b,.29,.23);at(.5,h-1.54,L*.985,.21,0xbc322b,.29,.23);
   if(nx===1){
    for(const t of [.22,.35,.48]){at(t,1.6,L*.105,2.72,dark,.14,.43);at(t,1.6,L*.095,2.50,glass,.36,.14);at(t,1.6,.07,2.50,0xb9362d,.46,.10);}
    at(.35,3.64,L*.43,.54,0xe4e2d8,.32,.30);
    const sx=near[0]+(far[0]-near[0])*.35+.475,sz=near[1]+(far[1]-near[1])*.35;
    sign(T,scene,'AutoZone',sx,3.64,sz,L*.38,.43,'#e4e2d8','#c32822',Math.PI/2);
   }
  }
  return true;
 }
 // Shell: the visible shop has a shallow grey pitched roof and white knee wall
 // below a band of dark glazing. This corrects Pass17's flat roof/full-height glass.
 const eave=h-1.03;mass(0xd8d9d1,eave);
 const e=frontageEdges(row).sort((a,b)=>b.w-a.w)[0];
 if(!e)throw Error('Shell frontage missing');
 const F=(u,y,W,H,c,p=.1,dep=.42)=>box(e.l+e.w*u,y,e.z+p,e.w*W,H,dep,c);
 // Closed roof prism, along the long x axis and wholly supported by existing wall.
 const roofW=w*.982,roofD=d*.98,rise=1.18;
 if(T?.Shape&&T?.ExtrudeGeometry&&mesh){
  const shape=new T.Shape();shape.moveTo(-roofD/2,-.12);shape.lineTo(roofD/2,-.12);shape.lineTo(0,rise);shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:roofW,bevelEnabled:false});geo.translate(0,0,-roofW/2);
  const roof=mesh(geo,0x727c79,x,eave,z);roof.rotation.y=Math.PI/2;
 }else box(x,eave+.42,z,roofW,1.10,roofD,0x727c79);
 F(.5,3.76,.985,.49,0xe5ab26,.14,.49);F(.5,3.55,.985,.13,0xb8362b,.36,.16);
 F(.5,.50,.985,1.0,0xdadbd4,.08,.39);
 for(const u of [.09,.24,.39,.54,.69])frame(e.l+e.w*u,2.25,e.z,e.w*.125,2.15,.27);
 frame(e.l+e.w*.46,1.52,e.z,e.w*.105,2.8,.37);
 F(.88,2.04,.22,3.90,0xd8d9d1,.10,.43);
 F(.5,3.80,.18,.29,0xeeeae0,.39,.18);
 sign(T,scene,'Food Mart',e.x,3.80,e.z+.485,e.w*.17,.25,'#eeeae0','#b42d2b');
 return true;
}
