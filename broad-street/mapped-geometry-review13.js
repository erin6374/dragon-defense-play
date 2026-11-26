import {buildInterior} from './interiors.js';
import {schoolFront} from './school-front.js';
import {roofMaterial} from './aerial.js';
import {landmarkFront} from './frontage-details.js';
import {addDistrict} from './district-geometry.js';
import * as T from 'three';
export function makeFrontages(scene,rows,streets){
 const colors=new Map(),cube=new T.BoxGeometry(),placements=new Map(),dummy=new T.Object3D();
 function material(color){if(!colors.has(color))colors.set(color,new T.MeshStandardMaterial({color,roughness:.9}));return colors.get(color)}
 function box(x,y,z,w,h,d,c,angle=0){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,angle,0);dummy.updateMatrix();if(!placements.has(c))placements.set(c,[]);placements.get(c).push(dummy.matrix.clone())}
 function mesh(geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,material(c));m.position.set(x,y,z);scene.add(m);return m}
 function block(poly,h,c,base=0){
  const path=(ring,cls)=>{const p=new cls();ring.forEach(([x,z],i)=>i?p.lineTo(x,-z):p.moveTo(x,-z));p.closePath();return p};
  const s=path(poly[0],T.Shape);s.holes=poly.slice(1).map(r=>path(r,T.Path));const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);const solid=mesh(g,c,0,base,0);if(base>0 && h<=.23)solid.material=roofMaterial(g,solid.material)
 }
 function hipRoof(x,z,w,d,base,rise,ridge,color){
  const a=[x-w/2,base,z-d/2],b=[x+w/2,base,z-d/2],c=[x+w/2,base,z+d/2],e=[x-w/2,base,z+d/2],l=[x-ridge/2,base+rise,z],r=[x+ridge/2,base+rise,z];
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([a,l,r,a,r,b,b,r,c,c,r,l,c,l,e,e,l,a].flat(),3));geo.computeVertexNormals();const roof=mesh(geo,color);roof.material.side=T.DoubleSide;
 }
 function tree(x,z,size){
  box(x,1.7,z,.38,3.4,.38,0x746450);
  for(const [dx,dy,dz,r,c] of [[0,0,0,1,0x63734f],[-.42,-.15,.1,.69,0x738259],[.37,-.09,.18,.74,0x576a49]]){
   const crown=mesh(new T.IcosahedronGeometry(size*r,1),c,x+dx*size,3.2+size*.55+dy*size,z+dz*size);crown.scale.y=.88;
  }
 }
 function equipment(x,z,h){
  box(x,h+.35,z,1.6,.7,2.25,0xb7b7ae);box(x,h+.72,z,1.05,.07,1.12,0x777d79);
 }
 function lot(x,z,w,d){box(x,-.08,z,w,.11,d,0x575b5a)}
 function car(x,z,angle,color){
  box(x,.62,z,1.85,.8,4.15,color,angle);box(x,1.23,z,1.55,.55,2.25,0x57666b,angle);
 }
 function church(b){
  const x=b.x,z=b.front-16.1,stone=0x90877c,trim=0xc8bca8;
  for(const poly of b.polys){
   block(poly,.45,stone);
   const back=[],ring=poly[0],cut=z-10;
   for(let i=1;i<ring.length;i++){const a=ring[i-1],q=ring[i];
    if(a[1]<=cut)back.push(a);
    if((a[1]<cut)!==(q[1]<cut))back.push([a[0]+(q[0]-a[0])*(cut-a[1])/(q[1]-a[1]),cut]);
   }if(back.length>2)block([back],9.4,stone)
  }
  const body=mesh(new T.CylinderGeometry(14.6,14.6,11.4,8),stone,x,5.7,z);body.rotation.y=Math.PI/8;
  mesh(new T.ConeGeometry(14.9,14.4,8),0x494950,x,18.5,z).rotation.y=Math.PI/8;
  mesh(new T.CylinderGeometry(.78,.94,.85,8),0x656568,x,25.85,z);box(x,26.7,z,.19,1.6,.19,trim);box(x,27.05,z,.87,.16,.16,trim);
  // Four ridges meet above the rear hall, visible in the vertical aerial.
  const rear=b.front-b.d, hallZ=rear+9,slate=0x525358;
  function ridge(x0,z0,rotation,length,width,rise){
   const shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);shape.lineTo(0,rise);shape.closePath();
   const geo=new T.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false});
   geo.translate(0,0,-length/2);mesh(geo,slate,x0,9.4,z0).rotation.y=rotation;
  }
  ridge(x,hallZ,Math.PI/2,28.6,15,8.2);
  ridge(x,hallZ+2,0,21.2,13.6,8.2);
  const gable=new T.Shape();
  gable.moveTo(-6.8,8.8);gable.lineTo(6.8,8.8);gable.lineTo(0,17.6);gable.closePath();
  mesh(new T.ExtrudeGeometry(gable,{depth:7,bevelEnabled:false}),stone,x,0,rear+.35);
  for(const u of [-4,-2,0,2,4]){
   const lancet=new T.Shape();lancet.moveTo(-.66,2);lancet.lineTo(.66,2);lancet.lineTo(.66,7);lancet.lineTo(0,8.5);lancet.lineTo(-.66,7);lancet.closePath();
   mesh(new T.ShapeGeometry(lancet),0x48545a,x+u,0,rear+.29).rotation.y=Math.PI;
  }
  for(const offset of [-5,5])box(x+offset*2,4.6,rear+.15,1,9.2,1.1,trim);
  for(const angle of [-Math.PI/2,-Math.PI/4,0,Math.PI/4,Math.PI/2]){
   const dx=Math.sin(angle),dz=Math.cos(angle),ax=x+dx*13.5,az=z+dz*13.5;
   const shape=new T.Shape();shape.moveTo(-4.2,0);shape.lineTo(4.2,0);shape.lineTo(4.2,10.8);shape.lineTo(0,15.1);shape.lineTo(-4.2,10.8);shape.closePath();
   mesh(new T.ExtrudeGeometry(shape,{depth:1.2,bevelEnabled:false}),stone,ax,0,az).rotation.y=angle;
   const corner=angle===Math.PI/4;
   function faceShape(points,offset,c){const shape=new T.Shape();points.forEach(([u,v],i)=>i?shape.lineTo(u,v):shape.moveTo(u,v));shape.closePath();mesh(new T.ShapeGeometry(shape),c,ax+dx*offset,0,az+dz*offset).rotation.y=angle}
   if(corner){
    faceShape([[-2.4,.5],[2.4,.5],[2.4,4.6],[0,7.5],[-2.4,4.6]],1.45,trim);
    faceShape([[-1.7,.6],[1.7,.6],[1.7,4.1],[0,6.2],[-1.7,4.1]],1.49,0x504b48);
    faceShape([[-1.52,.6],[1.52,.6],[1.52,3.9],[0,4.27],[-1.52,3.9]],1.53,0x8b3039);
    for(const u of [-.72,.72]){
     for(const y of [1.35,2.72])faceShape([[u-.52,y-.45],[u+.52,y-.45],[u+.52,y+.45],[u-.52,y+.45]],1.56,0x762d35);
    }
    for(const u of [-2.05,2.05]){
     for(const depth of [1.9,3.45])box(ax+u*dz+dx*depth,1.02,az-u*dx+dz*depth,.065,1.3,.065,0x333537,angle);
     box(ax+u*dz+dx*2.67,1.66,az-u*dx+dz*2.67,.065,.065,1.62,0x333537,angle);
    }
    mesh(new T.CircleGeometry(1.74,36),0x4a535d,ax+dx*1.37,9.9,az+dz*1.37).rotation.y=angle;
    mesh(new T.RingGeometry(1.58,1.89,36),trim,ax+dx*1.42,9.9,az+dz*1.42).rotation.y=angle;
    for(let k=0;k<5;k++){const a=k*2*Math.PI/5,q=(k+2)*2*Math.PI/5;
     const g=new T.BufferGeometry().setFromPoints([a,q].map(t=>new T.Vector3(ax+dx*1.55+dz*Math.sin(t)*1.53,9.9+Math.cos(t)*1.53,az+dz*1.55-dx*Math.sin(t)*1.53)));
     scene.add(new T.Line(g,new T.LineBasicMaterial({color:trim})))}
   }else for(const mid of [-1.8,0,1.8])faceShape([[mid-.58,2],[mid+.58,2],[mid+.58,8.2],[mid,9.8],[mid-.58,8.2]],1.42,0x505763);
   for(const side of [-1,1]){
    const px=ax+side*3.9*dz+dx,pz=az-side*3.9*dx+dz;
    mesh(new T.CylinderGeometry(.58,.78,13.3,8),stone,px,6.65,pz);mesh(new T.ConeGeometry(.81,3.0,8),trim,px,14.8,pz);
   }
   for(let k=0;k<4;k++)box(ax+dx*(2.8-k*.4),.12+k*.12,az+dz*(2.8-k*.4),4.1,.24+k*.24,.5,trim,angle);
  }
 }
 function label(str,x,z){
  const c=document.createElement('canvas');c.width=512;c.height=90;const ctx=c.getContext('2d');ctx.fillStyle='#203735';ctx.fillRect(0,0,512,90);ctx.font='bold 55px sans-serif';ctx.fillStyle='white';ctx.textAlign='center';ctx.fillText(str,256,65);
  const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false}));sprite.position.set(x,3,z);sprite.scale.set(15,2.7,1);scene.add(sprite);
 }
 box(-345,-.45,-37,740,.5,155,0xa6a394);box(-345,-.15,0,740,.20,28,0x535759);
 for(let x=-690;x<=0;x+=9)box(x,-.025,0,4,.04,.16,0xe3c469);
 addDistrict({block,box,tree});
 const marked=new Set();
 for(const s of streets){for(let i=1;i<s.points.length;i++){const [x,z]=s.points[i-1],[xx,zz]=s.points[i];box((x+xx)/2,-.12,(z+zz)/2,10,.18,Math.hypot(xx-x,zz-z),0x535759,Math.atan2(xx-x,zz-z))}
  if(!marked.has(s.name)){marked.add(s.name);const p=s.points.reduce((a,b)=>Math.abs(a[1])<Math.abs(b[1])?a:b);label(s.name,p[0],6)}
 }
 for(const b of rows){
  if(b.school||b.context)continue;
  const n=parseInt(b.address),palette=[0x977767,0xb0a093,0x926d5c,0x866d62,0xb49d83];
  if(n===2101){church(b);continue}
  if(n===2201 && b.w>6){
   // The restaurant occupies one low story below the paired rooftop billboards.
   const eave=4.4;
   for(const poly of b.polys){block(poly,eave,0x997e67);block(poly,.18,0x575452,eave)}
   for(const [u,width] of [[-.29,.24],[.02,.29],[.32,.20]])box(b.x+b.w*u,1.55,b.front+.13,b.w*width,2.3,.18,0x47565a);
   box(b.x,3.65,b.front+.22,b.w,.55,.54,0xa34a3f);
   for(const [u,angle] of [[-.23,0],[.23,-.48]]){
    box(b.x+u*b.w,eave+1.85,b.front-2,b.w*.52,2.35,.24,0x454c4e,angle);
    box(b.x+u*b.w,eave+.4,b.front-2,.19,.8,.2,0x4d4c48);
   }
   continue;
  }
  if(n===2207){
   // GIS record 1007130 covers ONLY the Watts-side rear volume. The Broad
   // facing four-story building is documented photographically, but its
   // front-to-rear geometry is not in this saved city footprint snapshot.
   // Preserve the actual polygon and overlay a separate *provisional* mass.
   for(const poly of b.polys){block(poly,b.h,0xe5e4dc);block(poly,.15,0x48464d,b.h)}
   const front=b.provisionalStreetFront;
   if(Number.isFinite(front)&&front>b.front){
    const depth=front-b.front,glass=0x526875,dark=0x44424a,trim=0xd9d9d4;
    box(b.x,b.h/2,(front+b.front)/2,b.w,b.h,depth,0xe7e7de);
    // Upper metal-clad story, white brick lower floors and a continuous
    // glazed bay are identifiable features in the published street photo.
    box(b.x,b.h-1.48,front+.14,b.w-.14,2.96,.30,dark);
    box(b.x+1.02,7.15,front+.24,2.32,13.5,.28,dark);
    for(const y of [1.85,4.65,7.45,10.16,12.85]){
     box(b.x+1.02,y,front+.40,1.96,1.68,.15,glass);
     box(b.x+1.02,y+.84,front+.49,2.01,.08,.09,trim);
     box(b.x+1.02,y,front+.48,.075,1.68,.08,trim);
    }
    for(const y of [4.62,8.12,12.42]){
     box(b.x-1.45,y,front+.35,1.42,1.5,.12,glass);
     box(b.x-1.45,y+.75,front+.43,1.55,.08,.09,trim);
    }
    box(b.x-1.45,1.45,front+.38,1.58,2.65,.15,0x354651);
    box(b.x-1.45,1.45,front+.49,.09,2.6,.08,trim);
   }
   continue;
  }
  if(schoolFront(b,scene))continue;
  if(landmarkFront(b,{T,block,box,mesh,hipRoof}))continue;
  const pharmacy=n===2131,food=n===2109,modern=n===2209||n===2243;
  const color=n===2125?0x996f57:pharmacy?0xc5c6bd:modern?0xd8d7cf:pharmacy?0xc7b6a0:food?0x978370:palette[n%5];
  const landmarkUse=food?'restaurant':pharmacy?'retail':n===2125?'courtyard':null;
  if(landmarkUse)buildInterior(b,scene,[color,1,food?5:8],n===2125?2:1,landmarkUse);
  else for(const poly of b.polys){block(poly,b.h,color);block(poly,.18,(food||pharmacy||modern)?0xd9d9cd:n===2125?0x484e4d:0x636261,b.h)}
  if(modern){
   const front=b.front+.06, xs=b.polys[0][0].filter(pt=>pt[1]>b.front-1.3).map(pt=>pt[0]);
   const left=Math.min(...xs),width=Math.max(...xs)-left,center=left+width/2;
   const panel=(u,y,z,w,h,d,color)=>box(left+u*width,y,front+z,w*width,h,d,color);
   const glass=0x536970,frame=0x363b3e;
   if(n===2243){
    const pitch=b.h/5;
    panel(.5,2,.06,.91,3.6,.18,0xe1ddd1);
    panel(.36,1.9,.19,.39,1.95,.09,glass);
    panel(.82,1.36,.18,.22,2.64,.09,glass);
    for(let k=1;k<=3;k++){
     const base=k*pitch;
     panel(.48,base+1.25,.14,.63,2.48,.12,frame);
     panel(.48,base+1.25,.22,.58,2.34,.06,glass);
     panel(.48,base+1.25,.28,.018,2.34,.05,frame);
     panel(.50,base,.48,.82,.18,1.05,frame);
     panel(.50,base+.96,.96,.82,.055,.055,frame);
     for(let post=0;post<=10;post++)panel(.09+post*.082,base+.50,.96,.009,.92,.045,frame);
    }
    panel(.48,b.h-.98,.3,.76,1.94,.58,frame);
   }else{
    for(const [u,w] of [[.22,.25],[.69,.39]]){
     panel(u,b.h*.46,.28,w,b.h*.56,.53,frame);
     for(const side of [-1,1])panel(u+side*w*.46,b.h*.46,.58,.038,b.h*.56,.12,0xb83742);
     for(let row=1;row<=3;row++)panel(u,b.h*(.15+row*.165),.59,w*.68,b.h*.107,.09,glass);
     panel(u,b.h*.84,.1,w*.80,b.h*.105,.11,glass);
    }
    panel(.48,1.48,.12,.74,2.85,.16,glass);
   }
   continue;
  }
  if(!landmarkUse)for(const ring of b.polys.map(p=>p[0])){
   for(let i=1;i<ring.length;i++){
    const [x,z]=ring[i-1],[xx,zz]=ring[i],len=Math.hypot(xx-x,zz-z);
    if(len<2.2||Math.abs(zz-z)>len*.5||Math.min(z,zz)<b.front-1.8)continue;
    const rowFront=n>=2201&&n<=2319&&b.front>-30;
    const bays=Math.max(1,Math.floor(len/(food||pharmacy?2.4:2.75))),levels=(pharmacy||food)?1:Math.max(1,Math.round(b.h/3.35));
    for(let floor=0;floor<levels;floor++)for(let j=0;j<bays;j++){
     const t=(j+.5)/bays;
     if(rowFront && floor>0){
      const bx=x+(xx-x)*t,bz=z+(zz-z)*t,wy=(floor+.53)*b.h/levels,wh=b.h/levels*.51;
      box(bx,wy-wh/2-.065,bz+.22,len/bays*.65,.13,.36,0xb1a595);
      box(bx,wy,bz+.22,len/bays*.55,.085,.08,0x7b8282);
     }
     box(x+(xx-x)*t,(floor+.53)*b.h/levels,z+(zz-z)*t+.11,len/bays*.56,b.h/levels*.51,.18,0x526872,-Math.atan2(zz-z,xx-x));
    }
   }
  }

  if(food){box(b.x,3.45,b.front+.58,b.w*.90,.22,1.24,0x969a97)}
  if(food||pharmacy){
   const side=food?1:-1,outer=b.x+side*(b.w/2+8),angle=food?1.16:Math.PI/2;
   lot(outer,b.z,16,b.d+5);lot(b.x,b.z-b.d/2-3,b.w,6);
   lot(b.x-side*(b.w/2+2.3),b.z,4.5,b.d+4);
   if(pharmacy){
    lot(b.x,(b.front-17)/2,b.w+10,b.front*-1-17);
    for(let i=0;i<6;i++)box(b.x-8+2.85*i,.035,-22,.1,.04,5,0xdad9ca);
    box(b.x-5,.34,-30,9,.65,2.3,0xa77a56);
   }
   for(let stall=0;stall<Math.floor(b.d/3);stall++){
    const z=b.front-1.5-stall*3;
    box(outer+side*3,.035,z,.10,.04,4.9,0xdad9ca,angle);
    if([1,4,8].includes(stall))car(outer+side*3,z-1.4,angle,[0x686f73,0x838c96,0xa4a6a1][stall%3]);
   }
   for(const [u,v] of [[-.23,-.22],[.14,.02],[.25,.31],[-.12,.28]])equipment(b.x+u*b.w,b.z+v*b.d,b.h+.18);
   if(food){
    box(b.x,b.h-.75,b.front+.18,b.w*.9,1.35,.25,0x454747);
    const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=96;
    const ctx=signCanvas.getContext('2d');ctx.fillStyle='#444746';ctx.fillRect(0,0,512,96);ctx.font='bold 73px Arial';ctx.fillStyle='#f6f2df';ctx.textAlign='center';ctx.fillText('McDonald’s',256,75);
    const signTexture=new T.CanvasTexture(signCanvas);signTexture.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(7,.98),new T.MeshBasicMaterial({map:signTexture}));sign.position.set(b.x,b.h-.75,b.front+.32);scene.add(sign);
    for(const signX of [-.5,.5]){
     const arch=new T.TorusGeometry(.58,.10,6,18,Math.PI);const m=mesh(arch,0xebba40,b.x-4.8+signX,3.6,b.front+1.1);m.scale.y=1.85;
    }
   }
  }
  if(n===2125){
   const court=b.polys[0][1];
   if(court){const xs=court.map(p=>p[0]),zs=court.map(p=>p[1]);tree((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2,4.3)}
   equipment(b.x-3,b.front-5,b.h);equipment(b.x+1,b.front-6,b.h);
  }
  if(n===2201&&b.w>6){for(const [dx,ang] of [[-1.6,0],[1.55,-.5]]){
   box(b.x+dx,b.h+1.7,b.front-2.5,3.5,1.9,.22,0x42545a,ang);box(b.x+dx,b.h+.56,b.front-2.5,.16,1.1,.18,0x383d3b)
  }}
  if(n>=2227&&n<=2255){
   const pts=b.polys[0][0].filter(p=>p[1]>b.front-.9),xs=pts.map(p=>p[0]),w=Math.max(...xs)-Math.min(...xs),x=(Math.max(...xs)+Math.min(...xs))/2;
   if(w>2){
    box(x,b.h-.19,b.front+.15,w,.28,.4,0x8a8074);
    box(x,3.12,b.front+.22,w*.9,.38,.54,0x4a4944);
    box(x-w*.28,1.3,b.front+.18,.95,2.6,.19,0x454c4b);
   }
  }
  if(n===2301||n===2305){
   const w=b.w*.92,d=b.d*.85;
   hipRoof(b.x,b.z,w,d,b.h+.2,2.9,w*.64,0x555a5c);
   for(const side of [-1,1]){
    box(b.x+side*w*.24,b.h+1,b.z+d*.45,1.45,1.7,1.6,0xb8afa1);
    box(b.x+side*w*.24,b.h+1,b.z+d*.45+.82,.85,1.08,.1,0x535d63);
   }
  }
  if(n===2217||n===2219)block(b.polys[0],.08,0xb9a78f,b.h+.19);

 }
 for(const [x,z,r] of [[-13,-17,3.6],[-38,-18,3],[-77,-19,2.8],[-94,-18,3.6],[-107,-18,4],[-147,-17,2.9],[-164,-18,3.3],[-209,-18,3.4],[-227,-18,3],[-308,-18,3.5],[-323,-18,3.8],[-335,-18,3.2]])tree(x,z,r);
 box(-256,2.8,-18,6.5,.22,2.1,0x92968e);
 for(const x of [-259,-253])box(x,1.35,-18.6,.12,2.7,.12,0x717c77);
 for(const [c,items] of placements){const m=new T.InstancedMesh(cube,material(c),items.length);items.forEach((matrix,i)=>m.setMatrixAt(i,matrix));scene.add(m)}
}
