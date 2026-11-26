/** Pass17 street-facing details only. Source GIS polygons remain untouched.
 * April 2025 030445: adjoining pizza storefront and Crown Chicken fascia.
 * October 2026 031158: Shell food mart facing Broad behind canopy.
 * These photo-estimated elevations do not assert surveyed dimensions.
 */
export const PASS17_STORE_IDS=new Set(['1007131','1011866']);
export function renderPass17Store(b,{block,box}){
 const id=String(b.id);if(!PASS17_STORE_IDS.has(id))return false;
 const {x,w,front,h}=b;
 const f=(u,y,W,H,c,p=.08,d=.36)=>box(x+u*w,y,front+p,w*W,H,d,c);
 const dark=0x343d3d,glass=0x4c666c;
 const fascia=(u,y,W,H,c,p=.16,d=.45)=>f(u,y,W,H,c,p,d);
 const glazed=(u,y,W,H)=>{
  f(u,y,W,H,dark,.12,.42);f(u,y,W-.018,H-.12,glass,.35,.13);
  f(u,y+H*.28,W-.018,.07,0x747b76,.44,.12);
  f(u,y,.008,H,0x747b76,.44,.12);
 };
 if(id==='1007131'){
  // Photograph shows low pizza storefront beside restaurant, not two-story
  // street elevation. Retain mapped height for rear portion beyond 5 m.
  const cut=front-5, low=4.36;
  const clip=(ring,keepFront)=>{
   const pts=ring.slice(0,-1),out=[];
   const keep=p=>keepFront?p[1]>=cut:p[1]<=cut;
   for(let i=0;i<pts.length;i++){
    const a=pts[i],c=pts[(i+1)%pts.length],ai=keep(a),ci=keep(c);
    if(ai)out.push(a);
    if(ai!==ci)out.push([a[0]+(c[0]-a[0])*(cut-a[1])/(c[1]-a[1]),cut]);
   }
   return out.length>=3?[...out,out[0]]:null;
  };
  for(const poly of b.polys){
   const fore=clip(poly[0],true),rear=clip(poly[0],false);
   if(fore){block([fore],low,0x92715e);block([fore],.14,0x62605a,low-.06);}
   if(rear){block([rear],h,0xb19a85);block([rear],.14,0x67645d,h-.06);}
  }
  fascia(0,1.9,.98,3.8,0x8e5c50,.04,.29);
  glazed(.15,1.75,.61,2.35);glazed(-.31,1.46,.22,2.74);
  fascia(0,.38,.97,.72,0xb6a28b,.15,.48);
  fascia(-.19,3.73,.56,.63,0xe0d6ba,.20,.48);
  // Empty backing for visible pizza sign; no fabricated restaurant name.
  fascia(.23,3.72,.39,.67,0x704943,.18,.43);
  // joined platform and three rails, as seen beside the main restaurant.
  f(0,.14,.94,.28,0xa69c89,.57,1.34);
  for(const u of [-.44,-.23,0,.23,.44])f(u,.67,.012,1.08,0xc6c5bd,1.15,.13);
  for(const y of [.48,.79,1.11])f(0,y,.89,.065,0xc6c5bd,1.15,.13);
  return true;
 }
 // Only the associated Shell shop's visible Broad-facing elevation is revised.
 // Single-story parapet, red/yellow trim, glazed central retail bay, pale end wall.
 for(const poly of b.polys){block(poly,h,0xd9d8d0);block(poly,.14,0x6c706d,h-.07);}
 fascia(0,h-.34,.985,.68,0xd6d8d1,.08,.36);
 fascia(0,3.86,.97,.54,0xe4b039,.19,.54);
 fascia(0,3.62,.97,.15,0xb7382a,.36,.22);
 fascia(-.26,1.69,.38,3.1,0x6c7169,.10,.36);
 for(const u of [-.32,-.17,-.02,.13])glazed(u,1.68,.133,2.92);
 glazed(.27,1.50,.12,2.74);
 fascia(.38,1.7,.19,3.25,0xdad9d1,.12,.39);
 fascia(-.44,1.7,.095,3.20,0x9e9e94,.10,.36);
 fascia(0,.20,.98,.38,0x9e9f95,.14,.44);
 // White food-mart sign substrate above central entrance, physically seated in yellow fascia.
 fascia(.03,3.92,.19,.29,0xeeeae0,.45,.16);
 return true;
}
export function addPass17CrownSign(T,scene,b){
 if(String(b.id)!=='1001196'||typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=1024;c.height=160;
 const ctx=c.getContext('2d');if(!ctx)return null;
 ctx.clearRect(0,0,1024,160);ctx.fillStyle='#f5eee3';
 ctx.font='bold 90px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText('CROWN CHICKEN & GRILL',512,80,1010);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(5.7,.52),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
 // Existing Pass16 red sign face at -21.71+.26+.59/2. Text is game texture only.
 m.position.set(-193.25,3.76,-21.71+.56);m.name='crown-chicken-april-2025-fascia';scene.add(m);return m;
}
