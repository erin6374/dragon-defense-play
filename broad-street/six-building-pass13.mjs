/** Photo-informed Pass 13 facade candidates; no change to municipal polygons.
 * 2209: December 2022 Jamie Meller, 2251: 2022 listing, 2315: 2024 brochure,
 * 2301/2305: 2018 historic nominations. 2255: partial 2025 photo only.
 * Geometry is schematic, never a survey or an STL certification. */
export const PASS13_IDS=new Set(['photo-2209','1536713','1050173','1050168','1050169','3000691']);
export function renderPass13(row,layout,{block,box,mesh,T}){
 const id=String(row.id);if(!PASS13_IDS.has(id))return false;
 const e=layout.edges.reduce((a,b)=>a.width>=b.width?a:b),w=e.width,z=e.z,x=f=>e.left+w*f,H=row.h;
 const dark=0x343c40,glass=0x65818e,white=0xdcd7cb,gray=0x8e9695;
 // Every panel has a backing which embeds in the source mass; layers overlap by positive volume.
 const rect=(cx,y,width,height,color,projection=.12,depth=.30)=>box(cx,y,z+projection,width,height,depth,color);
 const band=(y,h,c,width=w*.97,projection=.10,depth=.34)=>rect(e.x,y,width,h,c,projection,depth);
 const wall=(c,height=H)=>{for(const p of row.polys){block(p,height,c);block(p,.14,0x555557,height-.08,{aerialRoof:false});}};
 const glassAt=(cx,y,ww,hh,front=.19,frame=dark,pane=glass,mullions=1)=>{
  box(cx,y,z+front-.13,ww+.14,hh+.14,.32,frame);
  box(cx,y,z+front+.025,ww,hh,.10,pane);
  for(let i=1;i<=mullions;i++)box(cx-ww/2+ww*i/(mullions+1),y,z+front+.075,.055,hh,.08,frame);
  box(cx,y-hh*.31,z+front+.072,ww,.055,.08,frame);
 };
 const door=(cx,y,ww,hh,c=gray,front=.18)=>{glassAt(cx,y,ww,hh,front,c,glass,1);box(cx+ww*.35,y-.1,z+front+.09,.07,.16,.07,c);};
 const brickCourses=(left,right,bottom,top,color,spacing=.27)=>{for(let y=bottom;y<top;y+=spacing)box((left+right)/2,y,z+.03,right-left,.028,.14,color);};
 const cornice=(y,color=white)=>{band(y,.28,color,w*.97,.12,.38);band(y+.24,.22,color,w*.98,.20,.52);for(let j=0;j<22;j++)rect(x(.035+j*.93/21),y-.20,w*.025,.32,color,.16,.44);};
 // Closed hipped roof frustum. Fallback only for synthetic unit-test factories.
 const hip=(cx,cy,cz,ww,dd,hh,tw,td,c)=>{
  if(!T?.BufferGeometry||!T?.Float32BufferAttribute){box(cx,cy+hh*.5,cz,ww,hh,dd,c);return;}
  const b=[[cx-ww/2,cy,cz-dd/2],[cx+ww/2,cy,cz-dd/2],[cx+ww/2,cy,cz+dd/2],[cx-ww/2,cy,cz+dd/2]];
  const t=[[cx-tw/2,cy+hh,cz-td/2],[cx+tw/2,cy+hh,cz-td/2],[cx+tw/2,cy+hh,cz+td/2],[cx-tw/2,cy+hh,cz+td/2]];
  const v=[];const quad=(a,b,c,d)=>v.push(...a,...b,...c,...a,...c,...d);
  quad(b[0],b[1],b[2],b[3]);for(let i=0;i<4;i++)quad(b[i],t[i],t[(i+1)%4],b[(i+1)%4]);quad(t[3],t[2],t[1],t[0]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.computeVertexNormals();const obj=mesh(geo,c);if(obj?.material&&T.DoubleSide!==undefined)obj.material.side=T.DoubleSide;
 };
 if(id==='photo-2209'){
  // As-built white/tan brick, two red projecting glazed oriel stacks (three lower occupied floors), two flush top windows.
  const mainRoof=53*.3048,parapet=57*.3048;wall(0xd6c9b6,mainRoof);
  band((mainRoof+parapet)/2-.06,parapet-mainRoof+.24,0xd6c9b6,w*.98,-.10,.37);band(parapet-.02,.12,0xb6b4ab,w*.99,-.06,.45);
  for(const p of row.polys)block(p,.10,0x5a5b5d,mainRoof-.08,{aerialRoof:false});
  const y0=3.5,y1=13.35;for(const f of [.23,.70]){
   const cx=x(f),bw=w*(f<.4?.29:.40);
   box(cx,(y0+y1)/2,z+.20,bw,y1-y0,.82,0x34383c);
   for(const side of [-1,1])box(cx+side*bw*.43,(y0+y1)/2,z+.37,bw*.14,y1-y0,.68,0xa82736);
   if(f>.4)box(cx+bw*.15,(y0+y1)/2,z+.60,bw*.13,y1-y0,.24,0xb42f3d);
   for(let i=0;i<3;i++){
    const y=y0+(i+.62)*(y1-y0)/3;
    if(f<.4)glassAt(cx,y,bw*.66,1.95,.66,dark,glass,1);
    else{glassAt(cx-bw*.16,y,bw*.43,1.95,.66,dark,glass,1);glassAt(cx+bw*.30,y,bw*.19,1.95,.66,dark,glass,0);}
   }
   glassAt(cx,14.65,w*.20,1.72,.17,dark,glass,1);
  }
  band(1.72,3.44,0xb5a48e,w*.98,.04,.26);glassAt(x(.25),1.66,w*.27,2.25,.18,dark,glass,1);glassAt(x(.69),1.66,w*.31,2.25,.18,dark,glass,1);
  // Ground entrance details partly occluded by vehicles in the source; no fabricated lettering.
  door(x(.73),1.22,w*.105,2.20,dark,.28);for(let i=0;i<4;i++)rect(x(.28+i*.125),parapet-.35,.075,.19,dark,.15,.30);
  return true;
 }
 if(id==='1536713'){
  // Listing exterior explicitly shows left apartment entry, right glazed shop entry and central two-pane storefront.
  wall(0x77544d);brickCourses(e.left+.08,e.right-.08,.12,H-.45,0xa4877c,.23);
  const ground=3.45;band(ground+.10,.23,0x876960);band(H-.12,.26,0x8b7770);
  door(x(.25),1.26,w*.22,2.36,0xaeb4b6,.22);glassAt(x(.25),2.87,w*.22,.72,.22,0xaeb4b6,glass,0);
  glassAt(x(.625),1.32,w*.29,2.45,.22,0xaeb4b6,glass,1);glassAt(x(.625),2.82,w*.29,.70,.22,0xaeb4b6,glass,1);
  door(x(.86),1.23,w*.17,2.32,0xaeb4b6,.22);glassAt(x(.86),2.82,w*.17,.70,.22,0xaeb4b6,glass,0);
  for(const o of layout.openings)glassAt(o.x,o.y,Math.min(o.w*1.25,w*.34),o.h,.17,0xbfc2bd,glass,1);
  rect(x(.42),1.47,.14,.14,0xb32e31,.17,.27);rect(x(.42),2.22,.18,.22,0xe8e2dd,.17,.29);
  return true;
 }
 if(id==='3000691'){
  // Only the three wide upper windows are supported by partial Broad-side photo. Ground remains estimated.
  wall(0xe0ded7);band(H-.24,.28,0xd1d0cb);for(const o of layout.openings){
   const ww=w*.68;glassAt(e.x,o.y,ww,o.h*1.10,.17,0x4b5154,glass,1);rect(e.x,o.y-o.h*.63,ww+.12,.12,0xbbbdb9,.16,.42);
   band(o.y+o.h*.76,.085,0xc4c4be,w*.94,.055,.18);
  }
  // Simple light ground mass: avoid fictional retail sign or entrance layout.
  for(const g of layout.groundOpenings)glassAt(g.x,g.y,g.w,g.h,.17,dark,glass,1);
  for(const d of layout.doors)door(d.x,d.y,d.w,d.h,dark,.17);
  band(3.35,.19,0xc8c7c2);return true;
 }
 if(id==='1050169'){
  // 2024 WCRE photograph: dark green-black stone panels, 4 pale sash per upper floor,
  // 3 central arched windows + 2 pale double doors; cream elaborate cornice.
  wall(0x344a48);for(let j=0;j<9;j++)rect(x((j+.5)/9),H*.46,w/9-.025,H*.89,0x3b514f+(j%3)*0x020202,.025,.17);
  const arch=(cx,y,ww,hh)=>{
   const c=0xb7b2a3;rect(cx,y,ww+.18,hh*.68,c,.12,.34);rect(cx,y,ww,hh*.65,0x747451,.27,.18);
   // Semicircular top modeled in 13 positive-volume overlapping horizontal solid strips.
   const R=ww/2;for(let i=0;i<13;i++){const a=(i+.3)/13,span=2*Math.sqrt(Math.max(0,R*R-(a*R)**2));
    rect(cx,y+hh*.34+a*R,span+.18,R/13+.036,c,.13,.34);rect(cx,y+hh*.34+a*R,span,R/13+.026,0x777650,.28,.15);}
   for(const f of [-.23,0,.23])rect(cx+ww*f,y, .055,hh*.64,0xa39a68,.35,.11);
   for(let j=0;j<4;j++)rect(cx,y-hh*.27+j*hh*.18,ww,.055,0xa39a68,.35,.11);
  };
  for(const f of [.12,.88]){const cx=x(f),dw=w*.16;rect(cx,1.62,dw+.16,2.90,white,.10,.34);rect(cx,1.55,dw,2.70,0xdedbd0,.23,.20);for(const k of [-.31,-.16,.16,.31])rect(cx+k*dw,2.11,dw*.085,1.15,0x526569,.34,.06);rect(cx,1.55,.05,2.70,0xb2b3a9,.35,.08);rect(cx,.19,w*.18,.36,white,.28,.73);}
  for(const f of [.31,.50,.69])arch(x(f),3.22,w*.125,3.15);
  for(const o of layout.openings){const yy=7.65+(o.floor-1)*4.1;glassAt(o.x,yy,o.w*1.22,1.95,.17,white,0x74858a,1);rect(o.x,yy-1.04,o.w*1.38,.15,0x8d7765,.20,.38);}
  band(5.75,.48,0xd1b986,w*.50,.18,.37);cornice(H-.55,0xc4c2b0);
  for(const f of [.02,.50,.98])rect(x(f),H-.88,.15,.63,0xc4c2b0,.18,.50);
  // Twin pediment silhouettes supported by roof coping; lettering deliberately omitted.
  for(const f of [.27,.73])for(let j=0;j<7;j++)rect(x(f),H-.20+j*.105,w*.31*(1-j/7),.16,0xbdbbac,.14,.40);
  return true;
 }
 // 2301/2305 twin Victorian dwellings: distinct asymmetric corner vs symmetric pair.
 const corner=id==='1050173',body=corner?0x785d56:0x885c49,copper=corner?0xb0a99a:0x557b70,roof=0x414547;
 const eave=H-3.12;wall(body,eave);band(eave-.18,.34,copper,w*.98,.14,.42);band(eave+.06,.16,copper,w*.98,.19,.53);
 // Front mansard only; rear roof form remains approximate. Footprint is kept below eave.
 hip(e.x,eave-.13,z-5.1,w*.96,10.45,3.28,w*.84,6.35,roof);
 // Low backing within actual wall behind dormers, connected to roof and body.
 box(e.x,eave+.14,z-1.40,w*.88,.50,2.7,roof);
 for(let j=0;j<22;j++)rect(x(.04+j*.92/21),eave-.43,.115,.36,copper,.16,.40);
 const first=3.35,second=7.3,third=10.70;
 band(first+.34,.36,body,w*.98,.19,.49);band(second-1.82,.35,body,w*.97,.17,.43);band(third+1.45,.28,body,w*.97,.09,.30);
 for(let yy=.50;yy<4.0;yy+=.40)band(yy,.045,0x634c42,w*.96,.04,.20);
 const groundDoor=(f)=>{if(corner)door(x(f),1.87,w*.10,2.30,white,.21);else{rect(x(f),1.87,w*.10+.18,2.42,body,.10,.32);rect(x(f),1.87,w*.10,2.30,0xb1b7b1,.23,.20);rect(x(f)-w*.023,2.22,w*.027,.44,0x6b7979,.34,.07);}rect(x(f),.46,w*.16,.91,body,.20,.78);};
 if(corner){groundDoor(.10);for(const f of [.29,.52,.76])glassAt(x(f),2.0,w*.13,2.05,.20,body,0x555d59,0);}
 else{for(const f of [.44,.57])groundDoor(f);for(const f of [.12,.27,.73,.88])glassAt(x(f),2.18,w*.11,1.8,.19,copper,0x64716d,0);}
 if(!corner)for(let j=0;j<4;j++)box(x(.50),.11+j*.16,z+.75-j*.12,w*.35,.23,.61,body);
 // 2018 corner entrance ramp: continuous joined landing and rising solid treads, no floating rail.
 if(corner){const rampW=w*.93;for(let j=0;j<20;j++){const y=.17+.58*(19-j)/19;box(x(.035+(j+.5)*.93/20),y/2,z+.45,rampW/20+.045,y,1.15,0x8e8071);box(x(.035+(j+.5)*.93/20),y+.45,z+.94,rampW/20+.045,.075,.09,0x423e39);if(j%2===0)box(x(.035+(j+.5)*.93/20),y+.225,z+.94,.045,.55,.09,0x423e39);}}
 // Asymmetric corner: larger left three-light group, smaller right two-light group. Symmetric pair has three lights each.
 for(const [f,scale,n] of corner?[[.25,.33,3],[.73,.23,2]]:[[.25,.32,3],[.75,.32,3]]){
  const cx=x(f),bw=w*scale;box(cx,second,z+.22,bw,2.75,.84,copper);
  for(let k=0;k<n;k++)glassAt(cx+bw*((k+.5)/n-.5),second,bw/n*.78,2.25,.68,copper,glass,0);
  box(cx,third-1.14,z+.39,bw+.12,.22,1.0,copper);box(cx,second-1.37,z+.28,bw+.25,.26,.82,body);
  for(let j=0;j<5;j++)box(cx+bw*((j+.5)/5-.5),second-1.53,z+.28,.14,.33,.56,body);
  const rail=corner?0xc5bfae:0x557b70;
  for(let j=0;j<9;j++)box(cx-bw*.47+j*bw*.94/8,third-.67,z+.83,.075,.95,.12,rail);
  box(cx,third-.22,z+.83,bw,.12,.17,rail);box(cx,third-1.01,z+.83,bw,.11,.15,rail);
  box(cx,third-.60,z+.845,bw,.065,.13,rail);for(let j=0;j<8;j++)box(cx-bw*.43+j*bw*.86/7,third-.60,z+.87,bw*.08,.43,.08,rail);
  for(const sx of [-1,1]){box(cx+sx*bw*.48,third-.67,z+.38,.08,.92,.90,rail);}
  for(let k=0;k<n;k++)glassAt(cx+bw*((k+.5)/n-.5),third+.38,bw/n*.78,1.90,.20,copper,glass,0);
 }
 // Dormer volumes penetrate the sloped roof; not suspended decoration.
 for(const [f,scale,n] of corner?[[.15,.13,1],[.33,.13,1],[.73,.25,2]]:[[.25,.30,3],[.75,.30,3]]){
  const cx=x(f),bw=w*scale,cy=eave+1.13;
  box(cx,cy,z-1.06,bw,1.84,2.40,copper);box(cx,cy+.84,z-1.06,bw*1.14,.15,2.70,roof);
  for(let k=0;k<n;k++){const xx=cx+bw*((k+.5)/n-.5);box(xx,cy,z+.10,bw/n*.68,1.24,.22,glass);box(xx,cy-.14,z+.22,bw/n*.70,.075,.12,copper);}
  hip(cx,cy+.80,z-1.06,bw*1.12,2.62,.72,bw*.24,.85,roof);
 }
 if(corner&&T?.CylinderGeometry){
  // Cylinder centered in the original curved corner polygon, with directly attached pale sash relief.
  const tx=-365.87,tz=-22.52;
  mesh(new T.CylinderGeometry(1.68,1.68,eave-.15,24),body,tx,(eave-.15)/2,tz);
  for(const yy of [second,third]){
   mesh(new T.CylinderGeometry(1.72,1.72,.21,24),copper,tx,yy-1.0,tz);
   box(tx,yy,tz+1.55,1.22,1.90,.34,copper);box(tx,yy,tz+1.75,.96,1.67,.14,glass);
  }
  if(T.ConeGeometry)mesh(new T.ConeGeometry(1.80,3.12,24),roof,tx,eave+1.40,tz);
  // 2018 south elevation: light stucco, stone bands, varied sash/pointed apertures and a projecting enclosed bay.
  // Sample the actual side boundary from the GIS polygon to attach every side element locally.
  const sideX=zz=>{let q=[];for(const poly of row.polys){const ring=poly[0];for(let i=1;i<ring.length;i++){const [a,b]=[ring[i-1],ring[i]];if((a[1]<=zz&&zz<b[1])||(b[1]<=zz&&zz<a[1]))q.push(a[0]+(b[0]-a[0])*(zz-a[1])/(b[1]-a[1]));}}return Math.max(...q);};
  for(let zz=z-3.2;zz>=z-30;zz-=.85){const xx=sideX(zz);if(!Number.isFinite(xx))continue;box(xx-.08,eave*.50,zz,.26,eave-.20,.96,0xc7c4b9);for(const yy of [.55,4.1,5.25,9.0,12.65])box(xx+.03,yy,zz,.25,.14,.94,0x876c59);}
  const sideWindow=(zz,yy,ww,hh)=>{const xx=sideX(zz);if(!Number.isFinite(xx))return;box(xx-.04,yy,zz,.35,hh+.16,ww+.14,0xb6b4a9);box(xx+.15,yy,zz,.16,hh,ww,glass);box(xx+.24,yy-.10,zz,.10,.065,ww,white);};
  for(const [dz,yy,ww,hh] of [[4.7,7.2,1.0,1.7],[4.7,10.6,1,1.7],[10.3,7.2,1.05,1.75],[10.3,10.6,.85,1.65],[14.3,10.6,.80,1.55],[17.3,10.6,.80,1.55],[19.3,7.2,.58,1.35],[21,7.2,.58,1.35],[23.2,10.6,.91,1.7],[25.0,10.6,.91,1.7],[15.0,2.1,.76,1.4],[16.6,2.1,.76,1.4],[23,2.1,.76,1.4],[25,2.1,.76,1.4]])sideWindow(z-dz,yy,ww,hh);
  const bz=z-24.7,bx=sideX(bz);box(bx-.05,7.28,bz,.80,2.9,3.15,0xbdbab0);for(let k=0;k<3;k++){box(bx+.42,7.55,bz+(k-1)*.9,.24,1.84,.71,glass);box(bx+.55,7.55,bz+(k-1)*.9,.08,.055,.71,white);}
  // Secondary side-facing turret sash, physically embedded in cylinder.
  for(const yy of [second,third]){box(tx+1.55,yy,tz,.34,1.90,1.22,copper);box(tx+1.73,yy,tz,.15,1.67,.96,glass);}
  // One small roof oculus facing Broad, and one facing Dauphin (2018 photo).
  for(const a of [0,Math.PI/2]){const rr=.86,xx=tx+Math.sin(a)*rr,zz=tz+Math.cos(a)*rr,yy=eave+1.50;const rim=mesh(new T.CylinderGeometry(.27,.27,.18,24),copper,xx,yy,zz);if(rim?.rotation){rim.rotation.x=Math.PI/2;rim.rotation.z=-a;}const pane=mesh(new T.CylinderGeometry(.19,.19,.12,20),dark,xx+Math.sin(a)*.11,yy,zz+Math.cos(a)*.11);if(pane?.rotation){pane.rotation.x=Math.PI/2;pane.rotation.z=-a;}}

 }
 return true;
}
