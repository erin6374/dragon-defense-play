// Bright MLS PAPH2609302 includes an annotated photograph naming both fronts.
// Model its street-facing details without applying the annotations as signage.
export const PARK_2430_32_FRONTAGES=Object.freeze({
 '2430 N PARK AVE':{brick:0x9f654d,awning:0xbcaf57,stripe:0xd0c471,base:0x5f765e,trim:0x727b53,door:0xc9c0a9,sashes:[.24,.49],doorFraction:.77},
 '2432 N PARK AVE':{brick:0xa06852,awning:0x71897a,stripe:0x8fa596,base:0x8d5343,trim:0xbfb4a0,door:0x654d3f,sashes:[.49,.74],doorFraction:.19}
});

export function render2430And2432Frontage(plan,{T,box,mesh,wallAt}){
 const model=PARK_2430_32_FRONTAGES[plan.address];
 const is2430=plan.address==='2430 N PARK AVE',height=plan.height;
 // On 2432 the side return is set back about a meter. Keep the porch and
 // opening layout on the long, street-parallel part of the original footprint.
 const left=plan.facade.left+(is2430?.035:Math.min(.955,plan.facade.width*.166));
 const right=plan.facade.right-.035,width=right-left,mid=(left+right)/2;
 const at=f=>left+width*f;
 const stone=0xc2b9a8,metal=0x4a4945,glass=0x536870,white=0xddd5c6;
 const panel=(x,y,w,h,f,b,c)=>box(x,y,(f+b)/2,w,h,b-f,c);
 const span=(a,b,y,h,f,back,c)=>panel((a+b)/2,y,b-a,h,f,back,c);
 const support=(x,w)=>{
  const zs=[-.44,0,.44].map(k=>wallAt(x+w*k));
  return {front:Math.min(...zs),back:Math.max(...zs)+.055};
 };
 const wall=support(mid,width*.98),front=wall.front-1.21;
 const deck=.68,roofLow=is2430?2.89:2.99,roofHigh=roofLow+.56,trimY=height-.23;
 const profile=(points,x,y,f,b,color)=>{
  if(!T||!mesh)return;
  const s=new T.Shape();
  points.forEach(([dx,dy],i)=>i?s.lineTo(dx,dy):s.moveTo(dx,dy));s.closePath();
  mesh(new T.ExtrudeGeometry(s,{depth:b-f,bevelEnabled:false}),color,x,y,f);
 };
 const tilted=(x,w,y,zd,depth,rise,thickness,color)=>{
  if(!T||!mesh)return;
  const g=new T.BoxGeometry(w,thickness,Math.hypot(depth,rise));
  g.rotateX(-Math.atan2(rise,depth));
  mesh(g,color,x,y,zd);
 };

 // Meter-scaled running bond on the photographed street face only.
 const brickWidth=width*.988,brickHeight=height-.11,brickFront=wall.front-.045;
 if(T&&mesh){
  const skin=new T.BoxGeometry(brickWidth,brickHeight,wall.back-brickFront);
  const uv=skin.getAttribute('uv'),pos=skin.getAttribute('position'),face=skin.groups[5];
  for(const i of new Set(skin.index.array.slice(face.start,face.start+face.count))){
   uv.setXY(i,pos.getX(i),brickHeight/2+pos.getY(i));
  }
  mesh(skin,model.brick,mid,brickHeight/2,(brickFront+wall.back)/2,{brickFace:face.materialIndex});
 }else panel(mid,brickHeight/2,brickWidth,brickHeight,brickFront,wall.back,model.brick);

 const endY=is2430?trimY:trimY-.20;
 panel(mid,endY,width*.96,.20,wall.front-.15,wall.back,model.trim);
 for(let i=0;i<17;i++){
  panel(at(.065+i*.054),endY-.135,.101,.17,wall.front-.18,wall.front+.02,is2430?0x946250:0x995b48);
 }
 if(!is2430){
  panel(mid,height-.22,width*.94,.49,wall.front-.069,wall.back,0x96948a);
  for(let i=0;i<13;i++)panel(at(.073+.071*i),height-.22,.026,.46,wall.front-.084,wall.front-.055,metal);
 }

 const sash=(f,y,w,h,barred=false)=>{
  const x=at(f),where=support(x,w+.19),fz=where.front-.14;
  panel(x,y,w+.105,h+.10,fz,where.back,white);
  panel(x,y,w,h,fz-.053,fz+.03,glass);
  panel(x,y,w,.041,fz-.080,fz-.026,white);
  panel(x,y-h/2-.064,w+.16,.099,fz-.098,where.back,model.trim);
  panel(x,y+h/2+.07,w+.16,.112,fz-.085,where.back,model.trim);
  if(barred){
   for(let i=-2;i<=2;i++)panel(x+i*w*.17,y,.023,h,fz-.087,fz-.038,metal);
  }
 };
 for(const f of [.26,.73]){
  const y=height*.647,w=1.01,hh=1.72;
  sash(f,y,w,hh);
  if(is2430){
   const x=at(f),hoodBack=wallAt(x)+.04,hoodFront=hoodBack-.53,capY=y+hh/2+.27;
   tilted(x,w+.18,capY-.22,(hoodBack+hoodFront)/2,.53,.44,.067,model.awning);
   for(const dx of [-.43,.43])tilted(x+dx,.052,capY-.177,(hoodBack+hoodFront)/2,.53,.44,.042,model.stripe);
   panel(x,capY-.43,w+.17,.091,hoodFront-.026,hoodFront+.063,model.awning);
  }
 }
 for(const f of model.sashes)sash(f,deck+1.14,.87,1.43,!is2430);
 const doorX=at(model.doorFraction),door=support(doorX,1.14),df=door.front-.16;
 panel(doorX,deck+1.06,1.13,2.20,df,door.back,white);
 panel(doorX,deck+1.05,.94,2.08,df-.062,df+.035,model.door);
 for(const y of [deck+.57,deck+1.29])panel(doorX,y,.63,.50,df-.078,df-.046,is2430?0xb3aa92:0x715647);

 const a=left+.08,b=right-.08,stairs=1.20;
 span(a,b,.302,.604,front+.03,wall.back,model.base);
 span(a,b,.64,.085,front,wall.back,is2430?0x637765:0x969084);
 for(let i=1;i<=4;i++){
  const top=deck*i/4;
  panel(doorX,top/2,stairs,top,front-(5-i)*.19,front+.075,is2430?0x657b66:0x4c4942);
 }
 for(const f of (is2430?[.24,.48]:[.56,.75])){
  const x=at(f),baseY=.27;
  panel(x,baseY,.55,.28,front-.043,front+.069,stone);
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){
   panel(x+(col-1.5)*.125,baseY+(row-.5)*.105,.100,.083,front-.049,front-.022,0x696b64);
  }
 }

 const awningA=a-.015,awningB=b+.015,awningW=awningB-awningA,awningX=(awningA+awningB)/2;
 const lowZ=front-.13,highZ=wall.front+.115,depth=highZ-lowZ,rise=roofHigh-roofLow;
 tilted(awningX,awningW,(roofLow+roofHigh)/2,(lowZ+highZ)/2,depth,rise,.08,model.awning);
 // An anchored rear fascia keeps the sloped cover and its supports connected.
 span(awningA,awningB,roofHigh,.14,wall.front-.17,wall.back,model.trim);
 span(awningA,awningB,roofLow,.12,lowZ-.021,lowZ+.069,model.awning);
 for(let i=1;i<19;i++){
  const x=awningA+i*awningW/19;
  tilted(x,.067,(roofLow+roofHigh)/2+.045,(lowZ+highZ)/2,depth-.033,rise,.028,model.stripe);
  if(!is2430)profile([[-.10,.02],[.10,.02],[.10,-.055],[.05,-.095],[-.05,-.095],[-.10,-.055]],x,roofLow-.024,lowZ-.033,lowZ+.021,model.awning);
 }
 const supportZ=front+.0695,supportTop=roofLow+rise*(supportZ-lowZ)/depth;
 for(const x of [a+.09,b-.09])panel(x,(supportTop+deck)/2,.098,supportTop-deck+.10,front+.013,front+.126,is2430?model.trim:white);
 if(!is2430){
  const r0=doorX+stairs/2+.055,r1=b-.09;
  for(const y of [deck+.105,deck+.69])span(r0,r1,y,.053,front+.047,front+.120,metal);
  const count=Math.ceil((r1-r0)/.142);
  for(let i=0;i<=count;i++)panel(r0+(r1-r0)*i/count,deck+.36,.031,.69,front+.066,front+.103,metal);
 }
}
