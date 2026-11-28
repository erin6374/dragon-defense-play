import {containsParcel,ownsSchoolFootprint} from './viewer-parcels.js';

// Continuous descending segment vs extruded parcel footprints. Entry at the
// roof or a side face wins by travel time, not by array order or endpoint.
export function traceMeteorCollision(start,end,buildings,schoolBounds,schoolActive=true,expansion=[]){
 const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z;
 if(dy>=0||start.y<.5)return null;
 const eps=1e-7;
 const point=t=>({x:start.x+dx*t,y:start.y+dy*t,z:start.z+dz*t});
 const active=buildings.filter(b=>(b.damage??0)<.97);
 let best=null;
 const offer=(t,kind,building=null)=>{
  if(t<0||t>1||best&&t>=best.t)return;
  best={t,kind,building,point:point(t)};
 };
 const ground=(.7-start.y)/dy;
 if(ground>=0&&ground<=1)offer(ground,'ground');
 function prism(b,kind,inside){
  const minX=b.x-b.w/2,maxX=b.x+b.w/2,minZ=b.z-b.d/2,maxZ=b.z+b.d/2;
  if(Math.max(start.x,end.x)<minX||Math.min(start.x,end.x)>maxX||Math.max(start.z,end.z)<minZ||Math.min(start.z,end.z)>maxZ||end.y>b.h)return;
  const roof=(b.h-start.y)/dy;
  if(roof>=0&&roof<=1){const p=point(roof);if(inside(p.x,p.z))offer(roof,kind,kind==='building'||kind==='expansion'?b:null);}
  if(Math.abs(dx)+Math.abs(dz)<eps)return;
  const rings=b.polys?.flat(1)??[[[minX,minZ],[maxX,minZ],[maxX,maxZ],[minX,maxZ]]];
  for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[j],c=ring[i],ex=c[0]-a[0],ez=c[1]-a[1];
   const cross=dx*ez-dz*ex;
   if(Math.abs(cross)<eps)continue;
   const ax=a[0]-start.x,az=a[1]-start.z;
   const t=(ax*ez-az*ex)/cross,u=(ax*dz-az*dx)/cross;
   if(t<0||t>1||u<0||u>1||best&&t>=best.t)continue;
   const p=point(t),after=point(Math.min(1,t+eps));
   if(p.y<.7||p.y>b.h||!inside(after.x,after.z))continue;
   // Keep the reported position just inside the polygon for subsequent
   // ownership checks at shared walls.
   offer(Math.min(1,t+eps),kind,kind==='building'||kind==='expansion'?b:null);
  }
 }
 for(const b of active)prism(b,'building',(x,z)=>containsParcel(b,x,z));
 for(const b of expansion)if(b.damage<1)prism(b,'expansion',(x,z)=>containsParcel(b,x,z));
 if(schoolActive){
  const {min,max}=schoolBounds;
  const b={x:(min.x+max.x)/2,z:(min.z+max.z)/2,w:max.x-min.x,d:max.z-min.z,h:max.y};
  prism(b,'school',(x,z)=>ownsSchoolFootprint(schoolBounds,buildings,x,z));
 }
 return best;
}
