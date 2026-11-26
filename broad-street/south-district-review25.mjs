import {RESIDENCE_ROOF_COLOR,renderResidenceRoofDetails} from './residence-roof.mjs';
/** Review25: south of Diamond, six existing district footprint records.
 * Photo-informed first-pass candidates, not survey dimensions.
 * Source polygons unchanged; no new footprint assumed.
 */
export const SOUTH_NAMES=new Set(['2001-47 N BROAD ST','Liacouras Walk Residence Hall','Mitten Hall','1837-55 N BROAD ST','The Shops on Liacouras Walk']);
export const SOUTH_EVIDENCE={
 '2001-47 N BROAD ST':{label:'Johnson & Hardwick Halls',source:'https://studentaffairs.temple.edu/housing/residence-halls/johnson-hardwick-halls',note:'11 stories each; November 2023 Temple exterior photo shows opaque beige panels, narrow glazing and window AC units; dimensions approximate'},
 'Liacouras Walk Residence Hall':{label:'1940 Residence Hall',source:'https://studentaffairs.temple.edu/housing/residence-halls/1940-residence-hall',note:'Five stories; November 16 2023 entrance photograph (Liacouras side); 1999 University of Richmond archive explicitly identifies Broad as rear elevation, current details provisional'},
 'Mitten Hall':{label:'Mitten Hall',source:'https://www.phila.gov/media/20230919125306/1830-N-Broad-St_1st-Review_October-3-CDR.pdf',note:'2023 existing context photos, 1931 Gothic stone building, approximate bay dimensions'},
 '1837-55 N BROAD ST':{label:'Temple Performing Arts Center',source:'https://templeperformingartscenter.org/photogallery/tpac-exterior',note:'As-built exterior gallery, capture date not stated; 2022 anniversary photograph corroborates stone arches'},
 'The Shops on Liacouras Walk':{label:'Shops on Liacouras Walk',source:'https://education.temple.edu/academics/undergraduate-programs',note:'2018-05-01 and 2023-04-25 Temple photographs show narrow dark awnings, layered pale cornices, terrace stairs and open metal railings; exact storefront inventory unverified'}
};
export function renderSouthDistrict(polys,height,name,{block,box,mesh,T}){
 if(!SOUTH_NAMES.has(name))return false;
 const warm=0xa88f73,glass=0x405b64,frame=0xbab7a7,stone=0x9c9890,trim=0xd1c6b2,dark=0x3e4447;
 const all=polys.flat(2),xs=all.map(p=>p[0]),zs=all.map(p=>p[1]),L=Math.min(...xs),R=Math.max(...xs),F=Math.max(...zs),B=Math.min(...zs);
 const mass=(h,c)=>{for(const poly of polys){block(poly,h,c);block(poly,.15,0x66686a,h-.06,{aerialRoof:false});}};
 // Front-edge relief has positive-volume penetration into the exact polygon.
 const edgeDetail=(a,b,cb,ring)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(len<2)return;
  const tx=dx/len,tz=dz/len,angle=-Math.atan2(tz,tx);
  const nx=-tz,nz=tx,area=ring.slice(1).reduce((v,q,i)=>v+ring[i][0]*q[1]-q[0]*ring[i][1],0),sign=area>0?-1:1;
  // Exterior relief remains attached even where glazing/trim would otherwise
  // sit outside the masonry; preserve outward face and embed the back.
  const put=(t,y,w,h,c,p=.10,d=.38,embed=true)=>{const outer=p+d/2,inner=embed?Math.min(p-d/2,-.08):p-d/2,off=(outer+inner)/2;box(a[0]+t*dx+nx*sign*off,y,a[1]+t*dz+nz*sign*off,w,h,outer-inner,c,angle);};
  const point=(t,y,p)=>new T.Vector3(a[0]+t*dx+nx*sign*p,y,a[1]+t*dz+nz*sign*p);
  // True narrow structural members: attach to supports, not blanket backing.
  put.beam=(t0,y0,p0,t1,y1,p1,thick,c)=>{
   const v0=point(t0,y0,p0),v1=point(t1,y1,p1),v=v1.clone().sub(v0),mid=v0.clone().add(v1).multiplyScalar(.5);
   const part=mesh(new T.BoxGeometry(thick,v.length()+thick*.45,thick),c,mid.x,mid.y,mid.z);
   part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return part;
  };
  put.awning=(t,w,y0,y1,p0,p1,thick,c)=>{
   const v0=point(t,y0,p0),v1=point(t,y1,p1),zaxis=v1.clone().sub(v0),length=zaxis.length(),mid=v0.clone().add(v1).multiplyScalar(.5);
   zaxis.normalize();const xaxis=new T.Vector3(tx*sign,0,tz*sign),yaxis=zaxis.clone().cross(xaxis).normalize();
   const part=mesh(new T.BoxGeometry(w,thick,length),c,mid.x,mid.y,mid.z);
   part.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(xaxis,yaxis,zaxis));return part;
  };
  cb(len,put);
 };
 const edges=(filter,cb)=>{for(const poly of polys){const ring=poly[0];for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];if(filter(a,b))edgeDetail(a,b,cb,ring);}}};
 const broad=(a,b)=>Math.abs(a[0]-b[0])>Math.abs(a[1]-b[1])*2&&Math.min(a[1],b[1])>F-8;
 // Roof detail positions measured from the existing city-aerial-2.jpg tile
 // (x=20+pixelX/5, z=-130+pixelY/5). Image acquisition date unknown.
 // Heights of small rooftop elements are estimated, not surveyed.
 const roofRim=(h,color=0xb7b4a8)=>edges(()=>true,(len,f)=>{
  f(.5,h+.14,len-.04,.42,color,-.07,.30,false);
  f(.5,h+.36,len-.04,.13,0xc3c1b7,-.07,.39,false);
 });
 const inRing=(x,z,ring)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 const roofBox=(x,z,w,d,h,base,col)=>{const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([u,v])=>[x+u*w/2,z+v*d/2]);if(!polys.some(poly=>corners.every(q=>inRing(q[0],q[1],poly[0])&&!poly.slice(1).some(r=>inRing(q[0],q[1],r)))))return false;box(x,base+h/2-.04,z,w,h,d,col);return true;};
 if(name==='2001-47 N BROAD ST'){
  // Preserve the joined low dining hall footprint; independently model two
  // eleven-story slabs and their grid, rather than painting generic windows.
  mass(5.4,0xb2a48d);
  for(const cx of [40.7,89]){
   const w=19,d=44,cz=-71,top=41.15,base=5.2,levels=10,step=(top-base)/levels;
   box(cx,(top+base)/2,cz,w,top-base+.25,d,0xb4a58f);
   box(cx,top-.10,cz,w+.18,.38,d+.18,0xc6bda8);
   // The aerial shows a narrow dark inset roof, light perimeter coping,
   // and two elongated mechanical frames, not one solid central penthouse.
   box(cx,top+.07,cz,w-.50,.20,d-.50,0x65645f);
   for(const side of [-1,1]){
    box(cx+side*(w/2-.18),top+.23,cz,.36,.66,d,0xb3ac99);
    box(cx,top+.23,cz+side*(d/2-.18),w,.66,.36,0xb3ac99);
    box(cx+side*(w/2-.18),top+.57,cz,.43,.11,d,0xc5beb0);
    box(cx,top+.57,cz+side*(d/2-.18),w,.11,.43,0xc5beb0);
   }
   const isNorth=cx<60,rx=isNorth?40.4:88.1,rz=isNorth?-69.3:-70.6,rw=6.2,rd=isNorth?18.4:19.8;
   box(rx,top+.20,rz,rw+.45,.37,rd+.55,0x77766b);
   for(const sign of [-1,1]){
    box(rx+sign*(rw/2-.12),top+1.04,rz,.18,.22,rd,0xbec1b8);
    for(let k=0;k<=7;k++){
     const zz=rz-rd*.48+rd*.96*k/7;
     box(rx+sign*(rw/2-.12),top+.67,zz,.20,.92,.20,0x9faaa4);
     if(sign===1)box(rx,top+1.04,zz,rw,.21,.18,0xc5c6bb);
    }
   }
   // Visible light boxes and small exhausts at either end of the rack.
   box(rx,top+.79,rz-5.6,4.3,1.14,4.4,0x90958e);
   box(rx,top+.57,rz+5.6,4.2,.70,3.3,0x8a8e88);
   box(rx,top+.41,cz-15.0,4.4,.58,4.1,0x989990);
   box(rx+1.2,top+.86,cz-15.0,1.55,.40,1.2,0xb8b9ae);
   box(rx-1.4,top+.38,cz+17.0,1.3,.54,1.5,0xaaa99f);
   for(let i=0;i<levels;i++){
    const y=base+(i+.5)*step;
    for(const s of [-1,1]){
     // Broad-facing and opposite end: prominent rectangular concrete grid.
     for(let k=0;k<6;k++){
      const x=cx-7.4+k*2.95,z=cz+s*(d/2);
      box(x,y,z,2.72,step*.94,.32,0xb2a08a);
      box(x,y,z+s*.16,1.32,step*.94,.30,0x484949);
      box(x,y+step*.13,z+s*.28,1.04,step*.44,.22,0xbcc7c5);
      box(x,y-step*.13,z+s*.29,.96,step*.20,.24,glass);
      box(x,y-step*.30,z+s*.35,.73,.43,.37,0xb9b9ae);
     }
     box(cx,base+(i+1)*step,cz+s*(d/2),w,.23,.45,0x726d62);
     for(let k=0;k<13;k++){
      const z=cz-19.5+k*3.25,x=cx+s*w/2;
      box(x,y,z,.35,step*.94,2.8,0xb5a18a);
      box(x+s*.18,y,z,.30,step*.94,1.30,0x454747);
      box(x+s*.28,y+step*.13,z,.22,step*.44,1.02,0xbcc7c5);
      box(x+s*.29,y-step*.13,z,.24,step*.20,.92,glass);
      box(x+s*.35,y-step*.30,z,.37,.43,.73,0xb9b9ae);
      for(let j=0;j<4;j++)box(x+s*.53,y-step*.30,z-.24+j*.16,.06,.28,.035,0x666a67);
     }
     box(cx+s*w/2,base+(i+1)*step,cz,.42,.23,d,0x726d62);
    }
   }
   for(const s of [-1,1])for(let k=0;k<7;k++)box(cx-9+k*3,23,cz+s*(d/2+.04),.27,35.8,.45,0xc8bba3);
  }
  // Low connector rooftop service elements identifiable on the overhead tile.
  roofBox(64.6,-65.1,6.1,5.5,.28,5.50,0xa6a69e);
  roofBox(64.8,-65.2,3.4,3.0,1.10,5.50,0x777c78);
  roofBox(64.7,-64.9,1.7,1.9,.18,6.54,0xacaea3);
  // Dining connector/frontage along the actual long street-facing edges.
  edges(broad,(len,f)=>{const n=Math.max(1,Math.floor(len/3.4));for(let j=0;j<n;j++){const t=(j+.5)/n,bay=len/n;f(t,2.35,bay*.89,3.25,0x444948,.09,.40);f(t,2.39,bay*.76,2.88,glass,.29,.20);f(t,2.39,.095,2.88,frame,.43,.12);f(t,3.30,bay*.77,.11,frame,.43,.12);f(t,.56,bay*.92,.38,0xbab2a0,.14,.42);}f(.5,4.52,len-.10,.24,trim,.14,.48);});
  return true;
 }
 if(name==='Liacouras Walk Residence Hall'){
  // Separate the upper mass from the ground-floor footprint at the actual
  // straight Liacouras edge. The recessed entrance is open geometry rather
  // than a painted dark panel. The municipal source polygon stays immutable.
  const entryEdge=(a,b)=>Math.abs(a[0]-b[0])>20&&Math.min(a[1],b[1])<B+2;
  for(const poly of polys){
   const ring=poly[0],area=ring.slice(1).reduce((v,q,i)=>v+ring[i][0]*q[1]-q[0]*ring[i][1],0),sign=area>0?-1:1;
   const lower=[ring[0]];
   for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    if(entryEdge(a,b)){
     const point=(t,p)=>[a[0]+t*dx-dz/len*sign*p,a[1]+t*dz+dx/len*sign*p];
     lower.push(point(.08,0),point(.08,-2.10),point(.92,-2.10),point(.92,0));
    }
    lower.push(b);
   }
   block([lower,...poly.slice(1)],3.72,0xa99c87);
   block(poly,height-3.70,0x9a6e50,3.70);
   block(poly,.15,RESIDENCE_ROOF_COLOR,height-.06,{aerialRoof:false});
  }
  // Street-facing sections have brick bands, dark paired glazing and cap panels.
  // 2023-11-16 Temple housing photo establishes the canopy on Liacouras Walk,
  // not the Broad Street service elevation (1999 Urban Campus photograph).
  const residenceWindows=(len,f,first)=>{
   const n=Math.max(1,Math.round(len/3.6)),floor=height/5;
   for(let k=0;k<n;k++)for(let i=first;i<5;i++){
    const t=(k+.5)/n,y=(i+.54)*floor,w=Math.min(1.95,len/n*.68);
    f(t,y,w+.18,1.77,0x745d4e,.10,.36);
    f(t,y,w,1.55,glass,.27,.20);f(t,y,.075,1.55,dark,.36,.09);f(t,y-.83,w+.22,.10,trim,.17,.45);
    if(i===4){f(t,y+.95,w+.45,.35,0xc2b9a7,.08,.28);for(const off of [-.5,.5])f(t+off*w/len,y+.20,.25,2.0,0xc2b9a7,.09,.35);}
   }
   for(let i=1;i<5;i++)f(.5,i*floor,len-.10,.09,0xa78362,.08,.30);
   f(.5,height-.10,len-.08,.22,0xbcb2a0,.09,.38);
  };
  edges((a,b)=>!entryEdge(a,b)&&Math.hypot(a[0]-b[0],a[1]-b[1])>5,(len,f)=>residenceWindows(len,f,0));
  edges(entryEdge,(len,f)=>residenceWindows(len,f,1));
  // Overhead tile shows perimeter coping and a run of light exhaust units
  // on the north and east roof wings. Only place units inside the polygon.
  roofRim(height);
  renderResidenceRoofDetails(height,roofBox);
  for(const [x,z,ww,dd] of [[180.7,-95.2,2.2,1.9],[184.8,-95.6,1.6,1.8],[190.1,-95.1,1.4,1.6],[196.1,-94.8,2.7,1.9],[205.0,-95.2,1.8,1.8],[208.3,-76.5,2.0,2.5],[207.8,-67.0,2.0,2.1],[207.6,-57.1,2.4,2.3],[207.8,-49.3,1.8,2.1],[207.6,-38.4,1.8,2.0],[195.2,-34.6,2.5,1.6],[186.0,-34.2,2.4,1.6]]){
   if(roofBox(x,z,ww+.32,dd+.32,.20,height+.08,0x9a9c93))roofBox(x,z,ww,dd,.64,height+.22,0xb8bab1);
  }
  // Entrance canopy and projecting masonry piers on the long east-facing
  // wall (Liacouras Walk, minimum Z). Preserve original mass and footprint.
  edges(entryEdge,(len,f)=>{
   const width=len*.84,steel=0x3c5558;
   // Recessed glass doors seated in the actual new back wall.
   for(const t of [.22,.50,.78]){
    f(t,1.68,len*.22,2.94,0x383b39,-2.03,.32,false);
    f(t,1.68,len*.205,2.66,0x526568,-1.83,.14,false);
    for(const q of [-.27,0,.27])f(t+q*.205,1.68,.11,2.66,steel,-1.73,.12,false);
    f(t,2.72,len*.205,.10,steel,-1.73,.13,false);
   }
   // Independent masonry piers carry the upper slab. Their bottoms are
   // grounded and their tops overlap the slab, not floating in the arcade.
   for(const t of [.09,.36,.64,.91]){
    f(t,1.91,1.05,3.82,0xa99c87,-.42,.91,false);
    for(const y of [.69,1.34,2.12])f(t,y,1.10,.14,0xb99272,-.42,.95,false);
   }
   // Canopy visible in 2023-11-16 and older official entrance photos:
   // a shallow glass plane with sinusoidal steel bow trusses, real open bays.
   f(.50,3.71,width+.24,.24,steel,.03,.48,false);
   f.awning(.50,width,3.78,3.58,-.15,2.25,.11,0x829797);
   f(.50,3.53,width+.10,.18,steel,2.18,.18,false);
   for(let k=0;k<=10;k++){
    const t=.08+k*.84/10;
    f.beam(t,3.78,-.13,t,3.58,2.25,.085,steel);
   }
   for(let k=0;k<32;k++){
    const t0=.08+.84*k/32,t1=.08+.84*(k+1)/32;
    const y=t=>3.58+.68*(.5-.5*Math.cos(4*Math.PI*(t-.08)/.84));
    f.beam(t0,y(t0),2.23,t1,y(t1),2.23,.095,steel);
    if(k%4===0)f.beam(t0,3.53,2.23,t0,y(t0)+.06,2.23,.075,steel);
   }
   // The floor slab links the pier bases. Low threshold, not invented stairs.
   f(.50,.10,width+.15,.20,0xb5b4aa,-.65,3.15,false);
   f(.50,.07,width+.15,.14,0xb6b5ad,1.28,1.05,false);
  });
  return true;
 }
 if(name==='Mitten Hall'){
  // WPA architectural description: three high central bays. 2021 Temple
  // doorway photo and June 2019 renovation photo establish fieldstone, pale
  // limestone reveals, deep pointed portal and low rectangular basement sash.
  // Both Mitten wings are flat-roofed in the existing overhead photograph.
  // Preserve the roof plane; add its pale coping and the observable small
  // rectangular service patch, not a speculative pitched roof.
  roofRim(height,0xb6b1a4);
  roofBox(289.0,-45.1,2.7,3.4,.18,height+.07,0xaaa99e);
  roofBox(289.0,-45.1,1.5,1.9,.46,height+.22,0x747a75);
  const mainEdge=(a,b)=>broad(a,b)&&Math.hypot(a[0]-b[0],a[1]-b[1])>24&&Math.min(a[0],b[0])>289;
  const portalEdge=(a,b)=>broad(a,b)&&!mainEdge(a,b)&&Math.abs(b[0]-a[0])>20;
  // Actual recessed doorway at the existing provisional position. Keep
  // the upper footprint identical; notch only the low entry volume.
  for(const poly of polys){
   const ring=poly[0],area=ring.slice(1).reduce((v,q,i)=>v+ring[i][0]*q[1]-q[0]*ring[i][1],0),sign=area>0?-1:1,lower=[ring[0]];
   for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    if(portalEdge(a,b)){
     const point=(t,p)=>[a[0]+t*dx-dz/len*sign*p,a[1]+t*dz+dx/len*sign*p];
     const lo=.12-2.15/len,hi=.12+2.15/len;
     lower.push(point(lo,0),point(lo,-1.48),point(hi,-1.48),point(hi,0));
    }
    lower.push(b);
   }
   block([lower,...poly.slice(1)],5.97,0x827c70);
   block(poly,height-5.95,0x827c70,5.95);
   block(poly,.15,0x66686a,height-.06,{aerialRoof:false});
  }
  // Identify the entry edge in the masonry pass so its actual opening
  // is not accidentally filled with facade cladding.
  const stonework=(len,f,portal)=>{
   // Embedded staggered rough stone blocks rather than flat stripe texture.
   for(let y=.28;y<height-.4;y+=.55){
    const n=Math.max(1,Math.round(len/1.0)),pitch=len/n,row=Math.round(y/.55),shift=row%2?.5:0;
    for(let k=-1;k<n;k++){
     const lo=Math.max(0,(k+shift)*pitch),hi=Math.min(len,(k+shift+1)*pitch);if(hi-lo<.07)continue;
     const t=(lo+hi)/(2*len),hash=((k+13)*73856093^(row+23)*19349663)>>>0,shade=[0x928b7f,0x8c8579,0x989083,0x878176,0x958d80][hash%5];
     if(portal&&y<6.20&&hi>.12*len-2.20&&lo<.12*len+2.20)continue;
     f(t,y,hi-lo-.035,.49,shade,.015,.20);
    }
   }
   f(.5,height-.36,len-.08,.62,0xc0b7a5,.12,.54);
   f(.5,6.4,len-.08,.32,trim,.14,.55);
   if(!portal)f(.5,.32,len-.08,.55,0xa7a092,.10,.42);
   else for(const [lo,hi] of [[0,.12*len-2.2],[.12*len+2.2,len]])if(hi>lo)f((hi+lo)/(2*len),.32,hi-lo,.55,0xa7a092,.10,.42);
  };
  edges((a,b)=>!portalEdge(a,b)&&Math.hypot(a[0]-b[0],a[1]-b[1])>7,(len,f)=>stonework(len,f,false));
  edges(portalEdge,(len,f)=>stonework(len,f,true));
  const window=(f,t,w,bot,s,peak)=>{
   f(t,(s+bot)/2,w+.6,s-bot,trim,.19,.63);
   f(t,(s+bot)/2,w,s-bot,glass,.39,.27);
   for(let j=0;j<24;j++){
    const u=(j+.35)/24,k=Math.sqrt(1-u)*(1-.35*u);
    f(t,s+u*peak,(w+.6)*k,peak/24+.045,trim,.19,.63);
    f(t,s+u*peak,w*k,peak/24+.035,glass,.39,.27);
   }
  };
  edges(mainEdge,(len,f)=>{
   for(let k=0;k<3;k++){
    const t=(k+.5)/3,w=len/3*.64,bot=7.15,s=17.3;
    window(f,t,w,bot,s,3.25);
    for(const q of [-.28,0,.28])f(t+q*w/len,(bot+s)/2,.14,s-bot,trim,.55,.25);
    for(let i=1;i<=3;i++)f(t,bot+(s-bot)*i/4,w,.13,trim,.55,.25);
    // Tall pale buttresses and sloping cap, integrated into the wall.
    for(const u of [k/3+.026,(k+1)/3-.026]){
     f(u,10.3,.68,19.9,0xb7ae9b,.25,1.0);
     f(u,19.95,.91,.55,trim,.27,1.12);
     f(u,3.0,.95,5.8,trim,.35,1.18);
    }
    for(const q of [-.23,.23]){f(t+q/3,3.7,w*.40,2.55,trim,.13,.43);f(t+q/3,3.7,w*.34,2.30,glass,.30,.22);}
   }
  });
  edges((a,b)=>broad(a,b)&&!mainEdge(a,b),(len,f)=>{
   const n=Math.max(1,Math.round(len/5.8));
   for(let k=0;k<n;k++){
    const t=(k+.5)/n,w=Math.min(2.8,len/n*.62);
    window(f,t,w,8.2,15.8,2.15);
    if(len<20||Math.abs(t-.12)*len>2.30+w/2){f(t,3.55,w+.35,3.15,trim,.14,.43);f(t,3.55,w,2.86,glass,.30,.24);}
   }
   // Pointed door surround is rebuilt separately below.
  });
  // Temple 2021-02-10 close photo: recessed wooden double leaves and
  // subdivided pointed transom, deeply layered pale limestone arch.
  edges(portalEdge,(len,f)=>{
   const t=.12,bot=.67,spring=3.55,peak=2.23,half=1.52;
   const inside=u=>half*Math.sqrt(1-u)*(1-.22*u);
   // Jambs and stepped archivolts. Arch aperture is kept clear.
   for(const side of [-1,1]){
    f(t+side*1.82/len,2.04,.73,4.08,0xc9c0aa,.15,.75);
    for(let j=0;j<4;j++)f(t+side*(1.57+j*.13)/len,(spring+bot)/2,.15,spring-bot,[0xd1c6b2,0xb2a793,0xc8bda8,0xa49986][j],.43-j*.15,.35+j*.14,false);
    f(t+side*1.86/len,.35,.91,.65,trim,.21,.86);
    f(t+side*1.86/len,3.50,.81,.24,trim,.24,.81);
   }
   for(let j=0;j<30;j++){
    const u=(j+.5)/30,yy=spring+peak*u,inner=inside(u),dh=peak/30+.043;
    // Stone above arch aperture connects the arch to the upper wall.
    const span=2.15-inner;if(span>.03)for(const side of [-1,1])
     f(t+side*(inner+span/2)/len,yy,span+.04,dh,0xa99f8f,-.10,.70,false);
    for(let k=0;k<4;k++){
     const lo=inner+.05+k*.13,ww=.18;
     for(const side of [-1,1])f(t+side*(lo+ww/2)/len,yy,ww,dh,[0xd3c8b3,0xaea28f,0xc7bca6,0xa99c89][k],.43-k*.15,.38+k*.17,false);
    }
   }
   // Fill the small zone above the pointed head, contacting upper mass.
   f(t,5.91,4.30,.29,0xa69d8d,-.18,.70,false);
   // Dark inner reveals and actual recessed doors at the rear of niche.
   for(const side of [-1,1])f(t+side*1.45/len,2.24,.27,3.14,0x8f8879,-.73,1.54,false);
   f(t,2.05,2.39,2.76,0x513d2d,-1.39,.30,false);
   for(const side of [-1,1]){
    f(t+side*.58/len,2.05,1.08,2.59,0x896441,-1.21,.15,false);
    f(t+side*.58/len,2.52,.80,1.38,0x353e3e,-1.12,.13,false);
    f(t+side*.58/len,2.52,.055,1.38,0x9c805c,-1.03,.09,false);
    f(t+side*.58/len,1.18,.78,.67,0xa78358,-1.09,.13,false);
    f(t+side*.12/len,1.89,.07,.23,0xb1a085,-1.02,.15,false);
   }
   const tw=2.40,ts=3.50,th=1.12;
   f(t,3.48,2.47,.16,trim,-1.36,.43,false);
   for(let j=0;j<18;j++){
    const u=(j+.5)/18,ww=tw*Math.sqrt(1-u)*(1-.18*u);
    f(t,ts+th*u,ww+.20,th/18+.05,trim,-1.36,.43,false);
    f(t,ts+th*u,ww,th/18+.04,0x394748,-1.09,.17,false);
   }
   for(const q of [-.34,-.17,0,.17,.34]){
    const hh=th*(1-Math.abs(q)*1.7);f(t+q*tw/len,ts+hh/2,.05,hh,0x8f897b,-.97,.10,false);
   }
   for(const y of [3.72,3.98])f(t,y,tw*(1-(y-ts)*.65),.065,0x8f897b,-.97,.10,false);
   // Steps with freestanding, supported handrails; no solid rail walls.
   for(let k=0;k<5;k++){const h=(k+1)*.16,run=2.0-k*.32;f(t,h/2,3.28,h,trim,(run-1.4)/2,run+1.48,false);}
   for(const side of [-1,1]){
    const u=t+side*1.44/len;
    for(const [p,base] of [[.20,.80],[.88,.48],[1.60,.16]])f(u,base+.48,.075,1.02,0x303432,p,.075,false);
    f.beam(u,1.75,.20,u,1.11,1.60,.09,0x303432);
   }
   // One ornate wall lantern is visible to the right of the doorway.
   const u=t-2.05/len;
   f(u,3.27,.18,.26,0x343a37,.14,.50);
   f.beam(u,3.18,.17,u,3.62,.68,.09,0x343a37);
   f(u,3.85,.36,.60,0xe1d8b8,.69,.39,false);
   for(const q of [-.15,.15])f(u+q/len,3.85,.05,.66,0x343a37,.87,.06,false);
   f(u,4.17,.48,.10,0x343a37,.69,.48,false);
   f(u,3.53,.48,.10,0x343a37,.69,.48,false);
  });
  return true;
 }
 if(name==='The Shops on Liacouras Walk'){
  // May 2018 / April 2023 Temple photos: west-side historic retail row
  // faces east (negative Z in the mapped coordinate system).
  mass(height,0x985c45);
  // Both retail sections have flat dark roofs and pale perimeter coping.
  roofRim(height,0xb5ac9c);
  if(L>270){
   roofBox(296.2,-94.0,12.0,1.25,.52,height+.07,0xb3b6ad);
   roofBox(303.8,-94.0,2.9,5.0,.58,height+.07,0xaeb2ab);
   roofBox(305.5,-95.4,1.4,2.3,.65,height+.08,0xa0a69d);
  }else{
   // North retail section, saved city-aerial-2 tile: three light rooftop
   // rectangles and two small vents; plan centers and widths from the tile.
   // Heights/types are provisional. Each supported curb overlaps the deck.
   for(const [x,z,w,d,h] of [[231.6,-91.2,2.0,3.0,.60],[242.8,-93.4,2.2,1.8,.45],[251.2,-92.8,1.0,1.0,.32],[235.0,-92.2,.60,.60,.25],[251.2,-96.8,.60,.60,.25]]){
    if(!roofBox(x,z,w,d,.18,height+.08,0x90938a)||!roofBox(x,z,w*.78,d*.78,h,height+.22,0xb0b3a8))throw Error('North shops roof feature outside footprint');
   }
  }
  const walkway=(a,b)=>Math.abs(a[0]-b[0])>Math.abs(a[1]-b[1])*2&&Math.min(a[1],b[1])<B+2.5&&Math.abs(a[0]-b[0])>2.7;
  edges(walkway,(len,f)=>{
   const n=Math.max(1,Math.round(len/5.2));
   for(let k=0;k<n;k++){
    const t=(k+.5)/n,bay=len/n;
    f(t,2.15,bay*.83,2.75,dark,.09,.44);
    f(t,2.15,bay*.73,2.45,glass,.28,.26);
    // Each historic shop bay has two slender glazed leaves instead of
    // unbroken black strips; exact current business names not inferred.
    for(const q of [-.36,0,.36])f(t+q/n,2.15,.12,2.45,0xc2b6a0,.43,.15);
    f(t,2.91,bay*.72,.11,0xc2b6a0,.43,.15);
    f(t,1.20,bay*.73,.32,0x9d8b76,.29,.32);
    f(t,3.70,bay*.80,.32,trim,.12,.48);
    // Temple 2018 and 2023 photos show discrete sloping dark awnings.
    // Thin actual planes, with metal side braces and a wall-mounted head.
    for(const q of [-.21,.21]){
     const u=t+q/n,aw=bay*.34;
     f(u,3.82,aw,.14,0x343b36,.06,.27);
     f.awning(u,aw,3.86,3.12,-.08,1.08,.085,0x303a37);
     for(const q2 of [-.14,.14])f.beam(u+q2/n,3.15,.02,u+q2/n,3.13,1.08,.055,0x353e39);
    }
    for(const q of [-.22,.22]){
     f(t+q/n,height*.61,bay*.20,2.13,trim,.14,.44);
     f(t+q/n,height*.61,bay*.16,1.87,glass,.31,.24);
     f(t+q/n,height*.85,bay*.20,1.75,trim,.14,.44);
     f(t+q/n,height*.85,bay*.16,1.52,glass,.31,.24);
    }
    // The 2017 Temple photo also documents projecting bays near Mitten Hall.
    if(k%3===0){
     f(t,height*.64,bay*.49,2.8,0xbcb4a4,.22,.88);
     for(const q of [-.14,.14])f(t+q/n,height*.64,bay*.19,2.20,glass,.64,.18);
     f(t,height*.79,bay*.56,.24,trim,.22,.94);
    }
    // Layered pale cornice, dentils and repeated rowhouse pilasters.
    for(const u of [t-.46/n,t+.46/n])f(u,height*.51,.22,height*.81,0xaa7758,.055,.22);
    f(t,height-.15,bay*.96,.27,trim,.13,.50);
    f(t,height-.43,bay*.95,.16,0xc9beb0,.18,.56);
    for(let j=0;j<7;j++)f(t+((j+.5)/7-.5)*.88/n,height-.67,.15,.25,trim,.20,.42);
    // Small stone finials seen on the historic cornice in 2018 campus photo.
    for(const q of [-.43,.43]){f(t+q/n,height+.10,.34,.28,trim,.06,.36);f(t+q/n,height+.29,.23,.16,0x8f8c80,.06,.26);}
    // Raised continuous brick walkway, integrated with the ground floor.
    f(t,.52,bay+.04,1.04,0x9f6752,1.30,2.85);
    f(t,1.05,bay+.04,.15,0xb7b2a6,1.30,2.85);
    // Preserve true open railings. Use the solid raised deck as support;
    // raw depth rather than embedding every rail all the way to the wall.
    for(const q of [-.48,0,.48])f(t+q/n,1.55,.11,1.10,0x646c69,2.62,.16,false);
    for(let j=0;j<Math.max(3,Math.round(bay/.17));j++){
     const nbar=Math.max(3,Math.round(bay/.17)),u=t+((j+.5)/nbar-.5)*.94/n;
     f(u,1.56,.045,.90,0x737c77,2.62,.065,false);
    }
    for(const y of [1.15,1.55,2.03])f(t,y,bay+.04,.10,0x646c69,2.62,.15,false);
    if(k===0||k===n-1)for(let j=0;j<6;j++){let hh=(j+1)*.17,d=1.80-j*.24;f(t,hh/2,bay*.42,hh,0xa8a79f,2.65+d/2,d+.18,false);}
   }
  });
  // Do not falsely mirror the retail facade onto the service side.
  edges((a,b)=>broad(a,b)&&!walkway(a,b),(len,f)=>{
   const n=Math.max(1,Math.floor(len/3.1));
   for(let k=0;k<n;k++)for(const y of [height*.45,height*.75]){f((k+.5)/n,y,1.2,1.7,trim,.09,.30);f((k+.5)/n,y,1.04,1.50,glass,.21,.19);}
  });
  return true;
 }
 // Former Baptist Temple / TPAC. Main stone mass, two circular domed
 // towers, central pitched gable, fan tracery and Romanesque entry arches.
 if(name==='1837-55 N BROAD ST'){
  const eave=17.8,cx=(L+R)/2,face=-19.45;
  mass(eave,0xb5aea0);
  const f=(x,y,w,h,c,p=.10,d=.52)=>{const outer=p+d/2,inner=Math.min(p-d/2,-.18);box(x,y,face+(outer+inner)/2,w,h,outer-inner,c);};
  f(cx,8.9,R-L-1.2,17.8,0xb9b2a5,-.94,2.12);
  for(let i=0;i<39;i++){let y=.28+i*.44;f(cx,y,R-L-1.4,.028,0x928d82,.23,.12);}
  f(cx,16.9,R-L-.6,.48,trim,.26,.95);
  f(cx,8.05,20,.35,trim,.29,.88);
  // Triangular gable is a solid extrusion intersecting the main wall.
  const shape=new T.Shape();shape.moveTo(-10.8,eave-.22);shape.lineTo(10.8,eave-.22);shape.lineTo(0,height-.3);shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:1.25,bevelEnabled:false});mesh(geo,0xb6afa3,cx,0,face-.75);
  const roofShape=new T.Shape();roofShape.moveTo(-10.8,eave-.15);roofShape.lineTo(10.8,eave-.15);roofShape.lineTo(0,height-.3);roofShape.closePath();
  mesh(new T.ExtrudeGeometry(roofShape,{depth:30,bevelEnabled:false}),0x5d5b58,cx,0,face-31.0);
  for(let i=0;i<12;i++){const t=(i+.5)/12;f(cx,eave+t*(height-eave-.3),21*(1-t),.05,0x969084,.68,.16);}
  // Two rounded towers with copper-brown hemispherical domes.
  for(const x of [L+3.45,R-3.45]){
   const z=face-2.35,r=3.25;
   box(x,eave/2,z,2*r,eave+.20,2*r,0xada79b);
   for(const off of [-2.8,2.8])mesh(new T.CylinderGeometry(.48,.51,eave+.45,20),0xbdb5a6,x+off,eave/2,z+r-.22);
   mesh(new T.CylinderGeometry(r+.17,r+.17,.42,40),trim,x,eave-.12,z);
   // Closed stacked frustum profile; each section slightly overlaps the next.
   for(let i=0;i<12;i++){const a=i/12,b=(i+1)/12,rr=t=>r*Math.sqrt(Math.max(.001,1-t*t));
    mesh(new T.CylinderGeometry(rr(b),rr(a),5.0/12+.06,40),0x55746b,x,eave+(i+.5)*5/12-.07,z);}
   // The corner towers project beyond the center facade; their own window
   // surrounds must be on the tower face, not hidden behind that surface.
   const towerFace=z+r,tf=(xx,y,w,h,c,p=.12,d=.40)=>{const outer=p+d/2,inner=Math.min(p-d/2,-.12);box(xx,y,towerFace+(outer+inner)/2,w,h,outer-inner,c);};
   const round=(xx,bot,s,w,col)=>{tf(xx,(bot+s)/2,w+.44,s-bot,trim,.22,.52);tf(xx,(bot+s)/2,w,s-bot,col,.43,.20);for(let j=0;j<18;j++){const t=(j+.35)/18,k=Math.sqrt(1-t*t);tf(xx,s+t*w/2,(w+.44)*k,w/36+.045,trim,.22,.52);tf(xx,s+t*w/2,w*k,w/36+.035,col,.43,.20);}};
   for(const off of [-.88,.88])round(x+off,9.7,12.5,1.04,glass);
   round(x,.45,3.8,1.85,0x4d4841);
   tf(x,16.7,6.36,.45,trim,.28,.80);for(let j=0;j<10;j++)tf(x-2.7+j*.60,16.18,.24,.50,trim,.30,.64);
   tf(x,8.3,6.28,.32,trim,.20,.68);
   for(let j=0;j<4;j++){const hh=(j+1)*.15,run=1.38-j*.27;tf(x,hh/2,2.45,hh,trim,run/2-.10,run+.20);}
   for(let y=.30;y<17.4;y+=.44)for(let k=0;k<6;k++){
    const xx=x-2.65+k*1.06;if((y<5&&Math.abs(xx-x)<1.4)||(y>9.2&&y<13.7&&Math.abs(xx-x)<2.05))continue;
    tf(xx,y,1.01,.38,[0xb6aea0,0xc0b8aa,0xada699][(k+Math.floor(y*2.7))%3],.045,.22);
   }
  }
  const arch=(x,bot,s,w,col)=>{
   const r=w/2;
   // Layered Romanesque archivolts, distinct glazing and dark doorway.
   f(x,(bot+s)/2,w+.83,s-bot,0xc0b8aa,.25,.78);
   f(x,(bot+s)/2,w+.40,s-bot,0xa69b89,.40,.69);
   f(x,(bot+s)/2,w+.19,s-bot,trim,.47,.67);
   f(x,(bot+s)/2,w,s-bot,col,.82,.23);
   for(let i=0;i<28;i++){let t=(i+.35)/28,k=Math.sqrt(1-t*t),yy=s+t*r;
    f(x,yy,(w+.83)*k,r/28+.055,0xc0b8aa,.25,.78);
    f(x,yy,(w+.40)*k,r/28+.048,0xa69b89,.40,.69);
    f(x,yy,(w+.19)*k,r/28+.044,trim,.47,.67);
    f(x,yy,w*k,r/28+.038,col,.82,.23);}
  };
  for(const [x,w,bot,s] of [[cx-7.0,1.65,1.2,4.35],[cx-3.55,3.1,.48,4.9],[cx,1.55,1.2,4.35],[cx+3.55,3.1,.48,4.9],[cx+7.0,1.65,1.2,4.35]])arch(x,bot,s,w,glass);
  for(const x of [cx-3.55,cx+3.55]){
   for(let j=0;j<7;j++){let h=(j+1)*.16,run=2.45-j*.28;f(x,h/2,3.7,h,trim,(run-.12)/2,run+.12);}
   // Two door leaves and separate arched glazed transom.
   f(x,2.55,2.72,3.05,0x333b3c,.93,.18);f(x,2.55,.10,3.05,0x817a6e,1.02,.14);
   f(x,4.25,2.82,.17,trim,.95,.28);
   // Real handrails, not thick slabs extended to the facade. Uprights
   // overlap the solid steps; sloped rail uses a closed rectangular beam.
   for(const side of [-1,1]){
    const xx=x+side*1.55;
    for(const [zz,yy,hh] of [[.48,1.56,1.08],[1.23,1.27,1.08],[2.10,.75,1.30]])box(xx,yy,face+zz,.10,hh,.10,0x292e2d);
    const a=new T.Vector3(xx,2.05,face+.48),b=new T.Vector3(xx,1.36,face+2.10),v=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5);
    const rail=mesh(new T.BoxGeometry(.10,v.length()+.14,.10),0x292e2d,mid.x,mid.y,mid.z);rail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
   }
  }
  // Wall-mounted lanterns seen in the 2022 anniversary photograph.
  for(const x of [cx-5.45,cx-1.65,cx+1.65,cx+5.45]){
   f(x,3.35,.16,.19,0x343a37,.46,.85);
   f(x,3.35,.43,.20,0x343a37,.80,.72);
   f(x,3.65,.38,.59,0xc3bda2,.98,.42);
   f(x,3.98,.48,.12,0x343a37,.98,.53);
   f(x,3.31,.48,.13,0x343a37,.98,.53);
  }
  // Semicircular fan window with radial stone ribs in the glass backing.
  const y0=9.0,r=5.6;
  for(let i=0;i<35;i++){const t=(i+.35)/35,k=Math.sqrt(1-t*t);f(cx,y0+t*r,(2*r+.68)*k,r/35+.04,trim,.25,.80);f(cx,y0+t*r,2*r*k,r/35+.03,0x344e69,.57,.24);}
  for(let i=0;i<=12;i++){const a=Math.PI*i/12,rr=r*.96;
   const pts=[new T.Vector3(cx,y0,face+.68),new T.Vector3(cx+Math.cos(a)*rr,y0+Math.sin(a)*rr,face+.75)];
   mesh(new T.TubeGeometry(new T.LineCurve3(...pts),1,.085,8,false),trim);}
  // Radial stone ribs are seated into the fan-window backing.
  for(const rr of [1.2,2.7,4.3]){const pts=[];for(let j=0;j<=32;j++){const a=j*Math.PI/32;pts.push(new T.Vector3(cx+rr*Math.cos(a),y0+rr*Math.sin(a),face+.68));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.085,8,false),trim);}
  // Deep concentric stone arches and a row of small rosette panes around
  // the outer edge of the half-rose. All are backed by the existing wall.
  for(let j=0;j<36;j++){const t=(j+.35)/36,k=Math.sqrt(1-t*t);const outer=(2*r+1.40)*k,inner=(2*r+.73)*k,ww=(outer-inner)/2;if(ww>.015)for(const side of [-1,1])f(cx+side*(inner/2+ww/2),y0+t*(r+.55),ww+.035,(r+.55)/36+.07,0xc4b9a7,.35,.93);}
  for(let i=1;i<14;i++){const a=Math.PI*i/14,rr=5.0,xx=cx+rr*Math.cos(a),yy=y0+rr*Math.sin(a);
   const disk=(rad,c,z)=>{const q=mesh(new T.CylinderGeometry(rad,rad,.14,20),c,xx,yy,face+z);q.rotation.x=Math.PI/2;};disk(.40,trim,.69);disk(.29,0x467c84,.77);
   for(let k=0;k<4;k++){const ang=k*Math.PI/2;f(xx+.15*Math.cos(ang),yy+.15*Math.sin(ang),.10,.10,0x7d9c92,.86,.12);}
  }
  f(cx,y0-.10,12.2,.37,trim,.38,.95);
  f(cx,y0-.63,11.9,.54,0xb9b09f,.38,.81);
  // 2022 photo and official exterior gallery: shallow curved upper canopy,
  // stone courses and finial above the central gable.
  f(cx,17.7,13.5,.28,dark,.65,1.85);
  for(let k=0;k<12;k++)f(cx-6.25+k*1.14,17.48,.08,.42,dark,.76,1.65);
  mesh(new T.CylinderGeometry(.22,.39,1.2,16),trim,cx,height-.10,face-.12);
  // Continuous dentil courses and raised rusticated stone blocks from TPAC
  // exterior photos; use a gray-green copper patina rather than brown domes.
  for(const x of [L+3.45,R-3.45]){
   f(x,16.6,6.6,.46,trim,.28,.90);
   for(let k=0;k<9;k++)f(x-2.9+k*.72,16.1,.25,.50,trim,.38,.75);
  }
  for(let y=.32;y<eave-.45;y+=.46)for(let k=0;k<32;k++){
   const x=L+.8+(k+.5)*((R-L-1.6)/32);
   if(Math.abs(x-cx)<7.4&&y>8.4&&y<15.1)continue;
   if(Math.abs(x-cx)<9&&y<7.1)continue;
   f(x,y,(R-L-1.6)/32-.04,.36,[0xb8b1a5,0xc2b9ac,0xa9a498][(k+Math.floor(y*4))%3],.07,.30);
  }
  // The official TPAC gallery shows a shallow upper balcony with ironwork.
  // Supports embedded below, thin freestanding bars above the solid ledge.
  f(cx,17.55,13.4,.22,0x4a4943,.65,1.75);
  for(let k=0;k<=26;k++)box(cx-6.5+k*.50,18.05,face+1.46,.075,.92,.08,0x343a37);
  box(cx,18.50,face+1.46,13.08,.10,.11,0x343a37);
  // Continue the existing stone base and cornice around the side and rear.
  // Opening placement on these elevations is not yet photograph-verified;
  // do not invent a repeated window grid. Follow the actual GIS edges.
  edges((a,b)=>!broad(a,b),(len,put)=>{
   put(.5,.35,len-.06,.62,0xa69f92,.08,.40);
   put(.5,8.05,len-.06,.28,0xc0b6a6,.09,.38);
   put(.5,eave-.38,len-.06,.50,0xc1b8a9,.12,.52);
   for(let y=.85;y<eave-.85;y+=.48){
    const n=Math.max(1,Math.round(len/1.15)),pitch=len/n,row=Math.round(y/.48),shift=row%2*.5;
    for(let k=-1;k<n;k++){
     const lo=Math.max(0,(k+shift)*pitch),hi=Math.min(len,(k+shift+1)*pitch);
     if(hi-lo<.08)continue;
     const hash=((k+17)*73856093^(row+31)*19349663)>>>0;
     put((lo+hi)/(2*len),y,hi-lo-.035,.42,[0xb5aea0,0xb9b2a4,0xb0aa9e][hash%3],.015,.17);
    }
   }
  });
  // Narrow upper triple openings on the central gable.
  for(const x of [cx-1.55,cx,cx+1.55])arch(x,17.5,19.0,.75,dark);
  return true;
 }
 return false;
}
