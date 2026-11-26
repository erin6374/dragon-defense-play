// Broad-facing architecture interpreted from the supplied oblique views.
export function landmarkFront(b,{box,block,hipRoof,mesh,T}){
 const n=parseInt(b.address),{x,z,w,d,h,front}=b;
 const stone=0xbfb39e,glass=0x465960,cream=0xd9ccba;
 const panel=(u,y,v,width,height,depth,color)=>box(x+u,y,front+v,width,height,depth,color);
 function wall(color,roof){for(const poly of b.polys){block(poly,h,color);block(poly,.22,roof,h)}}
 if(n===2401 && front>-40){
   for(const poly of b.polys)block(poly,.56,cream,h-.56);
   panel(0,h-.34,.06,w,.22,.2,0xaa5845);
   for(const u of [-.34,0,.34]){
     panel(u*w,(h-.56)/2,-d/2,.49,h-.56,.54,cream);
     panel(u*w,.5,-d/2,2.15,1,1,0x9c9c93);
   }
   return true;
 }
 if(n===2331){
   const eave=h*.81;
   for(const poly of b.polys)block(poly,eave,stone);
   hipRoof(x,z,w,d,eave,3.7,w*.62,0x867a67);
   panel(0,eave-.6,.3,w,.8,.9,cream);
   for(const u of [-.28,0,.28]){
     const r=w*.085, spring=eave*.61,sh=new T.Shape();
     sh.moveTo(-r,.7);sh.lineTo(r,.7);sh.lineTo(r,spring);sh.absarc(0,spring,r,0,Math.PI,false);sh.closePath();
     mesh(new T.ShapeGeometry(sh),glass,x+u*w,0,front+.12);
     panel(u*w,2.2,.18,.13,3.3,.16,stone);
   }
   for(const u of [-.41,-.15,.15,.41]){
     mesh(new T.CylinderGeometry(.56,.7,eave*.72,12),cream,x+u*w,eave*.42,front+.62);
     panel(u*w,eave*.79,.62,1.64,.42,1.52,cream);
   }
   for(let i=0;i<5;i++)panel(0,(i+1)*.09,2.7-i*.5,w*.84,(i+1)*.18,.64,stone);
   return true;
 }
 if(n===2309){
   wall(0x9f9583,0x787772);
   panel(0,h*.34,.16,w*.94,h*.64,.3,cream);
   for(const u of [-.29,0,.29]){
     panel(u*w,h*.32,.4,w*.23,h*.55,.18,glass);
     for(const s of [-1,1])panel(u*w+s*w*.042,h*.32,.54,.12,h*.55,.12,0x343d40);
     for(const v of [.22,.43])panel(u*w,h*v,.54,w*.23,.15,.13,0x343d40);
   }
   panel(0,h*.68,.23,w,.55,.72,stone);
   // Exactly three principal glass banks in the user-supplied Nov 21
   // Street View. The former seven upper rectangles were unsupported.
   // Entrance is a single pedestrian opening at the center bank.
   panel(0,1.3,.64,1.28,2.48,.21,0x303a3c);
   panel(0,1.31,.80,.88,2.16,.08,0x5a7981);
   panel(.036,1.23,.89,.065,.065,.09,cream);
   return true;
 }
 if(n===2413){
   wall(0xa15f49,0xd1cec2);
   for(let j=0;j<15;j++){
     const u=(j-7)*w/15.7,light=j%4===2||j%4===3;
     // Follow the stepped street elevation, including its recessed bays.
     const hits=[];for(const ring of b.polys.map(p=>p[0]))for(let i=1;i<ring.length;i++){
       const [a,v]=ring[i-1],[c,q]=ring[i];if((a>x+u)!==(c>x+u))hits.push(v+(q-v)*(x+u-a)/(c-a));
     }
     if(!hits.length)continue;const off=Math.max(...hits)-front;
     if(light)panel(u,h*.5,off+.07,w/15.9,h,.16,0xc3c4be);
     for(let floor=0;floor<5;floor++){
       panel(u,(floor+.52)*h/5,off+.19,1.65,1.58,.12,glass);
       panel(u,(floor+.52)*h/5,off+.28,.1,1.6,.09,0x939997);
     }
   }
   return true;
 }
 if(n===2431){
   wall(0xd5c4a9,0xe0dccc);
   for(const frac of [.66,.81])panel(0,h*frac,.15,w,.24,.35,0xb44334);
   for(let j=0;j<6;j++)panel((j-2.5)*2,1.6,.12,1.72,2.1,.24,glass);
   return true;
 }
 return false;
}
