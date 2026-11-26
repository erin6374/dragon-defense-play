import {renderSouthRoof} from './south-broad-roofs.mjs';
/** Pass20 ArchWell clinic, 2131 North Broad. Street View Oct 2026,
 * user captures 030511, 030533; actual current tenant confirmed by
 * https://archwellhealth.com/locations/north-broad/.
 * Setback remains the municipal polygon; no frontage extension.
 */
export const PASS20_CLINIC_ID='1003022';
export function renderPass20Clinic(row,{T,scene,block,box}){
 if(String(row.id)!==PASS20_CLINIC_ID)return false;
 const L=-147.58,R=-121.31,z=-45.96,w=R-L,x=u=>L+w*u,h=row.h;
 const light=0xd3d5d1,gray=0x9da29e,dark=0x4b5d60,glass=0x647d82;
 renderSouthRoof(row,{block,box},light);
 // Solid relief: all finishing volumes have backing into municipal mass.
 const f=(u,y,ww,hh,c,outer=.20,inner=-.14)=>box(x(u),y,z+(outer+inner)/2,w*ww,hh,outer-inner,c);
 f(.5,h/2,.992,h,light,.12);
 // Left-hand broad shallow raised portal surround, right plain parapet.
 f(.235,3.28,.456,5.55,0xc0c5c2,.42);
 f(.235,3.07,.394,4.80,light,.54);
 f(.235,5.57,.456,.20,0xc1c5c2,.45);
 f(.735,4.91,.51,.16,0xb3b9b6,.20);
 // Three-pane retail window band with paired entry doors at left.
 f(.235,1.73,.39,2.33,dark,.65);
 for(const u of [.084,.155,.226,.297,.368]){
  f(u,1.73,.063,2.20,glass,.72);
  f(u,2.50,.063,.055,0xc5cfcb,.78);
  f(u,1.73,.004,2.20,0xc5cfcb,.78);
 }
 f(.115,1.38,.090,2.68,dark,.79);
 f(.115,1.38,.077,2.48,0x8ba3a5,.85);
 f(.115,1.38,.005,2.48,0xc5cfcb,.91);
 f(.235,.48,.394,.82,gray,.63);
 // Three diamond-shaped windows on the right; solid staircase relief
 // captures the photographed diagonal silhouette, no unsupported planes.
 for(const u of [.568,.692,.816]){
  const size=1.11,cy=3.20;
  for(let k=0;k<21;k++){
   const t=(k-10)/10,span=Math.max(.08,1-Math.abs(t));
   f(u,cy+t*size/2,(size*span+.19)/w,size/20+.024,gray,.26);
   f(u,cy+t*size/2,(size*span)/w,size/20+.016,dark,.37);
  }
 }
 f(.735,.62,.51,1.10,0xb9bfbb,.18);
 for(let i=1;i<6;i++)f(.735,.13+i*.17,.51,.024,0x9da8a1,.22);
 f(.735,2.08,.51,.07,0xaeb4af,.24);
 // Visible return elevation: keep actual wall location, three small diamond windows.
 const sx=-121.31;
 for(const zz of [-49.0,-52.1,-55.2]){
  const size=.86,cy=3.18;
  for(let i=0;i<15;i++){
   const t=(i-7)/7,span=Math.max(.10,1-Math.abs(t));
   box(sx+.035,cy+t*size/2,zz,.31,size/14+.025,size*span+.14,gray);
   box(sx+.13,cy+t*size/2,zz,.31,size/14+.016,size*span,dark);
  }
 }
 // Photo-supported signage, texture only; solid sign substrate sits in wall.
 f(.235,4.36,.335,.83,light,.56);
 f(.735,4.25,.45,.58,light,.23);
 if(T&&scene&&typeof document!=='undefined'){
  const sign=(label,u,y,ww,hh,depth,color)=>{
   const c=document.createElement('canvas');c.width=1400;c.height=180;
   const ctx=c.getContext('2d');if(!ctx)return;
   ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.font='bold 108px Arial, sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,700,90,1380);
   const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
   const m=new T.Mesh(new T.PlaneGeometry(w*ww,hh),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
   m.position.set(x(u),y,z+depth);m.name='archwell-game-sign';scene.add(m);
  };
  sign('ArchWell HEALTH',.235,4.36,.326,.76,.564,'#b8422d');
  sign('Primary Care for Adults Ages 60+',.735,4.25,.44,.50,.234,'#355d6d');
 }
 return true;
}
