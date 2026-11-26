/** Version 21: non-negotiable, source-identified landmarks.
 * Scene geometry is model decoration only; municipal footprint polygons remain unchanged.
 * 2101-07 N Broad: historic nomination 2021, fig. 38 (c.1923); circular five-pointed stained-glass star.
 * 2445 N Broad: AutoZone official store locator, checked 2026-11-22.
 * Roof form, original window arrangement and exact signage dimensions remain provisional.
 */
export const LANDMARK_FIDELITY_VERSION='21.0.0';
export const BEREAN_ADDRESS='2101-07 N BROAD ST';
export const AUTOZONE_ADDRESS='2445 N BROAD ST';
export const AUTOZONE_GIS_ID='1073318';
export const MCDONALDS_GIS_ID='1005655';
export const LANDMARK_FIDELITY_SOURCES=Object.freeze({
 berean:'https://www.phila.gov/media/20211119091954/2101-07-N-Broad-St-nomination.pdf',
 autozone:'https://www.autozone.com/locations/pa/philadelphia/2445-n-broad-st.html'
});

export function landmarkPlan(row){
 const id=String(row?.id||'');
 if(id==='1005656')return {id,feature:'berean-five-pointed-rose',address:BEREAN_ADDRESS,protected:true};
 if(id===MCDONALDS_GIS_ID)return {id,feature:'mcdonalds-2020-flat-roof-and-center-tower',protected:true};
 if(id===AUTOZONE_GIS_ID)return {id,feature:'autozone-identification',address:AUTOZONE_ADDRESS,protected:true};
 return null;
}

/** The Star-of-David circular stained-glass window is a major identifying
 * feature on the polygonal corner church at Broad and Diamond. Local +Z faces
 * the street; turn the group by `angle` to align with its octagonal front.
 */
export function renderBereanRose(T,root,{x=0,y=9,z=0,angle=0,radius=2.17}={}){
 const part=new T.Group();part.name='berean-large-stained-glass-star-window';
 part.userData.bsvFeature='berean-five-pointed-rose';part.position.set(x,y,z);part.rotation.y=angle;root.add(part);
 const disk=new T.Mesh(new T.CircleGeometry(radius,72),new T.MeshStandardMaterial({
  color:0x324d66,emissive:0x113547,emissiveIntensity:.38,roughness:.4,side:T.DoubleSide
 }));disk.position.z=.012;part.add(disk);
 const rim=new T.Mesh(new T.RingGeometry(radius*.92,radius*1.075,72),new T.MeshStandardMaterial({color:0xc7bfa9,metalness:.06,roughness:.86,side:T.DoubleSide}));rim.position.z=.080;part.add(rim);
 const innerRim=new T.Mesh(new T.RingGeometry(radius*.81,radius*.845,72),new T.MeshBasicMaterial({color:0x8d9d9d,side:T.DoubleSide}));innerRim.position.z=.105;part.add(innerRim);
 const lineMaterial=new T.LineBasicMaterial({color:0xe4d7a4,depthTest:true});
 // Philadelphia's 1923 heritage photograph shows a PENTAGRAM in the rose.
 // The v20 code drew a five-point trace, but its size/placement lacked fidelity.
 // Use one closed five-point star, with two vertices skipped at each edge.
 const pentagram=[];
 for(let k=0;k<=5;k++){
  const a=Math.PI/2+(k*2)*Math.PI*2/5;
  pentagram.push(new T.Vector3(Math.cos(a)*radius*.80,Math.sin(a)*radius*.80,.175));
 }
 const star=new T.Line(new T.BufferGeometry().setFromPoints(pentagram),lineMaterial);
 star.name='five-pointed-star-pentagram';part.add(star);
 for(let k=0;k<10;k++){
  const a=k*Math.PI/5,pts=[new T.Vector3(0,0,.15),new T.Vector3(Math.cos(a)*radius*.90,Math.sin(a)*radius*.90,.15)];
  const spoke=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0x7d999c,transparent:true,opacity:.56}));
  spoke.name='stained-glass-tracery';part.add(spoke);
 }
 return part;
}

/** Broad-facing storefront sign, mounted on the existing 2431-45 municipal
 * frontage which contains the 2445 N Broad AutoZone location. No false claim
 * is made about the precise position or size of the photographed sign.
 */
export function renderAutoZoneSign(T,scene,row){
 if(String(row?.id)!==AUTOZONE_GIS_ID)return null;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=210;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#a61924';ctx.fillRect(0,0,1024,210);
 ctx.fillStyle='#ffffff';ctx.font='italic 900 138px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText('AutoZone',562,103);
 ctx.fillStyle='#ed7d31';
 for(let i=0;i<4;i++){
  const x=44+i*40;ctx.beginPath();ctx.moveTo(x,24);ctx.lineTo(x+24,24);ctx.lineTo(x+2,184);ctx.lineTo(x-22,184);ctx.closePath();ctx.fill();
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sign=new T.Mesh(new T.PlaneGeometry(Math.min(11.8,row.w*.78),1.75),
  new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,depthTest:true}));
 sign.name='2445-n-broad-autozone-sign';sign.userData.bsvFeature='autozone-identification';
 sign.position.set(row.x,Math.min(row.h-.84,3.91),row.front+.62);
 scene.add(sign);return sign;
}

