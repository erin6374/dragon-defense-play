/** Pass21: final two setback structures. User 031130 and 031151
 * October 2026 Street View. 2319 garage photo partially occluded;
 * 2321 visible limestone facade and parapet; hidden bays estimated.
 * Keep the historically open courtyard, no invented curbside buildings.
 */
export const PASS21_IDS=new Set(['1079073','1050167']);
function faceAt(row,x){
 let z=-Infinity;
 for(const poly of row.polys)for(let i=1;i<poly[0].length;i++){
  const a=poly[0][i-1],b=poly[0][i];
  if((a[0]<=x&&x<b[0])||(b[0]<=x&&x<a[0]))
   z=Math.max(z,a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));
 }
 return z;
}
export function renderPass21Setbacks(row,{box,block}){
 const id=String(row.id);if(!PASS21_IDS.has(id))return false;
 const h=row.h;
 if(id==='1079073'){
  // Low three-bay service garage seen down the driveway from Broad.
  // Two doors fully visible, third estimated from available frontage.
  const L=-443.26,R=-432.42,w=R-L;
  for(const p of row.polys){block(p,h,0xbabbb5);block(p,.12,0x626862,h-.06);}
  const f=(u,y,ww,hh,c,outer=.12)=>{const x=L+u*w,z=faceAt(row,x),inner=-.16;box(x,y,z+(outer+inner)/2,ww,hh,outer-inner,c);};
  f(.50,h-.12,w-.10,.22,0xd0d0c7,.23);
  f(.50,h-.42,w-.16,.20,0xa3a49e,.16);
  for(const u of [.18,.50,.82]){
   f(u,1.34,2.91,2.62,0x777e79,.16);
   f(u,1.34,2.70,2.46,0xa9ada8,.22);
   for(let k=1;k<13;k++)f(u,.11+k*.19,2.70,.025,0x8b918d,.27);
   f(u,2.86,.38,.30,0x94978e,.19);
   f(u,2.86,.22,.19,0x5c6661,.24);
   f(u,.07,2.82,.12,0x92948d,.23);
  }
  return true;
 }
 // Dropsie College: limestone facade with two visible window tiers, lower
 // round-headed glazing, continuous cornice and pierced roof balustrade.
 // The southern/hidden window count is a provisional rhythmic extension.
 const stone=0xc5bca8,trim=0xb6ad97,light=0xd2cebd,glass=0x607378;
 const L=-483.19,R=-448.57;
 for(const p of row.polys){block(p,h,stone);block(p,.13,0x73766d,h-.07);}
 const f=(x,y,w,hh,c,outer=.12,inner=-.18)=>{const z=faceAt(row,x);if(!Number.isFinite(z))throw Error('No frontage at '+x);box(x,y,z+(outer+inner)/2,w,hh,outer-inner,c);};
 // Segment by actual polygon profile so coping and plinth do not bridge setbacks.
 const spans=[[-483.16,-481.87],[-481.80,-472.0],[-471.86,-448.63]];
 for(const [a,b] of spans){
  // Use short overlapping runs; all penetrate the locally sampled face.
  const n=Math.ceil((b-a)/.75);
  for(let j=0;j<n;j++){
   const x=a+(j+.5)*(b-a)/n,w=(b-a)/n+.025;
   for(const [y,hh,c,outer] of [[.48,.84,trim,.13],[6.55,.18,trim,.14],[h-.85,.34,trim,.25],[h-.48,.24,light,.36],[h-.15,.23,trim,.23],[h+.15,.34,stone,.18],[h+.93,.17,light,.19]])
    f(x,y,w,hh,c,outer);
  }
  // Pierced balustrade, connected to the continuous coping below and above.
  for(let x=a+.13;x<b-.13;x+=.37)f(x,h+.50,.17,.85,light,.17);
 }
 for(const x of [-480.0,-476.4,-472.8,-469.2,-465.6,-462.0,-458.4,-454.8,-451.2]){
  f(x,9.62,1.48,2.24,trim,.17);
  f(x,9.62,1.25,2.02,light,.25);
  f(x,9.62,1.09,1.86,glass,.33);
  f(x,9.62,.055,1.86,light,.38);
  f(x,9.62,1.09,.065,light,.38);
  f(x,8.43,1.60,.16,light,.24);
  // Tall lower semicircular arch. Horizontally overlapping strips preserve
  // solid connection to backing and represent pale sash mullions.
  const bot=1.57,top=5.02,ww=1.74,r=ww/2;
  f(x,(bot+top)/2,ww+.24,top-bot,trim,.18);
  f(x,(bot+top)/2,ww,top-bot,glass,.30);
  for(let k=0;k<16;k++){
   const t=(k+.35)/16,span=Math.sqrt(1-t*t);
   f(x,top+t*r,(ww+.24)*span,r/16+.04,trim,.19);
   f(x,top+t*r,ww*span,r/16+.035,glass,.31);
  }
  for(const dx of [-.56,0,.56])f(x+dx,(bot+top)/2,.055,top-bot,light,.37);
  for(const yy of [2.42,3.30,4.18,5.00])f(x,yy,ww,.055,light,.37);
  f(x,1.48,2.02,.16,trim,.22);
 }
 return true;
}
