/** Pass 15: six Broad-facing candidates. GIS/FBX remain immutable.
 * April 2025 Street View 031029/031037/030412, Sep 2026 031008,
 * Oct 2026 031121. Photo-estimated proportions, not measured surveys.
 */
export const PASS15_IDS=new Set(['1536713','3000691','1050169','1519830','1536712','1007132']);
export function renderPass15(row,{block,box,mesh,T}){
 const id=String(row.id);if(!PASS15_IDS.has(id))return false;
 const [L,R,z]={1536713:[-338.90,-333.48,-21.725],3000691:[-350.70,-345.53,-24.35],1050169:[-431.20,-416.83,-22.20],1519830:[-322.10,-316.74,-21.71],1536712:[-327.96,-322.28,-21.72],1007132:[-272.21,-266.79,-22.22]}[id];
 const w=R-L,H=row.h,x=f=>L+w*f;
 const ivory=0xd6d4ca,dark=0x353d3e,glass=0x536e7a,cream=0xc8bba7;
 const rect=(f,y,ww,hh,c,p=.08,d=.30)=>box(x(f),y,z+p,w*ww,hh,d,c);
 const band=(y,hh,c,ww=.98,p=.08,d=.30)=>rect(.5,y,ww,hh,c,p,d);
 const mass=(c,h=H)=>{for(const p of row.polys){block(p,h,c);block(p,.13,0x565653,h-.07);}};
 const panel=(f,y,ww,hh,c,p=.09,d=.32)=>rect(f,y,ww,hh,c,p,d);
 const sash=(f,y,ww,hh,front=.22,frame=ivory,pane=glass,split=true)=>{
   rect(f,y,ww+.035,hh+.13,frame,front-.12,.34);
   rect(f,y,ww,hh,pane,front+.02,.14);
   if(split)rect(f,y-.06,ww,.05,frame,front+.11,.09);
   rect(f,y-hh*.54,ww+.045,.11,frame,front-.02,.46);
 };
 const brick=(f,ww,lo,hi,c)=>{for(let y=lo+.14;y<hi;y+=.23)rect(f,y,ww,.021,c,.10,.25);};
 const cornice=(top,c=0x6d6055)=>{band(top-.15,.29,c,.98,.15,.50);band(top-.42,.17,c,.96,.15,.42);band(top-.61,.26,c,.95,.12,.40);for(let j=0;j<20;j++)rect(.04+.92*j/19,top-.58,.025,.25,c,.23,.38);};
 const storefront=(f,ww,y=1.50,h=2.8,front=.24)=>{sash(f,y,ww,h,front,dark,glass,false);for(let j=1;j<3;j++)rect(f-ww/2+ww*j/3,y,.009,h,dark,front+.10,.10);rect(f,y+h*.25,ww,.05,dark,front+.10,.10);};
 const door=(f,ww,y=1.37,h=2.60,front=.24,pane=glass)=>{sash(f,y,ww,h,front,dark,pane,false);rect(f+ww*.30,y-.1,.011,.16,ivory,front+.10,.12);};
 if(id==='1536713'){
  // 2251: distinct brick base and pale paneled upper front, with warm horizontal spandrels.
  mass(0x8e6655);
  // 2022 LoopNet listing shows continuous brown brick across the ground floor.
  // Existing GIS and upper floor arrangement are preserved; the brick skin
  // overlaps the main wall and replaces schematic horizontal mortar stripes.
  const skin=[[[L+.025,z-.12],[R-.025,z-.12],[R-.025,z+.12],[L+.025,z+.12],[L+.025,z-.12]]];
  block(skin,4.5,0x89665e,0,{wallFinish:"broad-2251-brick"});
  band((4.5+H)/2,H-4.5,ivory,.98,.11,.38);
  for(let j=1;j<4;j++)rect(j/4,(4.5+H)/2,.006,H-4.5,0xa9a89d,.31,.08);
  for(const [lo,hi] of [[7.15,8.85],[11.75,13.45]]){band((lo+hi)/2,hi-lo,0xb87855,.94,.25,.20);for(let y=lo+.15;y<hi;y+=.23)band(y,.022,0x996f56,.94,.36,.08);}
  for(const y of [6.05,10.25])for(const f of [.30,.72])sash(f,y,.27,2.10,.43,0xe3e1d9,0x57727c,false);
  band(H-.13,.25,0xc9c8c0,.98,.23,.44);
  // The photo shows a separate glazed apartment entry on the left and a
  // two-light storefront with its glazed right entry in the same frame.
  // Model silver aluminum and transoms; these are relief glazing, not holes.
  const aluminum=0xb8c2c5,pane=0x52646a;
  const glazed=(f,ww,kind)=>{
   const y=1.53,hh=2.94;
   rect(f,y,ww+.020,hh+.10,aluminum,.10,.30);
   rect(f,y,ww-.018,hh-.10,pane,.263,.08);
   rect(f,2.33,ww,.065,aluminum,.315,.09);
   if(kind==='display')rect(f,y,.012,hh-.06,aluminum,.315,.09);
   else{
    rect(f,1.09,ww,.065,aluminum,.315,.09);
    rect(f+ww*.33,1.15,.012,.20,aluminum,.338,.10);
   }
  };
  glazed(.25,.25,'entry');glazed(.605,.36,'display');glazed(.865,.16,'entry');
  // Supported storefront mullion/jamb connects the display bank to right entry.
  rect(.785,1.53,.016,3.04,aluminum,.235,.23);
  // Small red fire-department connection and backing observed between entries.
  rect(.411,.66,.075,.12,0xb64139,.17,.28);
  rect(.411,.66,.030,.09,0xa9aeab,.34,.09);
  // The listing image itself identifies 2251 on the left door. Restore
  // its address plaque, aluminum kick plates, intercom, alarm and FDC label.
  // These are small solid reliefs embedded in the existing glass or brick.
  for(const [f,ww] of [[.25,.25],[.865,.16]]){
   rect(f,.22,ww-.018,.20,0xaab5b8,.315,.09);
   const handle=f+ww*.33;
   rect(handle,1.12,.012,.27,0xc4cbcc,.385,.08);
   for(const yy of [1.005,1.235])rect(handle,yy,.018,.045,0xc4cbcc,.343,.14);
  }
  rect(.25,2.12,.31/w,.12,0xe8e7df,.31,.06);
  const digitStrokes=[[0,.034,.040,.008],[.020,.017,.008,.034],[.020,-.017,.008,.034],[0,-.034,.040,.008],[-.020,-.017,.008,.034],[-.020,.017,.008,.034],[0,0,.040,.008]];
  const digits={2:[0,1,6,4,3],5:[0,5,6,2,3],1:[1,2]};
  [...'2251'].forEach((d,i)=>{for(const j of digits[d]){const [dx,dy,ww,hh]=digitStrokes[j];rect(.25+((i-1.5)*.064+dx)/w,2.12+dy,ww/w,hh,0x353737,.343,.022);}});
  rect(.411,1.43,.15/w,.105,0xeae7df,.17,.12);
  const letterStrokes=[[0,.031,.034,.008],[.017,.0155,.008,.031],[.017,-.0155,.008,.031],[0,-.031,.034,.008],[-.017,-.0155,.008,.031],[-.017,.0155,.008,.031],[0,0,.034,.008]];
  const letters={F:[0,5,6,4],D:[0,1,2,3,4,5],C:[0,3,4,5]};
  [...'FDC'].forEach((d,i)=>{for(const j of letters[d]){const [dx,dy,ww,hh]=letterStrokes[j];rect(.411+((i-1)*.044+dx)/w,1.43+dy,ww/w,hh,0xb02d32,.235,.025);}});
  rect(.092,1.47,.10/w,.24,0xb9bcb7,.18,.15);
  rect(.092,1.52,.048/w,.047,0x464a47,.265,.04);
  rect(.092,1.40,.043/w,.030,0x777e79,.265,.04);
  rect(.092,2.60,.12/w,.16,0xa73737,.18,.15);
  rect(.092,2.60,.05/w,.06,0xe1b5a5,.265,.04);
  return true;
 }
 if(id==='3000691'){
  // 2255: brick base/right strip; siding on left; cantilevered white bay, not flush windows.
  // Retain the previously photo-informed brick base/right strip and white bay.
  // Replace schematic horizontal lines with the shared meter-scaled brick material.
  // Hidden faces retain the existing color; exact masonry finish is provisional.
  for(const p of row.polys){block(p,H,0x985e4c,0,{wallFinish:"broad-2255-brick"});block(p,.13,0x565653,H-.07);}
  rect(.23,(3.7+H)/2,.42,H-3.7,0xd3d4cd,.10,.36);
  for(let y=3.83;y<H;y+=.19)rect(.23,y,.42,.025,0xb4b7b0,.29,.08);
  rect(.57,(4.10+H)/2,.46,H-4.10,0xe4e3dc,.45,1.10);
  for(let i=0;i<3;i++){
   const y=5.75+i*3.72;sash(.57,y,.30,1.77,1.05,0xe2e2d9,0x617b85,false);
   rect(.57,y,.009,1.77,0xe1e1d9,1.15,.09);
   for(const yy of [y-1.24,y+1.24])rect(.57,yy,.46,.025,0xc0c0b9,1.01,.075);
  }
  rect(.57,H-.03,.47,.17,0xdadbd5,.47,1.15);
  sash(.60,2.15,.30,1.65,.21,0x9d9e91,0x4c5350,false);
  for(let j=0;j<7;j++)rect(.47+j*.043,2.15,.008,1.65,0x414844,.32,.10);
  for(let j=0;j<6;j++)rect(.60,1.42+j*.29,.30,.035,0x414844,.32,.10);
  band(.56,.21,0xb0aaa0,.96,.17,.45);
  return true;
 }
 if(id==='1050169'){
  // Chapel October 2026: dark stone wall, cream projecting cornice, pale mansard with 2 x 3 dormer sashes.
  const eave=H*.81,roofH=H-eave;
  mass(0x304440,eave);for(let j=0;j<9;j++)rect((j+.5)/9,eave*.49,.107,eave*.96,0x344946+(j%3)*0x030302,.025,.18);
  for(let yy=.45;yy<eave-.7;yy+=.82)band(yy,.025,0x485955,.96,.10,.21);
  cornice(eave-.02,0xc3c2aa);
  for(const y of [eave*.50,eave*.75])for(const f of [.20,.39,.64,.83])sash(f,y,.092,1.8,.22,0xd4d4c9,0x829194);
  // Five arch heads: end door tympana and three central stained window arches.
  for(const f of [.10,.31,.50,.69,.90]){
   const ww=(f<.15||f>.85)?.135:.11,cy=3.05,r=w*ww/2;
   rect(f,cy,ww,1.9,0xb7b2a2,.11,.36);
   for(let j=0;j<12;j++){const t=(j+.35)/12;rect(f,cy+.91+t*r,ww*Math.sqrt(1-t*t),r/12+.04,0xc3bead,.12,.35);}
   if(f<.15||f>.85){rect(f,1.25,.12,2.42,ivory,.24,.22);for(const k of [-.037,-.014,.014,.037])rect(f+k,1.70,.014,1.15,glass,.36,.09);}
   else {rect(f,cy,ww*.78,1.66,0x85794e,.24,.21);for(let j=0;j<5;j++)rect(f,cy-.7+j*.34,ww*.78,.04,0xa6a06f,.35,.12);rect(f,cy,.005,1.67,0xc0b38e,.35,.12);}
  }
  rect(.5,eave*.40,.48,.64,0xcbb98c,.19,.42);
  // Closed stepped mansard follows footprint on front; six tall pale dormer windows in two attached groups.
  const depth=7.0,cz=z-3.80;
  for(let j=0;j<12;j++){const t=j/12;box(x(.5),eave+(j+.5)*roofH/12-.035,cz-.65*t,w*(.95-.09*t),roofH/12+.10,depth-2.2*t,0xb7b8a9);}
  for(const f of [.28,.72]){
   rect(f,eave+roofH*.50,.31,roofH*.94,0xc9c9b6,-.10,2.30);
   for(let j=-1;j<=1;j++){const ff=f+j*.091;sash(ff,eave+roofH*.52,.078,roofH*.49,1.02,0xd9dacb,0x829096,false);}
   rect(f,eave+roofH*.93,.34,.22,0xd1d0b7,.24,1.85);
   for(let j=0;j<8;j++)rect(f,eave+roofH*.98+j*.095,.18*(1-j/8),.20,0xc8c6ae,.24,.62);
  }
  for(const f of [.05,.50,.95]){rect(f,eave+roofH*.49,.045,roofH*1.08,0xc9c7b0,.09,.65);rect(f,H+.06,.052,.36,0xc9c7b0,.09,.60);}
  return true;
 }
 if(id==='1519830'||id==='1536712'){
  // 2245 beige facade with boarded lower glazing in 2025, 2026 shows dark central entry;
  // 2247 pale painted facade with children's shop sign and guarded storefront.
  const first=id==='1519830',c=first?0xb8a992:0xb3b9b3;
  mass(c);
  // The 2020 group listing and later 2243 listing show the same adjoining
  // tan and blue-gray elevations. Street order from the identified 2243
  // fixes the pair as 2245/2247. Do not reuse historical tenant signs.
  const eave=H-.05,paint=first?0x665248:0x71564f;
  cornice(eave,paint);
  // Project the lower dentils beyond the cornice fascia so they remain
  // visible instead of being buried in the continuous frieze.
  band(eave-.88,.16,paint,.96,.14,.43);
  for(let j=0;j<20;j++)rect(.045+.91*j/19,eave-.71,.020,.15,first?0x796356:0x86665e,.37,.19);
  // Distinct end brackets connect to the existing cornice, not to the neighbor.
  for(const f of [.045,.955])rect(f,eave-.44,.053,.68,paint,.28,.53);
  // Light facade skin only; side/rear finish is not established by the photos.
  const face=first?0xb8ad99:0xb0b7bb,joint=first?0xa69a87:0xa2a9ab;
  rect(.5,(3.95+eave-.94)/2,.975,eave-.94-3.95,face,.065,.18);
  for(const y of [H*.51,H*.79])for(const f of [.28,.72]){
   sash(f,y,.20,1.65,.21,first?0x74665b:ivory);
   rect(f,y+.96,.25,.14,face,.16,.42);
   rect(f,y-.94,.25,.105,first?0xa69a87:0xc6c6bd,.19,.40);
  }
  // Horizontal and vertical panel joints seen in the upper stone/painted face.
  // Confine each joint to the uninterrupted pier or spandrel area.
  band(H*.65,.032,joint,.95,.16,.040);
  for(const f of [.11,.50,.89])for(const y of [H*.51,H*.79])rect(f,y,.004,1.75,joint,.156,.035);
  band(H*.65-.09,.09,face,.96,.11,.36);
  band(1.78,3.56,first?0x947967:0x747d76,.98,.10,.40);
  if(first){door(.20,.23,1.45,2.82,.27,0x353f3e);for(const f of [.47,.76])sash(f,1.62,.21,2.55,.27,0x8c8174,0xa99e89,false);}
  else {storefront(.39,.60,1.56,2.75,.28);door(.80,.18,1.4,2.62,.28);rect(.5,3.68,.92,.72,0xc5b49a,.23,.50);rect(.5,3.68,.87,.55,0x9b3932,.48,.13);}
  band(3.22,.16,0x62594d,.96,.22,.51);
  return true;
 }
 if(id==='1007132'){
  // School-adjacent historic light stone building. 030412 directly shows facade;
  // tenant/sign attribution across 2227/2231 remains ambiguous, do not duplicate sign text.
  mass(0xc2b6a1);cornice(H-.05,0xb6aa96);
  for(let y=4.35;y<H-.75;y+=.60)band(y,.026,0xa89e8a,.96,.08,.24);
  for(const y of [H*.54,H*.80])for(const f of [.27,.73]){sash(f,y,.20,1.72,.22,0xd7d4c6);rect(f,y+.99,.28,.15,0xa69a85,.16,.39);rect(f,y-.99,.28,.15,0xa69a85,.16,.39);}
  band(1.50,3.0,0xa47961,.98,.08,.36);
  door(.77,.23,2.1,2.80,.26);sash(.26,2.1,.24,2.20,.25,ivory);rect(.48,3.75,.90,.75,0x35675a,.23,.52);
  for(let j=0;j<5;j++){const run=(5-j)*.26,ht=(j+1)*.16;rect(.77,ht/2,.34,ht,0xafa394,(run-.15)/2,run+.15);}
  return true;
 }
 return false;
}