/** Recognizable freestanding gold arches photographed alongside this address.
 * Approximate roadside position; the photographed geometry controls identity,
 * not centimeter-exact signage placement.
 */
export function renderMcDonaldsArches(T,scene,row){
 if(String(row?.id)!==MCDONALDS_GIS_ID)return null;
 // The tall two-panel roadside sign appears just WEST of the long parking
 // elevation, near the Broad end. The prior sign sat on the NORTH side of
 // the building and pointed at the short Broad-facing wall: wrong elevation.
 // Exact parcel/forecourt pole coordinates remain provisional.
 const ring=row.polys[0]?.[0]||[];
 const longSouth=ring.slice(1).map((p,i)=>[ring[i],p])
  .filter(([a,b])=>Math.abs(b[1]-a[1])>row.d*.7&&Math.abs(b[0]-a[0])<.6)
  .sort((a,b)=>(b[0][0]+b[1][0])-(a[0][0]+a[1][0]))[0];
 const southX=longSouth?(longSouth[0][0]+longSouth[1][0])/2:row.x+row.w/2;
 const poleX=southX+5.10,poleZ=row.front-2.65;
 const pole=new T.Mesh(new T.CylinderGeometry(.19,.22,5.95,16),
   new T.MeshStandardMaterial({color:0x8d2931,roughness:.8}));
 pole.position.set(poleX,2.975,poleZ);pole.name='mcdonalds-golden-arches-pole';
 pole.userData.bsvFeature='mcdonalds-forecourt-sign-pole-2020';scene.add(pole);
 // Intentionally freestanding site asset: connected to its own solid pedestal,
 // not an artificial bridge to the restaurant. Panel brackets and arch bridge
 // have positive-volume intersection with both adjoining solids.
 const supportMat=new T.MeshStandardMaterial({color:0x8d2931,roughness:.8});
 function support(name,width,height,depth,y,dz,material=supportMat){
  const m=new T.Mesh(new T.BoxGeometry(width,height,depth),material);
  m.name=name;m.position.set(poleX,y,poleZ+dz);scene.add(m);return m;
 }
 support('mcdonalds-sign-ground-pedestal',.85,.32,.85,.12,0,new T.MeshStandardMaterial({color:0xa8a397,roughness:.9}));
 for(const y of [3.82,4.63])support('mcdonalds-sign-panel-bracket',.46,.27,.45,y,.12);
 support('mcdonalds-sign-arch-bridge',2.88,.54,.43,5.35,.08);
 const archGroup=new T.Group();archGroup.name='mcdonalds-golden-arches';
 archGroup.userData.bsvFeature='mcdonalds-golden-arches';
 archGroup.position.set(poleX,5.35,poleZ+.02);
 // New Broad-end reference visibly shows the two-panel sign from Broad St.
 // The photographed panel must face the Broad viewing corridor (+Z), rather
 // than appearing edge-on from that camera. Exact sign yaw is provisional.
 archGroup.rotation.y=0;
 const gold=new T.MeshStandardMaterial({color:0xffd531,metalness:.07,roughness:.47,
   emissive:0x644100,emissiveIntensity:.15});
 for(const side of [-1,1]){
   const pts=[];for(let k=0;k<=25;k++){
     const t=k/25;pts.push(new T.Vector3(side*.67+(t-.5)*1.34,
       .20+2.07*Math.sin(Math.PI*t),0));
   }
   const arch=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),36,.12,9,false),gold);
   arch.name='golden-arch';archGroup.add(arch);
 }
 scene.add(archGroup);
 function face(label,y,width,height,color,font){
   // Do not fail model construction in non-DOM source-geometry tests.
   const backing=new T.Mesh(new T.BoxGeometry(width,height,.14),
     new T.MeshStandardMaterial({color:0x8d1c25,roughness:.7}));
   backing.position.set(poleX,y,poleZ+.19);
   backing.name='mcdonalds-sign-solid-backing-'+label;scene.add(backing);
   if(typeof document==='undefined')return;
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
   const ctx=canvas.getContext('2d');if(!ctx)return;
   ctx.fillStyle=color;ctx.fillRect(0,0,1024,256);
   ctx.fillStyle='#f6f3ed';ctx.font='bold '+font+'px Arial,sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,512,125,970);
   const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
   // Two physically distinct readable sides. DoubleSide on ONE plane previously
   // mirrored 'McDonald's' and 'DRIVE-THRU' from the parking-side camera.
   // Opaque dark red backing has real thickness; each texture faces outward.
   for(const [suffix,dz,yaw] of [['broad',.268,0],['parking',.112,Math.PI]]){
     const sign=new T.Mesh(new T.PlaneGeometry(width,height),
       new T.MeshBasicMaterial({map:tex,side:T.FrontSide}));
     sign.position.set(poleX,y,poleZ+dz);sign.rotation.y=yaw;
     sign.name='mcdonalds-sign-readable-'+suffix+'-'+label;
     sign.userData.bsvFeature='mcdonalds-readable-both-directions';scene.add(sign);
   }
 }
 face("McDonald's",4.63,3.95,1.05,'#ba2231',145);
 face('DRIVE-THRU',3.82,3.59,.50,'#8c1724',152);
 return archGroup;
}
