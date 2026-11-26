// York Street evidence: existing municipal footprints/heights + saved city-aerial-0.jpg.
// Ground-floor use, opening counts, finishes, and eave heights are inferred, NOT photo verified.
import {makeSecondaryRoof} from './secondary-roofs-review43.mjs';
export const YORK_PROFILES=Object.freeze({
 '1327 W YORK ST':{kind:'row',side:1,floors:2,brick:0x997567,trim:0xc4b8a4,roof:0x77746b},
 '1329 W YORK ST':{kind:'row',side:1,floors:2,brick:0x9e8170,trim:0xc5b9a6,roof:0x77736b},
 '1335 W YORK ST':{kind:'row',side:1,floors:2,brick:0x9c8677,trim:0xc9c0b2,roof:0x77746e},
 '1337 W YORK ST':{kind:'row',side:1,floors:2,brick:0xa07b6a,trim:0xc7b7a6,roof:0x77736c},
 '1341 W YORK ST':{kind:'small-detached',side:1,brick:0xa69a87,roof:0xa4a6a0},
 '1345 W YORK ST':{kind:'row',side:1,floors:3,brick:0xa5907e,trim:0xc5bcad,roof:0xb8b8ad},
 '1344 W YORK ST':{kind:'corner',side:-1,floors:3,brick:0xb0a18e,trim:0xcac1b1,roof:0x66635c}
});
// Outward coordinate s=side*x, horizontal facade coordinate u=z. Sample true polygon
// at each opening rather than assuming all York walls are parallel or coplanar.
export function yorkWallS(polys,u,side){
 const hits=[];
 for(const poly of polys)for(const ring of poly.slice(0,1))for(let i=1;i<ring.length;i++){
  const [x,z]=ring[i-1],[v,w]=ring[i];if(Math.abs(w-z)<1e-9)continue;
  const t=(u-z)/(w-z);if(t>=0&&t<=1)hits.push(side*(x+t*(v-x)));
 }
 return hits.length?Math.max(...hits):null;
}
export function yorkPlan(polys,height,address){
 const profile=YORK_PROFILES[address];if(!profile)return null;
 const pts=polys.flatMap(p=>p[0]), side=profile.side;
 const maxS=Math.max(...pts.map(p=>p[0]*side));
 const near=pts.filter(p=>p[0]*side>=maxS-.65);const lo=Math.min(...near.map(p=>p[1])),hi=Math.max(...near.map(p=>p[1]));
 if(!Number.isFinite(lo)||hi-lo<2)return null;
 const eave=profile.kind==='corner'?height-2.45:height;
 // Aerial shows a light hip at road end and darker flat rear, not one large flat roof.
 // Rect lies INSIDE the unmodified surveyed footprint. Exact ridge/eave are estimated.
 const hip=profile.kind==='corner'?{kind:'hip',eave,peak:height,rect:[-518.38,-503.0,-70.05,-55.72],ridge:[-511.1,-510.3],color:0xc4c3ba}:null;
 return {address,polys,height,eave,profile,lo,hi,width:hi-lo,hip,evidence:'GIS massing + undated aerial; elevation schematic'};
}
export function yorkRelief(plan){
 if(!plan||plan.profile.kind==='small-detached')return [];
 const {lo,width,eave,polys,profile:p}=plan,side=p.side,arr=[];
 const surface=(u,w)=>{
  const hits=[-.46,-.23,0,.23,.46].map(t=>yorkWallS(polys,u+t*w,side));
  return hits.every(Number.isFinite)?{inner:Math.min(...hits),outer:Math.max(...hits)}:null;
 };
 function slab(u,y,w,h,a,b,color,kind){arr.push({u,y,w,h,a,b,side,color,kind});}
 function backed(u,y,w,h,projection,color,kind){const c=surface(u,w);if(!c)return null;slab(u,y,w,h,c.inner-.06,c.outer+projection,color,kind);return c.outer+projection;}
 function opening(u,y,w,h,door=false){
  const s=backed(u,y,w+.22,h+.20,.13,p.trim,'trim');if(s===null)return;
  slab(u,y,w,h,s-.045,s+.065,door?0x4d4943:0x475b63,door?'door':'window');
  if(!door){slab(u,y,.055,h,s+.02,s+.09,0x827e74,'mullion');slab(u,y,w,.05,s+.02,s+.09,0x827e74,'sash');backed(u,y-h/2-.10,w+.32,.14,.28,p.trim,'sill');}
  else{slab(u+w*.29,y-.08,.065,.08,s+.035,s+.105,0xb8a271,'knob');backed(u,.10,w+.30,.20,.52,p.trim,'stoop');}
 }
 const sections=Math.ceil(width/1.1),step=width*.92/sections;
 for(let k=0;k<sections;k++)backed(lo+width*.04+(k+.5)*step,eave-.22,step+.015,.37,.22,p.trim,'cornice');
 const floors=p.floors,pitch=eave/floors,corner=p.kind==='corner';
 const bays=corner?5:2;
 for(let f=1;f<floors;f++)for(let i=0;i<bays;i++)opening(lo+width*(i+1)/(bays+1),(f+.50)*pitch,Math.min(corner?1.25:.97,width/(bays+1)*.62),Math.min(1.48,pitch*.54));
 if(corner){
  opening(lo+width*.50,1.15,1.35,2.12,true);
  for(const t of [.14,.31,.69,.86])opening(lo+width*t,1.60,1.13,1.47);
 }else{
  opening(lo+width*.25,1.15,Math.min(.94,width*.21),2.12,true);
  opening(lo+width*.72,1.65,Math.min(1.19,width*.24),1.45);
 }
 return arr;
}
export function renderYorkDistrict(polys,height,address,{block,box,mesh,T}){
 const p=yorkPlan(polys,height,address);if(!p)return false;
 for(const poly of polys){block(poly,p.eave,p.profile.brick);block(poly,.15,p.profile.roof,p.eave-.07,{aerialRoof:false});}
 if(p.hip){const r=mesh(makeSecondaryRoof(T,p.hip),p.hip.color);r.name='1344 W YORK ST — closed hipped street roof';}
 for(const b of yorkRelief(p))box(b.side*(b.a+b.b)/2,b.y,b.u,b.w,b.h,b.b-b.a,b.color,b.side*Math.PI/2);
 return true;
}
