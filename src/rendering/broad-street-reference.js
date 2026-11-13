// Broad Street frontage enrichment from user-supplied Google Street View snapshots
// (April 2025 & September 2026) and Google Earth 3D oblique views (Images 5 & 6).
// Real-world location: 2221 N Broad St, Philadelphia PA.
// Real hierarchy: Tech Freire Charter School in center (x=0);
// North side (x < 0): Grands As Parents (2227), Maximus Cares Foundation (2235-2239),
//   tan historic rowhouses, Philadelphia Doll Museum (2253), Dauphin corner & 2300 block;
// South side (x > 0): 2215 Brownstone, alley courtyard, 2210 modern apartment (white/red),
//   2206 brick deli shop, 2200 Crown Chicken with billboard, Susquehanna Ave,
//   Philadelphia Military Academy / Makkah Mosque institutional campus.
import * as THREE from 'three';

export function createBroadStreetReferenceFacades(scene, buildings){
 const root=new THREE.Group();root.name='BROAD-STREET-REFERENCE-2026';scene.add(root);
 const boxGeometry=new THREE.BoxGeometry(1,1,1),planeGeometry=new THREE.PlaneGeometry(1,1);
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.84,metalness:.05});
 const brickTrim=mat(0x4a302b),warmStone=mat(0xc9b9a0),ivory=mat(0xe6dfcf),alum=mat(0x8aa2a8),red=mat(0xb93f3d),dark=mat(0x2a2e31),gold=mat(0xb69a61),brownstoneSill=mat(0xb58f74),glass=mat(0x5c8793),shadow=mat(0x1b232b),green=mat(0x1a6a4b),blue=mat(0x1f4574),cream=mat(0xd5c7b1),black=mat(0x16181b),tan=mat(0x9e7454),slate=mat(0x38414a);
 const objects=[];
 function bx(parent,x,y,z,w,h,d,m){const o=new THREE.Mesh(boxGeometry,m);o.scale.set(w,h,d);o.position.set(x,y,z);parent.add(o);objects.push(o);return o;}
 function plane(parent,x,y,z,w,h,m){const o=new THREE.Mesh(planeGeometry,m);o.position.set(x,y,z);o.scale.set(w,h,1);parent.add(o);objects.push(o);return o;}
 function signTexture(lines,bg,fg){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,768,160);c.fillStyle=fg;c.font=lines.length>1?'bold 52px sans-serif':'bold 72px sans-serif';c.textAlign='center';c.textBaseline='middle';lines.forEach((line,i)=>c.fillText(line,384,lines.length>1?48+i*54:80,728));const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
 function makeSign(parent,b,text,bg,fg,y=2.5,wScale=.88,h=.95){const g=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(b.w*wScale,10),h),new THREE.MeshBasicMaterial({map:signTexture(text,bg,fg),side:THREE.DoubleSide,transparent:true}));g.position.set(b.x,y,b.front+.25);parent.add(g);objects.push(g);return g;}
 function stoop(parent,b,offsetX,width=1.5,depth=1.8,steps=3){for(let i=0;i<steps;i++)bx(parent,b.x+offsetX,.10+i*.10,b.front+.75+depth*.2*(steps-i),width+.2*i,.10,depth*.38,warmStone);}
 function awning(parent,b,offsetX,width,colorHex,text){bx(parent,b.x+offsetX,2.15,b.front+.62,width,.17,1.10,mat(colorHex));if(text){const t=makeSign(parent,{...b,x:b.x+offsetX,w:width},[text],'#00000000','#f6f1e3',2.17,.96,.42);t.position.z=b.front+1.12;}}

 const specs={
  'tech-freire-school':{type:'school',label:['TECH Freire Charter School'],bg:'#b89456',fg:'#fff6d8'},
  'united-fund-cream':{type:'grandsAsParents',label:['GRANDS AS PARENTS','FOUNDATION'],bg:'#19704c',fg:'#f9efcc'},
  'south-cream-rowhouse':{type:'maximusCares',label:['MAXIMUS CARES','FOUNDATION'],bg:'#1f4574',fg:'#f8edd0'},
  'south-tan-brick':{type:'tanHistoricRowhouse'},
  'north-doll-museum':{type:'dollMuseum',label:['DOLL MUSEUM'],bg:'#1f5a41',fg:'#efe7bf'},
  'north-dauphin-historic-corner':{type:'dauphinCorner',label:['HISTORIC CORNER','2300 BROAD'],bg:'#1e2936',fg:'#f8f0d8'},
  'south-dauphin-historic':{type:'dauphinCommerce',label:['PHILA COMMERCE','2300 BROAD'],bg:'#203042',fg:'#fff4cf'},
  'broad-north-historic-extension':{type:'historicExtension',label:['HISTORIC NORTH','BROAD CORRIDOR'],bg:'#342218',fg:'#f5e8c4'},
  'north-2300-historic-shop-1':{type:'apothecary',label:['BROAD APOTHECARY'],bg:'#1b4532',fg:'#f8edd0'},
  'north-2300-historic-shop-2':{type:'hardware',label:['NORTH BROAD HARDWARE'],bg:'#4a2820',fg:'#ffefc8'},
  'north-brownstone':{type:'brownstone'},
  'north-modern-white-red':{type:'modernApartment'},
  'north-red-brick-shop':{type:'deliMarket',label:['BROAD DELI & MARKET'],bg:'#7c2424',fg:'#fff4cf'},
  'susquehanna-crown-chicken':{type:'crown',label:['CROWN CHICKEN & GRILL'],bg:'#8f2728',fg:'#fff8d9'},
  'broad-south-low-institution':{type:'campusInstitution',label:['PHILADELPHIA','MILITARY ACADEMY'],bg:'#192738',fg:'#f5e6be'},
   'north-2300-historic-shop-3':{type:'dauphinCommerce',label:['KEYSTONE PRINTING','2320 BROAD'],bg:'#1e3226',fg:'#f8edd0'},
   'north-2300-corner-commercial':{type:'dauphinCorner',label:['NORTH BROAD PLAZA','2330 BROAD'],bg:'#202838',fg:'#fff4cf'},
   'north-2400-broad-station':{type:'dauphinCommerce',label:['BROAD & YORK','METRO STATION'],bg:'#1c2a38',fg:'#f5e8c4'},
   'north-york-commercial':{type:'dauphinCommerce',label:['YORK HARDWARE','2400 BROAD'],bg:'#342218',fg:'#ffefc8'},
   'south-temple-broad-corner':{type:'dauphinCorner',label:['TEMPLE CORNER','2130 BROAD'],bg:'#4a1820',fg:'#fff5d8'},
   'south-temple-broad-shop':{type:'dauphinCommerce',label:['UNIVERSITY DELI','2120 BROAD'],bg:'#1c2d42',fg:'#f8f0d8'},
   'south-norris-corner':{type:'dauphinCorner',label:['NORRIS PLAZA','2110 BROAD'],bg:'#282038',fg:'#f5ecd0'},
   'south-temple-campus-hall':{type:'campusInstitution',label:['TEMPLE UNIVERSITY','CAMPUS RESIDENCE'],bg:'#38141c',fg:'#f8edd0'},
   'south-diamond-corner':{type:'dauphinCorner',label:['BROAD & DIAMOND','COMMUNITY BANK'],bg:'#183226',fg:'#fff6d8'},
 };

 const mapping=[];const externalFacadeNames=new Set();
 for(const b of buildings){
  const spec=specs[b.name];if(!spec)continue;
  const group=new THREE.Group();group.name='reference-facade-'+b.name;root.add(group);
  mapping.push({group,building:b});
  const z=b.front+.13;
  if(spec.label&&spec.type!=='school'&&spec.type!=='crown'&&spec.type!=='grandsAsParents'&&spec.type!=='maximusCares'&&spec.type!=='campusInstitution')makeSign(group,b,spec.label,spec.bg,spec.fg,b.h<8?3.2:2.30,.9,.95);

  if(spec.type==='school'){
   const floorH=b.h/5;
   for(const edge of [-1,1])bx(group,b.x+edge*(b.w/2-.25),b.h*.52,z,.28,b.h*.96,.22,brickTrim);
   for(const xFrac of [-.25,0,.25])bx(group,b.x+b.w*xFrac,b.h*.56,z,.34,b.h*.90,.18,brickTrim);
   bx(group,b.x,floorH*1.15,z,b.w*.98,.34,.24,ivory);
   for(const y of [b.h-floorH*.22,b.h-floorH*1.22,b.h-floorH*2.22,b.h-floorH*3.22])bx(group,b.x,y,z,b.w*.96,.22,.20,brickTrim);
   const rows=[{y:2.15,h:4.1},{y:7.4,h:3.3},{y:12.3,h:3.15},{y:17.1,h:3.15},{y:21.8,h:2.75}];
   for(const row of rows)for(const x of [-b.w*.34,-b.w*.08,b.w*.18])bx(group,b.x+x,row.y,z+.08,b.w*.22,row.h,.05,glass);
   bx(group,b.x-b.w*.28,1.9,z+.11,b.w*.20,3.7,.06,glass);
   bx(group,b.x+b.w*.29,1.55,z+.48,b.w*.28,2.95,1.55,new THREE.MeshStandardMaterial({color:0x88a8ad,roughness:.15,metalness:.1,transparent:true,opacity:.42,depthWrite:false}));
   bx(group,b.x+b.w*.29,.18,z+1.12,b.w*.32,.16,2.35,warmStone);
   // Tech Freire Charter School central projecting entrance canopy and illuminated signage
   bx(group,b.x,3.45,b.front+1.05,b.w*.38,.20,1.85,ivory);
   bx(group,b.x,3.45,b.front+1.98,b.w*.38+.08,.24,.08,alum);
   bx(group,b.x-b.w*.16,1.72,b.front+1.90,.20,3.25,.20,alum);
   bx(group,b.x+b.w*.16,1.72,b.front+1.90,.20,3.25,.20,alum);
   bx(group,b.x,1.60,z+.18,b.w*.26,3.0,.08,glass);
   const sign=makeSign(group,{...b,x:b.x,w:b.w*.42},['TECH FREIRE','CHARTER SCHOOL'],'#1c2836','#fff5d0',3.85,.98,.76);
   sign.position.set(b.x,3.85,b.front+2.02);
   stoop(group,b,-b.w*.29,1.6,2.2,4);
  }
  else if(spec.type==='grandsAsParents'){
   // 2227 N Broad (immediately North of Tech Freire): Grands As Parents Foundation
   bx(group,b.x,b.h-.22,z,b.w+.16,.30,.25,warmStone);
   bx(group,b.x,b.h*2/3,z,b.w+.08,.16,.20,warmStone);
   awning(group,b,0,b.w*.88,0x1a6a4b,'GRANDS AS PARENTS');
   makeSign(group,b,['GRANDS AS PARENTS','FOUNDATION'],'#184e36','#fff7de',3.15,.92,.72);
   for(let floor=1;floor<b.stories;floor++){
    const y=(floor+.62)*(b.h/b.stories);
    for(const dx of [-b.w*.26,b.w*.26]){
     bx(group,b.x+dx,y+.82,z+.08,1.45,.22,.28,warmStone);
     bx(group,b.x+dx,y-.82,z+.08,1.45,.14,.26,brownstoneSill);
     bx(group,b.x+dx,y,z+.04,1.25,1.5,.05,glass);
    }
   }
   bx(group,b.x,1.42,z+.06,b.w*.84,2.4,.05,shadow);
   bx(group,b.x-b.w*.24,1.38,z+.12,1.2,2.0,.06,glass);
   bx(group,b.x+b.w*.24,1.38,z+.12,1.2,2.0,.06,glass);
   stoop(group,b,b.w*.22,1.55,1.8,4);
  }
  else if(spec.type==='maximusCares'){
   // 2235-2239 N Broad: Maximus Cares Foundation
   bx(group,b.x,b.h-.20,z,b.w+.18,.28,.26,ivory);
   awning(group,b,0,b.w*.92,0x1f4574,'MAXIMUS CARES');
   makeSign(group,b,['MAXIMUS CARES','FOUNDATION'],'#163259','#f5edd6',3.1,.92,.68);
   bx(group,b.x,1.42,z+.06,b.w*.88,2.4,.055,shadow);
   for(const dx of [-b.w*.28,0,b.w*.28])bx(group,b.x+dx,1.40,z+.14,b.w*.22,2.05,.06,glass);
   for(let floor=1;floor<b.stories;floor++){
    const y=(floor+.62)*(b.h/b.stories);
    for(const dx of [-b.w*.25,b.w*.25]){
     bx(group,b.x+dx,y+.82,z+.08,1.5,.20,.26,ivory);
     bx(group,b.x+dx,y-.82,z+.08,1.5,.12,.24,warmStone);
     bx(group,b.x+dx,y,z+.04,1.3,1.5,.05,glass);
    }
   }
  }
  else if(spec.type==='tanHistoricRowhouse'){
   // 2243-2247 N Broad: Historic tan brick rowhouse
   bx(group,b.x,b.h-.22,z,b.w+.20,.32,.30,warmStone);
   for(let k=0;k<5;k++)bx(group,b.x+(k-2)*(b.w*.22),b.h-.42,z+.08,.22,.32,.24,warmStone);
   bx(group,b.x,b.h*.66,z,b.w+.10,.14,.18,gold);
   for(let floor=1;floor<b.stories;floor++){
    const y=(floor+.60)*(b.h/b.stories);
    for(const dx of [-b.w*.26,b.w*.26]){
     bx(group,b.x+dx,y+.80,z+.08,1.55,.24,.28,warmStone);
     bx(group,b.x+dx,y-.80,z+.08,1.55,.14,.26,warmStone);
     bx(group,b.x+dx,y,z+.04,1.35,1.45,.05,glass);
    }
   }
   bx(group,b.x-b.w*.22,1.4,z+.08,1.3,2.2,.06,dark);
   bx(group,b.x+b.w*.22,1.4,z+.08,1.5,2.0,.06,glass);
   stoop(group,b,-b.w*.22,1.6,1.9,4);
  }
  else if(spec.type==='dollMuseum'){
   // 2253 N Broad: Philadelphia Doll Museum (4 stories)
   bx(group,b.x,b.h-.18,z,b.w+.22,.32,.32,warmStone);
   for(let k=0;k<6;k++)bx(group,b.x+(k-2.5)*(b.w*.18),b.h-.38,z+.09,.20,.30,.22,brickTrim);
   awning(group,b,0,b.w*.92,0x1f5a41,'PHILADELPHIA DOLL MUSEUM');
   makeSign(group,b,['PHILADELPHIA','DOLL MUSEUM'],'#184532','#f8eed2',3.65,.92,.85);
   bx(group,b.x,1.45,z+.06,b.w*.84,2.45,.06,shadow);
   for(const dx of [-b.w*.26,0,b.w*.26])bx(group,b.x+dx,1.42,z+.14,b.w*.18,2.05,.06,glass);
   for(let floor=1;floor<b.stories;floor++){
    const y=(floor+.58)*(b.h/b.stories);
    for(const dx of [-b.w*.30,0,b.w*.30]){
     bx(group,b.x+dx,y+.78,z+.08,1.35,.22,.28,brickTrim);
     bx(group,b.x+dx,y-.78,z+.08,1.35,.14,.26,warmStone);
     bx(group,b.x+dx,y,z+.04,1.15,1.4,.05,glass);
    }
   }
   stoop(group,b,-b.w*.28,1.45,1.8,4);
  }
  else if(spec.type==='dauphinCorner'){
   // 2300 Block North Broad corner building with mansard roof & projecting bays
   bx(group,b.x,b.h+.65,b.front-.2,b.w*.94,1.3,b.d*.4,slate);
   bx(group,b.x,b.h+1.32,b.front+.12,b.w*.96,.18,.14,gold);
   bx(group,b.x,b.h-.22,z,b.w+.28,.36,.36,warmStone);
   for(let k=0;k<6;k++)bx(group,b.x+(k-2.5)*(b.w*.18),b.h-.45,z+.12,.22,.36,.26,warmStone);
   for(const side of [-1,1]){
    const bxPos=b.x+side*(b.w*.28);
    bx(group,bxPos,b.h*.52,b.front+.42,b.w*.28,b.h*.58,.58,warmStone);
    bx(group,bxPos,b.h*.52,b.front+.68,b.w*.24,b.h*.52,.08,glass);
   }
   bx(group,b.x,1.45,z+.08,b.w*.88,2.45,.06,shadow);
   for(const dx of [-b.w*.30,0,b.w*.30])bx(group,b.x+dx,1.42,z+.15,b.w*.22,2.05,.06,glass);
   awning(group,b,0,b.w*.94,0x243242,'BROAD & DAUPHIN');
   makeSign(group,b,['HISTORIC CORNER','2300 BROAD'],'#1e2936','#f8f0d8',b.h<8?3.2:2.45,.92,.85);
  }
  else if(spec.type==='dauphinCommerce'){
   // 2308-2312 N Broad commercial frontage
   bx(group,b.x,b.h-.20,z,b.w+.18,.30,.30,warmStone);
   bx(group,b.x,1.45,z+.06,b.w*.86,2.4,.06,shadow);
   for(const dx of [-b.w*.26,0,b.w*.26])bx(group,b.x+dx,1.42,z+.14,b.w*.18,2.05,.06,glass);
   awning(group,b,0,b.w*.92,0x203042,'PHILA COMMERCE');
   makeSign(group,b,['PHILA COMMERCE','2300 BROAD'],'#203042','#fff4cf',b.h<8?3.2:2.4,.92,.85);
  }
  else if(spec.type==='historicExtension'){
   // Historic North Broad masonry extension
   bx(group,b.x,b.h-.20,z,b.w+.18,.30,.30,warmStone);
   bx(group,b.x,3.75,z,b.w*.92,.20,.20,ivory);
   stoop(group,b,0,1.55,1.7,4);
   makeSign(group,b,['HISTORIC NORTH','BROAD CORRIDOR'],'#342218','#f5e8c4',b.h<8?3.2:2.4,.92,.85);
  }
  else if(spec.type==='apothecary'){
   // 2300 block historic apothecary
   bx(group,b.x,b.h-.20,z,b.w+.18,.28,.28,brickTrim);
   awning(group,b,0,b.w*.92,0x1b4532,'BROAD APOTHECARY');
   makeSign(group,b,['BROAD APOTHECARY','EST. 1898'],'#1b4532','#f8edd0',b.h<8?3.2:2.4,.92,.85);
   bx(group,b.x,1.42,z+.08,b.w*.86,2.35,.055,shadow);
   for(const dx of [-b.w*.26,b.w*.26])bx(group,b.x+dx,1.40,z+.14,b.w*.22,1.95,.06,glass);
   for(let floor=1;floor<b.stories;floor++){
    const y=(floor+.60)*(b.h/b.stories);
    for(const dx of [-b.w*.26,b.w*.26]){
     bx(group,b.x+dx,y+.75,z+.08,1.4,.20,.26,gold);
     bx(group,b.x+dx,y-.75,z+.08,1.4,.12,.24,warmStone);
     bx(group,b.x+dx,y,z+.04,1.2,1.4,.05,glass);
    }
   }
  }
  else if(spec.type==='hardware'){
   // 2300 block historic hardware
   bx(group,b.x,b.h-.20,z,b.w+.18,.30,.30,warmStone);
   awning(group,b,0,b.w*.92,0x4a2820,'NORTH BROAD HARDWARE');
   makeSign(group,b,['NORTH BROAD','HARDWARE & SUPPLY'],'#4a2820','#ffefc8',b.h<8?3.2:2.4,.92,.85);
   bx(group,b.x,1.42,z+.08,b.w*.86,2.35,.055,shadow);
   for(const dx of [-b.w*.26,b.w*.26])bx(group,b.x+dx,1.40,z+.14,b.w*.22,1.95,.06,glass);
  }
  else if(spec.type==='brownstone'){
   // 2215 N Broad (immediately South of Tech Freire): Pure Philadelphia brownstone
   bx(group,b.x,b.h-.24,z,b.w+.24,.36,.36,brickTrim);
   bx(group,b.x,b.h-.52,z,b.w+.14,.16,.28,brownstoneSill);
   for(let k=0;k<6;k++)bx(group,b.x+(k-2.5)*(b.w*.18),b.h-.40,z+.10,.20,.24,.24,brownstoneSill);
   for(let floor=1;floor<b.stories;floor++){
    const y=(floor+.62)*(b.h/b.stories);
    for(const dx of [-b.w*.26,b.w*.26]){
     bx(group,b.x+dx,y+.82,z+.10,1.65,.26,.32,brickTrim);
     bx(group,b.x+dx,y-.82,z+.10,1.65,.16,.30,brownstoneSill);
     bx(group,b.x+dx,y,z+.04,1.35,1.5,.05,glass);
    }
   }
   bx(group,b.x-b.w*.24,1.7,z+.06,1.4,2.5,.12,dark);
   bx(group,b.x-b.w*.24,2.8,z+.14,1.55,.32,.22,brickTrim);
   stoop(group,b,-b.w*.24,1.8,2.2,4);
   stoop(group,b,b.w*.24,1.4,1.6,3);
  }
  else if(spec.type==='modernApartment'){
   // 2210 N Broad: Striking 5-story modern apartment with white panels & bold red accents
   for(const side of [-1,1]){
    bx(group,b.x+side*(b.w*.32),b.h*.50,z+.08,.95,b.h*.94,.20,red);
    bx(group,b.x+side*(b.w*.16),b.h*.50,z+.06,.75,b.h*.90,.16,ivory);
   }
   bx(group,b.x,b.h-.25,z+.08,b.w*.98,.32,.24,ivory);
   bx(group,b.x,b.h*.50,z+.04,b.w*.14,b.h*.94,.08,dark);
   for(let row=0;row<5;row++){
    const y=(row+.5)*(b.h/5);
    bx(group,b.x,y,z+.06,b.w*.78,.14,.12,alum);
    for(const dx of [-b.w*.22,b.w*.22])bx(group,b.x+dx,y,z+.04,b.w*.18,b.h/6,.05,glass);
   }
   bx(group,b.x,1.45,z+.10,b.w*.65,2.4,.10,glass);
   bx(group,b.x,2.7,z+.20,b.w*.72,.14,.8,alum);
  }
  else if(spec.type==='deliMarket'){
   // 2206 N Broad: Brick commercial storefront
   bx(group,b.x,b.h-.20,z,b.w+.18,.26,.28,brickTrim);
   awning(group,b,0,b.w*.92,0x7c2424,'BROAD DELI & MARKET');
   makeSign(group,b,['BROAD DELI','& CONVENIENCE'],'#1a2430','#fff4cf',b.h<8?3.2:2.4,.92,.85);
   bx(group,b.x,1.40,z+.08,b.w*.84,2.35,.055,shadow);
   for(const dx of [-b.w*.26,b.w*.26])bx(group,b.x+dx,1.40,z+.14,b.w*.20,1.95,.06,glass);
  }
  else if(spec.type==='crown'){
   // 2200 N Broad: Crown Chicken & Grill corner commercial building with rooftop billboard
   bx(group,b.x,b.h-.14,z,b.w+.06,.16,.22,warmStone);
   awning(group,b,0,b.w*.98,0x7c2424,'CROWN CHICKEN & GRILL');
   bx(group,b.x,1.35,z+.06,b.w*.90,2.15,.055,shadow);
   for(const dx of [-b.w*.28,0,b.w*.28])bx(group,b.x+dx,1.35,z+.14,b.w*.16,1.95,.06,glass);
   // Prominent rooftop commercial billboard framing Broad & Susquehanna
   bx(group,b.x-b.w*.26,b.h+.65,b.front+.20,.16,1.32,.16,dark);
   bx(group,b.x+b.w*.26,b.h+.65,b.front+.20,.16,1.32,.16,dark);
   bx(group,b.x,b.h+.88,b.front+.18,b.w*.84,1.26,.08,dark);
   const bb=makeSign(group,{...b,x:b.x,w:b.w*.82},['PHILADELPHIA','COMMUNITY BOARD'],'#1a2838','#f5d272',b.h+.88,.96,1.18);
   bb.position.z=b.front+.24;
  }
  else if(spec.type==='campusInstitution'){
   // South of Susquehanna: Philadelphia Military Academy / Makkah Mosque campus
   bx(group,b.x,b.h-.20,z+.10,b.w+.24,.36,.36,warmStone);
   bx(group,b.x,b.h*.55,z+.08,b.w+.12,.18,.24,ivory);
   bx(group,b.x,2.2,b.front+.25,4.5,4.0,.35,warmStone);
   bx(group,b.x,1.8,b.front+.30,2.8,3.2,.08,dark);
   bx(group,b.x,3.6,b.front+.32,3.2,.45,.28,gold);
   makeSign(group,{...b,x:b.x,w:6},['PHILADELPHIA','MILITARY ACADEMY'],'#192738','#f5e6be',4.1,.95,.75);
   for(let bay=-3;bay<=3;bay++){
    if(Math.abs(bay)<=1)continue;
    const wx=b.x+bay*(b.w*.13);
    bx(group,wx,2.8,b.front+.14,2.2,2.8,.20,warmStone);
    bx(group,wx,2.8,b.front+.18,1.8,2.4,.06,glass);
   }
   bx(group,b.x,.5,10.2,b.w+4,.95,.42,warmStone);
   bx(group,b.x,1.0,10.2,b.w+4.2,.12,.48,ivory);
   bx(group,b.x,-.28,6.0,b.w+2,.12,8.0,green);
  }

  // Decorative signs, trim, glass and stoops lose visibility when their
  // nearest physical facade support detaches. Bind once during construction.
  const supports=b.sections?.length?b.sections:(b.structuralParts||[]);
  const bindings=[];
  group.traverse(mesh=>{
   if(!mesh.isMesh)return;
   let support=null,nearest=Infinity;
   for(const part of supports){
    const p=part.original?.position||part.position;
    if(!p)continue;
    const dx=mesh.position.x-p.x,dy=mesh.position.y-p.y,dz=mesh.position.z-p.z;
    const dist=dx*dx+dy*dy*.8+dz*dz*.18;
    if(dist<nearest){nearest=dist;support=part;}
   }
   bindings.push({mesh,support});
  });
  mapping[mapping.length-1].bindings=bindings;
 }

 function synchronize(entry){
  const {group,building,bindings}=entry;
  group.visible=building.damage<.74&&!externalFacadeNames.has(building.name);
  if(!group.visible)return;
  for(const {mesh,support} of bindings)mesh.visible=!support||support.state==='attached';
 }

 return {root,referenceBuildings:mapping.length,drawObjects:objects.length,
  update(){for(const entry of mapping)synchronize(entry);},
  setExternalFacade(name,loaded){if(loaded)externalFacadeNames.add(name);else externalFacadeNames.delete(name);
   for(const entry of mapping)if(entry.building.name===name)synchronize(entry);},
  snapshots:()=>mapping.map(({group,building,bindings})=>({building:building.name,damage:building.damage,
   visible:group.visible,decorations:bindings.length,
   unsupported:bindings.filter(x=>x.support&&x.support.state!=='attached').length,
   unsupportedVisible:bindings.filter(x=>x.support&&x.support.state!=='attached'&&x.mesh.visible&&group.visible).length}))};
}
