/** Secondary elevation fallback only. No new footprint, photo claim or change to specialist routes. */
export function insideRing(r,x,z){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [a,b]=r[i],[c,d]=r[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;}return inside;}
export function insidePoly(p,x,z){return insideRing(p[0],x,z)&&!p.slice(1).some(r=>insideRing(r,x,z));}
export function indexDistrict(records){return records.flatMap(([ps,h,name])=>ps.map(p=>{const xs=p[0].map(q=>q[0]),zs=p[0].map(q=>q[1]);return {p,h,name,minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};}));}
export function secondaryEdgePlan(poly,h,j,{rear=false,doorEdge=false,stories=null,index=[],frontRow=false,doorBay=0}={}){
 const ring=poly[0],[x,z]=ring[j-1],[u,v]=ring[j],dx=u-x,dz=v-z,len=Math.hypot(dx,dz),parts=[],skipped=[];
 if(len<(rear?1.25:2.8))return {parts,skipped};
 const tx=dx/len,tz=dz/len,area=ring.slice(1).reduce((s,[a,b],i)=>s+ring[i][0]*b-a*ring[i][1],0),sign=area>=0?1:-1,nx=sign*tz,nz=-sign*tx,angle=Math.atan2(nx,nz);
 const levels=Number.isInteger(stories)&&stories>0?stories:Math.max(1,Math.round(h/3.25)),pitch=h/levels,bays=frontRow?2:Math.max(1,Math.floor(len/(rear?2:2.8)));
 const pos=(t,offset)=>[x+t*dx+offset*nx,z+t*dz+offset*nz];
 const peers=index.filter(q=>q.p!==poly&&q.maxX>=Math.min(x,u)-1&&q.minX<=Math.max(x,u)+1&&q.maxZ>=Math.min(z,v)-1&&q.minZ<=Math.max(z,v)+1);
 function available(t,y,w,hh,reach){
  if(t*len-w/2<.015||(1-t)*len-w/2<.015||y-hh/2<-.01||y+hh/2>h+.01)return false;
  for(const s of [-.48,-.24,0,.24,.48]){const tt=t+s*w/len;const [ix,iz]=pos(tt,-.035);if(!insidePoly(poly,ix,iz))return false;
   for(const d of [.035,reach*.5,reach]){const [px,pz]=pos(tt,d);if(insidePoly(poly,px,pz)||peers.some(q=>q.h>y-hh/2&&insidePoly(q.p,px,pz)))return false;}}
  return true;
 }
 function put(t,y,w,hh,out,color,kind){const back=-.065,[px,pz]=pos(t,(back+out)/2);parts.push({x:px,y,z:pz,w,h:hh,d:out-back,color,angle,kind,t,nx,nz});}
 for(let f=0;f<levels;f++)for(let b=0;b<bays;b++){
  const t=(b+.5)/bays,door=(frontRow?b===doorBay:rear&&doorEdge&&b===0)&&f===0&&pitch>=2.25;
  const w=Math.min(door?.89:rear?.78:1.08,len/bays*.65),hh=door?Math.min(2.10,pitch*.76):Math.min(rear?1.26:1.44,pitch*.53),y=door?hh/2:(f+(frontRow?.46:.54))*pitch;
  const outerW=w+.20,outerH=hh+.16,frameY=door?y+.08:y;
  if(!available(t,frameY,outerW,outerH,.18)){skipped.push({t,f,reason:'edge clearance / adjacent wall'});continue;}
  put(t,frameY,outerW,outerH,.09,0xac9781,'frame');put(t,y,w,hh,.15,door?0x736d60:0x52636a,door?'door':'window');
  if(!door){put(t,y,w,.075,.19,0xabaaa0,'sash');const sy=y-hh/2-.085;if(available(t,sy,w+.23,.13,.24))put(t,sy,w+.23,.13,.24,0xa59d90,'sill');}
  else if(available(t,.10,w+.16,.20,.53))put(t,.10,w+.16,.20,.53,0x949189,'stoop');
 }
 if(frontRow){
  const cw=len*.91,cy=h-.23;
  if(available(.5,cy,cw,.28,.19))put(.5,cy,cw,.28,.19,0xb9ad99,'cornice');
  if(available(.5,cy-.22,cw,.12,.13))put(.5,cy-.22,cw,.12,.13,0x8d7969,'cornice-band');
 }
 return {parts,skipped};
}
export function renderSecondaryEdge(poly,h,j,options,box){const plan=secondaryEdgePlan(poly,h,j,options);for(const q of plan.parts)box(q.x,q.y,q.z,q.w,q.h,q.d,q.color,q.angle);return plan;}
