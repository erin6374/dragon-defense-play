import {renderSouthRoof} from './south-broad-roofs.mjs';
/** Pass19: 2125-29 brick church and Crown Chicken diagonal entry.
 * Source: user Street View 030533/030511 (Oct 2026), 030445 (Apr 2025).
 * Approximate facade dimensions, immutable city polygons, no rear changes.
 */
export const PASS19_CHURCH_ID='1000951';
export function renderPass19Church(row,{block,box}){
 if(String(row.id)!==PASS19_CHURCH_ID)return false;
 const L=-111.62,R=-90.38,front=-21.90,w=R-L,h=row.h,x=u=>L+w*u;
 const brick=0xb49a7f,mortar=0x9a8068,trim=0xa58d73,glass=0x34484a,dark=0x303938;
 renderSouthRoof(row,{block,box},brick);
 // Each finish has a shared embedded base. Keep all detail inside lot width.
 const f=(u,y,ww,hh,c,p=.06,d=.30)=>box(x(u),y,front+p,w*ww,hh,d,c);
 f(.5,h/2,.985,h,brick,.02,.34);
 for(let y=.15;y<h-.10;y+=.18)f(.5,y,.98,.021,mortar,.15,.07);
 for(let y=.30;y<h-.10;y+=.36)for(let k=1;k<24;k++){
  const u=(k+((Math.round(y/.36)%2)*.45))/24;if(u<.985)f(u,y,.002,.16,mortar,.15,.07);
 }
 f(.5,h-.10,.99,.18,0x6a665e,.08,.36);
 // Four individually sized arches; central pair are taller/wider.
 // The solid strip arch construction is deliberate: each strip overlaps backing.
 for(const [u,ww] of [[.18,.064],[.405,.095],[.625,.095],[.84,.064]]){
  const bot=.72,top=5.80,r=w*ww/2,archH=r*.83;
  f(u,(bot+top)/2,ww+.031,top-bot,trim,.16,.42);
  f(u,(bot+top)/2,ww,top-bot,glass,.36,.22);
  for(let k=0;k<18;k++){
   const t=(k+.35)/18,span=Math.sqrt(1-t*t);
   f(u,top+t*archH,(ww+.031)*span,archH/18+.045,trim,.16,.42);
   f(u,top+t*archH,ww*span,archH/18+.035,glass,.36,.22);
  }
  // Photo shows opaque central panels on outer two narrow openings.
  if(ww<.08)f(u,3.19,ww*.92,1.55,0x8c8e82,.49,.12);
  for(const yy of [2.35,4.0,5.78])f(u,yy,ww,.055,dark,.49,.11);
  f(u,4.55,.004,2.20,dark,.49,.11);
  f(u,.67,ww+.02,.13,0x8c7b66,.23,.51);
 }
 // Small central dark double door below projecting canopy, with solid support.
 f(.515,1.39,.084,2.78,dark,.18,.43);
 f(.515,1.45,.069,2.60,0x394747,.44,.15);
 f(.515,1.45,.004,2.60,0x69726c,.53,.09);
 f(.515,2.90,.145,.22,0x353c39,.34,.88);
 f(.515,2.71,.12,.22,0x373c38,.20,.43);
 // Visible small metal cross on the left-hand masonry and plain sign backing.
 f(.075,4.65,.004,2.23,0x88877c,.22,.20);
 f(.075,5.15,.045,.073,0x88877c,.22,.20);
 f(.915,3.31,.075,.50,0x3a3c36,.18,.36);
 return true;
}
export function addPass19CrownCorner(row,{box}){
 if(String(row.id)!=='1001196')return false;
 // Use diagonal surveyed edge; local +depth follows outward normal.
 const a=[-189.58,-21.68],b=[-187.26,-24.11],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
 const tx=(b[0]-a[0])/len,tz=(b[1]-a[1])/len,nx=-tz,nz=tx,angle=Math.atan2(-tz,tx);
 const f=(u,y,w,h,c,outer=.28,inner=-.16)=>{
  const off=(outer+inner)/2;
  box(a[0]+tx*len*u+nx*off,y,a[1]+tz*len*u+nz*off,w,h,outer-inner,c,angle);
 };
 // Angled doorway with glazed central panel, stone jambs, red fascia and coping.
 f(.5,1.82,len*.94,3.64,0xb6a48e,.20);
 f(.5,1.46,1.43,2.74,0x373e3a,.34);
 f(.5,1.46,1.15,2.47,0x4c666c,.42);
 f(.5,1.46,.07,2.47,0x545951,.50);
 f(.5,2.15,1.15,.055,0x545951,.50);
 f(.5,3.75,len*.94,.75,0xa53b36,.37);
 f(.5,4.17,len*.96,.12,0x7e312f,.40);
 for(const u of [.12,.88])f(u,1.82,.25,3.64,0x9b886d,.30);
 f(.5,.12,len*.94,.24,0xa69c89,.78);
 return true;
}
