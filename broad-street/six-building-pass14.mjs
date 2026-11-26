/** Pass14: six individually surveyed street-facing candidates. Source images
 * 030412/030432/030445/030946/031029/031111/031121, original capture 2025-04,
 * 2026-10 for 031121. Ratios are photo estimates, GIS polygons remain immutable.
 * Architectural details are solid relief with positive-volume mass contacts. */
export const PASS14_IDS=new Set(['1547386','1007134','1007133','1001197','1051326','1531017']);
export function renderPass14(row,{block,box,mesh,T}){
 const id=String(row.id);if(!PASS14_IDS.has(id))return false;
 const span={1547386:[-299.98,-288.49,-19.855],1007134:[-239.17,-233.01,-22.435],1007133:[-245.21,-239.17,-22.47],1001197:[-206.27,-200.69,-21.735],1051326:[-414.54,-394.09,-22.525],1531017:[-333.41,-328.06,-21.72]}[id];
 const [L,R,z]=span,W=R-L,x=f=>L+f*W,H=row.h;
 // Inset all finish geometry slightly at party walls; backing penetrates the source footprint.
 const rect=(f,y,w,h,c,p=.10,d=.38)=>box(x(f),y,z+p,W*w,h,d,c);
 const band=(y,h,c,w=.96,p=.10,d=.38)=>rect(.5,y,w,h,c,p,d);
 const mass=(c,h=H)=>{for(const p of row.polys){block(p,h,c);block(p,.14,0x555453,h-.08);}};
 const sash=(f,y,w,h,front=.20,frame=0xbfb8ac,glass=0x55717a)=>{
  rect(f,y,w+.035,h+.16,frame,front-.11,.36);rect(f,y,w,h,glass,front+.035,.12);
  rect(f,y-.12,w,.055,frame,front+.11,.08);rect(f,y+h*.25,w,.042,frame,front+.11,.08);
  rect(f,y-h*.55,w+.035,.13,frame,front-.02,.46);
 };
 const dark=0x303638,light=0xc3b6a0;
 const cornice=(top,c)=>{band(top-.16,.29,c,.98,.15,.51);band(top-.41,.18,c,.96,.14,.42);band(top-.65,.33,c,.95,.12,.40);for(let i=0;i<21;i++)rect(.045+i*.91/20,top-.68,.026,.27,c,.22,.36);};
 const stone=(c,doorSide,boarded=false)=>{
  mass(c);band(.38,.75,0x74584c,.95,.08,.34);band(1.02,.24,0x997966,.95,.12,.45);
  // Historic raised ground floor, individual rusticated blocks and continuous joints.
  for(let yy=1.25;yy<H-.90;yy+=.46){band(yy,.032,0x785f52,.96,.08,.24);for(let k=1;k<5;k++){let f=(k+((Math.round(yy/.46)%2)*.45))/5;if(f<.97)rect(f,yy+.20,.004,.39,0x806457,.08,.24);}}
  cornice(H-.10,0x514239);band(H*.40,.32,c,.96,.12,.43);band(H*.41,.11,0x776052,.96,.17,.43);for(let i=0;i<15;i++)rect(.05+i*.90/14,H*.385,.024,.24,0x816957,.16,.36);band(H*.68,.16,0x725b4e,.96,.10,.31);
  for(const y of [H*.55,H*.81])for(const f of [.27,.73]){
    sash(f,y,.205,1.65,.18,0xb7b1a3);rect(f,y+.94,.28,.19,0x806451,.15,.42);for(const s of [-1,1])rect(f+s*.13,y+.65,.04,.45,0x856b57,.14,.37);
  }
  const df=doorSide==='left'?.19:.81,fs=doorSide==='left'?[.51,.76]:[.24,.49];
  for(const f of fs){sash(f,2.57,.19,2.02,.18,0xb8a695,boarded?0xc4b9a4:0x4f626a);rect(f,3.77,.25,.19,0x826655,.16,.42);rect(f,.60,.18,.59,0x423b37,.12,.28);}
  rect(df,2.56,.235,2.85,0x9d7b66,.11,.43);rect(df,2.46,.175,2.65,boarded?0x896a56:0x353e3b,.29,.22);rect(df,4.04,.27,.21,0x74584a,.17,.43);
  if(boarded)for(let j=0;j<5;j++)rect(df,3.38+j*.10,.18,.065,0xd1c8b7,.40,.09);
  // Steps rise from sidewalk; each tread overlaps the riser behind and neighboring treads.
  const steps=5,run=.28,rise=.20,sw=.33;
  for(let j=0;j<steps;j++){let back=-.15,front=(steps-j)*run;rect(df,(j+1)*rise/2,sw,(j+1)*rise,boarded?0x9f9586:0xb39d88,(front+back)/2,front-back);}
  // Continuous lower stringer supports and connected handrail segments on either side.
  for(const f of [df-sw*.45,df+sw*.45]){for(let j=0;j<steps;j++){const zz=(steps-j)*run-.08,yy=(j+1)*rise;rect(f,yy+.48,.012,.98,0x3d3934,zz,.085);rect(f,yy+.91,.017,.11,0x3d3934,zz-run/2,.36);rect(f,yy+.81,.018,.25,0x3d3934,zz-run/2,.34);}}
  // Visible short end finials above historic cornice, kept inside lot width.
  for(const f of [.06,.94]){rect(f,H+.07,.04,.28,0x695346,.10,.38);rect(f,H+.26,.025,.14,0x695346,.10,.25);}
 };
 if(id==='1007134'||id==='1007133'||id==='1531017'){
   // Looking west on Broad, higher address is image-left. 2219 is adjacent to school; 2217 adjacent to vacant lot.
   // Image-left maps to smaller world x; 2219 entrance image-left, 2217 entrance image-right.
   stone(id==='1531017'?0x906e5a:id==='1007133'?0x8f6d57:0x92715b,id==='1007134'?'right':'left',id==='1531017');return true;
 }
 if(id==='1001197'){
  mass(0x995b43);for(let yy=.22;yy<H-.25;yy+=.23)band(yy,.024,0xa57d67,.97,.06,.25);
  for(let yy=.35;yy<H-.25;yy+=.46)for(let k=1;k<8;k++){let f=(k+(Math.round(yy/.46)%2)*.45)/8;if(f<.97)rect(f,yy,.004,.22,0xb18a72,.06,.24);}
  band(H-.14,.30,0x57463e,.97,.13,.39);
  for(const y of [H*.53,H*.79])for(const f of [.28,.72])sash(f,y,.19,1.56,.19,0xc3b6a6);
  // April 2025: large gray shutter, dark entry immediately to right, pale blank left panel.
  rect(.46,1.58,.52,2.98,0x40494a,.10,.39);rect(.46,1.58,.47,2.70,0x778184,.26,.16);
  for(let i=0;i<25;i++)rect(.46,.29+i*.108,.47,.026,0x9a9d99,.36,.09);
  rect(.81,1.49,.18,2.78,0x4c433b,.12,.41);rect(.81,1.49,.145,2.64,0x273330,.29,.18);
  rect(.10,1.32,.13,2.54,0xc5c0b1,.13,.30);
  band(3.31,.15,0x4f4840,.94,.21,.52);rect(.53,3.91,.73,.76,0x27312e,.14,.48); // blank sign substrate; lettering not certified
  return true;
 }
 if(id==='1547386'){
  // April 2025 and September 2026: three red-brick tiers below silver upper level,
  // continuous gray projecting center bay, one window to either side and three top windows.
  mass(0xa3634c);const topH=H*.185,topBase=H-topH-.25,ground=H*.195;
  band(topBase+topH/2,topH,0xaab0b0,.98,.10,.39);
  for(let k=1;k<11;k++)rect(k/11,topBase+topH/2,.003,topH,0x858d8d,.29,.075);
  for(let k=1;k<4;k++)band(topBase+topH*k/4,.035,0x858d8d,.98,.29,.075);
  // Overlapping front bay physically intersects the facade; projecting up to ~1.15 m.
  rect(.50,(topBase+ground)/2,.33,topBase-ground+.10,0x575e63,.44,1.14);
  for(let i=0;i<3;i++){
   const yy=ground+(i+.55)*(topBase-ground)/3;
   for(const f of [.17,.83])sash(f,yy,.18,2.03,.19,0x363f42);
   sash(.50,yy,.235,2.25,1.03,0x373f44,0x607d87);
   rect(.50,yy,.007,2.25,0x333c40,1.145,.10);
   rect(.50,yy-.47,.235,.065,0x333c40,1.145,.10);
   for(const f of [.34,.66])rect(f,yy,.006,3.4,0x42494d,.97,.10);
  }
  for(const f of [.19,.50,.81])sash(f,topBase+topH*.46,.19,topH*.51,.40,0x4a5254);
  for(let yy=ground+.15;yy<topBase;yy+=.24)for(const [f,w] of [[.167,.30],[.833,.30]])rect(f,yy,w,.021,0xad7c68,.065,.25);
  band(H-.12,.35,0xc6c7c4,.97,.52,1.42);for(let k=1;k<17;k++)rect(k/17,H-.32,.003,.07,0x888d8b,.63,1.20);
  band(ground-.10,.43,0x454a4b,.98,.14,.50);for(const f of [.14,.39,.64,.86]){rect(f,ground*.48,.22,ground*.91,0x334043,.13,.47);rect(f,ground*.48,.195,ground*.86,0x5d7880,.31,.16);rect(f,ground*.63,.195,.07,0x374145,.41,.10);rect(f,ground*.48,.007,ground*.86,0x374145,.41,.10);}
  rect(.14,ground*.40,.125,ground*.75,0x42565d,.44,.13);rect(.64,ground*.40,.125,ground*.75,0x42565d,.44,.13);
  return true;
 }
 // Philadelphia Electric Company: original front with 3 tall tripartite glass bays,
 // four fluted pilasters, decorative spandrels, and visible newer rooftop frame.
 if(id==='1051326'){
  const facadeH=H*.77,stoneColor=0xc7b89e,glass=0x537079;mass(stoneColor,facadeH);
  // Upper roof structure is set back inside source mass, avoiding party walls.
  const topZ=z-4.2,topDepth=6.8,roofY=facadeH+2.7;
  box(x(.5),facadeH+.22,topZ,W*.83,.60,topDepth,0xaaa7a0);
  box(x(.5),roofY,topZ,W*.83,.24,topDepth,0x333d3f);
  for(const f of [.10,.36,.64,.90])for(const zz of [topZ-topDepth*.43,topZ+topDepth*.43])box(x(f),(roofY+facadeH)/2,zz,.15,roofY-facadeH+.22,.15,0xa0a5a1);
  band(.55,1.1,0xb3a58e,.98,.12,.46);band(facadeH-.18,.35,stoneColor,.98,.20,.63);band(facadeH-.62,.22,0xab9c81,.98,.17,.48);band(facadeH-1.04,.60,0xb9ab93,.96,.12,.38);
  band(facadeH-1.65,.20,0x94856e,.97,.18,.50);
  for(let i=0;i<43;i++)rect(.035+i*.93/42,facadeH-1.73,.014,.16,0x9f9077,.28,.35);
  for(const f of [.055,.35,.65,.945]){
   rect(f,(facadeH-1.7)/2,.073,facadeH-1.7,stoneColor,.12,.52);
   for(let k=0;k<7;k++)rect(f+(k-3)*.009,(facadeH-2.6)/2+.35,.0035,facadeH-3.2,0x9b8d76,.40,.13);
   for(const yy of [.32,.80,facadeH-2.05,facadeH-1.76])rect(f,yy,.085,.21,0xb6a68a,.24,.60);
  }
  for(const f of [.205,.50,.795]){
   const ytop=facadeH-2.08,bot=.92,bayH=ytop-bot;
   rect(f,(ytop+bot)/2,.215,bayH,0x343e3e,.09,.45);
   for(const shift of [-.067,0,.067]){
    rect(f+shift,2.61,.061,3.10,glass,.33,.14);
    rect(f+shift,5.50,.061,2.08,glass,.33,.14);
    rect(f+shift,7.55,.061,1.42,0xb7c2ba,.33,.14);
    rect(f+shift,(ytop+8.38)/2,.061,ytop-8.58,glass,.33,.14);
   }
   for(const sh of [-.102,-.034,.034,.102])rect(f+sh,(ytop+bot)/2,.005,bayH,0x444c4a,.40,.14);
   for(const yy of [4.33,6.70,8.38,ytop-.24])rect(f,yy,.215,.15,0x383f3e,.39,.16);
   // gold meander band and small repeated rosette motifs at upper transom; simplified relief.
   for(let i=0;i<17;i++){const ff=f-.098+i*.01225;rect(ff,4.35,.007,.095,0xbfa465,.49,.11);rect(ff,ytop-.20,.007,.12,0xc9c4af,.49,.11);}
   for(let i=0;i<6;i++)rect(f-.086+i*.0344,7.56,.008,1.40,0x454e4b,.42,.13);
  }
  // central dark entrance with attached pediment; sign lettering left for canvas/solid text pass.
  rect(.5,1.70,.105,3.40,0x4b443c,.47,.36);rect(.5,1.60,.078,2.84,0x263334,.68,.15);rect(.5,3.58,.125,.46,0x54473b,.55,.37);
  for(let j=0;j<6;j++)rect(.5,3.84+j*.066,.15*(1-j/6),.10,0x5e5344,.52,.34);
  return true;
 }
 return false;
}
