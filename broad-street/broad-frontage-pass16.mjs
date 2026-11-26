/** Pass 16 candidate (unreleased). Photo-constrained prototypes.
 * Crown Chicken and 2207: April 2025, 030445/030432; 2331 and 2401:
 * October 2026, 031151/031158. Only street-facing architecture addressed.
 * GIS coordinates remain unchanged; 2207 provisional frontage is not survey data.
 */
export const PASS16_FRONTAGE_IDS=new Set(['1001196','1007130','1051327','1009021']);
export function renderPass16Frontage(b,{T,block,box,mesh}){
 const id=String(b.id);if(!PASS16_FRONTAGE_IDS.has(id))return false;
 const w=b.w,x=b.x,z=b.front,h=b.h;
 const dark=0x363d3e,glass=0x536d75,stone=0xc6b8a0;
 const rect=(u,y,ww,hh,c,p=.08,d=.30,ang=0)=>box(x+u*w,y,z+p,w*ww,hh,d,c,ang);
 const sash=(u,y,ww,hh,c=0xd2cec0,p=.24)=>{
  rect(u,y,ww+.022,hh+.13,dark,p-.10,.30);rect(u,y,ww,hh,glass,p+.03,.12);
  rect(u,y,ww,.052,c,p+.11,.09);
 };
 if(id==='1001196'){
  // A 1-story restaurant, not a multi-story block; low red fascia and corner door.
  // The billboards are separate supported frames (no fake advertising copy).
  const eave=4.42,L=-196.55,R=-189.69,ww=R-L,front=-21.71,fx=u=>L+ww*u;
  const f=(u,y,W,H,c,p=.08,d=.36)=>box(fx(u),y,front+p,ww*W,H,d,c);
  for(const p of b.polys){block(p,eave,0x907a66);block(p,.14,0x67645d,eave-.06);}
  f(.50,1.80,.98,3.60,0xb6a48e);for(let yy=.15;yy<3.5;yy+=.25){f(.5,yy,.97,.022,0x8d8170,.24,.08);}
  for(const u of [.25,.51,.75]){f(u,1.65,.22,2.3,0x3b4140,.24,.34);f(u,1.65,.18,2.12,glass,.43,.12);}
  f(.50,3.76,.98,.73,0xa53b36,.26,.59);f(.50,4.17,.98,.10,0x7e312f,.25,.65);
  // Attached lower stone courses, continuous sill and vertical storefront divisions.
  f(.50,.34,.98,.58,0x9d8b74,.17,.47);
  for(const u of [.13,.38,.64,.86])f(u,1.66,.027,2.4,0x665e50,.35,.32);
  f(.5,2.86,.94,.105,0xb4a18a,.33,.34);
  // Raised red pediment above the corner entrance; the real photograph shows a curved cap.
  for(let j=0;j<7;j++){const t=(j+.35)/7;f(.88,4.22+t*.40,.19*Math.sqrt(1-t*t),.085,0xa53b36,.24,.60);}
  // Ground-mounted railings connect to a continuous concrete platform joined to storefront.
  f(.49,.13,.86,.28,0x9d9383,.54,1.2);
  for(const u of [.10,.30,.50,.70,.90])f(u,.68,.009,1.0,0xa9aaa3,1.03,.10);
  for(const y of [.48,.88,1.14])f(.50,y,.81,.065,0xa9aaa3,1.03,.10);
  // South/east clipped corner in actual GIS: keep curved corner facade schematic until camera match.
  // Pass19 places the entrance on the actual diagonal corner edge.
  // Support every billboard through a continuous welded frame embedded into the roof.
  for(const [cx,angle] of [[x-1.5,0],[x+1.45,-.42]]){
   for(const dx of [-1.25,1.25]){
    box(cx+dx,eave+.90,z-4.1,.16,1.96,.22,0x494a46);
    box(cx+dx,eave+1.63,z-4.1,.22,.25,.25,0x494a46);
   }
   box(cx,eave+1.62,z-4.1,3.3,.21,.24,0x494a46);
   box(cx,eave+2.67,z-4.1,3.55,2.10,.24,0x4d565b,angle);
   // Positive-volume connection from screen face to horizontal steel frame.
   box(cx,eave+1.79,z-4.1,2.75,.25,.45,0x494a46);
  }
  return true;
 }
 if(id==='1007130'){
  // Original city GIS record describes rear only; do not edit it. Add only the
  // already-established provisional Broad-front envelope, with better cladding.
  for(const p of b.polys){block(p,h,0xe7e3d9);block(p,.15,0x48494b,h);}
  const front=b.provisionalStreetFront;if(!Number.isFinite(front)||front<=z)return true;
  // 2025 KW Commercial LEX portfolio brochure (p.9) documents a private
  // courtyard and two entrances. The original full-length infill was wrong.
  // Approximate 25.5m front building depth; not a survey measurement.
  // Preserve the separate mapped Watts-side structure and open courtyard.
  const depth=Math.min(25.5,front-z-5);
  if(depth<=0)return true;
  box(x-.12,h/2,front-depth/2,w-.28,h,depth,0xe4e3db);
  const f=(u,y,W,H,c,p=.08,d=.38)=>box(x+u*w,y,front+p,w*W,H,d,c);
  f(0,h-1.65,.98,3.30,0x45474b,.10,.40);
  for(let j=0;j<16;j++)f(-.46+j*.061,h-1.65,.005,3.3,0x2e3336,.32,.10);
  f(.18,h*.51,.40,h*.88,0x6d7071,.18,.68);
  for(let j=0;j<4;j++){
   const yy=1.65+j*3.28;f(.18,yy,.32,2.42,0x343a3d,.46,.28);f(.18,yy,.28,2.20,glass,.63,.16);f(.18,yy,.009,2.20,0xc1c3c0,.74,.09);
  }
  for(let j=1;j<=3;j++){const yy=1.65+j*3.28;f(-.28,yy,.24,1.80,dark,.15,.32);f(-.28,yy,.20,1.63,glass,.34,.15);}
  f(-.28,1.40,.24,2.65,dark,.15,.32);f(-.28,1.40,.19,2.43,glass,.34,.15);
  f(0,h-.06,.98,.18,0xc6c6bd,.10,.42);
  // White lower facade has fine horizontal courses; dark center bay is framed by pale trim.
  for(let yy=3.1;yy<h-3.31;yy+=.24)f(-.28,yy,.40,.023,0xc0bfb5,.075,.24);
  for(const u of [-.03,.39])f(u,h*.51,.024,h*.88,0xd5d4cb,.30,.50);
  for(let j=0;j<4;j++){const yy=1.65+j*3.28;f(.18,yy-.88,.34,.09,0x555d60,.67,.22);}
  f(-.28,2.94,.29,.17,0xbbbeb7,.23,.54);
  return true;
 }
 if(id==='1051327'){
  // Low flat classical parapet with three tall dark arches, paired columns and
  // medallion panels. GIS front edge is narrower than whole footprint.
  const L=-514.02,R=-493.95,fw=R-L,fc=(L+R)/2,front=-28.54;
  const eave=h*.88,base=0xbaa990,roof=0x817e70;
  for(const p of b.polys){block(p,eave,base);block(p,.18,roof,eave-.06);}
  const f=(u,y,W,H,c,p=.08,d=.45)=>box(fc+u*fw,y,front+p,fw*W,H,d,c);
  f(0,eave-.36,.99,.70,stone,.26,.95);f(0,eave+.25,.91,.62,base,.11,.54);
  for(let j=0;j<31;j++)f(-.46+j*.92/30,eave-.82,.016,.24,0xb1a38b,.52,.34);
  for(const u of [-.29,0,.29]){
   const aW=.164,r=fw*aW/2,spring=eave*.66,low=.95,arch=0x2a3433;
   f(u,(spring+low)/2,aW+.035,spring-low,stone,.16,.52);
   f(u,(spring+low)/2,aW,spring-low,arch,.43,.20);
   for(let k=0;k<16;k++){let t=(k+.35)/16,s=Math.sqrt(1-t*t);f(u,spring+t*r,aW*s+.026,r/16+.045,stone,.16,.52);f(u,spring+t*r,aW*s,r/16+.035,arch,.43,.20);}
   for(let j=0;j<3;j++)f(u-.051+j*.051,(spring+low)/2,.003,spring-low,0x3d4945,.56,.09);
   for(let j=0;j<5;j++)f(u,low+.65+j*(spring-low-1.1)/4,aW,.045,0x3d4945,.56,.09);
  }
  // The eight columns/pilasters touch backing or base, capitals touch the entablature.
  for(const u of [-.445,-.175,-.118,.118,.175,.445]){
   f(u,eave*.43,.05,eave*.78,stone,.22,.84);f(u,.47,.068,.76,stone,.30,.91);
   f(u,eave*.83,.067,.55,stone,.31,1.03);
   // Layered column capital and plinth. Model relief instead of texture-only ornament.
   f(u,eave*.83+.31,.075,.16,0xd0c1a8,.29,1.10);
   f(u,eave*.83-.28,.058,.17,0xb5a68e,.38,.91);
   f(u,.89,.058,.16,0xcbbda5,.33,.93);
   for(let j=0;j<5;j++)f(u-.018+j*.009,eave*.43,.003,eave*.75,0xac9d82,.66,.12);
  }
  for(const u of [-.38,-.143,.143,.38]){f(u,eave*.75,.035,.88,0xb2a38a,.23,.52);f(u,eave*.40,.034,1.45,0xb5a58c,.18,.46);
   for(let k=0;k<9;k++){const t=(k+.35)/9;f(u,eave*.75+(t-.5)*.88,.040*Math.sqrt(1-(2*t-1)**2),.11,0xc2b397,.43,.20);}
  }
  // Raised parapet panels and dentils observed on the October 2026 facade.
  for(const u of [-.28,0,.28]){f(u,eave+.27,.22,.29,0xc8b99e,.32,.20);for(let k=0;k<9;k++)f(u-.086+k*.0215,eave+.27,.009,.12,0xaa9b82,.44,.08);}
  for(let k=0;k<34;k++)f(-.46+k*.92/33,eave-.42,.012,.16,0xd0c1a9,.68,.20);
  for(let j=0;j<5;j++){const y=(j+1)*.15,run=1.75-j*.27;f(0,y/2,.86,y,base,(run-.18)/2,run+.18);}
  return true;
 }
 if(id==='1009021'){
  // Front gas-station canopy only. Rear store geometry deliberately unchanged.
  const eave=5.25;
  for(const p of b.polys)block(p,.55,0xe3e2da,eave-.04,{aerialRoof:false});
  // The surveyed footprint is the elevated canopy itself, not a solid store.
  rect(0,eave+.05,.99,.34,0xe4e3db,.10,.36);
  rect(0,eave-.04,.98,.19,0xe4a42a,.31,.18);rect(0,eave-.17,.98,.14,0xc94731,.31,.18);
  // Continue the yellow/red fascia along both ends of the surveyed canopy.
  // Use actual polygon boundary segments; no new invented footprint.
  const ring=b.polys[0][0];
  for(let j=1;j<ring.length;j++){const [ax,az]=ring[j-1],[bx,bz]=ring[j],len=Math.hypot(bx-ax,bz-az);if(len<.10||Math.abs(bz-az)<1)continue;
   const cx=(ax+bx)/2,cz=(az+bz)/2,angle=-Math.atan2(bz-az,bx-ax);
   box(cx,eave-.04,cz,len,.19,.18,0xe4a42a,angle);box(cx,eave-.17,cz,len,.14,.18,0xc94731,angle);
  }
  for(const u of [-.36,0,.36]){
   box(x+u*w,eave/2,z-2.8,.50,eave+.12,.56,0xd7d6ce);
   box(x+u*w,.32,z-2.8,1.70,.60,1.26,0xa8a79f);
   for(const off of [-.9,.9]){box(x+u*w+off,.78,z-2.8,.44,1.55,.66,0xe3e1d7);box(x+u*w+off,1.20,z-2.8+.34,.29,.38,.10,0x414947);}
   box(x+u*w,.12,z-2.8,2.45,.25,1.50,0xb3b0a8);
  }
  return true;
 }
 return false;
}
