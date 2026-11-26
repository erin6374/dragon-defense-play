/** McDonald's visual-QA facade finishes. Reference-driven material appearance,
 * NOT photogrammetry; never changes municipal footprints or opening counts.
 * Browser-only textures; source/Node tests continue to use real box geometry.
 */
export const MCD_FINISH_REV='MCD-FINAL-PHOTO-GUIDED-20261123';
function makeTexture(T,w,h,paint){
 if(typeof document==='undefined'||!T?.CanvasTexture)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d');if(!ctx||typeof ctx.createLinearGradient!=='function'||typeof ctx.save!=='function')return null;
 paint(ctx,w,h);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 tex.wrapS=tex.wrapT=T.ClampToEdgeWrapping;
 tex.anisotropy=8;return tex;
}
function fnv(n){n=Math.imul(n^0x9e3779b9,0x85ebca6b);n^=n>>>13;n=Math.imul(n,0xc2b2ae35);return (n^(n>>>16))>>>0;}
/** Dark warm brown clay-brick bond, subdued variation, mortar and micro-noise. */
export function makeBrownBrickTexture(T){return makeTexture(T,1024,1024,(ctx,w,h)=>{
 ctx.fillStyle='#52463f';ctx.fillRect(0,0,w,h);
 const cols=['#55463e','#625249','#493e39','#6a584b','#4c423c','#594b43','#705c4e'];
 const course=25,brickW=86;
 for(let r=0;r<Math.ceil(h/course);r++){
  const y=r*course,offset=(r%2)*brickW*.5;
  for(let col=-1;col<Math.ceil(w/brickW)+1;col++){
   const x=col*brickW+offset,seed=fnv(r*991+col*23);
   ctx.fillStyle=cols[seed%cols.length];ctx.fillRect(x+1.8,y+1.9,brickW-3.4,course-3.6);
   ctx.fillStyle='rgba(255,226,192,.045)';ctx.fillRect(x+2.5,y+2.2,brickW-5,1.3);
   ctx.fillStyle='rgba(20,13,12,.09)';ctx.fillRect(x+3,y+course-4.5,brickW-5,1.3);
   for(let i=0;i<4;i++){const s=fnv(seed+i*1337);
     ctx.fillStyle=s%3===0?'rgba(244,211,176,.045)':'rgba(13,10,8,.07)';
     ctx.fillRect(x+3+(s%70),y+4+((s>>>8)%17),2+(s%6),1+((s>>>12)%3));
   }
  }
 }
});}
/** Flat charcoal metal cladding is horizontally jointed, not a featureless slab. */
export function makeGraphiteCladdingTexture(T){return makeTexture(T,1024,512,(ctx,w,h)=>{
 const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3e4442');g.addColorStop(.47,'#343b3a');g.addColorStop(1,'#444a46');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 for(let y=64;y<h;y+=73){ctx.fillStyle='rgba(15,22,21,.43)';ctx.fillRect(0,y,w,2);ctx.fillStyle='rgba(230,235,224,.10)';ctx.fillRect(0,y+3,w,1);}
 for(let i=0;i<280;i++){const s=fnv(i*713);ctx.fillStyle=i%3===0?'rgba(220,234,226,.025)':'rgba(4,13,14,.027)';ctx.fillRect(s%w,(s>>>10)%h,10+(s%90),1);}
});}
/** Subdued blue-green glass with visible reflections and two dark mullions. */
export function makeStorefrontGlassTexture(T,{panes=3,door=false}={}){return makeTexture(T,1024,768,(ctx,w,h)=>{
 const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#536d75');g.addColorStop(.3,'#28434c');g.addColorStop(.7,'#465e62');g.addColorStop(1,'#1e363d');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 // Diffuse reflection of sky + neighboring lighter surfaces, no fabricated interior imagery.
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'rgba(198,220,222,.32)');sky.addColorStop(.40,'rgba(200,211,209,.10)');sky.addColorStop(.72,'rgba(16,30,33,.02)');sky.addColorStop(1,'rgba(8,13,17,.25)');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.translate(-140,0);ctx.transform(1,.01,-.37,1,0,0);
 ctx.fillStyle='rgba(220,235,233,.105)';ctx.fillRect(230,-40,145,h+100);ctx.fillStyle='rgba(170,197,197,.065)';ctx.fillRect(540,-40,70,h+100);ctx.restore();
 for(let k=1;k<panes;k++){const x=k*w/panes;ctx.fillStyle='#293738';ctx.fillRect(x-5,0,10,h);ctx.fillStyle='rgba(216,222,215,.22)';ctx.fillRect(x+3,0,2,h);}
 ctx.fillStyle='#a6acab';ctx.fillRect(0,0,w,8);ctx.fillRect(0,h-9,w,9);ctx.fillRect(0,0,8,h);ctx.fillRect(w-8,0,8,h);
 if(door){ctx.fillStyle='rgba(15,32,36,.7)';ctx.fillRect(w*.46,0,12,h);ctx.fillStyle='#bdc6c2';ctx.fillRect(w*.40,h*.45,8,h*.14);}
});}
function plane(T,scene,texture,{name,x,y,z,w,h,yaw=0,roughness=.70,metalness=.06,opacity=1}){
 if(!scene||!texture)return null;
 const material=new T.MeshStandardMaterial({map:texture,roughness,metalness,transparent:opacity<1,opacity,side:T.FrontSide,depthWrite:opacity>=1});
 const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);mesh.rotation.y=yaw;mesh.name=name;mesh.userData.bsvFeature='mcdonalds-evidence-driven-finish';scene.add(mesh);return mesh;
}
export function addBroadFinishMaterials(T,scene,row){
 if(!scene||typeof document==='undefined')return [];
 const {x,w,h,front}=row,edge=x-w/2,res=[];
 const brick=makeBrownBrickTexture(T),metal=makeGraphiteCladdingTexture(T),glass=makeStorefrontGlassTexture(T,{panes:3}),entry=makeStorefrontGlassTexture(T,{panes:2,door:true});
 const brickZ=front+.712;
 res.push(plane(T,scene,brick,{name:'mcdonalds-broad-dark-brown-brick-bond',x:edge+w*.355,y:(h+.47)/2,z:brickZ,w:w*.262,h:h+.47,roughness:.91}));
 res.push(plane(T,scene,metal,{name:'mcdonalds-broad-dark-metal-sign-fascia',x:edge+w*.745,y:h-.83,z:front+.685,w:w*.505,h:1.6,roughness:.72,metalness:.2}));
 res.push(plane(T,scene,glass,{name:'mcdonalds-broad-storefront-reflective-glazing',x:edge+w*.755,y:1.65,z:front+.875,w:w*.452,h:2.22,roughness:.20,metalness:.13,opacity:.92}));
 res.push(plane(T,scene,entry,{name:'mcdonalds-broad-drive-side-glass-door',x:edge+w*.13,y:1.54,z:front+.868,w:w*.115,h:2.47,roughness:.23,metalness:.13,opacity:.94}));
 return res.filter(Boolean);
}
export function addParkingFinishMaterials(T,scene,row,edge){
 if(!scene||typeof document==='undefined'||!edge)return [];
 const res=[],L=edge.length,[tx,tz]=edge.tangent,[nx,nz]=edge.normal;
 function place(name,t,off,y,w,h,tex,opacity=.9){
  res.push(plane(T,scene,tex,{name,x:edge.near[0]+tx*L*t+nx*off,y,z:edge.near[1]+tz*L*t+nz*off,w,h,yaw:edge.angle,opacity,roughness:.25,metalness:.11}));
 }
 const left=.253,entry=.151,adj=.157;
 place('mcdonalds-parking-2020-large-glass',left/2,.56,1.95,L*left*.91,2.64,makeStorefrontGlassTexture(T,{panes:4}),.87);
 place('mcdonalds-parking-2020-central-door',left+entry/2,.85,1.47,L*entry*.66,2.45,makeStorefrontGlassTexture(T,{panes:2,door:true}),.91);
 place('mcdonalds-parking-2020-right-glass',left+entry+adj/2,.54,1.45,L*adj*.84,2.52,makeStorefrontGlassTexture(T,{panes:2}),.88);
 return res.filter(Boolean);
}
