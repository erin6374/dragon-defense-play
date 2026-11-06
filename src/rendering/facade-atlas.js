
// v4.2: richer handcrafted facade atlas. Windows are painted into an opaque facade
// surface with deeper reveals, cornices, signage, awnings, and interior glow.
export function createFacadeAtlas(THREE,{seed=0,stories=3,bays=3,kind='brick',color='#916e5c',store=false,background=false}){
 const W=background?512:1024,H=background?768:1536,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d');let z=(seed*1103515245+12345)>>>0;
 const rnd=()=>((z=Math.imul(z,1664525)+1013904223>>>0)/4294967296);
 const clamp=v=>Math.max(0,Math.min(255,v|0));
 const hexToRgb=hex=>{const n=parseInt(hex.replace('#',''),16);return [n>>16&255,n>>8&255,n&255]};
 const tint=(hex,m=1,a=1)=>{const [r,g,b]=hexToRgb(hex);return `rgba(${clamp(r*m)},${clamp(g*m)},${clamp(b*m)},${a})`;};
 const rgb=(r,g,b,a=1)=>`rgba(${clamp(r)},${clamp(g)},${clamp(b)},${a})`;
 const fill=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
 const stroke=(x,y,w,h,col,lw=1)=>{c.strokeStyle=col;c.lineWidth=lw;c.strokeRect(x,y,w,h)};
 
 // Base facade gradient and subtle toning.
 const bg=c.createLinearGradient(0,0,0,H);
 bg.addColorStop(0,tint(color,.92)); bg.addColorStop(.38,tint(color,1.03)); bg.addColorStop(1,tint(color,.78));
 fill(0,0,W,H,bg);
 
 // Material-specific patterning.
 if(kind==='brick'){
  const bw=58,bh=24;
  for(let row=0; row<H/bh+2; row++){
   const y=row*bh, offset=(row%2)*bw*.5;
   for(let x=-bw; x<W+bw; x+=bw){
    const xx=x+offset;
    fill(xx,y,bw-2,bh-2,tint(color,.80+rnd()*.34));
    fill(xx,y+bh-4,bw-2,2,'rgba(0,0,0,.10)');
    if(rnd()>.82) fill(xx+5,y+4,bw-12,2,'rgba(255,255,255,.10)');
    if(rnd()>.93) fill(xx+bw*.2,y+bh*.35,bw*.5,3,'rgba(35,20,15,.18)');
   }
  }
  // mortar joints
  for(let y=0;y<H;y+=bh) fill(0,y,W,2,'rgba(210,196,180,.10)');
 }else if(kind==='modern'){
  for(let y=0;y<H;y+=128){ fill(0,y,W,2,'rgba(255,255,255,.08)'); }
  for(let x=0;x<W;x+=90){ fill(x,0,2,H,'rgba(245,245,245,.06)'); }
  for(let i=0;i<6200;i++) fill(rnd()*W,rnd()*H,1+rnd()*2,1+rnd()*2,'rgba(12,18,28,.025)');
 }else{
  for(let y=0;y<H;y+=132){ fill(0,y,W,2,tint(color,.71,.75)); }
  for(let x=-60;x<W+60;x+=225){ fill(x,0,2,H,'rgba(50,44,40,.07)'); }
  for(let i=0;i<7200;i++) fill(rnd()*W,rnd()*H,1+rnd()*2,1+rnd()*2,'rgba(30,22,18,.04)');
 }
 
 // General weathering / subtle city grime.
 const grime=c.createLinearGradient(0,0,0,H);
 grime.addColorStop(0,'rgba(255,255,255,.04)');
 grime.addColorStop(.35,'rgba(0,0,0,.02)');
 grime.addColorStop(.78,'rgba(0,0,0,.06)');
 grime.addColorStop(1,'rgba(12,13,18,.18)');
 fill(0,0,W,H,grime);
 
 // Roof/parapet and base.
 fill(0,0,W,16,tint(color,.60));
 fill(0,16,W,10,tint(color,1.18));
 fill(0,H-66,W,66,tint(color,.64));
 
 const rowH=H/stories;
 for(let floor=0; floor<stories; floor++){
  const y0=floor*rowH;
  const topBand=y0+8;
  if(floor>0){
   fill(0,topBand,W,8,tint(color,.80));
   fill(0,topBand+8,W,2,'rgba(250,245,237,.20)');
  }
  for(let col=0; col<bays; col++){
   const colW=W/bays;
   const center=(col+.5)*colW;
   const modern=kind==='modern';
   const winW=colW*(modern?.76:.54);
   const winH=rowH*(store&&floor===stories-1?.68:modern?.60:.48);
   const x=center-winW/2;
   const y=y0+rowH*.28+(modern?0:6);
   // Stone/trim reveal
   fill(x-18,y-20,winW+36,winH+38,tint(color,kind==='brick'?1.22:.88));
   fill(x-10,y-10,winW+20,winH+18,'rgba(20,24,30,.82)');
   fill(x-7,y-7,winW+14,winH+14,'rgba(10,14,20,.92)');
   // Glass body
   const glass=c.createLinearGradient(x,y,x+winW,y+winH);
   glass.addColorStop(0,rnd()>.5?'#6d8ea3':'#3a5467');
   glass.addColorStop(.35,'#243847');
   glass.addColorStop(.72,'#4a6776');
   glass.addColorStop(1,'#89a8b8');
   fill(x,y,winW,winH,glass);
   // Room cards / interior variation
   const lit=rnd()>.46;
   if(lit){
    fill(x+8,y+winH*.44,winW-16,winH*.48,'rgba(124,97,64,.75)');
    fill(x+8,y+winH*.43,winW-16,4,'rgba(241,213,161,.58)');
    if(rnd()>.42){
     fill(x+14,y+winH*.16,winW*.20,winH*.18,'rgba(245,207,136,.55)');
     fill(x+winW*.58,y+winH*.18,winW*.15,winH*.13,'rgba(212,227,244,.18)');
    }
   }
   // Mullions and reflections
   fill(x+winW*.495,y,Math.max(4,winW*.05),winH,'rgba(28,36,43,.96)');
   fill(x,y+winH*.54,winW,Math.max(4,winH*.045),'rgba(28,36,43,.90)');
   fill(x+5,y+5,winW*.17,winH*.74,'rgba(255,255,255,.12)');
   fill(x+winW*.78,y+5,winW*.08,winH*.52,'rgba(176,216,234,.10)');
   fill(x+2,y+winH-3,winW-4,2,'rgba(0,0,0,.20)');
   // sill / header
   fill(x-18,y+winH+9,winW+36,10,tint(color,1.30));
   fill(x-20,y+winH+19,winW+40,4,tint(color,.76));
   // occasional signs or awnings at lower level
   if(store && floor===stories-1){
    if(rnd()>.4){
     fill(x-10,y+winH+25,winW+20,22,rgb(28,78,96,.95));
     fill(x-10,y+winH+25,winW+20,3,'rgba(255,255,255,.22)');
     fill(x+18,y+winH+31,winW-36,6,'rgba(235,244,248,.48)');
    }else{
     fill(x-16,y+winH+26,winW+32,18,rgb(131,47,40,.88));
     for(let s=0;s<5;s++) fill(x-15+s*(winW+22)/5,y+winH+26,4,18,'rgba(241,211,188,.28)');
    }
   }
  }
 }
 // Door / storefront composition.
 const baseY=H-rowH*.38;
 fill(W*.44,baseY,W*.12,rowH*.36,'rgba(35,44,52,.95)');
 fill(W*.455,baseY+10,W*.03,rowH*.28,'rgba(136,184,196,.60)');
 fill(W*.505,baseY+10,W*.04,rowH*.28,'rgba(91,129,146,.54)');
 fill(0,H-8,W,8,'rgba(24,23,26,.30)');
 // Minor cracks and masonry repairs add realism without gameplay cost.
 for(let i=0;i<70;i++){
  const x=rnd()*W, y=rnd()*H;
  if(rnd()>.55) fill(x,y,6+rnd()*18,1,'rgba(0,0,0,.05)');
 }
 const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8; tex.needsUpdate=true;
 return tex;
}
