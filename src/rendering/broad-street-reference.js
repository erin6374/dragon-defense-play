// Broad Street frontage enrichment from user-supplied Google Street View snapshots
// (April 2025 & September 2026) and a satellite screenshot. This is decorative
// architecture over the structural shells, tuned to preserve the real hierarchy.
import * as THREE from 'three';
export function createBroadStreetReferenceFacades(scene, buildings){
 const root=new THREE.Group();root.name='BROAD-STREET-REFERENCE-2026';scene.add(root);
 const boxGeometry=new THREE.BoxGeometry(1,1,1),planeGeometry=new THREE.PlaneGeometry(1,1);
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.84,metalness:.05});
 const brickTrim=mat(0x4a302b),warmStone=mat(0xc9b9a0),ivory=mat(0xe6dfcf),alum=mat(0x8aa2a8),red=mat(0xb93f3d),dark=mat(0x2a2e31),gold=mat(0xb69a61),brownstoneSill=mat(0xb58f74),glass=mat(0x5c8793),shadow=mat(0x1b232b),green=mat(0x1a6a4b),blue=mat(0x1f4574),cream=mat(0xd5c7b1),black=mat(0x16181b),tan=mat(0x9e7454);
 const objects=[];
 function bx(parent,x,y,z,w,h,d,m){const o=new THREE.Mesh(boxGeometry,m);o.scale.set(w,h,d);o.position.set(x,y,z);parent.add(o);objects.push(o);return o;}
 function plane(parent,x,y,z,w,h,m){const o=new THREE.Mesh(planeGeometry,m);o.position.set(x,y,z);o.scale.set(w,h,1);parent.add(o);objects.push(o);return o;}
 function signTexture(lines,bg,fg){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,768,160);c.fillStyle=fg;c.font=lines.length>1?'bold 52px sans-serif':'bold 72px sans-serif';c.textAlign='center';c.textBaseline='middle';lines.forEach((line,i)=>c.fillText(line,384,lines.length>1?48+i*54:80,728));const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
 function makeSign(parent,b,text,bg,fg,y=2.5,wScale=.88,h=.95){const g=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(b.w*wScale,10),h),new THREE.MeshBasicMaterial({map:signTexture(text,bg,fg),side:THREE.DoubleSide,transparent:true}));g.position.set(b.x,y,b.front+.25);parent.add(g);objects.push(g);return g;}
 function stoop(parent,b,offsetX,width=1.5,depth=1.8,steps=3){for(let i=0;i<steps;i++)bx(parent,b.x+offsetX,.10+i*.10,b.front+.75+depth*.2*(steps-i),width+.2*i,.10,depth*.38,warmStone);}
 function awning(parent,b,offsetX,width,colorHex,text){bx(parent,b.x+offsetX,2.15,b.front+.62,width,.17,1.10,mat(colorHex));if(text){const t=makeSign(parent,{...b,x:b.x+offsetX,w:width},[text],'#00000000','#f6f1e3',2.17,.96,.42);t.position.z=b.front+1.12;}}
 const specs={
  'tech-freire-school':{type:'school',label:['TECH Freire Charter School'],bg:'#b89456',fg:'#fff6d8'},
  'united-fund-cream':{label:['United Fund','of Philadelphia, Inc.'],bg:'#19704c',fg:'#f9efcc',type:'cream'},
  'south-cream-rowhouse':{type:'stone'},
  'south-tan-brick':{type:'brick'},
  'south-modern-red-gray':{type:'modern'},
  'north-doll-museum':{label:['DOLL MUSEUM'],bg:'#1f5a41',fg:'#efe7bf',type:'store'},
  'south-dolmuseum-across-dauphin':{label:['DOLL MUSEUM'],bg:'#1f5a41',fg:'#efe7bf',type:'store'},
  'north-dauphin-historic-corner':{type:'stone'},
  'north-brownstone':{type:'brownstone'},
  'north-modern-white-red':{type:'modern2'},
  'north-red-brick-shop':{type:'brickShop'},
  'susquehanna-crown-chicken':{label:['CROWN CHICKEN & GRILL'],bg:'#8f2728',fg:'#fff8d9',type:'crown'}
 };
 const mapping=[];const externalFacadeNames=new Set();
 for(const b of buildings){const spec=specs[b.name];if(!spec)continue;const group=new THREE.Group();group.name='reference-facade-'+b.name;root.add(group);mapping.push({group,building:b});const z=b.front+.13; if(spec.label&&spec.type!=='school')makeSign(group,b,spec.label,spec.bg,spec.fg,b.h<8?3.2:2.30,spec.type==='crown'?.95:.9,spec.type==='crown'?.82:.95);
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
  else if(spec.type==='brownstone'){
   for(const y of [b.h-.24,b.h-.54,b.h/3+.18,b.h*2/3+.16])bx(group,b.x,y,z,b.w+.16,.13,.26,y>b.h*.8?brickTrim:gold);
   for(const side of [-1,1])bx(group,b.x+side*(b.w/2-.15),b.h*.52,z,.19,b.h*.92,.16,brickTrim);
   awning(group,b,0,b.w*.72,0x1f5c3b,'GRANDS AS PARENTS');
   stoop(group,b,-1.75,1.55,1.9,4); stoop(group,b,1.75,1.25,1.2,3);}
  else if(spec.type==='modern' || spec.type==='modern2'){
   const sideTrim=spec.type==='modern2'?ivory:red, middleDark=dark; for(const side of [-1,1]){bx(group,b.x+side*(b.w*.29),b.h*.48,z,.95,b.h*.84,.15,sideTrim);bx(group,b.x+side*(b.w*.17),b.h*.48,z,.72,b.h*.84,.14,spec.type==='modern2'?red:dark);} bx(group,b.x,b.h-.28,z,b.w*.95,.28,.22,ivory); bx(group,b.x,b.h*.5,z+.025,b.w*.13,b.h*.92,.075,middleDark); for(let row=0;row<Math.min(5,b.stories||5);row++){const y=(row+.5)*(b.h/(b.stories||5));bx(group,b.x,y,z+.04,b.w*.70,.12,.09,alum);} }
  else if(spec.type==='cream'){bx(group,b.x,b.h-.20,z,b.w+.16,.32,.28,warmStone);bx(group,b.x,3.65,z,b.w*.94,.20,.19,ivory);bx(group,b.x-1.15,1.15,z+.11,1.25,2.15,.06,glass);bx(group,b.x+1.10,1.15,z+.11,1.55,2.15,.06,glass);awning(group,b,0,b.w*.96,0x1c704a,'United Fund');}
  else if(spec.type==='stone'){bx(group,b.x,b.h-.22,z,b.w+.16,.30,.25,warmStone);bx(group,b.x,3.78,z,b.w*.94,.20,.20,ivory);stoop(group,b,0,1.55,1.7,4);} 
  else if(spec.type==='store'){bx(group,b.x,b.h-.16,z,b.w+.08,.2,.22,warmStone);bx(group,b.x,3.9,z,b.w*.95,.22,.25,alum);bx(group,b.x,1.48,z+.06,b.w*.82,2.55,.055,shadow);for(const dx of [-b.w*.23,0,b.w*.23])bx(group,b.x+dx,1.45,z+.14,b.w*.14,2.25,.06,glass);awning(group,b,0,b.w*.92,0x224d39,'DOLL MUSEUM');}
  else if(spec.type==='brickShop'){
   bx(group,b.x,b.h-.2,z,b.w+.18,.25,.28,brickTrim);
   bx(group,b.x,b.h*.68,z,b.w*.86,.14,.16,gold);
   awning(group,b,0,b.w*.92,0x1f3c6e,'MAXIMUS CARES');
   bx(group,b.x,1.40,z+.08,b.w*.82,2.35,.055,shadow);
   for(const dx of [-b.w*.26,b.w*.26])bx(group,b.x+dx,1.40,z+.14,b.w*.18,1.95,.06,glass);
  }
  else if(spec.type==='crown'){
   bx(group,b.x,b.h-.14,z,b.w+.06,.16,.22,warmStone);
   awning(group,b,0,b.w*.98,0x7c2424,'OPEN');
   bx(group,b.x,1.35,z+.06,b.w*.90,2.15,.055,shadow);
   for(const dx of [-b.w*.28,0,b.w*.28])bx(group,b.x+dx,1.35,z+.14,b.w*.16,1.95,.06,glass);
   // Prominent rooftop commercial billboard framing Broad & Susquehanna
   bx(group,b.x-b.w*.26,b.h+.65,b.front+.20,.16,1.32,.16,dark);
   bx(group,b.x+b.w*.26,b.h+.65,b.front+.20,.16,1.32,.16,dark);
   bx(group,b.x,b.h+.88,b.front+.18,b.w*.84,1.26,.08,dark);
   const bb=makeSign(group,{...b,x:b.x,w:b.w*.82},['PHILADELPHIA','COMMUNITY BOARD'],'#1a2838','#f5d272',b.h+.88,.96,1.18);
   bb.position.z=b.front+.24;
  }
  else if(spec.type==='brick'){bx(group,b.x,b.h-.2,z,b.w+.18,.25,.28,brickTrim);bx(group,b.x,b.h*.68,z,b.w*.86,.14,.16,gold);stoop(group,b,0,1.45,1.6,3);}
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
